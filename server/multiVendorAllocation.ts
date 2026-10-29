import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  Order,
  OrderItem,
  OrderStatus,
  VendorSuborder,
  OrderAllocationDecision,
  VendorInventoryItem,
  StockMovementLedgerEntry,
  StockReservation,
  Product,
  Vendor
} from '../src/types.ts';
import { INITIAL_PRODUCTS, INITIAL_VENDORS } from '../src/data.ts';

// File paths in storage/
const STORAGE_DIR = path.resolve(process.cwd(), 'storage');
const VENDOR_INVENTORY_FILE = path.join(STORAGE_DIR, 'vendor_inventory.json');
const STOCK_RESERVATIONS_FILE = path.join(STORAGE_DIR, 'stock_reservations.json');
const STOCK_LEDGER_FILE = path.join(STORAGE_DIR, 'stock_movement_ledger.json');
const ORDERS_FILE = path.join(STORAGE_DIR, 'orders.json');
const ALLOCATION_LOGS_FILE = path.join(STORAGE_DIR, 'allocation_logs.json');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// Helper for safe JSON file reads & writes
function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(`[MultiVendorStorage] Error reading ${filePath}:`, err);
  }
  return fallback;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[MultiVendorStorage] Error writing ${filePath}:`, err);
  }
}

// Locality distances reference from Hospete Town Center / dispatch hub
export const LOCALITY_DISTANCES: Record<string, number> = {
  'Station Road': 1.2,
  'Patel Nagar': 2.2,
  'M.J. Nagar': 3.0,
  'College Road': 3.5,
  'Dam Road': 4.8,
  'Amaravathi': 6.5,
  'Ananthashayana Gudi': 7.2,
  'Hampi Road': 8.4,
  'Kampli Road': 4.8,
  'Kampli Road Outer': 9.8,
  'Munirabad / TB Dam': 12.5,
  'Vidyanagar': 3.2,
  'Bus Stand': 1.5,
  'Gandhi Nagar': 2.0
};

export function getLocalityDistance(locality: string): number {
  return LOCALITY_DISTANCES[locality] ?? 3.5;
}

// Locality eligibility checker respecting supermarket geofence and vendor operational status
export function isVendorEligibleForLocality(
  vendorId: number,
  customerLocality: string,
  maxGeofenceKm = 15
): { eligible: boolean; distanceKm: number; reason?: string } {
  const vendor = INITIAL_VENDORS.find(v => v.id === vendorId);
  const dist = getLocalityDistance(customerLocality);

  if (dist > maxGeofenceKm) {
    return {
      eligible: false,
      distanceKm: dist,
      reason: `Customer delivery location (${customerLocality}, ${dist} km) exceeds maximum supermarket geofence coverage of ${maxGeofenceKm} km.`
    };
  }

  if (!vendor) {
    return {
      eligible: false,
      distanceKm: dist,
      reason: `Vendor #${vendorId} not found in verified merchant registry.`
    };
  }

  if (vendor.status !== 'approved') {
    return {
      eligible: false,
      distanceKm: dist,
      reason: `Vendor "${vendor.businessName}" is currently ${vendor.status} and cannot fulfill customer orders.`
    };
  }

  return { eligible: true, distanceKm: dist };
}

// Authoritative master catalog vendor inventory generator
function generateMasterVendorInventory(): VendorInventoryItem[] {
  const items: VendorInventoryItem[] = [];
  const vendorLookup = new Map<number, Vendor>();
  INITIAL_VENDORS.forEach(v => vendorLookup.set(v.id, v));

  // 1. Iterate through all catalog products and variants
  INITIAL_PRODUCTS.forEach(product => {
    const primaryVendor = vendorLookup.get(product.vendorId || 1) || INITIAL_VENDORS[0];

    product.variants.forEach(variant => {
      items.push({
        id: `inv-v${primaryVendor.id}-p${product.id}-vr${variant.id}`,
        vendorId: primaryVendor.id,
        vendorName: primaryVendor.businessName,
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        packSize: variant.packSize,
        brand: product.brand,
        categorySlug: product.categorySlug,
        price: variant.price,
        mrp: variant.mrp,
        physicalStock: variant.stockQty,
        reservedStock: 0,
        committedStock: 0,
        availableStock: variant.stockQty,
        locality: primaryVendor.locality,
        updatedAt: new Date().toISOString()
      });
    });
  });

  // 2. Secondary multi-vendor inventory partners for shared supermarket essentials
  items.push(
    {
      id: 'inv-v3-p1-vr101',
      vendorId: 3,
      vendorName: 'Sri Lakshmi Store',
      productId: 1,
      variantId: 101,
      productName: 'Tomato (Local)',
      packSize: '500 g',
      brand: 'Local Fresh',
      categorySlug: 'veggies',
      price: 24,
      mrp: 30,
      physicalStock: 25,
      reservedStock: 0,
      committedStock: 0,
      availableStock: 25,
      locality: 'Kampli Road',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'inv-v4-p1-vr101',
      vendorId: 4,
      vendorName: 'Hampi Farm Delights',
      productId: 1,
      variantId: 101,
      productName: 'Tomato (Local)',
      packSize: '500 g',
      brand: 'Local Fresh',
      categorySlug: 'veggies',
      price: 26,
      mrp: 30,
      physicalStock: 20,
      reservedStock: 0,
      committedStock: 0,
      availableStock: 20,
      locality: 'Amaravathi',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'inv-v4-p3-vr301',
      vendorId: 4,
      vendorName: 'Hampi Farm Delights',
      productId: 3,
      variantId: 301,
      productName: 'Nandini Pasteurised Toned Milk',
      packSize: '500 ml',
      brand: 'Nandini (KMF)',
      categorySlug: 'dairy',
      price: 24,
      mrp: 24,
      physicalStock: 40,
      reservedStock: 0,
      committedStock: 0,
      availableStock: 40,
      locality: 'Amaravathi',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'inv-v4-p4-vr402',
      vendorId: 4,
      vendorName: 'Hampi Farm Delights',
      productId: 4,
      variantId: 402,
      productName: 'Nandini Pure Cow Ghee',
      packSize: '500 ml Pouch',
      brand: 'Nandini (KMF)',
      categorySlug: 'dairy',
      price: 320,
      mrp: 340,
      physicalStock: 15,
      reservedStock: 0,
      committedStock: 0,
      availableStock: 15,
      locality: 'Amaravathi',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'inv-v4-p5-vr501',
      vendorId: 4,
      vendorName: 'Hampi Farm Delights',
      productId: 5,
      variantId: 501,
      productName: 'South Indian Special Mixture Snacks',
      packSize: '200 g Pouch',
      brand: 'Hospete Sweets & Namkeen',
      categorySlug: 'snacks',
      price: 52,
      mrp: 60,
      physicalStock: 20,
      reservedStock: 0,
      committedStock: 0,
      availableStock: 20,
      locality: 'Amaravathi',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'inv-v4-p6-vr601',
      vendorId: 4,
      vendorName: 'Hampi Farm Delights',
      productId: 6,
      variantId: 601,
      productName: 'Premium Sona Masoori Rice',
      packSize: '1 kg',
      brand: 'Tungabhadra Gold',
      categorySlug: 'staples',
      price: 68,
      mrp: 75,
      physicalStock: 25,
      reservedStock: 0,
      committedStock: 0,
      availableStock: 25,
      locality: 'Amaravathi',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'inv-v3-p18-vr1801',
      vendorId: 3,
      vendorName: 'Sri Lakshmi Store',
      productId: 18,
      variantId: 1801,
      productName: 'Potato (Regular)',
      packSize: '1 kg',
      brand: 'Local Fresh',
      categorySlug: 'veggies',
      price: 32,
      mrp: 38,
      physicalStock: 25,
      reservedStock: 0,
      committedStock: 0,
      availableStock: 25,
      locality: 'Kampli Road',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'inv-v3-p19-vr1901',
      vendorId: 3,
      vendorName: 'Sri Lakshmi Store',
      productId: 19,
      variantId: 1901,
      productName: 'Onion (Red)',
      packSize: '1 kg',
      brand: 'Local Fresh',
      categorySlug: 'veggies',
      price: 30,
      mrp: 32,
      physicalStock: 30,
      reservedStock: 0,
      committedStock: 0,
      availableStock: 30,
      locality: 'Kampli Road',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'inv-v3-p20-vr2001',
      vendorId: 3,
      vendorName: 'Sri Lakshmi Store',
      productId: 20,
      variantId: 2001,
      productName: 'Palak / Spinach (Fresh Leafy Greens)',
      packSize: '250 g',
      brand: 'Local Fresh',
      categorySlug: 'veggies',
      price: 18,
      mrp: 22,
      physicalStock: 25,
      reservedStock: 0,
      committedStock: 0,
      availableStock: 25,
      locality: 'Kampli Road',
      updatedAt: new Date().toISOString()
    }
  );

  return items;
}


// Initial default seed for parent orders & suborders
function getInitialOrders(): Order[] {
  return [
    {
      id: 83921,
      orderNumber: 'HF-83921',
      customerName: 'Ramesh Rao',
      phone: '9845012345',
      address: '#42, 3rd Cross, Gandhi Nagar',
      locality: 'Patel Nagar',
      totalAmount: 76,
      deliveryFee: 0,
      paymentMethod: 'UPI / PhonePe',
      status: 'Assigned',
      createdAt: '12 Oct 2026, 10:15 AM',
      orderedAt: '10:15 AM',
      orderAcceptedAt: '10:17 AM',
      preparedAt: '10:20 AM',
      readyForPickupAt: '10:22 AM',
      assignedAt: '10:24 AM',
      estimatedDeliveryTime: '10:45 AM',
      estimatedMinutes: 20,
      totalTimeTaken: '~20 mins SLA',
      deliveryMinutes: 20,
      vendorName: 'Sri Lakshmi Store',
      vendorLocality: 'Kampli Road',
      vendorAddress: 'Kampli Road, Hospet - 583201 Near Bus Stand, Opp. City Mart',
      vendorPhone: '+91 98451 00223',
      pickupInstructions: 'Collect items from counter 2. Mention Hospete Fresh order reference.',
      deliveryOtp: '2846',
      deliveryInstructions: 'Call before delivery. House is on left side, blue gate.',
      deliveryPayout: 45,
      distanceKm: 2.2,
      assignedDeliveryBoy: 'Ravi Kumar (DLV-001)',
      assignedDeliveryBoyId: 'DLV-001',
      assignedDeliveryBoyPhone: '+91 98450 12345',
      isMultiVendor: false,
      items: [
        {
          productId: 1,
          vendorId: 3,
          productName: 'Fresh Red Tomatoes',
          packSize: '1 kg',
          unitPrice: 32,
          quantity: 2,
          subtotal: 64,
          imageUrl: '/images/tomatoes.jpg',
          packed: true,
          checked: true
        },
        {
          productId: 2,
          vendorId: 3,
          productName: 'Fresh Coriander',
          packSize: '1 Bunch (100 g)',
          unitPrice: 12,
          quantity: 1,
          subtotal: 12,
          imageUrl: '/images/cat_veggies.jpg',
          packed: true,
          checked: true
        }
      ],
      suborders: [
        {
          id: 'SO-83921-V3',
          suborderNumber: 'SO-83921-V3',
          parentOrderId: 83921,
          parentOrderNumber: 'HF-83921',
          vendorId: 3,
          vendorName: 'Sri Lakshmi Store',
          vendorLocality: 'Kampli Road',
          vendorAddress: 'Kampli Road, Hospet - 583201',
          vendorPhone: '+91 98451 00223',
          subtotal: 76,
          commissionRate: 10.0,
          commissionAmount: 7.6,
          netPayout: 68.4,
          status: 'Assigned',
          createdAt: '12 Oct 2026, 10:15 AM',
          orderAcceptedAt: '10:17 AM',
          preparedAt: '10:20 AM',
          readyForPickupAt: '10:22 AM',
          allocationReason: 'Optimal single-vendor fulfillment: Sri Lakshmi Store fulfills 100% of order with lowest fulfillment overhead.',
          items: [
            {
              productId: 1,
              vendorId: 3,
              productName: 'Fresh Red Tomatoes',
              packSize: '1 kg',
              unitPrice: 32,
              quantity: 2,
              subtotal: 64,
              imageUrl: '/images/tomatoes.jpg',
              packed: true,
              checked: true
            },
            {
              productId: 2,
              vendorId: 3,
              productName: 'Fresh Coriander',
              packSize: '1 Bunch (100 g)',
              unitPrice: 12,
              quantity: 1,
              subtotal: 12,
              imageUrl: '/images/cat_veggies.jpg',
              packed: true,
              checked: true
            }
          ]
        }
      ],
      allocationDecision: {
        orderId: 83921,
        orderNumber: 'HF-83921',
        isMultiVendor: false,
        strategy: 'SINGLE_OPTIMAL',
        reason: 'Optimal single-vendor fulfillment: Sri Lakshmi Store had complete stock available and lowest transit distance to Patel Nagar.',
        evaluatedVendors: [
          { vendorId: 3, vendorName: 'Sri Lakshmi Store', distanceKm: 4.8, canFulfillFullOrder: true, availableItemsCount: 2, estimatedCost: 76 },
          { vendorId: 1, vendorName: 'Tungabhadra Agro & Organics', distanceKm: 3.5, canFulfillFullOrder: true, availableItemsCount: 2, estimatedCost: 78 }
        ],
        allocatedVendors: [
          { vendorId: 3, vendorName: 'Sri Lakshmi Store', itemCount: 2, subtotal: 76 }
        ],
        splitCount: 1,
        totalDeliveryFee: 0,
        timestamp: '2026-10-12T10:15:00.000Z'
      }
    },
    {
      id: 83920,
      orderNumber: 'HF-83920',
      customerName: 'Smt. Shanti Devi',
      phone: '9845198765',
      address: '#18, Station Road near KSRTC',
      locality: 'Station Road',
      totalAmount: 315,
      deliveryFee: 0,
      paymentMethod: 'Cash on Delivery',
      status: 'Accepted',
      createdAt: '12 Oct 2026, 09:45 AM',
      orderedAt: '09:45 AM',
      orderAcceptedAt: '09:47 AM',
      estimatedDeliveryTime: '10:05 AM',
      estimatedMinutes: 20,
      totalTimeTaken: '~20 mins SLA',
      deliveryMinutes: 20,
      vendorName: 'Bellary Organic Dairy',
      vendorLocality: 'Dam Road',
      vendorAddress: '#12, Dam Road, Hospete',
      vendorPhone: '+91 98452 44556',
      deliveryOtp: '8912',
      deliveryPayout: 40,
      distanceKm: 1.2,
      isMultiVendor: false,
      items: [
        {
          productId: 4,
          vendorId: 3,
          productName: 'Nandini Pure Cow Ghee',
          packSize: '500 ml Pouch',
          unitPrice: 315,
          quantity: 1,
          subtotal: 315,
          imageUrl: '/images/cat_dairy.jpg'
        }
      ],
      suborders: [
        {
          id: 'SO-83920-V3',
          suborderNumber: 'SO-83920-V3',
          parentOrderId: 83920,
          parentOrderNumber: 'HF-83920',
          vendorId: 3,
          vendorName: 'Bellary Organic Dairy',
          vendorLocality: 'Dam Road',
          vendorAddress: '#12, Dam Road, Hospete',
          vendorPhone: '+91 98452 44556',
          subtotal: 315,
          commissionRate: 10.0,
          commissionAmount: 31.5,
          netPayout: 283.5,
          status: 'Accepted',
          createdAt: '12 Oct 2026, 09:45 AM',
          orderAcceptedAt: '09:47 AM',
          allocationReason: 'Optimal single-vendor fulfillment: Stock ready for instant dispatch.',
          items: [
            {
              productId: 4,
              vendorId: 3,
              productName: 'Nandini Pure Cow Ghee',
              packSize: '500 ml Pouch',
              unitPrice: 315,
              quantity: 1,
              subtotal: 315,
              imageUrl: '/images/cat_dairy.jpg'
            }
          ]
        }
      ]
    },
    {
      id: 83919,
      orderNumber: 'HF-83919',
      customerName: 'Kiran Kumar',
      phone: '9900112233',
      address: '#89, Main Bazaar, Dam Road',
      locality: 'Station Road',
      totalAmount: 98,
      deliveryFee: 25,
      paymentMethod: 'UPI / GPay',
      status: 'Preparing',
      createdAt: '12 Oct 2026, 09:10 AM',
      orderedAt: '09:10 AM',
      orderAcceptedAt: '09:12 AM',
      preparedAt: '09:15 AM',
      estimatedDeliveryTime: '09:30 AM',
      estimatedMinutes: 15,
      totalTimeTaken: '~15 mins SLA',
      deliveryMinutes: 15,
      vendorName: 'Tungabhadra Agro & Organics',
      vendorLocality: 'Station Road',
      vendorAddress: '#14, Station Road, Near Railway Underpass, Hospet',
      vendorPhone: '+91 98452 33445',
      deliveryOtp: '3391',
      deliveryPayout: 42,
      distanceKm: 1.2,
      isMultiVendor: false,
      items: [
        {
          productId: 1,
          vendorId: 1,
          productName: 'Farm Fresh Red Tomatoes',
          packSize: '1 kg',
          unitPrice: 32,
          quantity: 1,
          subtotal: 32,
          imageUrl: '/images/tomatoes.jpg'
        },
        {
          productId: 20,
          vendorId: 1,
          productName: 'Fresh Palak (Spinach)',
          packSize: '250 g Bunch',
          unitPrice: 18,
          quantity: 1,
          subtotal: 18,
          imageUrl: '/images/cat_veggies.jpg'
        },
        {
          productId: 19,
          vendorId: 1,
          productName: 'Sambar Onions',
          packSize: '1 kg',
          unitPrice: 48,
          quantity: 1,
          subtotal: 48,
          imageUrl: '/images/cat_veggies.jpg'
        }
      ],
      suborders: [
        {
          id: 'SO-83919-V1',
          suborderNumber: 'SO-83919-V1',
          parentOrderId: 83919,
          parentOrderNumber: 'HF-83919',
          vendorId: 1,
          vendorName: 'Tungabhadra Agro & Organics',
          vendorLocality: 'Station Road',
          vendorAddress: '#14, Station Road, Near Railway Underpass, Hospet',
          vendorPhone: '+91 98452 33445',
          subtotal: 98,
          commissionRate: 10.0,
          commissionAmount: 9.8,
          netPayout: 88.2,
          status: 'Preparing',
          createdAt: '12 Oct 2026, 09:10 AM',
          orderAcceptedAt: '09:12 AM',
          preparedAt: '09:15 AM',
          items: [
            {
              productId: 1,
              vendorId: 1,
              productName: 'Farm Fresh Red Tomatoes',
              packSize: '1 kg',
              unitPrice: 32,
              quantity: 1,
              subtotal: 32,
              imageUrl: '/images/tomatoes.jpg'
            },
            {
              productId: 20,
              vendorId: 1,
              productName: 'Fresh Palak (Spinach)',
              packSize: '250 g Bunch',
              unitPrice: 18,
              quantity: 1,
              subtotal: 18,
              imageUrl: '/images/cat_veggies.jpg'
            },
            {
              productId: 19,
              vendorId: 1,
              productName: 'Sambar Onions',
              packSize: '1 kg',
              unitPrice: 48,
              quantity: 1,
              subtotal: 48,
              imageUrl: '/images/cat_veggies.jpg'
            }
          ]
        }
      ]
    }
  ];
}

// Memory + persistent file managers
class MultiVendorStore {
  private inventory: VendorInventoryItem[] = [];
  private reservations: StockReservation[] = [];
  private ledger: StockMovementLedgerEntry[] = [];
  private orders: Order[] = [];
  private allocationLogs: OrderAllocationDecision[] = [];

  constructor() {
    this.init();
  }

  private init() {
    const existing = readJsonFile<VendorInventoryItem[]>(VENDOR_INVENTORY_FILE, []);
    const master = generateMasterVendorInventory();

    const existingMap = new Map<string, VendorInventoryItem>();
    existing.forEach(item => {
      existingMap.set(`${item.vendorId}_${item.productId}_${item.variantId}`, item);
    });

    const reconciled: VendorInventoryItem[] = [];

    // For each item in master catalog
    master.forEach(masterItem => {
      const key = `${masterItem.vendorId}_${masterItem.productId}_${masterItem.variantId}`;
      const found = existingMap.get(key);
      if (found) {
        // Vendor 2 evidence screenshot sets exact physical stock:
        // Product 5: 501 -> 64, 502 -> 35, 503 -> 20
        // Product 12: 1201 -> 40, 1202 -> 25
        const isEvidenceStock = masterItem.vendorId === 2 && (masterItem.productId === 5 || masterItem.productId === 12);
        const physicalStock = isEvidenceStock ? masterItem.physicalStock : (found.physicalStock ?? masterItem.physicalStock);
        const reservedStock = found.reservedStock || 0;
        const committedStock = found.committedStock || 0;
        const availableStock = Math.max(0, physicalStock - reservedStock - committedStock);

        reconciled.push({
          ...masterItem,
          ...found,
          physicalStock,
          reservedStock,
          committedStock,
          availableStock,
          price: masterItem.price,
          mrp: masterItem.mrp,
          locality: masterItem.locality || found.locality
        });
        existingMap.delete(key);
      } else {
        reconciled.push(masterItem);
      }
    });

    // Add any remaining items from existing that weren't in master catalog
    existingMap.forEach(item => {
      reconciled.push(item);
    });

    this.inventory = reconciled;
    writeJsonFile(VENDOR_INVENTORY_FILE, this.inventory);

    this.reservations = readJsonFile<StockReservation[]>(STOCK_RESERVATIONS_FILE, []);
    this.ledger = readJsonFile<StockMovementLedgerEntry[]>(STOCK_LEDGER_FILE, []);
    this.orders = readJsonFile<Order[]>(ORDERS_FILE, getInitialOrders());
    if (!fs.existsSync(ORDERS_FILE)) {
      writeJsonFile(ORDERS_FILE, this.orders);
    }

    this.allocationLogs = readJsonFile<OrderAllocationDecision[]>(ALLOCATION_LOGS_FILE, []);

    // Perform initial expiry check on reservations
    this.cleanupExpiredReservations();
  }

  // 1. Clean up expired active reservations (10 min TTL)
  public cleanupExpiredReservations() {
    const now = Date.now();
    let hasChanges = false;

    this.reservations.forEach(res => {
      if (res.status === 'active' && now > res.expiresAt) {
        res.status = 'expired';
        hasChanges = true;

        // Release reserved stock on inventory
        const inv = this.inventory.find(i => i.vendorId === res.vendorId && i.productId === res.productId && i.variantId === res.variantId);
        if (inv) {
          const prevReserved = inv.reservedStock;
          inv.reservedStock = Math.max(0, inv.reservedStock - res.quantity);
          inv.availableStock = Math.max(0, inv.physicalStock - inv.reservedStock - inv.committedStock);
          inv.updatedAt = new Date().toISOString();

          this.recordLedgerEntry({
            vendorId: inv.vendorId,
            vendorName: inv.vendorName,
            productId: inv.productId,
            variantId: inv.variantId,
            productName: inv.productName,
            packSize: inv.packSize,
            changeQty: res.quantity,
            previousPhysicalStock: inv.physicalStock,
            newPhysicalStock: inv.physicalStock,
            previousReservedStock: prevReserved,
            newReservedStock: inv.reservedStock,
            reason: 'RESERVATION_EXPIRED',
            referenceId: res.reservationToken
          });
        }
      }
    });

    if (hasChanges) {
      writeJsonFile(STOCK_RESERVATIONS_FILE, this.reservations);
      writeJsonFile(VENDOR_INVENTORY_FILE, this.inventory);
    }
  }

  // 2. Record a stock movement ledger entry
  public recordLedgerEntry(entry: Omit<StockMovementLedgerEntry, 'id' | 'timestamp'>) {
    const fullEntry: StockMovementLedgerEntry = {
      ...entry,
      id: `led-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString()
    };
    this.ledger.unshift(fullEntry);
    if (this.ledger.length > 500) {
      this.ledger = this.ledger.slice(0, 500);
    }
    writeJsonFile(STOCK_LEDGER_FILE, this.ledger);
    return fullEntry;
  }

  // 3. Get all vendor inventory items with updated available stock
  public getVendorInventory(): VendorInventoryItem[] {
    this.cleanupExpiredReservations();
    return this.inventory.map(item => ({
      ...item,
      availableStock: Math.max(0, item.physicalStock - item.reservedStock - item.committedStock)
    }));
  }

  // 4. Combined Product Availability across multiple vendors
  public getCombinedStockForVariant(productId: number, variantId: number, customerLocality?: string) {
    this.cleanupExpiredReservations();
    const vendorItems = this.inventory.filter(
      i => i.productId === productId && i.variantId === variantId
    );

    // If customer locality is provided, check vendor eligibility
    const eligibleVendorItems = customerLocality
      ? vendorItems.filter(i => isVendorEligibleForLocality(i.vendorId, customerLocality).eligible)
      : vendorItems;

    const physicalStock = eligibleVendorItems.reduce((acc, it) => acc + it.physicalStock, 0);
    const reservedStock = eligibleVendorItems.reduce((acc, it) => acc + it.reservedStock, 0);
    const committedStock = eligibleVendorItems.reduce((acc, it) => acc + it.committedStock, 0);
    const availableStock = Math.max(0, physicalStock - reservedStock - committedStock);

    const activeVendors = eligibleVendorItems
      .filter(it => it.physicalStock - it.reservedStock - it.committedStock > 0)
      .map(it => ({
        vendorId: it.vendorId,
        vendorName: it.vendorName,
        locality: it.locality,
        price: it.price,
        available: Math.max(0, it.physicalStock - it.reservedStock - it.committedStock)
      }));

    const minPrice = eligibleVendorItems.length > 0 ? Math.min(...eligibleVendorItems.map(it => it.price)) : 0;

    return {
      productId,
      variantId,
      physicalStock,
      reservedStock,
      committedStock,
      availableStock,
      minPrice,
      vendorCount: activeVendors.length,
      vendors: activeVendors
    };
  }

  // 5. Restock inventory for a vendor
  public restockVendorVariant(vendorId: number, productId: number, variantId: number, addQty: number) {
    let inv = this.inventory.find(i => i.vendorId === vendorId && i.productId === productId && i.variantId === variantId);
    if (!inv) {
      throw new Error(`Inventory item for vendor ${vendorId}, product ${productId}, variant ${variantId} not found.`);
    }

    const prevPhysical = inv.physicalStock;
    inv.physicalStock += addQty;
    inv.availableStock = Math.max(0, inv.physicalStock - inv.reservedStock - inv.committedStock);
    inv.updatedAt = new Date().toISOString();

    this.recordLedgerEntry({
      vendorId: inv.vendorId,
      vendorName: inv.vendorName,
      productId: inv.productId,
      variantId: inv.variantId,
      productName: inv.productName,
      packSize: inv.packSize,
      changeQty: addQty,
      previousPhysicalStock: prevPhysical,
      newPhysicalStock: inv.physicalStock,
      previousReservedStock: inv.reservedStock,
      newReservedStock: inv.reservedStock,
      reason: 'VENDOR_RESTOCK'
    });

    writeJsonFile(VENDOR_INVENTORY_FILE, this.inventory);
    return inv;
  }

  // 6. Automatic Order Allocation Algorithm
  public evaluateAllocation(
    cartItems: Array<{
      productId: number;
      variantId: number;
      productName: string;
      packSize: string;
      quantity: number;
      unitPrice?: number;
      imageUrl?: string;
    }>,
    customerLocality: string,
    customerDistanceKm?: number,
    commissionRate = 10.0
  ): {
    strategy: 'SINGLE_OPTIMAL' | 'MULTI_SPLIT';
    isMultiVendor: boolean;
    reason: string;
    subordersPlan: Array<{
      vendorId: number;
      vendorName: string;
      vendorLocality: string;
      distanceKm: number;
      items: Array<{
        productId: number;
        variantId: number;
        productName: string;
        packSize: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
        imageUrl?: string;
      }>;
      subtotal: number;
      commissionAmount: number;
      netPayout: number;
    }>;
    evaluatedVendors: Array<{
      vendorId: number;
      vendorName: string;
      distanceKm: number;
      canFulfillFullOrder: boolean;
      availableItemsCount: number;
      estimatedCost: number;
      ineligibleReason?: string;
    }>;
    totalItemsCost: number;
  } {
    this.cleanupExpiredReservations();

    // Check item-level availability across entire network and within customer locality
    for (const item of cartItems) {
      const combined = this.getCombinedStockForVariant(item.productId, item.variantId, customerLocality);
      if (combined.availableStock < item.quantity) {
        const overallNetwork = this.getCombinedStockForVariant(item.productId, item.variantId);
        if (overallNetwork.availableStock >= item.quantity && customerLocality) {
          throw new Error(
            `"${item.productName}" (${item.packSize}) has stock across the marketplace (${overallNetwork.availableStock} in stock), but no verified vendor can deliver to "${customerLocality}".`
          );
        }
        throw new Error(
          `Insufficient network stock for "${item.productName}" (${item.packSize}). Requested: ${item.quantity}, Combined Available: ${combined.availableStock}.`
        );
      }
    }

    // Step A: Find all vendors carrying at least 1 item
    const vendorMap = new Map<number, { id: number; name: string; locality: string }>();
    this.inventory.forEach(inv => {
      if (!vendorMap.has(inv.vendorId)) {
        vendorMap.set(inv.vendorId, { id: inv.vendorId, name: inv.vendorName, locality: inv.locality });
      }
    });

    // Evaluate each vendor
    const evaluatedVendors: Array<{
      vendorId: number;
      vendorName: string;
      distanceKm: number;
      canFulfillFullOrder: boolean;
      availableItemsCount: number;
      estimatedCost: number;
      ineligibleReason?: string;
    }> = [];

    const singleVendorCandidates: Array<{
      vendorId: number;
      vendorName: string;
      vendorLocality: string;
      distanceKm: number;
      totalCost: number;
      items: Array<{
        productId: number;
        variantId: number;
        productName: string;
        packSize: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
        imageUrl?: string;
      }>;
    }> = [];

    vendorMap.forEach(vendor => {
      const eligibility = isVendorEligibleForLocality(vendor.id, customerLocality);
      if (!eligibility.eligible) {
        evaluatedVendors.push({
          vendorId: vendor.id,
          vendorName: vendor.name,
          distanceKm: eligibility.distanceKm,
          canFulfillFullOrder: false,
          availableItemsCount: 0,
          estimatedCost: 0,
          ineligibleReason: eligibility.reason
        });
        return;
      }

      const dist = eligibility.distanceKm;
      let canFulfill = true;
      let availableCount = 0;
      let totalCost = 0;
      const vendorAllocatedItems: any[] = [];

      for (const reqItem of cartItems) {
        const inv = this.inventory.find(
          i => i.vendorId === vendor.id && i.productId === reqItem.productId && i.variantId === reqItem.variantId
        );
        const avail = inv ? Math.max(0, inv.physicalStock - inv.reservedStock - inv.committedStock) : 0;

        if (avail >= reqItem.quantity) {
          availableCount++;
          const price = inv?.price ?? reqItem.unitPrice ?? 0;
          totalCost += price * reqItem.quantity;
          vendorAllocatedItems.push({
            productId: reqItem.productId,
            variantId: reqItem.variantId,
            productName: reqItem.productName,
            packSize: reqItem.packSize,
            quantity: reqItem.quantity,
            unitPrice: price,
            subtotal: price * reqItem.quantity,
            imageUrl: reqItem.imageUrl
          });
        } else {
          canFulfill = false;
        }
      }

      evaluatedVendors.push({
        vendorId: vendor.id,
        vendorName: vendor.name,
        distanceKm: dist,
        canFulfillFullOrder: canFulfill,
        availableItemsCount: availableCount,
        estimatedCost: totalCost
      });

      if (canFulfill) {
        singleVendorCandidates.push({
          vendorId: vendor.id,
          vendorName: vendor.name,
          vendorLocality: vendor.locality,
          distanceKm: dist,
          totalCost,
          items: vendorAllocatedItems
        });
      }
    });

    // Case 1: Single vendor can fulfill the entire order
    if (singleVendorCandidates.length > 0) {
      // Sort single vendors by lowest total items cost, then by proximity to customer
      singleVendorCandidates.sort((a, b) => {
        if (a.totalCost !== b.totalCost) {
          return a.totalCost - b.totalCost;
        }
        return a.distanceKm - b.distanceKm;
      });

      const best = singleVendorCandidates[0];
      const commAmount = (best.totalCost * commissionRate) / 100;

      return {
        strategy: 'SINGLE_OPTIMAL',
        isMultiVendor: false,
        reason: `Optimal single-vendor fulfillment: ${best.vendorName} fulfills 100% of order with lowest fulfillment cost (₹${best.totalCost} product cost, located ${best.distanceKm} km from dispatch).`,
        subordersPlan: [
          {
            vendorId: best.vendorId,
            vendorName: best.vendorName,
            vendorLocality: best.vendorLocality,
            distanceKm: best.distanceKm,
            items: best.items,
            subtotal: best.totalCost,
            commissionAmount: commAmount,
            netPayout: best.totalCost - commAmount
          }
        ],
        evaluatedVendors,
        totalItemsCost: best.totalCost
      };
    }

    // Case 2: Multi-vendor split allocation (no single vendor has full stock)
    const vendorSubordersMap = new Map<
      number,
      {
        vendorId: number;
        vendorName: string;
        vendorLocality: string;
        distanceKm: number;
        items: any[];
        subtotal: number;
      }
    >();

    for (const reqItem of cartItems) {
      let needed = reqItem.quantity;

      // Find all eligible vendors for this variant sorted by price then distance
      const eligibleInvs = this.inventory
        .filter(
          i =>
            i.productId === reqItem.productId &&
            i.variantId === reqItem.variantId &&
            i.physicalStock - i.reservedStock - i.committedStock > 0 &&
            isVendorEligibleForLocality(i.vendorId, customerLocality).eligible
        )
        .sort((a, b) => {
          if (a.price !== b.price) return a.price - b.price;
          return getLocalityDistance(a.locality) - getLocalityDistance(b.locality);
        });

      for (const inv of eligibleInvs) {
        if (needed <= 0) break;
        const available = Math.max(0, inv.physicalStock - inv.reservedStock - inv.committedStock);
        const take = Math.min(needed, available);
        if (take <= 0) continue;

        if (!vendorSubordersMap.has(inv.vendorId)) {
          vendorSubordersMap.set(inv.vendorId, {
            vendorId: inv.vendorId,
            vendorName: inv.vendorName,
            vendorLocality: inv.locality,
            distanceKm: getLocalityDistance(inv.locality),
            items: [],
            subtotal: 0
          });
        }

        const sub = vendorSubordersMap.get(inv.vendorId)!;
        const itemSubtotal = inv.price * take;
        sub.items.push({
          productId: reqItem.productId,
          variantId: reqItem.variantId,
          productName: reqItem.productName,
          packSize: reqItem.packSize,
          quantity: take,
          unitPrice: inv.price,
          subtotal: itemSubtotal,
          imageUrl: reqItem.imageUrl
        });
        sub.subtotal += itemSubtotal;
        needed -= take;
      }

      if (needed > 0) {
        throw new Error(`Unable to fulfill full quantity for "${reqItem.productName}". Shortage of ${needed} units.`);
      }
    }

    const subordersPlan = Array.from(vendorSubordersMap.values()).map(sub => {
      const comm = (sub.subtotal * commissionRate) / 100;
      return {
        ...sub,
        commissionAmount: comm,
        netPayout: sub.subtotal - comm
      };
    });

    const totalCost = subordersPlan.reduce((acc, s) => acc + s.subtotal, 0);
    const vendorNames = subordersPlan.map(s => s.vendorName).join(', ');

    return {
      strategy: 'MULTI_SPLIT',
      isMultiVendor: true,
      reason: `Multi-vendor split fulfillment: Stock distributed across ${subordersPlan.length} verified vendors (${vendorNames}) to satisfy requested basket quantities.`,
      subordersPlan,
      evaluatedVendors,
      totalItemsCost: totalCost
    };
  }

  // 7. Atomic Reservation
  public createReservation(
    orderRef: string,
    allocatedItems: Array<{ vendorId: number; productId: number; variantId: number; quantity: number }>
  ): { reservationToken: string; expiresAt: number } {
    const reservationToken = `res-${crypto.randomBytes(12).toString('hex')}`;
    const now = Date.now();
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes TTL

    allocatedItems.forEach(it => {
      const inv = this.inventory.find(i => i.vendorId === it.vendorId && i.productId === it.productId && i.variantId === it.variantId);
      if (!inv) {
        throw new Error(`Cannot reserve stock: Inventory for vendor ${it.vendorId} not found.`);
      }

      const available = inv.physicalStock - inv.reservedStock - inv.committedStock;
      if (available < it.quantity) {
        throw new Error(`Stock concurrency conflict: Available stock for ${inv.productName} dropped below requested quantity.`);
      }

      const prevReserved = inv.reservedStock;
      inv.reservedStock += it.quantity;
      inv.availableStock = Math.max(0, inv.physicalStock - inv.reservedStock - inv.committedStock);
      inv.updatedAt = new Date().toISOString();

      const reservation: StockReservation = {
        id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        reservationToken,
        vendorId: it.vendorId,
        productId: it.productId,
        variantId: it.variantId,
        quantity: it.quantity,
        status: 'active',
        createdAt: now,
        expiresAt
      };
      this.reservations.push(reservation);

      this.recordLedgerEntry({
        vendorId: inv.vendorId,
        vendorName: inv.vendorName,
        productId: inv.productId,
        variantId: inv.variantId,
        productName: inv.productName,
        packSize: inv.packSize,
        changeQty: -it.quantity,
        previousPhysicalStock: inv.physicalStock,
        newPhysicalStock: inv.physicalStock,
        previousReservedStock: prevReserved,
        newReservedStock: inv.reservedStock,
        reason: 'STOCK_RESERVATION',
        referenceId: reservationToken
      });
    });

    writeJsonFile(STOCK_RESERVATIONS_FILE, this.reservations);
    writeJsonFile(VENDOR_INVENTORY_FILE, this.inventory);

    return { reservationToken, expiresAt };
  }

  // 8. Authoritative Atomic Checkout & Suborder Generation
  public checkoutOrder(orderData: {
    customerName: string;
    phone: string;
    address: string;
    locality: string;
    distanceKm: number;
    deliveryFee: number;
    paymentMethod: string;
    items: Array<{
      productId: number;
      variantId: number;
      productName: string;
      packSize: string;
      quantity: number;
      unitPrice?: number;
      imageUrl?: string;
    }>;
    commissionRate?: number;
  }): { parentOrder: Order; suborders: VendorSuborder[]; decision: OrderAllocationDecision } {
    const rate = orderData.commissionRate ?? 10.0;
    const allocation = this.evaluateAllocation(
      orderData.items,
      orderData.locality,
      orderData.distanceKm,
      rate
    );

    const parentOrderId = Date.now();
    const parentOrderNumber = `HF-${Math.floor(10000 + Math.random() * 90000)}`;
    const nowTimeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const nowIsoStr = new Date().toISOString();

    // Convert stock reservations into committed order stock
    allocation.subordersPlan.forEach(sub => {
      sub.items.forEach(it => {
        const inv = this.inventory.find(i => i.vendorId === sub.vendorId && i.productId === it.productId && i.variantId === it.variantId);
        if (inv) {
          const prevPhysical = inv.physicalStock;
          inv.physicalStock = Math.max(0, inv.physicalStock - it.quantity);
          inv.availableStock = Math.max(0, inv.physicalStock - inv.reservedStock - inv.committedStock);
          inv.updatedAt = nowIsoStr;

          this.recordLedgerEntry({
            vendorId: inv.vendorId,
            vendorName: inv.vendorName,
            productId: inv.productId,
            variantId: inv.variantId,
            productName: inv.productName,
            packSize: inv.packSize,
            changeQty: -it.quantity,
            previousPhysicalStock: prevPhysical,
            newPhysicalStock: inv.physicalStock,
            previousReservedStock: inv.reservedStock,
            newReservedStock: inv.reservedStock,
            reason: 'ORDER_FULFILLED',
            referenceId: parentOrderNumber
          });
        }
      });
    });

    writeJsonFile(VENDOR_INVENTORY_FILE, this.inventory);

    // Build Vendor Suborders
    const suborders: VendorSuborder[] = allocation.subordersPlan.map((plan, idx) => {
      const suborderNumber = `SO-${parentOrderNumber.replace('HF-', '')}-V${plan.vendorId}`;
      return {
        id: `so-${parentOrderId}-${plan.vendorId}`,
        suborderNumber,
        parentOrderId,
        parentOrderNumber,
        vendorId: plan.vendorId,
        vendorName: plan.vendorName,
        vendorLocality: plan.vendorLocality,
        items: plan.items.map(it => ({
          productId: it.productId,
          vendorId: plan.vendorId,
          productName: it.productName,
          packSize: it.packSize,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          subtotal: it.subtotal,
          imageUrl: it.imageUrl,
          packed: false,
          checked: false,
          fulfillmentStatus: 'Pending'
        })),
        subtotal: plan.subtotal,
        commissionRate: rate,
        commissionAmount: plan.commissionAmount,
        netPayout: plan.netPayout,
        status: 'New',
        allocationReason: allocation.reason,
        createdAt: nowTimeStr
      };
    });

    // Build Allocation Decision
    const decision: OrderAllocationDecision = {
      orderId: parentOrderId,
      orderNumber: parentOrderNumber,
      isMultiVendor: allocation.isMultiVendor,
      strategy: allocation.strategy,
      reason: allocation.reason,
      evaluatedVendors: allocation.evaluatedVendors,
      allocatedVendors: allocation.subordersPlan.map(s => ({
        vendorId: s.vendorId,
        vendorName: s.vendorName,
        itemCount: s.items.length,
        subtotal: s.subtotal
      })),
      splitCount: allocation.subordersPlan.length,
      totalDeliveryFee: orderData.deliveryFee,
      timestamp: nowIsoStr
    };

    // Flatten items for customer parent order
    const flattenedItems: OrderItem[] = [];
    suborders.forEach(sub => {
      sub.items.forEach(it => flattenedItems.push(it));
    });

    const primaryVendor = suborders[0];

    const parentOrder: Order = {
      id: parentOrderId,
      orderNumber: parentOrderNumber,
      customerName: orderData.customerName,
      phone: orderData.phone,
      address: orderData.address,
      locality: orderData.locality,
      totalAmount: allocation.totalItemsCost + orderData.deliveryFee,
      deliveryFee: orderData.deliveryFee,
      paymentMethod: orderData.paymentMethod,
      status: 'New',
      createdAt: 'Just now',
      orderedAt: nowTimeStr,
      estimatedDeliveryTime: new Date(Date.now() + 20 * 60000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      estimatedMinutes: 20,
      totalTimeTaken: '~20 mins SLA',
      deliveryMinutes: 20,
      distanceKm: orderData.distanceKm,
      isMultiVendor: allocation.isMultiVendor,
      vendorName: allocation.isMultiVendor ? `Multi-Vendor (${suborders.length} Hubs)` : primaryVendor.vendorName,
      vendorLocality: allocation.isMultiVendor ? 'Multiple Locations' : primaryVendor.vendorLocality,
      items: flattenedItems,
      suborders,
      allocationDecision: decision
    };

    this.orders.unshift(parentOrder);
    this.allocationLogs.unshift(decision);

    writeJsonFile(ORDERS_FILE, this.orders);
    writeJsonFile(ALLOCATION_LOGS_FILE, this.allocationLogs);

    return { parentOrder, suborders, decision };
  }

  // 9. Vendor Suborder Status Transitions (Accept, Prepare, Ready for Pickup)
  public updateSuborderStatus(
    suborderIdOrNumber: string,
    nextStatus: OrderStatus | 'Pending' | 'Rejected',
    extra?: { rejectionReason?: string; checklist?: Record<number, boolean> }
  ): { suborder: VendorSuborder; parentOrder: Order } {
    let targetSuborder: VendorSuborder | null = null;
    let targetOrder: Order | null = null;

    for (const ord of this.orders) {
      if (ord.suborders) {
        const found = ord.suborders.find(s => s.id === suborderIdOrNumber || s.suborderNumber === suborderIdOrNumber);
        if (found) {
          targetSuborder = found;
          targetOrder = ord;
          break;
        }
      }
    }

    if (!targetSuborder || !targetOrder) {
      throw new Error(`Suborder "${suborderIdOrNumber}" not found.`);
    }

    const nowStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    targetSuborder.status = nextStatus;

    if (nextStatus === 'Accepted') {
      targetSuborder.orderAcceptedAt = nowStr;
    } else if (nextStatus === 'Preparing') {
      targetSuborder.preparedAt = nowStr;
    } else if (nextStatus === 'Ready for Pickup' || nextStatus === 'Packed') {
      targetSuborder.readyForPickupAt = nowStr;
      targetSuborder.items.forEach(it => {
        it.packed = true;
      });
    } else if (nextStatus === 'Rejected' || nextStatus === 'Cancelled') {
      targetSuborder.rejectionReason = extra?.rejectionReason || 'Vendor unable to fulfill requested stock';
      // Return stock to physical inventory
      targetSuborder.items.forEach(it => {
        const inv = this.inventory.find(i => i.vendorId === targetSuborder!.vendorId && i.productId === it.productId && i.variantId === it.id);
        if (inv) {
          const prev = inv.physicalStock;
          inv.physicalStock += it.quantity;
          inv.availableStock = Math.max(0, inv.physicalStock - inv.reservedStock - inv.committedStock);
          this.recordLedgerEntry({
            vendorId: inv.vendorId,
            vendorName: inv.vendorName,
            productId: inv.productId,
            variantId: inv.variantId,
            productName: inv.productName,
            packSize: inv.packSize,
            changeQty: it.quantity,
            previousPhysicalStock: prev,
            newPhysicalStock: inv.physicalStock,
            previousReservedStock: inv.reservedStock,
            newReservedStock: inv.reservedStock,
            reason: 'VENDOR_REJECTION_RETURN',
            referenceId: targetSuborder!.suborderNumber
          });
        }
      });
      writeJsonFile(VENDOR_INVENTORY_FILE, this.inventory);
    }

    // Update parent order composite status
    const allSubs = targetOrder.suborders || [];
    if (allSubs.every(s => s.status === 'Ready for Pickup' || s.status === 'Packed')) {
      targetOrder.status = 'Ready for Pickup';
      targetOrder.readyForPickupAt = nowStr;
    } else if (allSubs.some(s => s.status === 'Preparing')) {
      targetOrder.status = 'Preparing';
      targetOrder.preparedAt = nowStr;
    } else if (allSubs.every(s => s.status === 'Accepted')) {
      targetOrder.status = 'Accepted';
      targetOrder.orderAcceptedAt = nowStr;
    } else if (allSubs.every(s => s.status === 'Cancelled' || s.status === 'Rejected')) {
      targetOrder.status = 'Cancelled';
    }

    writeJsonFile(ORDERS_FILE, this.orders);
    return { suborder: targetSuborder, parentOrder: targetOrder };
  }

  // 10. Admin Manual Reallocation Override
  public reallocateSuborder(
    suborderIdOrNumber: string,
    newVendorId: number,
    adminNotes?: string
  ): { suborder: VendorSuborder; parentOrder: Order } {
    let targetSuborder: VendorSuborder | null = null;
    let targetOrder: Order | null = null;

    for (const ord of this.orders) {
      if (ord.suborders) {
        const found = ord.suborders.find(s => s.id === suborderIdOrNumber || s.suborderNumber === suborderIdOrNumber);
        if (found) {
          targetSuborder = found;
          targetOrder = ord;
          break;
        }
      }
    }

    if (!targetSuborder || !targetOrder) {
      throw new Error(`Suborder ${suborderIdOrNumber} not found.`);
    }

    const prevVendorId = targetSuborder.vendorId;
    const prevVendorName = targetSuborder.vendorName;

    // Check if new vendor exists in inventory
    const newVendorItems = this.inventory.filter(i => i.vendorId === newVendorId);
    if (newVendorItems.length === 0) {
      throw new Error(`Vendor ID ${newVendorId} not found in vendor registry.`);
    }

    const newVendorName = newVendorItems[0].vendorName;
    const newVendorLocality = newVendorItems[0].locality;

    // Return stock to previous vendor
    targetSuborder.items.forEach(it => {
      const invOld = this.inventory.find(i => i.vendorId === prevVendorId && i.productId === it.productId && i.variantId === it.id);
      if (invOld) {
        const prev = invOld.physicalStock;
        invOld.physicalStock += it.quantity;
        invOld.availableStock = Math.max(0, invOld.physicalStock - invOld.reservedStock - invOld.committedStock);
        this.recordLedgerEntry({
          vendorId: prevVendorId,
          vendorName: prevVendorName,
          productId: invOld.productId,
          variantId: invOld.variantId,
          productName: invOld.productName,
          packSize: invOld.packSize,
          changeQty: it.quantity,
          previousPhysicalStock: prev,
          newPhysicalStock: invOld.physicalStock,
          previousReservedStock: invOld.reservedStock,
          newReservedStock: invOld.reservedStock,
          reason: 'ADMIN_OVERRIDE',
          referenceId: `REALLOC_FROM_${targetSuborder!.suborderNumber}`
        });
      }

      // Deduct stock from new vendor
      const invNew = this.inventory.find(i => i.vendorId === newVendorId && i.productId === it.productId && i.variantId === it.id);
      if (invNew) {
        const prev = invNew.physicalStock;
        invNew.physicalStock = Math.max(0, invNew.physicalStock - it.quantity);
        invNew.availableStock = Math.max(0, invNew.physicalStock - invNew.reservedStock - invNew.committedStock);
        this.recordLedgerEntry({
          vendorId: newVendorId,
          vendorName: newVendorName,
          productId: invNew.productId,
          variantId: invNew.variantId,
          productName: invNew.productName,
          packSize: invNew.packSize,
          changeQty: -it.quantity,
          previousPhysicalStock: prev,
          newPhysicalStock: invNew.physicalStock,
          previousReservedStock: invNew.reservedStock,
          newReservedStock: invNew.reservedStock,
          reason: 'ADMIN_OVERRIDE',
          referenceId: `REALLOC_TO_${targetSuborder!.suborderNumber}`
        });
      }
    });

    writeJsonFile(VENDOR_INVENTORY_FILE, this.inventory);

    // Update Suborder fields
    targetSuborder.vendorId = newVendorId;
    targetSuborder.vendorName = newVendorName;
    targetSuborder.vendorLocality = newVendorLocality;
    targetSuborder.status = 'New';
    targetSuborder.allocationReason = `Manual Admin Override: Reallocated from ${prevVendorName} to ${newVendorName}. Notes: ${adminNotes || 'Dispatch optimization'}`;

    writeJsonFile(ORDERS_FILE, this.orders);

    return { suborder: targetSuborder, parentOrder: targetOrder };
  }

  // 11. Read methods
  public getOrders(): Order[] {
    return this.orders;
  }

  public getOrderById(orderId: number): Order | undefined {
    return this.orders.find(o => o.id === orderId);
  }

  public getVendorSuborders(vendorId: number): VendorSuborder[] {
    const list: VendorSuborder[] = [];
    this.orders.forEach(ord => {
      if (ord.suborders) {
        ord.suborders.forEach(sub => {
          if (sub.vendorId === vendorId) {
            list.push(sub);
          }
        });
      }
    });
    return list;
  }

  public getLedger(): StockMovementLedgerEntry[] {
    return this.ledger;
  }

  public getAllocationLogs(): OrderAllocationDecision[] {
    return this.allocationLogs;
  }
}

// Export singleton instance
export const multiVendorStore = new MultiVendorStore();
