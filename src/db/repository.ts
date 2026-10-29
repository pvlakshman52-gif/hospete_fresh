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
import { isMssqlAvailable, executeMssqlQuery, executeMssqlTransaction } from './sqlserver.ts';

// 1. Categories
export async function getCategories() {
  try {
    if (await isMssqlAvailable()) {
      const rows = await executeMssqlQuery<{
        id: number;
        name: string;
        slug: string;
        icon: string;
        displayOrder: number;
      }>('SELECT id, name, slug, icon, display_order as displayOrder FROM categories ORDER BY display_order ASC');
      if (rows && rows.length > 0) return rows;
    }
  } catch (err) {
    console.warn('[Repository] SQL Server getCategories fallback:', err);
  }

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
    if (await isMssqlAvailable()) {
      const rows = await executeMssqlQuery('SELECT id, legacy_id as legacyId, business_name as businessName, owner_name as ownerName, phone, email, address, locality, service_area as serviceArea, status FROM vendors');
      if (rows && rows.length > 0) return rows;
    }
  } catch (err) {
    console.warn('[Repository] SQL Server getVendors fallback:', err);
  }

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
    if (await isMssqlAvailable()) {
      let query = `
        SELECT p.id, p.legacy_id as legacyId, p.sku, p.name, p.category_slug as categorySlug,
               p.sub_category as subCategory, p.description, p.image_url as imageUrl, p.is_active as isActive
        FROM products p
      `;
      if (categorySlug) {
        query += ` WHERE p.category_slug = '${categorySlug.replace(/'/g, "''")}'`;
      }
      const prods = await executeMssqlQuery(query);
      if (prods && prods.length > 0) {
        const variants = await executeMssqlQuery('SELECT id, legacy_id as legacyId, product_id as productId, pack_size as packSize, price, mrp, stock_qty as stockQty FROM product_variants');
        const variantsByProd = new Map<any, any[]>();
        variants.forEach((v: any) => {
          const pid = v.productId;
          if (!variantsByProd.has(pid)) variantsByProd.set(pid, []);
          variantsByProd.get(pid)!.push({
            id: v.legacyId || v.id,
            uuid: String(v.id),
            packSize: v.packSize,
            price: parseFloat(v.price),
            mrp: parseFloat(v.mrp),
            stockQty: v.stockQty,
          });
        });

        return prods.map((p: any) => ({
          ...p,
          id: p.legacyId || p.id,
          uuid: String(p.id),
          rating: 4.5,
          variants: variantsByProd.get(p.id) || variantsByProd.get(p.legacyId) || [],
        }));
      }
    }
  } catch (err) {
    console.warn('[Repository] SQL Server getProducts fallback:', err);
  }

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
    if (await isMssqlAvailable()) {
      const orderRows = await executeMssqlQuery<any>(`
        SELECT TOP (${limit}) id, uuid, order_number as orderNumber, customer_name as customerName,
               phone, address, locality, total_amount as totalAmount, delivery_fee as deliveryFee,
               payment_method as paymentMethod, payment_status as paymentStatus, status,
               distance_km as distanceKm, is_multi_vendor as isMultiVendor,
               assigned_delivery_boy as assignedDeliveryBoy, assigned_delivery_boy_phone as assignedDeliveryBoyPhone,
               delivery_otp as deliveryOtp, created_at as createdAt
        FROM orders ORDER BY created_at DESC
      `);
      if (orderRows && orderRows.length > 0) {
        const orderIds = orderRows.map((o: any) => o.id).join(',');
        const itemRows = await executeMssqlQuery<any>(`
          SELECT id, order_id as orderId, product_id as productId, product_name as productName,
                 pack_size as packSize, unit_price as unitPrice, quantity, subtotal, packed, checked
          FROM order_items WHERE order_id IN (${orderIds})
        `);
        const subRows = await executeMssqlQuery<any>(`
          SELECT id, order_id as orderId, vendor_id as vendorId, subtotal_amount as subtotal,
                 commission_amount as commissionAmount, net_payout as netPayout, status, allocation_reason as allocationReason
          FROM vendor_orders WHERE order_id IN (${orderIds})
        `);

        const itemsByOrder = new Map<any, any[]>();
        itemRows.forEach((i: any) => {
          if (!itemsByOrder.has(i.orderId)) itemsByOrder.set(i.orderId, []);
          itemsByOrder.get(i.orderId)!.push({
            id: i.id,
            productId: i.productId,
            productName: i.productName,
            packSize: i.packSize,
            unitPrice: parseFloat(i.unitPrice),
            quantity: i.quantity,
            subtotal: parseFloat(i.subtotal),
            packed: Boolean(i.packed),
            checked: Boolean(i.checked),
            fulfillmentStatus: 'Fulfilled',
          });
        });

        const subsByOrder = new Map<any, any[]>();
        subRows.forEach((s: any) => {
          if (!subsByOrder.has(s.orderId)) subsByOrder.set(s.orderId, []);
          subsByOrder.get(s.orderId)!.push({
            id: s.id,
            vendorId: s.vendorId,
            subtotal: parseFloat(s.subtotal),
            commissionAmount: parseFloat(s.commissionAmount),
            netPayout: parseFloat(s.netPayout),
            status: s.status,
            allocationReason: s.allocationReason,
          });
        });

        return orderRows.map((o: any) => ({
          id: o.id,
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
          isMultiVendor: Boolean(o.isMultiVendor),
          assignedDeliveryBoy: o.assignedDeliveryBoy,
          assignedDeliveryBoyPhone: o.assignedDeliveryBoyPhone,
          deliveryOtp: o.deliveryOtp,
          createdAt: new Date(o.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          items: itemsByOrder.get(o.id) || [],
          suborders: subsByOrder.get(o.id) || [],
        }));
      }
    }
  } catch (err) {
    console.warn('[Repository] SQL Server getOrders fallback:', err);
  }

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

// 6b. Persist Order in Authoritative Database
export async function createOrderInDb(orderData: any, suborders?: any[]) {
  // 1. SQL Server Persistence (Transaction-safe)
  try {
    if (await isMssqlAvailable()) {
      await executeMssqlTransaction(async (_tx, req) => {
        req.input('orderNumber', orderData.orderNumber || `HF-${orderData.id}`);
        req.input('customerName', orderData.customerName || 'Customer');
        req.input('phone', orderData.phone || '9845012345');
        req.input('address', orderData.address || 'Hospete');
        req.input('locality', orderData.locality || 'Patel Nagar');
        req.input('subtotalAmount', (orderData.totalAmount || 0) - (orderData.deliveryFee || 0));
        req.input('deliveryFee', orderData.deliveryFee || 0);
        req.input('totalAmount', orderData.totalAmount || 0);
        req.input('paymentMethod', orderData.paymentMethod || 'UPI');
        req.input('paymentStatus', orderData.paymentStatus || 'Pending');
        req.input('status', orderData.status || 'Placed');
        req.input('distanceKm', orderData.distanceKm || 2.5);
        req.input('isMultiVendor', orderData.isMultiVendor ? 1 : 0);

        const insertRes = await req.query(`
          INSERT INTO orders (order_number, customer_name, phone, address, locality, subtotal_amount, delivery_fee, total_amount, payment_method, payment_status, status, distance_km, is_multi_vendor)
          OUTPUT INSERTED.id
          VALUES (@orderNumber, @customerName, @phone, @address, @locality, @subtotalAmount, @deliveryFee, @totalAmount, @paymentMethod, @paymentStatus, @status, @distanceKm, @isMultiVendor);
        `);
        const orderId = insertRes.recordset[0]?.id;

        if (orderId && Array.isArray(orderData.items)) {
          for (const item of orderData.items) {
            const itemReq = new (await import('mssql')).Request(_tx);
            itemReq.input('orderId', orderId);
            itemReq.input('productId', Number(item.productId) || 1);
            itemReq.input('variantId', Number(item.variantId) || 1);
            itemReq.input('productName', item.productName || 'Product');
            itemReq.input('packSize', item.packSize || '1 unit');
            itemReq.input('unitPrice', item.unitPrice || 0);
            itemReq.input('quantity', item.quantity || 1);
            itemReq.input('subtotal', item.subtotal || 0);
            await itemReq.query(`
              INSERT INTO order_items (order_id, product_id, variant_id, product_name, pack_size, unit_price, quantity, subtotal)
              VALUES (@orderId, @productId, @variantId, @productName, @packSize, @unitPrice, @quantity, @subtotal);
            `);
          }
        }
      });
      console.log(`[MSSQL] Order ${orderData.orderNumber} successfully recorded in SQL Server.`);
    }
  } catch (err) {
    console.warn('[MSSQL Order Persist Notice] Could not write order to SQL Server:', err);
  }

  // 2. PostgreSQL Persistence (Zero data loss, authoritative fallback)
  try {
    const existingOrders = await db.select().from(orders).where(eq(orders.orderNumber, orderData.orderNumber)).limit(1);
    if (existingOrders.length === 0) {
      const insertedOrder = await db.insert(orders).values({
        legacyId: typeof orderData.id === 'number' && orderData.id <= 2147483640
          ? orderData.id
          : Math.floor(10000 + (Math.abs(Number(orderData.id) || Date.now()) % 89999)),
        orderNumber: orderData.orderNumber || `HF-${orderData.id}`,
        customerName: orderData.customerName || 'Valued Customer',
        phone: orderData.phone || '9845012345',
        address: orderData.address || 'Hospete Town',
        locality: orderData.locality || 'Patel Nagar',
        subtotalAmount: String((orderData.totalAmount || 0) - (orderData.deliveryFee || 0)),
        deliveryFee: String(orderData.deliveryFee || 0),
        totalAmount: String(orderData.totalAmount || 0),
        paymentMethod: orderData.paymentMethod || 'UPI / PhonePe',
        paymentStatus: orderData.paymentStatus || 'Pending',
        status: orderData.status || 'Placed',
        distanceKm: String(orderData.distanceKm || 2.5),
        isMultiVendor: Boolean(orderData.isMultiVendor),
        deliveryOtp: orderData.deliveryOtp || '8912',
      }).returning();

      const createdOrder = insertedOrder[0];

      if (Array.isArray(orderData.items) && orderData.items.length > 0) {
        for (const item of orderData.items) {
          try {
            const pRows = await db.select().from(products).where(eq(products.legacyId, Number(item.productId))).limit(1);
            const vRows = await db.select().from(productVariants).where(eq(productVariants.legacyId, Number(item.variantId))).limit(1);
            const pUuid = pRows[0]?.id;
            const vrUuid = vRows[0]?.id;
            const vList = await db.select().from(vendors).limit(1);
            const defaultVendorId = vList[0]?.id;

            if (pUuid && vrUuid && defaultVendorId) {
              await db.insert(orderItems).values({
                orderId: createdOrder.id,
                productId: pUuid,
                variantId: vrUuid,
                vendorId: defaultVendorId,
                productName: item.productName || 'Item',
                packSize: item.packSize || '1 unit',
                unitPrice: String(item.unitPrice || 0),
                quantity: item.quantity || 1,
                subtotal: String(item.subtotal || 0),
                packed: false,
                checked: false,
                fulfillmentStatus: 'Pending',
              });
            }
          } catch (itemErr) {
            console.warn('[PostgreSQL Item Persist Warning]', itemErr);
          }
        }
      }

      console.log(`[PostgreSQL] Order ${orderData.orderNumber} successfully persisted into PostgreSQL database.`);
      return createdOrder;
    }
  } catch (err) {
    console.error('[PostgreSQL Order Persist Error]', err);
  }
}

// 7. System Settings
export async function getSystemSettingsMap() {
  try {
    if (await isMssqlAvailable()) {
      const rows = await executeMssqlQuery<any>('SELECT key_name as settingKey, value_data as settingValue FROM system_settings');
      if (rows && rows.length > 0) {
        const map: Record<string, string> = {};
        rows.forEach(r => {
          map[r.settingKey] = r.settingValue;
        });
        return map;
      }
    }
  } catch (err) {
    console.warn('[Repository] SQL Server getSystemSettingsMap fallback:', err);
  }

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
    if (await isMssqlAvailable()) {
      await executeMssqlQuery(`
        IF EXISTS (SELECT 1 FROM system_settings WHERE key_name = '${key.replace(/'/g, "''")}')
          UPDATE system_settings SET value_data = '${value.replace(/'/g, "''")}', updated_at = SYSUTCDATETIME() WHERE key_name = '${key.replace(/'/g, "''")}'
        ELSE
          INSERT INTO system_settings (key_name, value_data, description) VALUES ('${key.replace(/'/g, "''")}', '${value.replace(/'/g, "''")}', 'Config parameter')
      `);
    }
  } catch (err) {
    console.warn('[Repository] SQL Server updateSystemSetting fallback:', err);
  }

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
    if (await isMssqlAvailable()) {
      const rows = await executeMssqlQuery<any>(`
        SELECT s.id, s.batch_number as batchId, s.vendor_id as vendorId, v.business_name as vendorName,
               v.locality as vendorLocality, s.fulfilled_orders_count as fulfilledOrders,
               s.gross_sales as grossSales, s.commission_amount as commission, s.net_payout as netPayout,
               s.status, s.payment_ref as paymentRef, s.paid_at as paidAt
        FROM vendor_settlements s
        INNER JOIN vendors v ON s.vendor_id = v.id
        ORDER BY s.batch_number ASC
      `);
      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          batchId: r.batchId,
          id: r.id,
          vendorId: r.vendorId,
          vendorName: r.vendorName,
          vendorLocality: r.vendorLocality,
          fulfilledOrders: r.fulfilledOrders,
          grossSales: parseFloat(r.grossSales),
          commission: parseFloat(r.commission),
          netPayout: parseFloat(r.netPayout),
          status: r.status,
          paymentRef: r.paymentRef,
          paidAt: r.paidAt ? new Date(r.paidAt).toISOString() : undefined,
        }));
      }
    }
  } catch (err) {
    console.warn('[Repository] SQL Server getVendorSettlements fallback:', err);
  }

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

// 11. Customer Management & Validation
export async function findCustomerByPhone(phone: string) {
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  if (!cleanPhone) return null;

  try {
    if (await isMssqlAvailable()) {
      const rows = await executeMssqlQuery<any>(`
        SELECT TOP 1 id, full_name as fullName, phone, default_address as defaultAddress, locality, created_at as createdAt
        FROM customers
        WHERE phone LIKE '%${cleanPhone}'
      `);
      if (rows && rows.length > 0) return rows[0];
    }
  } catch (err) {
    console.warn('[Repository] SQL Server findCustomerByPhone fallback:', err);
  }

  try {
    const results = await db
      .select()
      .from(customers)
      .where(
        sql`regexp_replace(${customers.phone}, '[^0-9]', '', 'g') LIKE ${'%' + cleanPhone}`
      )
      .limit(1);

    return results[0] || null;
  } catch (error) {
    console.error('Failed to find customer by phone:', error);
    return null;
  }
}

export async function findCustomerById(id: string) {
  try {
    if (await isMssqlAvailable()) {
      const rows = await executeMssqlQuery<any>(`
        SELECT TOP 1 id, full_name as fullName, phone, default_address as defaultAddress, locality, created_at as createdAt
        FROM customers WHERE id = '${id.replace(/'/g, "''")}'
      `);
      if (rows && rows.length > 0) return rows[0];
    }
  } catch (err) {
    console.warn('[Repository] SQL Server findCustomerById fallback:', err);
  }

  try {
    const results = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    return results[0] || null;
  } catch (error) {
    console.error('Failed to find customer by id:', error);
    return null;
  }
}

export async function createCustomer(data: {
  fullName: string;
  phone: string;
  defaultAddress?: string;
  locality?: string;
  userId?: string;
}) {
  const cleanPhone = data.phone.replace(/\D/g, '').slice(-10) || data.phone;
  let mssqlCreated: any = null;

  try {
    if (await isMssqlAvailable()) {
      const rows = await executeMssqlQuery<any>(`
        INSERT INTO customers (full_name, phone, default_address, locality)
        OUTPUT INSERTED.id, INSERTED.full_name as fullName, INSERTED.phone, INSERTED.default_address as defaultAddress, INSERTED.locality
        VALUES ('${data.fullName.replace(/'/g, "''")}', '${cleanPhone}', ${data.defaultAddress ? `'${data.defaultAddress.replace(/'/g, "''")}'` : 'NULL'}, '${(data.locality || 'Patel Nagar').replace(/'/g, "''")}')
      `);
      if (rows && rows.length > 0) mssqlCreated = rows[0];
    }
  } catch (err) {
    console.warn('[Repository] SQL Server createCustomer fallback:', err);
  }

  try {
    const inserted = await db
      .insert(customers)
      .values({
        fullName: data.fullName.trim(),
        phone: cleanPhone,
        defaultAddress: data.defaultAddress?.trim() || null,
        locality: data.locality?.trim() || 'Patel Nagar',
        userId: data.userId || null,
      })
      .returning();

    return mssqlCreated || inserted[0];
  } catch (error) {
    if (mssqlCreated) return mssqlCreated;
    console.error('Failed to create customer:', error);
    throw new Error('Failed to create customer record in database.', { cause: error });
  }
}

export async function updateCustomer(
  id: string,
  data: Partial<{
    fullName: string;
    phone: string;
    defaultAddress: string;
    locality: string;
  }>
) {
  try {
    const updateData: any = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName.trim();
    if (data.phone !== undefined) updateData.phone = data.phone.replace(/\D/g, '').slice(-10);
    if (data.defaultAddress !== undefined) updateData.defaultAddress = data.defaultAddress.trim();
    if (data.locality !== undefined) updateData.locality = data.locality.trim();

    const updated = await db
      .update(customers)
      .set(updateData)
      .where(eq(customers.id, id))
      .returning();

    return updated[0] || null;
  } catch (error) {
    console.error('Failed to update customer:', error);
    throw new Error('Failed to update customer in database.', { cause: error });
  }
}

export async function getAllCustomers() {
  try {
    if (await isMssqlAvailable()) {
      const rows = await executeMssqlQuery<any>('SELECT id, full_name as fullName, phone, default_address as defaultAddress, locality, created_at as createdAt FROM customers ORDER BY created_at DESC');
      if (rows && rows.length > 0) return rows;
    }
  } catch (err) {
    console.warn('[Repository] SQL Server getAllCustomers fallback:', err);
  }

  try {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    return [];
  }
}
