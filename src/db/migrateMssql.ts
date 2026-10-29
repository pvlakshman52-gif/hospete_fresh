import fs from 'fs';
import path from 'path';
import { getMssqlPool, executeMssqlQuery, isMssqlAvailable, mssqlConfig } from './sqlserver.ts';
import { CATEGORIES, INITIAL_VENDORS, INITIAL_PRODUCTS } from '../data.ts';

export async function runMssqlMigration() {
  console.log(`[MSSQL Migration] Testing connection to ${mssqlConfig.server}/${mssqlConfig.database}...`);
  
  const isAlive = await isMssqlAvailable();
  if (!isAlive) {
    console.warn(`[MSSQL Migration Notice] SQL Server (${mssqlConfig.server}) is not reachable in this container network environment. Migration script preserved in /migrations/mssql/001_initial_schema.sql.`);
    return {
      success: false,
      connected: false,
      server: mssqlConfig.server,
      database: mssqlConfig.database,
      message: `SQL Server ${mssqlConfig.server} is offline or unreachable from this network environment. Schema script prepared for execution.`,
    };
  }

  const pool = await getMssqlPool();
  if (!pool) {
    return { success: false, message: 'Could not obtain SQL Server pool.' };
  }

  try {
    console.log('[MSSQL Migration] Running idempotent DDL schema creation...');
    const schemaSqlPath = path.resolve(process.cwd(), 'migrations/mssql/001_initial_schema.sql');
    if (fs.existsSync(schemaSqlPath)) {
      const fullSql = fs.readFileSync(schemaSqlPath, 'utf8');
      const batches = fullSql.split(/\nGO\b/i);

      for (const batch of batches) {
        const trimmed = batch.trim();
        if (trimmed.length > 0) {
          await pool.request().query(trimmed);
        }
      }
      console.log('[MSSQL Migration] All table schemas verified successfully.');
    }

    // Check if categories table is populated
    const catCheck = await executeMssqlQuery('SELECT count(*) as count FROM categories');
    const catCount = catCheck[0]?.count || 0;

    if (catCount === 0) {
      console.log('[MSSQL Migration] Seeding initial business catalog into HospeteFresh SQL Server...');
      
      // 1. Categories
      for (const cat of CATEGORIES) {
        await pool.request()
          .input('name', cat.name)
          .input('slug', cat.slug)
          .input('icon', cat.iconEmoji || '🥦')
          .input('displayOrder', cat.displayOrder || cat.id)
          .query(`
            IF NOT EXISTS (SELECT 1 FROM categories WHERE slug = @slug)
            INSERT INTO categories (name, slug, icon, display_order)
            VALUES (@name, @slug, @icon, @displayOrder);
          `);
      }

      // 2. Vendors
      for (const v of INITIAL_VENDORS) {
        await pool.request()
          .input('legacyId', v.id)
          .input('businessName', v.businessName)
          .input('ownerName', v.ownerName)
          .input('phone', v.phone)
          .input('email', v.email)
          .input('address', v.address)
          .input('locality', v.locality)
          .input('serviceArea', v.serviceArea)
          .input('status', v.status)
          .query(`
            IF NOT EXISTS (SELECT 1 FROM vendors WHERE legacy_id = @legacyId)
            INSERT INTO vendors (legacy_id, business_name, owner_name, phone, email, address, locality, service_area, status)
            VALUES (@legacyId, @businessName, @ownerName, @phone, @email, @address, @locality, @serviceArea, @status);
          `);
      }

      // 3. Products & Variants
      for (const p of INITIAL_PRODUCTS) {
        const prodInsert = await pool.request()
          .input('legacyId', p.id)
          .input('sku', p.sku)
          .input('barcode', p.barcode || null)
          .input('name', p.name)
          .input('categorySlug', p.categorySlug)
          .input('subCategory', (p as any).subCategory || null)
          .input('description', p.description || null)
          .input('imageUrl', p.imageUrl)
          .input('isActive', p.isActive !== false ? 1 : 0)
          .query(`
            IF NOT EXISTS (SELECT 1 FROM products WHERE legacy_id = @legacyId)
            BEGIN
              INSERT INTO products (legacy_id, sku, barcode, name, category_slug, sub_category, description, image_url, is_active)
              VALUES (@legacyId, @sku, @barcode, @name, @categorySlug, @subCategory, @description, @imageUrl, @isActive);
              SELECT SCOPE_IDENTITY() as newId;
            END
            ELSE
            BEGIN
              SELECT id as newId FROM products WHERE legacy_id = @legacyId;
            END
          `);

        const productId = prodInsert.recordset[0]?.newId;
        if (productId && p.variants) {
          for (const vr of p.variants) {
            await pool.request()
              .input('productId', productId)
              .input('packSize', vr.packSize)
              .input('price', vr.price)
              .input('mrp', vr.mrp)
              .input('stockQty', vr.stockQty || 0)
              .query(`
                IF NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = @productId AND pack_size = @packSize)
                INSERT INTO product_variants (product_id, pack_size, price, mrp, stock_qty)
                VALUES (@productId, @packSize, @price, @mrp, @stockQty);
              `);
          }
        }
      }

      // 4. Default System Settings
      await pool.request().query(`
        IF NOT EXISTS (SELECT 1 FROM system_settings WHERE key_name = 'platform_commission_percent')
        INSERT INTO system_settings (key_name, value_data, description) VALUES ('platform_commission_percent', '5.0', 'Platform commission rate');

        IF NOT EXISTS (SELECT 1 FROM system_settings WHERE key_name = 'base_delivery_radius_km')
        INSERT INTO system_settings (key_name, value_data, description) VALUES ('base_delivery_radius_km', '5.0', 'Base delivery radius');

        IF NOT EXISTS (SELECT 1 FROM system_settings WHERE key_name = 'free_delivery_threshold')
        INSERT INTO system_settings (key_name, value_data, description) VALUES ('free_delivery_threshold', '199.0', 'Free delivery order value threshold');
      `);

      console.log('[MSSQL Migration] Initial catalog and settings successfully migrated into SQL Server.');
    } else {
      console.log(`[MSSQL Migration] SQL Server already contains ${catCount} categories. Existing business data preserved.`);
    }

    return {
      success: true,
      connected: true,
      server: mssqlConfig.server,
      database: mssqlConfig.database,
      message: 'SQL Server schema and seed migration verified successfully.',
    };
  } catch (err: any) {
    console.error('[MSSQL Migration Error]', err);
    return {
      success: false,
      connected: true,
      error: err.message,
    };
  }
}
