export interface ProductVariant {
  id: number;
  packSize: string;
  price: number;
  mrp: number;
  stockQty: number;
  isDefault: boolean;
}

export interface ProductImageAudit {
  id: string | number;
  action: 'VENDOR_UPLOAD' | 'ADMIN_APPROVE' | 'ADMIN_CORRECTION_REQUEST' | 'ADMIN_REPLACE' | 'VENDOR_RESUBMIT';
  actor: string;
  actorRole: 'vendor' | 'admin';
  imageUrl: string;
  notes?: string;
  timestamp: string;
}

export interface Product {
  id: number;
  vendorId?: number;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  isActive?: boolean; // Storefront visibility toggle by admin
  sku?: string;
  barcode?: string;
  name: string;
  categorySlug: string;
  brand: string;
  description: string;
  imageUrl: string;
  additionalImages?: string[]; // Optional extra gallery images uploaded by vendor
  imageReviewStatus?: 'submitted' | 'approved' | 'needs_correction';
  imageCorrectionReason?: string;
  originalImageUrl?: string; // Preserved original vendor upload when admin replaces
  adminReplacedImageUrl?: string;
  imageReplacedByAdmin?: boolean;
  imageReplacementReason?: string;
  imageAuditHistory?: ProductImageAudit[];
  rating: number;
  reviewCount: number;
  isDeal?: boolean;
  dealTag?: string;
  isBestseller?: boolean;
  isFresh?: boolean;
  isBulk?: boolean;
  subCategorySlug?: string;
  deliveryEtaMinutes?: number;
  variants: ProductVariant[];
  createdAt?: string;
  updatedAt?: string;
  adminNotes?: string;
}

export interface CatalogAuditLog {
  id: string | number;
  adminIdentifier: string;
  productId: number;
  productName: string;
  action: 'APPROVE' | 'REJECT' | 'HIDE' | 'ACTIVATE' | 'STOCK_UPDATE' | 'IMAGE_APPROVE' | 'IMAGE_CORRECTION' | 'IMAGE_REPLACE';
  previousState?: string;
  newState?: string;
  reason?: string;
  timestamp: string;
}

export interface VendorDocument {
  id: string | number;
  documentType: string;
  documentName: string;
  fileName: string;
  fileSize?: string;
  status: 'verified' | 'pending_review' | 'rejected';
  uploadedAt: string;
}

export interface VendorStatusHistory {
  id: string | number;
  adminIdentifier: string;
  previousStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  newStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  reason: string;
  timestamp: string;
}

export interface AdminPreviewLog {
  id: string | number;
  adminIdentifier: string;
  vendorId: number;
  vendorName: string;
  action: 'ENTER_PREVIEW' | 'BLOCKED_TRANSACTION' | 'EXIT_PREVIEW' | 'STOCK_OVERRIDE';
  notes: string;
  timestamp: string;
}

export interface Vendor {
  id: number;
  businessName: string;
  ownerName: string;
  phone: string;
  email?: string;
  address: string;
  locality: string;
  serviceArea: string;
  password?: string;
  businessType: 'grocery' | 'farmer' | 'dairy' | 'snacks' | 'other';
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  rejectionReason?: string;
  suspensionReason?: string;
  additionalInfoRequested?: string;
  resubmissionStatus?: 'none' | 'pending_resubmission' | 'resubmitted';
  documents?: VendorDocument[];
  statusHistory?: VendorStatusHistory[];
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  iconEmoji: string;
  bannerColor?: string;
  imageUrl?: string;
  parentCategory?: string | null;
  description?: string;
  displayOrder?: number;
  order?: number;
  isActive?: boolean;
  showOnHome?: boolean;
}

export const sortCategoriesByOrder = (cats: Category[]): Category[] => {
  return [...cats].sort((a, b) => {
    const ordA = a.displayOrder ?? a.order ?? 99999;
    const ordB = b.displayOrder ?? b.order ?? 99999;
    if (ordA !== ordB) return ordA - ordB;
    return a.name.localeCompare(b.name);
  });
};

export interface CartItem {
  variantId: number;
  productId: number;
  vendorId?: number;
  name: string;
  packSize: string;
  price: number;
  mrp: number;
  imageUrl: string;
  qty: number;
  isFlashDeal?: boolean;
  flashDealId?: string;
  originalPrice?: number;
  dealBadge?: string;
}

export interface OrderItem {
  id?: number;
  productId?: number;
  vendorId?: number;
  productName: string;
  packSize: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  imageUrl?: string;
  fulfillmentStatus?: 'Pending' | 'Accepted' | 'Preparing' | 'Ready for Pickup' | 'Dispatched';
  packedByVendor?: boolean;
  verifiedByDeliveryBoy?: boolean;
  packed?: boolean;
  checked?: boolean;
}

export type OrderStatus =
  | 'New'
  | 'Accepted'
  | 'Preparing'
  | 'Ready for Pickup'
  | 'Assigned'
  | 'Picked Up'
  | 'Delivered'
  | 'Cancelled'
  | 'Placed'
  | 'Packed'
  | 'Out for Delivery';

export interface OrderDiscrepancy {
  itemIdx?: number;
  itemName?: string;
  reason: string;
  notes?: string;
  reportedAt: string;
  resolved?: boolean;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  locality: string;
  deliveryInstructions?: string;
  totalAmount: number;
  deliveryFee?: number;
  paymentMethod: string;
  status: OrderStatus;
  createdAt: string;
  orderedAt?: string;
  orderAcceptedAt?: string;
  preparedAt?: string;
  readyForPickupAt?: string;
  assignedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  estimatedDeliveryTime?: string;
  estimatedMinutes?: number;
  totalTimeTaken?: string;
  deliveryMinutes?: number;
  items: OrderItem[];
  // Packing & Delivery workflow
  vendorPackingChecklist?: Record<number, boolean>;
  deliveryChecklist?: Record<number, boolean>;
  assignedDeliveryBoy?: string;
  assignedDeliveryBoyId?: string;
  assignedDeliveryBoyPhone?: string;
  deliveryDiscrepancy?: OrderDiscrepancy | null;
  vendorRejectionReason?: string;
  // Specific vendor pickup details & delivery verification
  vendorName?: string;
  vendorLocality?: string;
  vendorAddress?: string;
  vendorPhone?: string;
  pickupInstructions?: string;
  deliveryOtp?: string;
  deliveryPhotoProof?: string;
  deliveryPayout?: number;
  distanceKm?: number;
  // Multi-vendor allocation fields
  isMultiVendor?: boolean;
  suborders?: VendorSuborder[];
  allocationDecision?: OrderAllocationDecision;
  parentOrderId?: number;
  suborderId?: string;
}

export interface VendorSuborder {
  id: string;
  suborderNumber: string;
  parentOrderId: number;
  parentOrderNumber: string;
  vendorId: number;
  vendorName: string;
  vendorLocality: string;
  vendorAddress?: string;
  vendorPhone?: string;
  items: OrderItem[];
  subtotal: number;
  commissionRate: number;
  commissionAmount: number;
  netPayout: number;
  status: OrderStatus | 'Pending' | 'Rejected';
  rejectionReason?: string;
  allocationReason?: string;
  createdAt: string;
  orderAcceptedAt?: string;
  preparedAt?: string;
  readyForPickupAt?: string;
}

export interface OrderAllocationDecision {
  orderId: number;
  orderNumber: string;
  isMultiVendor: boolean;
  strategy: 'SINGLE_OPTIMAL' | 'MULTI_SPLIT' | 'MANUAL_OVERRIDE';
  reason: string;
  evaluatedVendors: Array<{
    vendorId: number;
    vendorName: string;
    distanceKm: number;
    canFulfillFullOrder: boolean;
    availableItemsCount: number;
    estimatedCost: number;
    fulfillmentScore?: number;
  }>;
  allocatedVendors: Array<{
    vendorId: number;
    vendorName: string;
    itemCount: number;
    subtotal: number;
  }>;
  splitCount: number;
  totalDeliveryFee: number;
  timestamp: string;
}

export interface VendorInventoryItem {
  id: string;
  vendorId: number;
  vendorName: string;
  productId: number;
  variantId: number;
  productName: string;
  packSize: string;
  brand: string;
  categorySlug: string;
  price: number;
  mrp: number;
  physicalStock: number;
  reservedStock: number;
  committedStock: number;
  availableStock: number;
  locality: string;
  updatedAt: string;
}

export interface StockMovementLedgerEntry {
  id: string;
  vendorId: number;
  vendorName: string;
  productId: number;
  variantId: number;
  productName: string;
  packSize: string;
  changeQty: number;
  previousPhysicalStock: number;
  newPhysicalStock: number;
  previousReservedStock: number;
  newReservedStock: number;
  reason: 'INITIAL_IMPORT' | 'STOCK_RESERVATION' | 'RESERVATION_EXPIRED' | 'RESERVATION_CANCELLED' | 'ORDER_FULFILLED' | 'VENDOR_RESTOCK' | 'ADMIN_OVERRIDE' | 'VENDOR_REJECTION_RETURN';
  referenceId?: string;
  timestamp: string;
}

export interface StockReservation {
  id: string;
  reservationToken: string;
  orderId?: number;
  vendorId: number;
  productId: number;
  variantId: number;
  quantity: number;
  status: 'active' | 'committed' | 'released' | 'expired';
  createdAt: number;
  expiresAt: number;
}

export type DeliveryPartnerStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'documents_required' | 'suspended';

export interface DeliveryPartnerDocument {
  id: string;
  name: string;
  type: 'photo' | 'aadhaar' | 'licence' | 'rc' | 'bank_proof';
  fileName: string;
  fileSize?: string;
  previewUrl?: string;
  fileData?: string;
  side?: 'front' | 'back';
  status: 'verified' | 'pending' | 'rejected';
  uploadedAt: string;
}

export interface DeliveryPartnerEarnings {
  today: number;
  thisWeek: number;
  thisMonth: number;
  pendingPayout: number;
  history: Array<{
    id: string;
    date: string;
    amount: number;
    orderCount: number;
    status: 'paid' | 'processing';
  }>;
}

export interface DeliveryPartnerNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'order' | 'system' | 'payout' | 'approval';
  orderId?: number;
}

export interface DeliveryPartner {
  id: string;
  applicationId: string;
  code: string;
  name: string;
  phone: string;
  email?: string;
  passwordHash?: string;
  mustChangePassword?: boolean;
  lastLoginAt?: string;
  address?: string;
  serviceArea: string;
  profilePhoto?: string;
  vehicleType: 'Two Wheeler' | 'Electric Vehicle' | 'Bicycle' | 'Four Wheeler';
  vehicleNumber: string;
  licenceNumber?: string;
  aadhaarNumber?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    ifsc: string;
    upiId?: string;
  };
  status: DeliveryPartnerStatus;
  isOnline: boolean;
  activeOrdersCount: number;
  ratings?: number;
  totalDeliveries?: number;
  appliedAt: string;
  approvedAt?: string;
  adminNotes?: string;
  currentLocation?: {
    lat: number;
    lng: number;
    areaName: string;
  };
  assignedRoute?: string;
  documents: DeliveryPartnerDocument[];
  earnings: DeliveryPartnerEarnings;
  notifications?: DeliveryPartnerNotification[];
}

export interface DeliveryBoy {
  id: string;
  code: string;
  name: string;
  phone: string;
  vehicle: string;
  status: 'available' | 'busy' | 'offline';
  activeOrdersCount: number;
}

export interface Locality {
  name: string;
  pincode: string;
  etaMinutes: number;
}

export type BannerStatus = 'active' | 'inactive' | 'scheduled' | 'expired';
export type BannerCtaType = 'product' | 'category' | 'flash_deals' | 'offers' | 'custom';
export type BannerDisplayMode = 'artwork' | 'html_text'; // Mode A: Image artwork, Mode B: HTML/text banner

export interface HomeBanner {
  id: string;
  title: string; // internal admin name
  headline: string; // customer-facing headline
  description?: string;
  offerLabel?: string; // e.g. "FLAT 30% OFF"
  promoCode?: string; // e.g. "HOSPETE30"
  imageUrl: string;
  altText?: string;
  ctaText?: string; // e.g. "Claim Offer", "Shop Now"
  ctaType: BannerCtaType;
  ctaTargetId?: string; // category slug, product id, etc.
  ctaUrl?: string; // custom route or URL
  displayOrder: number;
  status: BannerStatus;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  backgroundColor?: string;
  accentColor?: string;
  displayMode?: BannerDisplayMode; // 'artwork' (Mode A) | 'html_text' (Mode B)
}

export interface BannerCarouselSettings {
  autoRotateIntervalSeconds: 1 | 2 | 3 | 4 | 5 | 7 | 10;
  isAutoRotateEnabled: boolean;
  pauseOnHover: boolean;
  pauseOnInteraction: boolean;
  showIndicators: boolean;
  showArrows: boolean;
}

// =========================================================================
// FLASH DEALS TYPES & CAMPAIGN CONFIGURATION
// =========================================================================

export type FlashDealPricingType = 'fixed_price' | 'percentage_discount' | 'fixed_discount';

export type FlashDealStatus = 'active' | 'scheduled' | 'paused' | 'expired' | 'ineligible';

export interface FlashDeal {
  id: string; // Unique deal ID e.g. "deal-tomato-101"
  productId: number;
  variantId: number;
  badgeText: string; // e.g. "20% OFF", "BESTSELLER", "VALUE PACK", "FLAT ₹15 OFF"
  pricingType: FlashDealPricingType;
  discountValue: number; // Configured price, discount %, or fixed discount amount
  dealPrice: number; // Final calculated selling price during the deal
  originalPrice: number; // Regular variant selling price before deal
  originalMrp: number; // Original MRP for strike-through
  calculatedDiscountPercent: number; // Math-verified discount percentage against MRP
  startDate?: string; // Optional start datetime (YYYY-MM-DDTHH:mm or ISO)
  endDate?: string; // Optional end datetime (YYYY-MM-DDTHH:mm or ISO)
  dealStockLimit?: number; // Optional max items allowed for this deal (e.g. 50 units)
  dealStockSold?: number; // Units purchased under deal price
  perCustomerLimit?: number; // Optional purchase limit per customer (e.g. max 2 per order)
  isActive: boolean; // Admin enabled/paused toggle
  status: FlashDealStatus; // Computed state
  ineligibleReason?: string; // Reason if product cannot qualify
  vendorApproved?: boolean; // Vendor consented to promotional discount & stock allocation
  vendorApprovedAt?: string;
  vendorNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FlashDealsCampaign {
  id: string;
  title: string;
  subtitle?: string;
  isEnabled: boolean;
  endDateTime: string; // ISO string for campaign countdown e.g. "2026-10-25T14:30:00Z"
  enablePerDealCountdown: boolean;
  bannerNotice?: string;
}




/**
 * Normalizes supported weight units to kilograms (kg).
 * Examples: 500 g = 0.5 kg, 25 kg = 25 kg.
 * Non-weight units (litres, ml, pieces, bunches, etc.) return null.
 */
export function parseWeightInKg(packSize: string): number | null {
  if (!packSize) return null;
  const trimmed = packSize.trim();

  // If liquid/volume unit, do not treat as kilograms
  if (/(?:litre|liter|\bl\b|\bml\b)/i.test(trimmed)) {
    return null;
  }

  // Match supported weight units: kg, kgs, kilo, kilos, kilogram, kilograms, g, gm, gms, gram, grams
  const match = trimmed.match(/(\d+(?:\.\d+)?)\s*(kg|kgs|kilo|kilos|kilogram|kilograms|g|gm|gms|gram|grams)\b/i);
  if (!match) return null;

  const val = parseFloat(match[1]);
  if (isNaN(val)) return null;

  const unit = match[2].toLowerCase();
  if (unit.startsWith('g')) {
    return val / 1000;
  }
  return val;
}

/**
 * Returns variants of a product that weigh strictly more than 10 kg.
 */
export function getQualifyingBulkVariants(product: Product): ProductVariant[] {
  if (!product.variants || product.variants.length === 0) return [];
  return product.variants.filter(v => {
    const kg = parseWeightInKg(v.packSize);
    return kg !== null && kg > 10.0;
  });
}
