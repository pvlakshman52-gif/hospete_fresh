import { db } from './index.ts';
import {
  categories,
  brands,
  vendors,
  products,
  productVariants,
  vendorInventory,
  orders,
  vendorOrders,
  orderItems,
  systemSettings,
  mandatoryFieldPolicies,
  notificationChannels,
  notificationTemplates,
  vendorSettlements,
  flashDeals,
  auditLogs,
} from './schema.ts';
import { CATEGORIES, INITIAL_VENDORS, INITIAL_PRODUCTS } from '../data.ts';
import { eq, sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

export async function runInitialMigration() {
  try {
    console.log('[Migration] Checking if initial migration has already been executed...');
    
    // Check if categories are already seeded
    const existingCats = await db.select({ count: sql<number>`count(*)::int` }).from(categories);
    const catCount = existingCats[0]?.count || 0;
    if (catCount > 0) {
      console.log(`[Migration] Database already initialized (${catCount} categories exist). Skipping fresh seed.`);
      return { success: true, message: 'Already initialized.' };
    }

    console.log('[Migration] Starting initial PostgreSQL migration...');

    // 1. Seed Categories
    console.log('[Migration] Seeding categories...');
    for (const cat of CATEGORIES) {
      await db.insert(categories).values({
        name: cat.name,
        slug: cat.slug,
        icon: cat.iconEmoji || '',
        itemCount: 0,
        displayOrder: cat.displayOrder || cat.id,
      }).onConflictDoNothing();
    }

    // 2. Seed Brands
    console.log('[Migration] Seeding brands...');
    const brandSet = new Set<string>();
    INITIAL_PRODUCTS.forEach(p => {
      if (p.brand) brandSet.add(p.brand);
    });
    for (const bName of brandSet) {
      await db.insert(brands).values({
        name: bName,
      }).onConflictDoNothing();
    }

    // 3. Seed Vendors
    console.log('[Migration] Seeding vendors...');
    const vendorMap = new Map<number, string>(); // legacyId -> uuid
    for (const v of INITIAL_VENDORS) {
      const inserted = await db.insert(vendors).values({
        legacyId: v.id,
        businessName: v.businessName,
        ownerName: v.ownerName,
        phone: v.phone,
        email: v.email,
        address: v.address,
        locality: v.locality,
        serviceArea: v.serviceArea,
        businessType: v.businessType,
        description: v.description,
        commissionRate: '10.00',
        status: v.status,
        suspensionReason: v.suspensionReason || null,
      } as any).returning({ id: vendors.id, legacyId: vendors.legacyId });

      if (inserted[0]) {
        vendorMap.set(inserted[0].legacyId!, inserted[0].id);
      }
    }

    // 4. Seed Products and Variants
    console.log('[Migration] Seeding products and variants...');
    const productMap = new Map<number, string>(); // legacyId -> uuid
    const variantMap = new Map<number, string>(); // legacyId -> uuid

    for (const p of INITIAL_PRODUCTS) {
      const vUuid = vendorMap.get(p.vendorId || 1) || vendorMap.get(1);
      const insertedProd = await db.insert(products).values({
        legacyId: p.id,
        vendorId: vUuid,
        sku: p.sku,
        barcode: p.barcode || null,
        name: p.name,
        categorySlug: p.categorySlug,
        subCategorySlug: p.subCategorySlug || null,
        brand: p.brand,
        description: p.description,
        imageUrl: p.imageUrl,
        rating: String(p.rating || 4.5),
        reviewCount: p.reviewCount || 0,
        isDeal: Boolean(p.isDeal),
        dealTag: p.dealTag || null,
        isBestseller: Boolean(p.isBestseller),
        isFresh: Boolean(p.isFresh),
        isBulk: Boolean(p.isBulk),
        isActive: p.isActive !== false,
        approvalStatus: p.approvalStatus || 'approved',
      } as any).returning({ id: products.id, legacyId: products.legacyId });

      if (insertedProd[0]) {
        const prodUuid = insertedProd[0].id;
        productMap.set(insertedProd[0].legacyId!, prodUuid);

        for (const vr of p.variants) {
          const insertedVar = await db.insert(productVariants).values({
            legacyId: vr.id,
            productId: prodUuid,
            packSize: vr.packSize,
            price: String(vr.price),
            mrp: String(vr.mrp),
            stockQty: vr.stockQty,
            isDefault: Boolean(vr.isDefault),
          }).returning({ id: productVariants.id, legacyId: productVariants.legacyId });

          if (insertedVar[0]) {
            variantMap.set(insertedVar[0].legacyId!, insertedVar[0].id);

            // Create initial vendor inventory entry for primary vendor
            if (vUuid) {
              const vendorObj = INITIAL_VENDORS.find(ven => ven.id === p.vendorId);
              await db.insert(vendorInventory).values({
                vendorId: vUuid,
                productId: prodUuid,
                variantId: insertedVar[0].id,
                physicalStock: vr.stockQty,
                reservedStock: 0,
                committedStock: 0,
                availableStock: vr.stockQty,
                price: String(vr.price),
                mrp: String(vr.mrp),
                locality: vendorObj?.locality || 'Station Road',
              });
            }
          }
        }
      }
    }

    // 5. Seed Additional Multi-Vendor Inventory
    console.log('[Migration] Seeding multi-vendor inventory distribution...');
    // Add staple items for Sri Lakshmi Store (vendor 3) and Hampi Farm Delights (vendor 4)
    const tomatoProdUuid = productMap.get(1);
    const tomatoVarUuid = variantMap.get(101);
    const vendor3Uuid = vendorMap.get(3);
    const vendor4Uuid = vendorMap.get(4);

    if (tomatoProdUuid && tomatoVarUuid && vendor3Uuid) {
      await db.insert(vendorInventory).values({
        vendorId: vendor3Uuid,
        productId: tomatoProdUuid,
        variantId: tomatoVarUuid,
        physicalStock: 25,
        reservedStock: 0,
        committedStock: 0,
        availableStock: 25,
        price: '24.00',
        mrp: '30.00',
        locality: 'Kampli Road',
      });
    }

    // 6. Seed System Settings
    console.log('[Migration] Seeding system settings...');
    const defaultSettings = [
      { key: 'geofence_radius_km', value: '15', desc: 'Maximum delivery coverage radius from Hospete center (km)' },
      { key: 'standard_delivery_fee', value: '25', desc: 'Standard delivery fee below free threshold (₹)' },
      { key: 'free_delivery_threshold', value: '199', desc: 'Cart total qualifying for ₹0 free delivery (₹)' },
      { key: 'commission_rate_percent', value: '10.0', desc: 'Default platform commission on vendor gross sales (%)' },
      { key: 'store_operational_hours', value: '6:00 AM - 11:00 PM IST', desc: 'Supermarket daily operational window' },
      { key: 'auto_dispatch_lead_mins', value: '10', desc: 'Lead time before assigning nearest delivery partner' },
      { key: 'business_timezone', value: 'Asia/Kolkata', desc: 'Standard business reporting timezone' },
      { key: 'eod_closing_time', value: '23:00', desc: 'Daily closing report trigger time (IST)' },
    ];
    for (const s of defaultSettings) {
      await db.insert(systemSettings).values({
        settingKey: s.key,
        settingValue: s.value,
        description: s.desc,
      }).onConflictDoNothing();
    }

    // 7. Seed Mandatory Field Policies
    console.log('[Migration] Seeding mandatory field policies...');
    const policies = [
      { formType: 'customer_registration', fieldName: 'fullName', isRequired: true, isOverridable: false, desc: 'Customer full name' },
      { formType: 'customer_registration', fieldName: 'phone', isRequired: true, isOverridable: false, desc: '10-digit Indian mobile number' },
      { formType: 'customer_registration', fieldName: 'address', isRequired: true, isOverridable: true, desc: 'Delivery address line' },
      { formType: 'customer_registration', fieldName: 'locality', isRequired: true, isOverridable: false, desc: 'Hospete delivery locality' },
      { formType: 'vendor_registration', fieldName: 'businessName', isRequired: true, isOverridable: false, desc: 'Vendor trade name' },
      { formType: 'vendor_registration', fieldName: 'phone', isRequired: true, isOverridable: false, desc: 'Vendor contact phone' },
      { formType: 'vendor_registration', fieldName: 'tradeLicense', isRequired: true, isOverridable: true, desc: 'CMC Municipal trade license' },
      { formType: 'checkout', fieldName: 'paymentMethod', isRequired: true, isOverridable: false, desc: 'Selected payment method' },
    ];
    for (const p of policies) {
      await db.insert(mandatoryFieldPolicies).values({
        formType: p.formType,
        fieldName: p.fieldName,
        isRequired: p.isRequired,
        isOverridable: p.isOverridable,
        description: p.desc,
      });
    }

    // 8. Seed Notification Channels (Fallback hierarchy: Email -> WhatsApp -> SMS)
    console.log('[Migration] Seeding notification channels...');
    const channels = [
      { name: 'email', isEnabled: true, priority: 1, config: { provider: 'transactional_smtp', sender: 'no-reply@hospetegrocery.in' } },
      { name: 'whatsapp', isEnabled: true, priority: 2, config: { provider: 'whatsapp_business_cloud', senderId: '+919845012345' } },
      { name: 'sms', isEnabled: true, priority: 3, config: { provider: 'telecom_sms_gateway', senderId: 'HOSPETE' } },
    ];
    for (const ch of channels) {
      await db.insert(notificationChannels).values({
        channelName: ch.name,
        isEnabled: ch.isEnabled,
        priorityOrder: ch.priority,
        providerConfig: ch.config,
      }).onConflictDoNothing();
    }

    // 9. Seed Notification Templates
    console.log('[Migration] Seeding notification templates...');
    const templates = [
      {
        eventKey: 'order_placed',
        subject: 'Order Confirmed: #{{orderNumber}} - Hospete Fresh',
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #059669;">Hospete Fresh</h2>
          <p>Hi <strong>{{customerName}}</strong>,</p>
          <p>Thank you for shopping with us! Your order <strong>#{{orderNumber}}</strong> has been placed successfully.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Delivery Locality:</strong> {{locality}}</p>
            <p style="margin: 0 0 8px 0;"><strong>Delivery Address:</strong> {{address}}</p>
            <p style="margin: 0 0 8px 0;"><strong>Payment Method:</strong> {{paymentMethod}}</p>
            <p style="margin: 0;"><strong>Total Amount:</strong> ₹{{totalAmount}}</p>
          </div>
          <p>Items ordered:</p>
          <ul style="padding-left: 20px;">{{itemsList}}</ul>
          <p style="color: #64748b; font-size: 13px;">Estimated Delivery: {{estimatedMinutes}} mins. Need help? Contact support@hospetegrocery.in</p>
        </div>`,
        plain: 'Hospete Fresh: Your order #{{orderNumber}} for ₹{{totalAmount}} has been received and is being prepared.',
      },
      {
        eventKey: 'order_delivered',
        subject: 'Delivered: #{{orderNumber}} - Hospete Fresh',
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #059669;">Order Delivered!</h2>
          <p>Hi <strong>{{customerName}}</strong>,</p>
          <p>Your order <strong>#{{orderNumber}}</strong> has been successfully delivered to {{address}}.</p>
          <p>Total Paid: ₹{{totalAmount}}</p>
          <p>Thank you for choosing Hospete Fresh. Rate your delivery partner in the app!</p>
        </div>`,
        plain: 'Hospete Fresh: Your order #{{orderNumber}} has been delivered. Thank you!',
      },
      {
        eventKey: 'vendor_daily_closing',
        subject: 'Daily Closing Summary: {{vendorName}} ({{reportDate}})',
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #1e293b;">Daily Settlement Report: {{vendorName}}</h2>
          <p>Date: <strong>{{reportDate}}</strong> | Timezone: Asia/Kolkata</p>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Fulfilled Orders</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;"><strong>{{ordersCount}}</strong></td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Gross Sales</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹{{grossSales}}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Commission (10%)</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #dc2626;">-₹{{commission}}</td></tr>
            <tr style="background: #f1f5f9;"><td style="padding: 10px; font-weight: bold;">Net Payout</td><td style="padding: 10px; text-align: right; font-weight: bold; color: #059669;">₹{{netPayout}}</td></tr>
          </table>
          <p style="font-size: 13px; color: #64748b;">Weekly settlements are processed every Monday via Karnataka Bank Escrow.</p>
        </div>`,
        plain: 'Hospete Fresh: Daily report for {{vendorName}} ({{reportDate}}). Orders: {{ordersCount}}, Gross: ₹{{grossSales}}, Net: ₹{{netPayout}}.',
      },
      {
        eventKey: 'delivery_partner_daily_closing',
        subject: 'Delivery Earnings Report: {{partnerName}} ({{reportDate}})',
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #1e293b;">Daily Delivery Earnings: {{partnerName}}</h2>
          <p>Date: <strong>{{reportDate}}</strong></p>
          <p>Completed Trips: <strong>{{tripsCount}}</strong></p>
          <p>Total Payout: <strong>₹{{totalEarned}}</strong></p>
        </div>`,
        plain: 'Hospete Fresh: Earnings for {{partnerName}} ({{reportDate}}). Deliveries: {{tripsCount}}, Total Earned: ₹{{totalEarned}}.',
      }
    ];
    for (const t of templates) {
      await db.insert(notificationTemplates).values({
        eventKey: t.eventKey,
        version: 1,
        subjectTemplate: t.subject,
        htmlTemplate: t.html,
        plainTextTemplate: t.plain,
      });
    }

    // 10. Seed Vendor Settlements (SET-001 to SET-005)
    console.log('[Migration] Seeding vendor settlements...');
    const settlements = [
      { batch: 'SET-001', vLegacyId: 1, orders: 184, gross: '128450.00', comm: '6422.00', net: '122028.00', status: 'Paid', ref: 'KB-ESC-99821' },
      { batch: 'SET-002', vLegacyId: 4, orders: 122, gross: '82600.00', comm: '4130.00', net: '78470.00', status: 'Pending', ref: null },
      { batch: 'SET-003', vLegacyId: 3, orders: 95, gross: '48320.00', comm: '2416.00', net: '45904.00', status: 'Paid', ref: 'KB-ESC-99844' },
      { batch: 'SET-004', vLegacyId: 5, orders: 68, gross: '36900.00', comm: '1845.00', net: '35055.00', status: 'Pending', ref: null },
      { batch: 'SET-005', vLegacyId: 2, orders: 42, gross: '24850.00', comm: '1242.00', net: '23608.00', status: 'Paid', ref: 'KB-ESC-99890' },
    ];
    for (const s of settlements) {
      const vUuid = vendorMap.get(s.vLegacyId);
      if (vUuid) {
        await db.insert(vendorSettlements).values({
          batchNumber: s.batch,
          vendorId: vUuid,
          periodStart: '2026-10-15',
          periodEnd: '2026-10-21',
          fulfilledOrdersCount: s.orders,
          grossSales: s.gross,
          commissionAmount: s.comm,
          netPayout: s.net,
          status: s.status,
          paymentRef: s.ref,
        }).onConflictDoNothing();
      }
    }

    // 11. Seed Initial Orders and Suborders
    console.log('[Migration] Seeding initial verified orders...');
    const initialOrders = [
      {
        legacyId: 83921,
        orderNumber: 'HF-83921',
        customerName: 'Ramesh Rao',
        phone: '9845012345',
        address: '#42, 3rd Cross, Gandhi Nagar',
        locality: 'Patel Nagar',
        total: '76.00',
        fee: '0.00',
        payment: 'UPI / PhonePe',
        status: 'Delivered',
        vLegacyId: 3,
        items: [
          { prodId: 1, varId: 101, name: 'Farm Fresh Red Tomatoes', pack: '1 kg', price: '32.00', qty: 2, sub: '64.00' },
          { prodId: 2, varId: 201, name: 'Fresh Green Coriander', pack: '1 Bunch (100g)', price: '12.00', qty: 1, sub: '12.00' },
        ]
      },
      {
        legacyId: 83920,
        orderNumber: 'HF-83920',
        customerName: 'Shanti Devi',
        phone: '9845098765',
        address: '#108, Hampi Road, Near Temple',
        locality: 'Dam Road',
        total: '315.00',
        fee: '0.00',
        payment: 'Cash on Delivery',
        status: 'Out for Delivery',
        vLegacyId: 3,
        items: [
          { prodId: 4, varId: 402, name: 'Nandini Pure Cow Ghee', pack: '500 ml Pouch', price: '315.00', qty: 1, sub: '315.00' },
        ]
      },
      {
        legacyId: 83919,
        orderNumber: 'HF-83919',
        customerName: 'Kiran Kumar',
        phone: '9900112233',
        address: '#89, Main Bazaar, Dam Road',
        locality: 'Station Road',
        total: '98.00',
        fee: '25.00',
        payment: 'UPI / GPay',
        status: 'Preparing',
        vLegacyId: 1,
        items: [
          { prodId: 1, varId: 101, name: 'Tomato (Local)', pack: '500 g', price: '24.00', qty: 1, sub: '24.00' },
          { prodId: 2, varId: 201, name: 'Fresh Green Coriander', pack: '1 Bunch (100g)', price: '12.00', qty: 1, sub: '12.00' },
        ]
      }
    ];

    for (const o of initialOrders) {
      const vUuid = vendorMap.get(o.vLegacyId);
      const insertedOrder = await db.insert(orders).values({
        legacyId: o.legacyId,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        phone: o.phone,
        address: o.address,
        locality: o.locality,
        subtotalAmount: o.total,
        deliveryFee: o.fee,
        totalAmount: o.total,
        paymentMethod: o.payment,
        paymentStatus: o.status === 'Delivered' ? 'Paid' : 'Pending',
        status: o.status,
        distanceKm: '2.20',
        isMultiVendor: false,
        assignedDeliveryBoy: 'Ravi Kumar (DLV-001)',
        assignedDeliveryBoyPhone: '+91 98450 12345',
        deliveryOtp: '2846',
      }).returning({ id: orders.id });

      if (insertedOrder[0] && vUuid) {
        const orderUuid = insertedOrder[0].id;
        const subtotalNum = parseFloat(o.total);
        const commNum = subtotalNum * 0.10;
        const netNum = subtotalNum - commNum;

        const insertedSub = await db.insert(vendorOrders).values({
          suborderNumber: `SO-${o.legacyId}-V${o.vLegacyId}`,
          parentOrderId: orderUuid,
          vendorId: vUuid,
          subtotal: o.total,
          commissionRate: '10.00',
          commissionAmount: commNum.toFixed(2),
          netPayout: netNum.toFixed(2),
          status: o.status,
          allocationReason: 'Optimal single-vendor fulfillment',
        }).returning({ id: vendorOrders.id });

        const subUuid = insertedSub[0]?.id;

        for (const it of o.items) {
          const pUuid = productMap.get(it.prodId);
          const varUuid = variantMap.get(it.varId);
          if (pUuid && varUuid) {
            await db.insert(orderItems).values({
              orderId: orderUuid,
              suborderId: subUuid,
              productId: pUuid,
              variantId: varUuid,
              vendorId: vUuid,
              productName: it.name,
              packSize: it.pack,
              unitPrice: it.price,
              quantity: it.qty,
              subtotal: it.sub,
              packed: true,
              checked: true,
              fulfillmentStatus: o.status === 'Delivered' ? 'Delivered' : 'Processing',
            });
          }
        }
      }
    }

    // 12. Audit Log
    await db.insert(auditLogs).values({
      actorEmail: 'system@hospetegrocery.in',
      actorRole: 'system',
      action: 'INITIAL_POSTGRESQL_MIGRATION',
      targetEntity: 'marketplace_catalog',
      details: {
        categoriesCount: CATEGORIES.length,
        vendorsCount: INITIAL_VENDORS.length,
        productsCount: INITIAL_PRODUCTS.length,
      },
    });

    console.log('[Migration] Cloud SQL initial migration completed successfully!');
    return { success: true, message: 'Migration completed.' };
  } catch (err) {
    console.error('[Migration Error] Failed to run initial migration:', err);
    throw err;
  }
}
