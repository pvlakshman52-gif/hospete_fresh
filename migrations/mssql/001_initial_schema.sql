-- Hospete Fresh SQL Server Schema Migration (Idempotent)
-- Database: HospeteFresh
-- Instance: DESKTOP-JN61NSF\SQLEXPRESS

-- 1. Categories Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'categories')
BEGIN
    CREATE TABLE categories (
        id INT IDENTITY(1,1) PRIMARY KEY,
        uuid UNIQUEIDENTIFIER DEFAULT NEWID(),
        name NVARCHAR(100) NOT NULL,
        slug NVARCHAR(100) NOT NULL UNIQUE,
        icon NVARCHAR(50) NOT NULL DEFAULT '🥦',
        display_order INT NOT NULL DEFAULT 1,
        created_at DATETIME2 DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_categories_slug ON categories(slug);
END
GO

-- 2. Vendors Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'vendors')
BEGIN
    CREATE TABLE vendors (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        legacy_id INT UNIQUE,
        business_name NVARCHAR(200) NOT NULL,
        owner_name NVARCHAR(150) NOT NULL,
        phone NVARCHAR(30) NOT NULL,
        email NVARCHAR(150) NOT NULL,
        address NVARCHAR(500) NOT NULL,
        locality NVARCHAR(100) NOT NULL,
        service_area NVARCHAR(100) NOT NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'approved',
        created_at DATETIME2 DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_vendors_locality ON vendors(locality);
END
GO

-- 3. Customers Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'customers')
BEGIN
    CREATE TABLE customers (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        user_id UNIQUEIDENTIFIER NULL,
        full_name NVARCHAR(200) NOT NULL,
        phone NVARCHAR(30) NOT NULL,
        default_address NVARCHAR(500) NULL,
        locality NVARCHAR(100) NULL,
        created_at DATETIME2 DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_customers_phone ON customers(phone);
END
GO

-- 4. Products Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'products')
BEGIN
    CREATE TABLE products (
        id INT IDENTITY(1,1) PRIMARY KEY,
        legacy_id INT UNIQUE,
        vendor_id UNIQUEIDENTIFIER NULL FOREIGN KEY REFERENCES vendors(id),
        sku NVARCHAR(50) NOT NULL,
        barcode NVARCHAR(50) NULL,
        name NVARCHAR(200) NOT NULL,
        category_slug NVARCHAR(100) NOT NULL,
        sub_category NVARCHAR(100) NULL,
        description NVARCHAR(MAX) NULL,
        image_url NVARCHAR(500) NOT NULL,
        is_active BIT NOT NULL DEFAULT 1,
        approval_status NVARCHAR(50) DEFAULT 'approved',
        created_at DATETIME2 DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_products_category ON products(category_slug);
    CREATE INDEX IX_products_sku ON products(sku);
END
GO

-- 5. Product Variants Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'product_variants')
BEGIN
    CREATE TABLE product_variants (
        id INT IDENTITY(1,1) PRIMARY KEY,
        legacy_id INT UNIQUE,
        product_id INT NOT NULL FOREIGN KEY REFERENCES products(id),
        pack_size NVARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        mrp DECIMAL(10,2) NOT NULL,
        stock_qty INT NOT NULL DEFAULT 0,
        created_at DATETIME2 DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_variants_product ON product_variants(product_id);
END
GO

-- 6. Vendor Inventory Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'vendor_inventory')
BEGIN
    CREATE TABLE vendor_inventory (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        vendor_id UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES vendors(id),
        product_id INT NOT NULL FOREIGN KEY REFERENCES products(id),
        variant_id INT NOT NULL FOREIGN KEY REFERENCES product_variants(id),
        sku NVARCHAR(50) NOT NULL,
        barcode NVARCHAR(50) NULL,
        pack_size NVARCHAR(100) NOT NULL,
        available_qty INT NOT NULL DEFAULT 0,
        reserved_qty INT NOT NULL DEFAULT 0,
        unit_cost DECIMAL(10,2) NOT NULL,
        selling_price DECIMAL(10,2) NOT NULL,
        mrp DECIMAL(10,2) NOT NULL,
        is_active BIT NOT NULL DEFAULT 1,
        updated_at DATETIME2 DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_vendor_inventory_lookup ON vendor_inventory(product_id, variant_id, vendor_id);
END
GO

-- 7. Orders Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'orders')
BEGIN
    CREATE TABLE orders (
        id BIGINT IDENTITY(10000,1) PRIMARY KEY,
        uuid UNIQUEIDENTIFIER DEFAULT NEWID(),
        order_number NVARCHAR(50) NOT NULL UNIQUE,
        customer_id UNIQUEIDENTIFIER NULL FOREIGN KEY REFERENCES customers(id),
        customer_name NVARCHAR(200) NOT NULL,
        phone NVARCHAR(30) NOT NULL,
        address NVARCHAR(500) NOT NULL,
        locality NVARCHAR(100) NOT NULL,
        subtotal_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        total_amount DECIMAL(10,2) NOT NULL,
        payment_method NVARCHAR(100) NOT NULL,
        payment_status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
        status NVARCHAR(50) NOT NULL DEFAULT 'Placed',
        distance_km DECIMAL(5,2) DEFAULT 2.50,
        is_multi_vendor BIT DEFAULT 0,
        assigned_delivery_boy NVARCHAR(150) NULL,
        assigned_delivery_boy_phone NVARCHAR(30) NULL,
        delivery_otp NVARCHAR(10) NULL,
        estimated_delivery_time NVARCHAR(50) NULL,
        ordered_at DATETIME2 DEFAULT SYSUTCDATETIME(),
        created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_orders_status ON orders(status);
    CREATE INDEX IX_orders_phone ON orders(phone);
END
GO

-- 8. Order Items Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'order_items')
BEGIN
    CREATE TABLE order_items (
        id INT IDENTITY(1,1) PRIMARY KEY,
        order_id BIGINT NOT NULL FOREIGN KEY REFERENCES orders(id),
        product_id INT NOT NULL,
        variant_id INT NOT NULL,
        vendor_id UNIQUEIDENTIFIER NULL FOREIGN KEY REFERENCES vendors(id),
        product_name NVARCHAR(200) NOT NULL,
        pack_size NVARCHAR(100) NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        quantity INT NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        packed BIT DEFAULT 0,
        checked BIT DEFAULT 0
    );
    CREATE INDEX IX_order_items_order ON order_items(order_id);
END
GO

-- 9. Vendor Orders Table (Split fulfillment)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'vendor_orders')
BEGIN
    CREATE TABLE vendor_orders (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        order_id BIGINT NOT NULL FOREIGN KEY REFERENCES orders(id),
        vendor_id UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES vendors(id),
        subtotal_amount DECIMAL(10,2) NOT NULL,
        commission_rate DECIMAL(5,2) DEFAULT 5.00,
        commission_amount DECIMAL(10,2) NOT NULL,
        net_payout DECIMAL(10,2) NOT NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
        allocation_reason NVARCHAR(250) NULL,
        created_at DATETIME2 DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_vendor_orders_vendor ON vendor_orders(vendor_id);
END
GO

-- 10. Stock Reservations Table (Transaction safe checkout)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'stock_reservations')
BEGIN
    CREATE TABLE stock_reservations (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        cart_session_id NVARCHAR(100) NOT NULL,
        order_id BIGINT NULL,
        vendor_id UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES vendors(id),
        product_id INT NOT NULL,
        variant_id INT NOT NULL,
        quantity INT NOT NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'active', -- active, committed, released, expired
        created_at BIGINT NOT NULL,
        expires_at BIGINT NOT NULL
    );
    CREATE INDEX IX_stock_reservations_status ON stock_reservations(status, expires_at);
END
GO

-- 11. Vendor Settlements Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'vendor_settlements')
BEGIN
    CREATE TABLE vendor_settlements (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        batch_number NVARCHAR(50) NOT NULL UNIQUE,
        vendor_id UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES vendors(id),
        fulfilled_orders_count INT NOT NULL DEFAULT 0,
        gross_sales DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        commission_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        net_payout DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
        payment_ref NVARCHAR(100) NULL,
        paid_at DATETIME2 NULL,
        created_at DATETIME2 DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_vendor_settlements_vendor ON vendor_settlements(vendor_id);
END
GO

-- 12. System Settings Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'system_settings')
BEGIN
    CREATE TABLE system_settings (
        key_name NVARCHAR(100) PRIMARY KEY,
        value_data NVARCHAR(MAX) NOT NULL,
        description NVARCHAR(250) NULL,
        updated_at DATETIME2 DEFAULT SYSUTCDATETIME()
    );
END
GO

-- 13. Flash Deals Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'flash_deals')
BEGIN
    CREATE TABLE flash_deals (
        id NVARCHAR(50) PRIMARY KEY,
        product_id INT NOT NULL,
        variant_id INT NOT NULL,
        title NVARCHAR(200) NOT NULL,
        badge_text NVARCHAR(100) NOT NULL,
        deal_price DECIMAL(10,2) NOT NULL,
        original_price DECIMAL(10,2) NOT NULL,
        discount_pct INT NOT NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'active',
        is_active BIT NOT NULL DEFAULT 1,
        start_date DATETIME2 NULL,
        end_date DATETIME2 NULL,
        per_customer_limit INT DEFAULT 2,
        deal_stock_limit INT DEFAULT 50,
        deal_stock_sold INT DEFAULT 0,
        created_at DATETIME2 DEFAULT SYSUTCDATETIME()
    );
END
GO

-- 14. Daily Closing Reports Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'daily_closing_reports')
BEGIN
    CREATE TABLE daily_closing_reports (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        report_date DATE NOT NULL UNIQUE,
        total_orders INT NOT NULL,
        gross_gmv DECIMAL(12,2) NOT NULL,
        net_vendor_payouts DECIMAL(12,2) NOT NULL,
        platform_commission DECIMAL(12,2) NOT NULL,
        delivered_count INT NOT NULL,
        cancelled_count INT NOT NULL,
        generated_at DATETIME2 DEFAULT SYSUTCDATETIME()
    );
END
GO
