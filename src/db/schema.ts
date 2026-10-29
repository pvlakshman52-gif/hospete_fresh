import { pgTable, uuid, text, integer, boolean, timestamp, numeric, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Users
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  fullName: text('full_name'),
  phone: text('phone'),
  role: text('role').notNull().default('customer'), // 'customer' | 'vendor' | 'delivery' | 'admin'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 2. Customers
export const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  defaultAddress: text('default_address'),
  locality: text('locality'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. Vendors
export const vendors = pgTable('vendors', {
  id: uuid('id').defaultRandom().primaryKey(),
  legacyId: integer('legacy_id').unique(),
  businessName: text('business_name').notNull(),
  ownerName: text('owner_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  address: text('address').notNull(),
  locality: text('locality').notNull(),
  serviceArea: text('service_area').notNull(),
  businessType: text('business_type').notNull().default('grocery'),
  description: text('description'),
  commissionRate: numeric('commission_rate', { precision: 5, scale: 2 }).notNull().default('10.00'),
  status: text('status').notNull().default('pending'), // 'approved' | 'pending' | 'rejected' | 'suspended'
  suspensionReason: text('suspension_reason'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 4. Categories
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  icon: text('icon'),
  itemCount: integer('item_count').default(0),
  displayOrder: integer('display_order').default(0),
});

// 5. Brands
export const brands = pgTable('brands', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  categorySlug: text('category_slug'),
});

// 6. Products
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  legacyId: integer('legacy_id').unique(),
  vendorId: uuid('vendor_id').references(() => vendors.id),
  sku: text('sku').notNull().unique(),
  barcode: text('barcode'),
  name: text('name').notNull(),
  categorySlug: text('category_slug').notNull(),
  subCategorySlug: text('sub_category_slug'),
  brand: text('brand').notNull(),
  description: text('description'),
  imageUrl: text('image_url').notNull(),
  rating: numeric('rating', { precision: 3, scale: 2 }).default('4.50'),
  reviewCount: integer('review_count').default(0),
  isDeal: boolean('is_deal').default(false),
  dealTag: text('deal_tag'),
  isBestseller: boolean('is_bestseller').default(false),
  isFresh: boolean('is_fresh').default(false),
  isBulk: boolean('is_bulk').default(false),
  isActive: boolean('is_active').default(true),
  approvalStatus: text('approval_status').default('approved'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 7. Product Variants
export const productVariants = pgTable('product_variants', {
  id: uuid('id').defaultRandom().primaryKey(),
  legacyId: integer('legacy_id').unique(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  packSize: text('pack_size').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  mrp: numeric('mrp', { precision: 10, scale: 2 }).notNull(),
  stockQty: integer('stock_qty').notNull().default(0),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 8. Vendor Inventory
export const vendorInventory = pgTable('vendor_inventory', {
  id: uuid('id').defaultRandom().primaryKey(),
  vendorId: uuid('vendor_id').references(() => vendors.id).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  variantId: uuid('variant_id').references(() => productVariants.id).notNull(),
  physicalStock: integer('physical_stock').notNull().default(0),
  reservedStock: integer('reserved_stock').notNull().default(0),
  committedStock: integer('committed_stock').notNull().default(0),
  availableStock: integer('available_stock').notNull().default(0),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  mrp: numeric('mrp', { precision: 10, scale: 2 }).notNull(),
  locality: text('locality').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 9. Orders
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  legacyId: integer('legacy_id').unique(),
  orderNumber: text('order_number').notNull().unique(), // Public ref e.g. HF-83921
  customerId: uuid('customer_id').references(() => customers.id),
  customerName: text('customer_name').notNull(),
  phone: text('phone').notNull(),
  address: text('address').notNull(),
  locality: text('locality').notNull(),
  subtotalAmount: numeric('subtotal_amount', { precision: 10, scale: 2 }).notNull(),
  deliveryFee: numeric('delivery_fee', { precision: 10, scale: 2 }).notNull().default('0.00'),
  discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }).default('0.00'),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text('payment_method').notNull(),
  paymentStatus: text('payment_status').notNull().default('Pending'),
  status: text('status').notNull().default('New'),
  distanceKm: numeric('distance_km', { precision: 5, scale: 2 }).default('2.50'),
  isMultiVendor: boolean('is_multi_vendor').default(false),
  assignedDeliveryBoy: text('assigned_delivery_boy'),
  assignedDeliveryBoyPhone: text('assigned_delivery_boy_phone'),
  deliveryOtp: text('delivery_otp'),
  orderedAt: timestamp('ordered_at').defaultNow(),
  estimatedDeliveryTime: text('estimated_delivery_time'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 10. Vendor Orders (Suborders)
export const vendorOrders = pgTable('vendor_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  suborderNumber: text('suborder_number').notNull().unique(), // e.g. SO-83921-V1
  parentOrderId: uuid('parent_order_id').references(() => orders.id).notNull(),
  vendorId: uuid('vendor_id').references(() => vendors.id).notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  commissionRate: numeric('commission_rate', { precision: 5, scale: 2 }).notNull(),
  commissionAmount: numeric('commission_amount', { precision: 10, scale: 2 }).notNull(),
  netPayout: numeric('net_payout', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull().default('New'),
  allocationReason: text('allocation_reason'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 11. Order Items
export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  suborderId: uuid('suborder_id').references(() => vendorOrders.id),
  productId: uuid('product_id').references(() => products.id).notNull(),
  variantId: uuid('variant_id').references(() => productVariants.id).notNull(),
  vendorId: uuid('vendor_id').references(() => vendors.id).notNull(),
  productName: text('product_name').notNull(),
  packSize: text('pack_size').notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  imageUrl: text('image_url'),
  packed: boolean('packed').default(false),
  checked: boolean('checked').default(false),
  fulfillmentStatus: text('fulfillment_status').default('Pending'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 12. Stock Reservations
export const stockReservations = pgTable('stock_reservations', {
  id: uuid('id').defaultRandom().primaryKey(),
  reservationToken: text('reservation_token').notNull().unique(),
  vendorId: uuid('vendor_id').references(() => vendors.id).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  variantId: uuid('variant_id').references(() => productVariants.id).notNull(),
  quantity: integer('quantity').notNull(),
  status: text('status').notNull().default('active'), // 'active' | 'committed' | 'released' | 'expired'
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 13. Stock Movement Ledger
export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').defaultRandom().primaryKey(),
  vendorId: uuid('vendor_id').references(() => vendors.id).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  variantId: uuid('variant_id').references(() => productVariants.id).notNull(),
  productName: text('product_name').notNull(),
  packSize: text('pack_size').notNull(),
  changeQty: integer('change_qty').notNull(),
  previousPhysicalStock: integer('previous_physical_stock').notNull(),
  newPhysicalStock: integer('new_physical_stock').notNull(),
  previousReservedStock: integer('previous_reserved_stock').notNull(),
  newReservedStock: integer('new_reserved_stock').notNull(),
  reason: text('reason').notNull(),
  referenceId: text('reference_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 14. Deliveries
export const deliveries = pgTable('deliveries', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  suborderId: uuid('suborder_id').references(() => vendorOrders.id),
  deliveryPartnerName: text('delivery_partner_name'),
  deliveryPartnerPhone: text('delivery_partner_phone'),
  pickupAddress: text('pickup_address'),
  dropoffAddress: text('dropoff_address'),
  distanceKm: numeric('distance_km', { precision: 5, scale: 2 }),
  deliveryFee: numeric('delivery_fee', { precision: 10, scale: 2 }),
  status: text('status').default('Pending'),
  deliveryOtp: text('delivery_otp'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 15. Invoices
export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(), // e.g. INV-2026-0001
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  orderNumber: text('order_number').notNull(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  billingAddress: text('billing_address').notNull(),
  itemsSnapshot: jsonb('items_snapshot').notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  deliveryFee: numeric('delivery_fee', { precision: 10, scale: 2 }).notNull().default('0.00'),
  discount: numeric('discount', { precision: 10, scale: 2 }).default('0.00'),
  taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).default('0.00'),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text('payment_method').notNull(),
  paymentStatus: text('payment_status').notNull(),
  issuedAt: timestamp('issued_at').defaultNow(),
});

// 16. System Settings
export const systemSettings = pgTable('system_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  settingKey: text('setting_key').notNull().unique(),
  settingValue: text('setting_value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 17. Mandatory Field Policies
export const mandatoryFieldPolicies = pgTable('mandatory_field_policies', {
  id: uuid('id').defaultRandom().primaryKey(),
  formType: text('form_type').notNull(), // 'customer_registration' | 'vendor_registration' | 'product' | 'checkout'
  fieldName: text('field_name').notNull(),
  isRequired: boolean('is_required').notNull().default(true),
  isOverridable: boolean('is_overridable').notNull().default(false),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 18. Admin Field Exceptions
export const adminFieldExceptions = pgTable('admin_field_exceptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  recordType: text('record_type').notNull(),
  recordId: text('record_id').notNull(),
  fieldName: text('field_name').notNull(),
  adminEmail: text('admin_email').notNull(),
  reason: text('reason').notNull(),
  approvedAt: timestamp('approved_at').defaultNow(),
});

// 19. Notification Channels
export const notificationChannels = pgTable('notification_channels', {
  id: uuid('id').defaultRandom().primaryKey(),
  channelName: text('channel_name').notNull().unique(), // 'email' | 'whatsapp' | 'sms'
  isEnabled: boolean('is_enabled').notNull().default(true),
  priorityOrder: integer('priority_order').notNull().default(1),
  providerConfig: jsonb('provider_config'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 20. Notification Templates
export const notificationTemplates = pgTable('notification_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventKey: text('event_key').notNull(),
  version: integer('version').notNull().default(1),
  subjectTemplate: text('subject_template').notNull(),
  htmlTemplate: text('html_template').notNull(),
  plainTextTemplate: text('plain_text_template').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 21. Notification Events
export const notificationEvents = pgTable('notification_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventKey: text('event_key').notNull(),
  orderId: uuid('order_id').references(() => orders.id),
  recipientEmail: text('recipient_email'),
  recipientPhone: text('recipient_phone'),
  channelUsed: text('channel_used').notNull(), // 'email' | 'whatsapp' | 'sms'
  status: text('status').notNull().default('pending'), // 'pending' | 'sent' | 'delivered' | 'failed'
  providerRef: text('provider_ref'),
  errorDetails: text('error_details'),
  retryCount: integer('retry_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// 22. Daily Closing Reports
export const dailyClosingReports = pgTable('daily_closing_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  reportType: text('report_type').notNull(), // 'admin' | 'vendor' | 'delivery_partner'
  entityId: text('entity_id'), // Vendor ID, Delivery Boy ID, or 'admin'
  entityName: text('entity_name').notNull(),
  reportDate: text('report_date').notNull(), // YYYY-MM-DD
  timezone: text('timezone').notNull().default('Asia/Kolkata'),
  summary: jsonb('summary').notNull(),
  status: text('status').notNull().default('generated'),
  generatedAt: timestamp('generated_at').defaultNow(),
});

// 23. Vendor Settlements
export const vendorSettlements = pgTable('vendor_settlements', {
  id: uuid('id').defaultRandom().primaryKey(),
  batchNumber: text('batch_number').notNull().unique(), // e.g. SET-001
  vendorId: uuid('vendor_id').references(() => vendors.id).notNull(),
  periodStart: text('period_start').notNull(),
  periodEnd: text('period_end').notNull(),
  fulfilledOrdersCount: integer('fulfilled_orders_count').notNull().default(0),
  grossSales: numeric('gross_sales', { precision: 10, scale: 2 }).notNull(),
  commissionAmount: numeric('commission_amount', { precision: 10, scale: 2 }).notNull(),
  netPayout: numeric('net_payout', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull().default('Pending'), // 'Pending' | 'Paid'
  paymentRef: text('payment_ref'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 24. Delivery Earnings
export const deliveryEarnings = pgTable('delivery_earnings', {
  id: uuid('id').defaultRandom().primaryKey(),
  deliveryPartnerName: text('delivery_partner_name').notNull(),
  deliveryPartnerPhone: text('delivery_partner_phone'),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  distanceKm: numeric('distance_km', { precision: 5, scale: 2 }).notNull(),
  basePay: numeric('base_pay', { precision: 10, scale: 2 }).notNull(),
  distanceIncentive: numeric('distance_incentive', { precision: 10, scale: 2 }).notNull().default('0.00'),
  totalEarned: numeric('total_earned', { precision: 10, scale: 2 }).notNull(),
  settlementStatus: text('settlement_status').notNull().default('Pending'), // 'Pending' | 'Paid'
  createdAt: timestamp('created_at').defaultNow(),
});

// 25. Flash Deals
export const flashDeals = pgTable('flash_deals', {
  id: uuid('id').defaultRandom().primaryKey(),
  legacyId: text('legacy_id').unique(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  variantId: uuid('variant_id').references(() => productVariants.id).notNull(),
  badgeText: text('badge_text').notNull(),
  pricingType: text('pricing_type').notNull().default('percentage_discount'),
  discountValue: numeric('discount_value', { precision: 10, scale: 2 }).notNull(),
  dealPrice: numeric('deal_price', { precision: 10, scale: 2 }).notNull(),
  dealStockLimit: integer('deal_stock_limit'),
  dealStockSold: integer('deal_stock_sold').default(0),
  perCustomerLimit: integer('per_customer_limit').default(3),
  startDate: text('start_date'),
  endDate: text('end_date'),
  isActive: boolean('is_active').default(true),
  status: text('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 26. Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorEmail: text('actor_email').notNull(),
  actorRole: text('actor_role').notNull(),
  action: text('action').notNull(),
  targetEntity: text('target_entity').notNull(),
  targetId: text('target_id'),
  details: jsonb('details'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Drizzle Relations
export const productsRelations = relations(products, ({ one, many }) => ({
  vendor: one(vendors, {
    fields: [products.vendorId],
    references: [vendors.id],
  }),
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  suborders: many(vendorOrders),
  items: many(orderItems),
  invoices: many(invoices),
}));

export const vendorOrdersRelations = relations(vendorOrders, ({ one, many }) => ({
  parentOrder: one(orders, {
    fields: [vendorOrders.parentOrderId],
    references: [orders.id],
  }),
  vendor: one(vendors, {
    fields: [vendorOrders.vendorId],
    references: [vendors.id],
  }),
  items: many(orderItems),
}));
