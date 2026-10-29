import { db } from './index.ts';
import {
  users,
  customers,
  vendors,
  categories,
  brands,
  products,
  productVariants,
  vendorInventory,
  orders,
  vendorOrders,
  orderItems,
  stockReservations,
  stockMovements,
  deliveries,
  invoices,
  systemSettings,
  mandatoryFieldPolicies,
  adminFieldExceptions,
  notificationChannels,
  notificationTemplates,
  notificationEvents,
  dailyClosingReports,
  vendorSettlements,
  deliveryEarnings,
  flashDeals,
  auditLogs,
} from './schema.ts';
import { eq, and, sql, desc, inArray } from 'drizzle-orm';

// 1. Categories
export async function getCategories() {
  try {
    return await db.select().from(categories).orderBy(categories.displayOrder);
  } catch (error) {
    console.error('Failed to query categories:', error);
    throw new Error('Database query failed. Could not fetch categories.', { cause: error });
  }
}

// 2. Vendors
export async function getVendors() {
  try {
    return await db.select().from(vendors);
  } catch (error) {
    console.error('Failed to query vendors:', error);
    throw new Error('Database query failed. Could not fetch vendors.', { cause: error });
  }
}

export async function getVendorByLegacyOrUuid(idOrLegacy: string | number) {
  try {
    if (typeof idOrLegacy === 'number' || !isNaN(Number(idOrLegacy))) {
      const rows = await db.select().from(vendors).where(eq(vendors.legacyId, Number(idOrLegacy)));
      if (rows.length > 0) return rows[0];
    }
    const rows = await db.select().from(vendors).where(eq(vendors.id, String(idOrLegacy)));
    return rows[0] || null;
  } catch (error) {
    console.error('Failed to query vendor:', error);
    throw new Error('Database query failed. Could not fetch vendor.', { cause: error });
  }
}

// 3. Products with Variants
export async function getProducts(categorySlug?: string) {
  try {
    let prodsQuery = db.select().from(products);
    if (categorySlug) {
      prodsQuery = db.select().from(products).where(eq(products.categorySlug, categorySlug)) as any;
    }
    const prods = await prodsQuery;
    if (prods.length === 0) return [];

    const prodUuids = prods.map(p => p.id);
    const variants = await db
      .select()
      .from(productVariants)
      .where(inArray(productVariants.productId, prodUuids));

    const variantsByProd = new Map<string, typeof variants>();
    variants.forEach(vr => {
      if (!variantsByProd.has(vr.productId)) {
        variantsByProd.set(vr.productId, []);
      }
      variantsByProd.get(vr.productId)!.push(vr);
    });

    return prods.map(p => ({
      ...p,
      id: p.legacyId || p.id,
      uuid: p.id,
      rating: parseFloat(p.rating || '4.5'),
      variants: (variantsByProd.get(p.id) || []).map(v => ({
        ...v,
        id: v.legacyId || v.id,
        uuid: v.id,
        price: parseFloat(v.price),
        mrp: parseFloat(v.mrp),
      })),
    }));
  } catch (error) {
    console.error('Failed to query products:', error);
    throw new Error('Database query failed. Could not fetch products.', { cause: error });
  }
}

// 4. Combined Stock for Variant
export async function getCombinedStock(productId: string | number, variantId: string | number, locality?: string) {
  try {
    // Resolve product & variant UUIDs
    let pUuid: string | undefined;
    let vrUuid: string | undefined;

    if (typeof productId === 'number' || !isNaN(Number(productId))) {
      const pRow = await db.select({ id: products.id }).from(products).where(eq(products.legacyId, Number(productId)));
      pUuid = pRow[0]?.id;
    } else {
      pUuid = String(productId);
    }

    if (typeof variantId === 'number' || !isNaN(Number(variantId))) {
      const vrRow = await db.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.legacyId, Number(variantId)));
      vrUuid = vrRow[0]?.id;
    } else {
      vrUuid = String(variantId);
    }

    if (!pUuid || !vrUuid) {
      return { physicalStock: 0, availableStock: 0, vendorCount: 0, vendors: [] };
    }

    const invRows = await db
      .select({
        inv: vendorInventory,
        vendor: vendors,
      })
      .from(vendorInventory)
      .innerJoin(vendors, eq(vendorInventory.vendorId, vendors.id))
      .where(
        and(
          eq(vendorInventory.productId, pUuid),
          eq(vendorInventory.variantId, vrUuid),
          eq(vendors.status, 'approved')
        )
      );

    const physicalStock = invRows.reduce((sum, r) => sum + r.inv.physicalStock, 0);
    const availableStock = invRows.reduce((sum, r) => sum + r.inv.availableStock, 0);

    return {
      physicalStock,
      availableStock,
      vendorCount: invRows.length,
      vendors: invRows.map(r => ({
        vendorId: r.vendor.legacyId || r.vendor.id,
        vendorUuid: r.vendor.id,
        vendorName: r.vendor.businessName,
        locality: r.vendor.locality,
        price: parseFloat(r.inv.price),
        available: r.inv.availableStock,
      })),
    };
  } catch (error) {
    console.error('Failed to calculate combined stock:', error);
    throw new Error('Database query failed. Could not calculate inventory.', { cause: error });
  }
}

// 5. Vendor Inventory
export async function getVendorInventoryRecords(vendorIdOrLegacy?: string | number) {
  try {
    let query = db
      .select({
        inv: vendorInventory,
        vendor: vendors,
        prod: products,
        variant: productVariants,
      })
      .from(vendorInventory)
      .innerJoin(vendors, eq(vendorInventory.vendorId, vendors.id))
      .innerJoin(products, eq(vendorInventory.productId, products.id))
      .innerJoin(productVariants, eq(vendorInventory.variantId, productVariants.id));

    if (vendorIdOrLegacy) {
      if (typeof vendorIdOrLegacy === 'number' || !isNaN(Number(vendorIdOrLegacy))) {
        query = query.where(eq(vendors.legacyId, Number(vendorIdOrLegacy))) as any;
      } else {
        query = query.where(eq(vendors.id, String(vendorIdOrLegacy))) as any;
      }
    }

    const rows = await query;
    return rows.map(r => ({
      id: r.inv.id,
      vendorId: r.vendor.legacyId || r.vendor.id,
      vendorUuid: r.vendor.id,
      vendorName: r.vendor.businessName,
      productId: r.prod.legacyId || r.prod.id,
      variantId: r.variant.legacyId || r.variant.id,
      productName: r.prod.name,
      packSize: r.variant.packSize,
      brand: r.prod.brand,
      categorySlug: r.prod.categorySlug,
      price: parseFloat(r.inv.price),
      mrp: parseFloat(r.inv.mrp),
      physicalStock: r.inv.physicalStock,
      reservedStock: r.inv.reservedStock,
      committedStock: r.inv.committedStock,
      availableStock: r.inv.availableStock,
      locality: r.inv.locality,
      updatedAt: r.inv.updatedAt?.toISOString(),
    }));
  } catch (error) {
    console.error('Failed to fetch vendor inventory:', error);
    throw new Error('Database query failed. Could not retrieve vendor inventory.', { cause: error });
  }
}

// 6. Orders and Suborders
export async function getOrders(limit = 100) {
  try {
    const orderRows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit);
    if (orderRows.length === 0) return [];

    const orderUuids = orderRows.map(o => o.id);
    const subRows = await db.select().from(vendorOrders).where(inArray(vendorOrders.parentOrderId, orderUuids));
    const itemRows = await db.select().from(orderItems).where(inArray(orderItems.orderId, orderUuids));

    const subsByOrder = new Map<string, typeof subRows>();
    subRows.forEach(s => {
      if (!subsByOrder.has(s.parentOrderId)) subsByOrder.set(s.parentOrderId, []);
      subsByOrder.get(s.parentOrderId)!.push(s);
    });

    const itemsByOrder = new Map<string, typeof itemRows>();
    itemRows.forEach(i => {
      if (!itemsByOrder.has(i.orderId)) itemsByOrder.set(i.orderId, []);
      itemsByOrder.get(i.orderId)!.push(i);
    });

    return orderRows.map(o => ({
      id: o.legacyId || o.id,
      uuid: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      phone: o.phone,
      address: o.address,
      locality: o.locality,
      totalAmount: parseFloat(o.totalAmount),
      deliveryFee: parseFloat(o.deliveryFee),
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      status: o.status,
      distanceKm: parseFloat(o.distanceKm || '2.5'),
      isMultiVendor: o.isMultiVendor,
      assignedDeliveryBoy: o.assignedDeliveryBoy,
      assignedDeliveryBoyPhone: o.assignedDeliveryBoyPhone,
      deliveryOtp: o.deliveryOtp,
      createdAt: o.createdAt?.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      items: (itemsByOrder.get(o.id) || []).map(i => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName,
        packSize: i.packSize,
        unitPrice: parseFloat(i.unitPrice),
        quantity: i.quantity,
        subtotal: parseFloat(i.subtotal),
        imageUrl: i.imageUrl,
        packed: i.packed,
        checked: i.checked,
        fulfillmentStatus: i.fulfillmentStatus,
      })),
      suborders: (subsByOrder.get(o.id) || []).map(s => ({
        id: s.id,
        suborderNumber: s.suborderNumber,
        vendorId: s.vendorId,
        subtotal: parseFloat(s.subtotal),
        commissionAmount: parseFloat(s.commissionAmount),
        netPayout: parseFloat(s.netPayout),
        status: s.status,
        allocationReason: s.allocationReason,
      })),
    }));
  } catch (error) {
    console.error('Failed to retrieve orders:', error);
    throw new Error('Database query failed. Could not fetch orders.', { cause: error });
  }
}

// 7. System Settings
export async function getSystemSettingsMap() {
  try {
    const rows = await db.select().from(systemSettings);
    const map: Record<string, string> = {};
    rows.forEach(r => {
      map[r.settingKey] = r.settingValue;
    });
    return map;
  } catch (error) {
    console.error('Failed to fetch system settings:', error);
    throw new Error('Database query failed. Could not retrieve system settings.', { cause: error });
  }
}

export async function updateSystemSetting(key: string, value: string) {
  try {
    await db
      .insert(systemSettings)
      .values({
        settingKey: key,
        settingValue: value,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: systemSettings.settingKey,
        set: {
          settingValue: value,
          updatedAt: new Date(),
        },
      });
    return { success: true, key, value };
  } catch (error) {
    console.error(`Failed to update setting ${key}:`, error);
    throw new Error(`Database write failed for setting ${key}.`, { cause: error });
  }
}

// 8. Mandatory Field Policies
export async function getFieldPolicies(formType?: string) {
  try {
    let q = db.select().from(mandatoryFieldPolicies);
    if (formType) {
      q = db.select().from(mandatoryFieldPolicies).where(eq(mandatoryFieldPolicies.formType, formType)) as any;
    }
    return await q;
  } catch (error) {
    console.error('Failed to fetch field policies:', error);
    throw new Error('Database query failed. Could not retrieve field policies.', { cause: error });
  }
}

// 9. Admin Field Exception
export async function createAdminException(recordType: string, recordId: string, fieldName: string, adminEmail: string, reason: string) {
  try {
    const inserted = await db.insert(adminFieldExceptions).values({
      recordType,
      recordId,
      fieldName,
      adminEmail,
      reason,
    }).returning();
    return inserted[0];
  } catch (error) {
    console.error('Failed to record admin exception:', error);
    throw new Error('Database write failed for admin exception.', { cause: error });
  }
}

// 10. Vendor Weekly Settlements
export async function getVendorSettlements() {
  try {
    const rows = await db
      .select({
        set: vendorSettlements,
        ven: vendors,
      })
      .from(vendorSettlements)
      .innerJoin(vendors, eq(vendorSettlements.vendorId, vendors.id))
      .orderBy(vendorSettlements.batchNumber);

    return rows.map(r => ({
      batchId: r.set.batchNumber,
      id: r.set.id,
      vendorId: r.ven.legacyId || r.ven.id,
      vendorName: r.ven.businessName,
      vendorLocality: r.ven.locality,
      fulfilledOrders: r.set.fulfilledOrdersCount,
      grossSales: parseFloat(r.set.grossSales),
      commission: parseFloat(r.set.commissionAmount),
      netPayout: parseFloat(r.set.netPayout),
      status: r.set.status,
      paymentRef: r.set.paymentRef,
      paidAt: r.set.paidAt?.toISOString(),
    }));
  } catch (error) {
    console.error('Failed to retrieve vendor settlements:', error);
    throw new Error('Database query failed. Could not fetch settlements.', { cause: error });
  }
}
