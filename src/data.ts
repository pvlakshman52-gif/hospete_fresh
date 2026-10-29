import type { Category, Locality, Product, Vendor, CatalogAuditLog, DeliveryBoy, DeliveryPartner, HomeBanner, BannerCarouselSettings, FlashDeal, FlashDealsCampaign } from './types.ts';

export const LOCALITIES: (Locality & { distanceKm?: number })[] = [
  { name: 'Station Road', pincode: '583201', etaMinutes: 15, distanceKm: 1.2 },
  { name: 'Patel Nagar', pincode: '583201', etaMinutes: 20, distanceKm: 2.2 },
  { name: 'M.J. Nagar', pincode: '583203', etaMinutes: 20, distanceKm: 3.0 },
  { name: 'College Road', pincode: '583201', etaMinutes: 15, distanceKm: 3.5 },
  { name: 'Dam Road', pincode: '583225', etaMinutes: 30, distanceKm: 4.8 },
  { name: 'Amaravathi', pincode: '583201', etaMinutes: 25, distanceKm: 6.5 },
  { name: 'Ananthashayana Gudi', pincode: '583201', etaMinutes: 25, distanceKm: 7.2 },
  { name: 'Hampi Road', pincode: '583201', etaMinutes: 25, distanceKm: 8.4 },
  { name: 'Kampli Road Outer', pincode: '583201', etaMinutes: 35, distanceKm: 9.8 },
  { name: 'Munirabad / TB Dam', pincode: '583233', etaMinutes: 40, distanceKm: 12.5 },
];

export const CATEGORIES: Category[] = [
  { id: 1, name: 'Fresh Veggies', slug: 'veggies', iconEmoji: '🥦', bannerColor: '#ecfdf5', imageUrl: '/images/cat_veggies.jpg', displayOrder: 1, order: 1 },
  { id: 2, name: 'Fresh Fruits', slug: 'fruits', iconEmoji: '🍎', bannerColor: '#fef2f2', imageUrl: '/images/cat_fruits.jpg', displayOrder: 2, order: 2 },
  { id: 3, name: 'Dairy & Bakery', slug: 'dairy', iconEmoji: '🥛', bannerColor: '#eff6ff', imageUrl: '/images/cat_dairy.jpg', displayOrder: 3, order: 3 },
  { id: 4, name: 'Atta, Rice & Dals', slug: 'staples', iconEmoji: '🌾', bannerColor: '#fefce8', imageUrl: '/images/cat_staples.jpg', displayOrder: 4, order: 4 },
  { id: 5, name: 'Snacks & Namkeen', slug: 'snacks', iconEmoji: '🍿', bannerColor: '#fff7ed', imageUrl: '/images/cat_snacks.jpg', displayOrder: 5, order: 5 },
  { id: 6, name: 'Masalas & Oils', slug: 'oils', iconEmoji: '🌶️', bannerColor: '#fdf2f8', imageUrl: '/images/cat_oils.jpg', displayOrder: 6, order: 6 },
  { id: 7, name: 'Beverages & Tea', slug: 'beverages', iconEmoji: '☕', bannerColor: '#f5f3ff', imageUrl: '/images/cat_beverages.jpg', displayOrder: 7, order: 7 },
  { id: 8, name: 'Household', slug: 'household', iconEmoji: '🧼', bannerColor: '#f0fdfa', imageUrl: '/images/cat_household.jpg', displayOrder: 8, order: 8 },
];

export interface DocumentRequirementRule {
  type: string;
  name: string;
  description: string;
  mandatory: boolean;
}

export const BUSINESS_TYPE_DOCUMENT_RULES: Record<Vendor['businessType'], DocumentRequirementRule[]> = {
  farmer: [
    { type: 'pahani_rtc', name: 'Land Record / Pahani (RTC)', description: 'Government land ownership / RTC revenue record from Hospete taluk', mandatory: true },
    { type: 'farmer_id', name: 'Kisan / Farmer Photo ID', description: 'Aadhaar / Karnataka Raitha ID proof', mandatory: true },
    { type: 'organic_cert', name: 'Organic Farming Certificate', description: 'PGS-India or Jaivik Bharat organic certification (optional)', mandatory: false }
  ],
  dairy: [
    { type: 'fssai_dairy', name: 'FSSAI Dairy Processing License', description: 'Food safety standards registration for raw milk / dairy derivatives', mandatory: true },
    { type: 'vet_health', name: 'Veterinary Livestock Health NOC', description: 'Herd vaccination and milk safety inspection certificate', mandatory: true },
    { type: 'trade_license', name: 'Hospete CMC Trade License', description: 'City municipal commercial operating permit', mandatory: true }
  ],
  grocery: [
    { type: 'gstin', name: 'GSTIN Certificate', description: 'GST registration certificate from Karnataka Commercial Taxes', mandatory: true },
    { type: 'fssai_retail', name: 'FSSAI Food Business License', description: 'Retail grocery food storage and sale license', mandatory: true },
    { type: 'trade_license', name: 'Hospete Municipal Trade License', description: 'Hospete CMC Shop Act license', mandatory: true }
  ],
  snacks: [
    { type: 'fssai_mfg', name: 'FSSAI Food Manufacturing License', description: 'License for namkeen, sweets, and fried snacks processing unit', mandatory: true },
    { type: 'hygiene_noc', name: 'Commercial Kitchen Hygiene NOC', description: 'Health and sanitation inspection clearance', mandatory: true },
    { type: 'msme_udyam', name: 'MSME Udyam Registration', description: 'Udyam micro enterprise registration certificate', mandatory: false }
  ],
  other: [
    { type: 'shop_act', name: 'Shop & Commercial Establishment Registration', description: 'Karnataka Labour Dept Form C certificate', mandatory: true },
    { type: 'owner_id', name: 'Owner Government Photo ID', description: 'Aadhaar, Voter ID, or Passport of authorized signatory', mandatory: true }
  ]
};

export const INITIAL_VENDORS: Vendor[] = [
  {
    id: 1,
    businessName: 'Tungabhadra Agro & Organics',
    ownerName: 'Suresh Gowda',
    phone: '9845011111',
    email: 'suresh@tungabhadra.in',
    address: 'Plot 44, Rural Market Yard, Hospete',
    locality: 'College Road',
    serviceArea: 'College Road, Patel Nagar, Amaravathi',
    password: 'vendor123',
    businessType: 'farmer',
    description: 'Direct farm supplier of pesticide-free vegetables, grains, and fruits harvested fresh along the Tungabhadra river valley.',
    status: 'approved',
    createdAt: '2026-03-01',
    documents: [
      { id: 'doc-1-1', documentType: 'pahani_rtc', documentName: 'Land Record / Pahani (RTC)', fileName: 'rtc_survey_44_hospete.pdf', fileSize: '1.8 MB', status: 'verified', uploadedAt: '2026-03-01 10:14' },
      { id: 'doc-1-2', documentType: 'farmer_id', documentName: 'Kisan / Farmer Photo ID', fileName: 'kisan_card_suresh.pdf', fileSize: '950 KB', status: 'verified', uploadedAt: '2026-03-01 10:16' },
      { id: 'doc-1-3', documentType: 'organic_cert', documentName: 'Organic Farming Certificate', fileName: 'jaivik_bharat_cert.pdf', fileSize: '2.1 MB', status: 'verified', uploadedAt: '2026-03-01 10:20' }
    ],
    statusHistory: [
      { id: 'hist-1-1', adminIdentifier: 'system@hospetegrocery.in', previousStatus: 'pending', newStatus: 'pending', reason: 'Self-registration submitted by vendor.', timestamp: '2026-03-01 10:22' },
      { id: 'hist-1-2', adminIdentifier: 'superadmin@hospetegrocery.in', previousStatus: 'pending', newStatus: 'approved', reason: 'Land records verified and field inspection passed.', timestamp: '2026-03-02 11:30' }
    ]
  },
  {
    id: 2,
    businessName: 'Hospete Sweets & Namkeen',
    ownerName: 'Prasad Rao',
    phone: '9845022222',
    email: 'prasad@hospetesweets.com',
    address: 'Station Road Market, Shop #12, Hospete',
    locality: 'Station Road',
    serviceArea: 'Station Road, Patel Nagar, Hampi Road',
    password: 'vendor123',
    businessType: 'snacks',
    description: 'Authentic Karnataka savories, hot mixture, banana chips, and traditional namkeen prepared fresh every morning.',
    status: 'approved',
    createdAt: '2026-03-05',
    documents: [
      { id: 'doc-2-1', documentType: 'fssai_mfg', documentName: 'FSSAI Food Manufacturing License', fileName: 'fssai_lic_21223000.pdf', fileSize: '1.2 MB', status: 'verified', uploadedAt: '2026-03-05 14:02' },
      { id: 'doc-2-2', documentType: 'hygiene_noc', documentName: 'Commercial Kitchen Hygiene NOC', fileName: 'kitchen_sanitation_noc.pdf', fileSize: '780 KB', status: 'verified', uploadedAt: '2026-03-05 14:05' },
      { id: 'doc-2-3', documentType: 'msme_udyam', documentName: 'MSME Udyam Registration', fileName: 'udyam_kr_14_9921.pdf', fileSize: '1.4 MB', status: 'verified', uploadedAt: '2026-03-05 14:10' }
    ],
    statusHistory: [
      { id: 'hist-2-1', adminIdentifier: 'system@hospetegrocery.in', previousStatus: 'pending', newStatus: 'pending', reason: 'Self-registration submitted with 3 certificates.', timestamp: '2026-03-05 14:12' },
      { id: 'hist-2-2', adminIdentifier: 'superadmin@hospetegrocery.in', previousStatus: 'pending', newStatus: 'approved', reason: 'Commercial kitchen hygiene certificate and FSSAI valid through 2028.', timestamp: '2026-03-06 09:15' }
    ]
  },
  {
    id: 3,
    businessName: 'Bellary Organic Dairy',
    ownerName: 'Manjunath K',
    phone: '9845033333',
    email: 'manju@bellarydairy.com',
    address: 'Near Dam Circle, Hospete',
    locality: 'Dam Road',
    serviceArea: 'Dam Road, College Road, Patel Nagar',
    password: 'vendor123',
    businessType: 'dairy',
    description: 'Pure A2 Gir Cow Milk, fresh malai paneer, and artisanal churned curd from local dairy herds.',
    status: 'approved',
    createdAt: '2026-03-12',
    documents: [
      { id: 'doc-3-1', documentType: 'fssai_dairy', documentName: 'FSSAI Dairy Processing License', fileName: 'fssai_dairy_cert_bellary.pdf', fileSize: '1.1 MB', status: 'verified', uploadedAt: '2026-03-12 16:30' },
      { id: 'doc-3-2', documentType: 'trade_license', documentName: 'Hospete CMC Trade License', fileName: 'cmc_dam_circle_shop.pdf', fileSize: '890 KB', status: 'verified', uploadedAt: '2026-03-12 16:35' },
      { id: 'doc-3-3', documentType: 'vet_health', documentName: 'Veterinary Livestock Health Certificate', fileName: 'vet_inspection_bellary.pdf', fileSize: '950 KB', status: 'verified', uploadedAt: '2026-03-12 17:00' }
    ],
    statusHistory: [
      { id: 'hist-3-1', adminIdentifier: 'system@hospetegrocery.in', previousStatus: 'pending', newStatus: 'pending', reason: 'Application submitted for dairy supplier listing. Awaiting review.', timestamp: '2026-03-12 16:40' },
      { id: 'hist-3-2', adminIdentifier: 'superadmin@hospetegrocery.in', previousStatus: 'pending', newStatus: 'approved', reason: 'FSSAI and Veterinary health certificate verified. Authorized for dairy supply & flash deals.', timestamp: '2026-03-13 10:15' }
    ]
  },
  {
    id: 4,
    businessName: 'Hampi Farm Delights',
    ownerName: 'Ravi Kumar',
    phone: '9845044444',
    email: 'ravi@hampifarms.com',
    address: 'Kadirampura Cross, Hospete',
    locality: 'Hampi Road',
    serviceArea: 'Hampi Road, Amaravathi',
    password: 'vendor123',
    businessType: 'farmer',
    description: 'Exotic organic fruits, pomegranate, and seasonal greens from Hampi heritage soil.',
    status: 'rejected',
    rejectionReason: 'Incomplete FSSAI / local trade license document. The uploaded land title was expired and unreadable. Please re-submit with clear scanned copy.',
    resubmissionStatus: 'pending_resubmission',
    createdAt: '2026-03-14',
    documents: [
      { id: 'doc-4-1', documentType: 'pahani_rtc', documentName: 'Land Record / Pahani (RTC)', fileName: 'rtc_scan_blurry.jpg', fileSize: '420 KB', status: 'rejected', uploadedAt: '2026-03-14 11:20' }
    ],
    statusHistory: [
      { id: 'hist-4-1', adminIdentifier: 'system@hospetegrocery.in', previousStatus: 'pending', newStatus: 'pending', reason: 'Initial application submitted.', timestamp: '2026-03-14 11:25' },
      { id: 'hist-4-2', adminIdentifier: 'superadmin@hospetegrocery.in', previousStatus: 'pending', newStatus: 'rejected', reason: 'Incomplete FSSAI / local trade license document. The uploaded land title was expired and unreadable. Please re-submit with clear scanned copy.', timestamp: '2026-03-15 15:40' }
    ]
  },
  {
    id: 5,
    businessName: 'Vijayanagar Mart & Provisions',
    ownerName: 'Ganesh Hegde',
    phone: '9845055555',
    email: 'ganesh@vijayanagarmart.in',
    address: 'Patel Nagar Main Circle, Hospete',
    locality: 'Patel Nagar',
    serviceArea: 'Patel Nagar, College Road, Station Road',
    password: 'vendor123',
    businessType: 'grocery',
    description: 'Neighbourhood provision store offering daily pulses, spices, branded edible oils, and packaged foods.',
    status: 'suspended',
    suspensionReason: 'Customer quality complaints: multiple orders contained unsealed packages and expired oil bottles reported on 2026-03-16. Storefront listings deactivated pending warehouse audit.',
    createdAt: '2026-02-20',
    documents: [
      { id: 'doc-5-1', documentType: 'gstin', documentName: 'GSTIN Certificate', fileName: 'gstin_29AAACH7721.pdf', fileSize: '1.3 MB', status: 'verified', uploadedAt: '2026-02-20 09:10' },
      { id: 'doc-5-2', documentType: 'fssai_retail', documentName: 'FSSAI Food Business License', fileName: 'fssai_retail_patelnagar.pdf', fileSize: '980 KB', status: 'verified', uploadedAt: '2026-02-20 09:15' },
      { id: 'doc-5-3', documentType: 'trade_license', documentName: 'Hospete Municipal Trade License', fileName: 'cmc_patelnagar_trade.pdf', fileSize: '1.5 MB', status: 'verified', uploadedAt: '2026-02-20 09:20' }
    ],
    statusHistory: [
      { id: 'hist-5-1', adminIdentifier: 'system@hospetegrocery.in', previousStatus: 'pending', newStatus: 'pending', reason: 'Application registered.', timestamp: '2026-02-20 09:25' },
      { id: 'hist-5-2', adminIdentifier: 'superadmin@hospetegrocery.in', previousStatus: 'pending', newStatus: 'approved', reason: 'Documents verified and business authorized.', timestamp: '2026-02-22 14:00' },
      { id: 'hist-5-3', adminIdentifier: 'superadmin@hospetegrocery.in', previousStatus: 'approved', newStatus: 'suspended', reason: 'Customer quality complaints: multiple orders contained unsealed packages and expired oil bottles reported on 2026-03-16. Storefront listings deactivated pending warehouse audit.', timestamp: '2026-03-16 17:30' }
    ]
  }
];

export const DEFAULT_FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    vendorId: 1,
    approvalStatus: 'approved',
    imageReviewStatus: 'approved',
    isActive: true,
    sku: 'SKU-VEG-101',
    barcode: '890103001011',
    name: 'Tomato (Local)',
    categorySlug: 'veggies',
    subCategorySlug: 'tomatoes',
    deliveryEtaMinutes: 20,
    brand: 'Local Fresh',
    description: 'Locally harvested ripe farm-fresh red tomatoes, handpicked daily from Hospete rural farms.',
    imageUrl: '/images/tomatoes.jpg',
    additionalImages: ['/images/tomatoes.jpg'],
    rating: 4.8,
    reviewCount: 142,
    isDeal: true,
    dealTag: '20% OFF',
    isBestseller: true,
    isFresh: true,
    isBulk: false,
    createdAt: '2026-03-01 08:30',
    variants: [
      { id: 101, packSize: '500 g', price: 24, mrp: 30, stockQty: 45, isDefault: true },
      { id: 102, packSize: '1 kg', price: 45, mrp: 55, stockQty: 30, isDefault: false },
      { id: 103, packSize: '2 kg (Family Pack)', price: 85, mrp: 110, stockQty: 20, isDefault: false },
    ]
  },
  {
    id: 2,
    vendorId: 1,
    approvalStatus: 'approved',
    isActive: true,
    sku: 'SKU-VEG-201',
    barcode: '890103002012',
    name: 'Fresh Green Coriander (Kothambari)',
    categorySlug: 'veggies',
    subCategorySlug: 'leafy_greens',
    deliveryEtaMinutes: 20,
    brand: 'Local Fresh',
    description: 'Crisp and aromatic fresh coriander leaves sourced from Tungabhadra riverbed growers.',
    imageUrl: '/images/coriander.jpg',
    rating: 4.7,
    reviewCount: 98,
    isDeal: false,
    isBestseller: false,
    isFresh: true,
    isBulk: false,
    createdAt: '2026-03-01 08:45',
    variants: [
      { id: 201, packSize: '1 Bunch (100g)', price: 12, mrp: 15, stockQty: 25, isDefault: true },
      { id: 202, packSize: '2 Bunches', price: 22, mrp: 30, stockQty: 15, isDefault: false },
    ]
  },
  {
    id: 3,
    vendorId: 3,
    approvalStatus: 'approved',
    isActive: true,
    sku: 'SKU-DAI-301',
    barcode: '890103003013',
    name: 'Nandini Pasteurised Toned Milk',
    categorySlug: 'dairy',
    brand: 'Nandini (KMF)',
    description: 'Pure and rich toned cow milk pouch from Karnataka Milk Federation. Homogenised and nutrient rich.',
    imageUrl: '/images/nandini_milk.jpg',
    rating: 4.9,
    reviewCount: 310,
    isDeal: true,
    dealTag: 'DAILY ESSENTIAL',
    isBestseller: true,
    isFresh: true,
    isBulk: false,
    createdAt: '2026-03-02 09:10',
    variants: [
      { id: 301, packSize: '500 ml', price: 24, mrp: 24, stockQty: 60, isDefault: true },
      { id: 302, packSize: '1 Litre', price: 46, mrp: 48, stockQty: 40, isDefault: false },
    ]
  },
  {
    id: 4,
    vendorId: 3,
    approvalStatus: 'approved',
    isActive: true,
    sku: 'SKU-DAI-401',
    barcode: '890103004014',
    name: 'Nandini Pure Cow Ghee',
    categorySlug: 'dairy',
    brand: 'Nandini (KMF)',
    description: 'Golden, granulated authentic Karnataka cow ghee with traditional aroma and pure taste.',
    imageUrl: '/images/nandini_ghee.jpg',
    rating: 4.9,
    reviewCount: 215,
    isDeal: true,
    dealTag: 'FLAT ₹40 OFF',
    isBestseller: true,
    isFresh: false,
    isBulk: false,
    createdAt: '2026-03-02 09:20',
    variants: [
      { id: 401, packSize: '200 ml Jar', price: 135, mrp: 145, stockQty: 30, isDefault: false },
      { id: 402, packSize: '500 ml Pouch', price: 315, mrp: 340, stockQty: 40, isDefault: true },
      { id: 403, packSize: '1 Litre Tin', price: 610, mrp: 660, stockQty: 15, isDefault: false },
    ]
  },
  {
    id: 5,
    vendorId: 2,
    approvalStatus: 'approved',
    isActive: true,
    sku: 'SKU-SNK-501',
    barcode: '890103005015',
    name: 'South Indian Special Mixture Snacks',
    categorySlug: 'snacks',
    brand: 'Hospete Sweets & Namkeen',
    description: 'Authentic crispy spicy Karnataka mixture with roasted groundnuts, curry leaves, crunchy sev, and boondi. Made fresh daily.',
    imageUrl: '/images/mixture_snacks.jpg',
    rating: 4.6,
    reviewCount: 178,
    isDeal: true,
    dealTag: 'BESTSELLER',
    isBestseller: true,
    isFresh: false,
    isBulk: false,
    createdAt: '2026-03-03 10:15',
    variants: [
      { id: 501, packSize: '200 g Pouch', price: 48, mrp: 60, stockQty: 64, isDefault: true },
      { id: 502, packSize: '400 g Pack', price: 92, mrp: 120, stockQty: 35, isDefault: false },
      { id: 503, packSize: '1 kg Jar', price: 220, mrp: 290, stockQty: 20, isDefault: false },
    ]
  },
  {
    id: 6,
    vendorId: 1,
    approvalStatus: 'approved',
    isActive: true,
    sku: 'SKU-STP-601',
    barcode: '890103006016',
    name: 'Premium Sona Masoori Rice',
    categorySlug: 'staples',
    brand: 'Tungabhadra Gold',
    description: 'Aged, lightweight and aromatic Karnataka Sona Masoori raw rice. Ideal for everyday South Indian meals.',
    imageUrl: '/images/sona_masoori.jpg',
    rating: 4.8,
    reviewCount: 260,
    isDeal: false,
    isBestseller: true,
    isFresh: false,
    isBulk: true,
    createdAt: '2026-03-03 11:00',
    variants: [
      { id: 601, packSize: '1 kg', price: 65, mrp: 75, stockQty: 40, isDefault: true },
      { id: 602, packSize: '5 kg Bag', price: 310, mrp: 360, stockQty: 25, isDefault: false },
      { id: 603, packSize: '25 kg Family Sack', price: 1450, mrp: 1750, stockQty: 10, isDefault: false },
    ]
  },
  {
    id: 7,
    vendorId: 1,
    approvalStatus: 'approved',
    isActive: true,
    sku: 'SKU-STP-701',
    barcode: '890103007017',
    name: 'Aashirvaad Shudh Chakki Atta',
    categorySlug: 'staples',
    brand: 'Aashirvaad',
    description: '100% whole wheat flour, naturally rich in dietary fibre for soft and fluffy rotis.',
    imageUrl: '/images/aashirvaad_atta.jpg',
    rating: 4.8,
    reviewCount: 190,
    isDeal: true,
    dealTag: 'VALUE PACK',
    isBestseller: true,
    isFresh: false,
    isBulk: true,
    createdAt: '2026-03-04 12:30',
    variants: [
      { id: 701, packSize: '1 kg', price: 52, mrp: 60, stockQty: 35, isDefault: false },
      { id: 702, packSize: '5 kg Value Pack', price: 245, mrp: 285, stockQty: 40, isDefault: true },
      { id: 703, packSize: '10 kg Mega Pack', price: 475, mrp: 550, stockQty: 18, isDefault: false },
    ]
  },
  {
    id: 8,
    vendorId: 1,
    approvalStatus: 'approved',
    isActive: true,
    sku: 'SKU-FRU-801',
    barcode: '890103008018',
    name: 'Banana (Yelakki)',
    categorySlug: 'fruits',
    subCategorySlug: 'fruits',
    deliveryEtaMinutes: 20,
    brand: 'Hospete Orchard',
    description: 'Sweet, fragrant Yelakki bananas directly from Bellary & Hospete fruit plantations.',
    imageUrl: '/images/bananas.jpg',
    rating: 4.8,
    reviewCount: 164,
    isDeal: true,
    dealTag: '12% OFF',
    isBestseller: true,
    isFresh: true,
    isBulk: false,
    createdAt: '2026-03-05 07:45',
    variants: [
      { id: 801, packSize: '500 g', price: 40, mrp: 46, stockQty: 40, isDefault: true },
      { id: 802, packSize: '1 kg', price: 78, mrp: 90, stockQty: 25, isDefault: false },
    ]
  },
  {
    id: 9,
    vendorId: 1,
    approvalStatus: 'approved',
    isActive: true,
    sku: 'SKU-HOU-901',
    barcode: '890103009019',
    name: 'Mysore Sandal Classic Soap',
    categorySlug: 'household',
    brand: 'KSDL',
    description: 'World-famous authentic sandalwood oil toilet soap from Government of Karnataka.',
    imageUrl: '/images/mysore_sandal.jpg',
    originalImageUrl: '/images/cat_household.jpg',
    adminReplacedImageUrl: '/images/mysore_sandal.jpg',
    imageReplacedByAdmin: true,
    imageReplacementReason: 'Authorized admin packaging update: replaced generic store photo with official KSDL packaging asset.',
    imageReviewStatus: 'approved',
    additionalImages: ['/images/mysore_sandal.jpg'],
    imageAuditHistory: [
      {
        id: 'img-aud-9-1',
        action: 'VENDOR_UPLOAD',
        actor: 'Suresh Gowda (Tungabhadra Agro)',
        actorRole: 'vendor',
        imageUrl: '/images/cat_household.jpg',
        notes: 'Initial generic supplier category photo uploaded.',
        timestamp: '2026-03-05 14:20'
      },
      {
        id: 'img-aud-9-2',
        action: 'ADMIN_REPLACE',
        actor: 'superadmin@hospetegrocery.in',
        actorRole: 'admin',
        imageUrl: '/images/mysore_sandal.jpg',
        notes: 'Authorized admin packaging update: replaced generic store photo with official KSDL packaging asset. Original vendor submission preserved.',
        timestamp: '2026-03-06 10:15'
      }
    ],
    rating: 4.9,
    reviewCount: 340,
    isDeal: true,
    dealTag: 'HERITAGE CARE',
    isBestseller: true,
    isFresh: false,
    isBulk: false,
    createdAt: '2026-03-05 14:20',
    variants: [
      { id: 901, packSize: '75 g Single', price: 45, mrp: 50, stockQty: 50, isDefault: false },
      { id: 902, packSize: '125 g Pack of 3', price: 215, mrp: 250, stockQty: 30, isDefault: true },
    ]
  },
  {
    id: 10,
    vendorId: 1,
    approvalStatus: 'approved',
    isActive: true,
    sku: 'SKU-OIL-1001',
    barcode: '890103010011',
    name: 'Gemini Pure Refined Sunflower Oil',
    categorySlug: 'oils',
    brand: 'Gemini',
    description: 'Enriched with Vitamin A and D. Light cooking oil for heart-healthy South Indian cooking.',
    imageUrl: '/images/sunflower_oil.jpg',
    rating: 4.7,
    reviewCount: 165,
    isDeal: false,
    isBestseller: false,
    isFresh: false,
    isBulk: true,
    createdAt: '2026-03-06 15:10',
    variants: [
      { id: 1001, packSize: '1 Litre Pouch', price: 135, mrp: 160, stockQty: 35, isDefault: true },
      { id: 1002, packSize: '5 Litre Can', price: 650, mrp: 780, stockQty: 15, isDefault: false },
    ]
  },
  {
    id: 11,
    vendorId: 1,
    approvalStatus: 'approved',
    isActive: true,
    sku: 'SKU-BEV-1101',
    barcode: '890103011012',
    name: 'Tata Tea Gold Leaf Tea',
    categorySlug: 'beverages',
    brand: 'Tata Tea',
    description: 'Gentle blend of rich Assam CTC teas with 15% long leaves for heavenly aroma and strength.',
    imageUrl: '/images/tata_tea.jpg',
    rating: 4.8,
    reviewCount: 145,
    isDeal: false,
    isBestseller: true,
    isFresh: false,
    isBulk: false,
    createdAt: '2026-03-06 16:00',
    variants: [
      { id: 1101, packSize: '250 g', price: 140, mrp: 160, stockQty: 30, isDefault: true },
      { id: 1102, packSize: '500 g Pack', price: 265, mrp: 310, stockQty: 20, isDefault: false },
    ]
  },
  {
    id: 12,
    vendorId: 2,
    approvalStatus: 'approved',
    isActive: true,
    sku: 'SKU-SNK-1201',
    barcode: '890103012013',
    name: 'Crispy Masala Banana Chips',
    categorySlug: 'snacks',
    brand: 'Malnad Crunch',
    description: 'Thinly sliced raw bananas fried in coconut oil with fresh black pepper and rock salt.',
    imageUrl: '/images/banana_chips.jpg',
    rating: 4.7,
    reviewCount: 130,
    isDeal: true,
    dealTag: 'TOP SNACK',
    isBestseller: false,
    isFresh: false,
    isBulk: false,
    createdAt: '2026-03-07 11:20',
    variants: [
      { id: 1201, packSize: '150 g Pouch', price: 42, mrp: 55, stockQty: 40, isDefault: true },
      { id: 1202, packSize: '300 g Family Pack', price: 80, mrp: 105, stockQty: 25, isDefault: false },
    ]
  },
  {
    id: 13,
    vendorId: 5,
    approvalStatus: 'approved',
    isActive: true,
    sku: 'SKU-SNK-1301',
    barcode: '890103013014',
    name: 'Vijayanagar Roasted Gram & Peanuts Mixture',
    categorySlug: 'snacks',
    brand: 'Vijayanagar Mart',
    description: 'Crispy roasted chana dal and salted peanuts prepared in peanut oil.',
    imageUrl: '/images/banana_chips.jpg',
    rating: 4.4,
    reviewCount: 38,
    isDeal: false,
    isBestseller: false,
    isFresh: false,
    isBulk: false,
    createdAt: '2026-03-08 09:50',
    variants: [
      { id: 1301, packSize: '200 g Pack', price: 45, mrp: 60, stockQty: 20, isDefault: true },
      { id: 1302, packSize: '500 g Family Pack', price: 100, mrp: 140, stockQty: 10, isDefault: false }
    ]
  },
  {
    id: 14,
    vendorId: 1,
    approvalStatus: 'pending',
    imageReviewStatus: 'submitted',
    additionalImages: ['/images/tomatoes.jpg'],
    imageAuditHistory: [
      {
        id: 'img-aud-14-1',
        action: 'VENDOR_UPLOAD',
        actor: 'Suresh Gowda (Tungabhadra Agro)',
        actorRole: 'vendor',
        imageUrl: '/images/tomatoes.jpg',
        notes: 'Vendor uploaded polyhouse cherry tomatoes photo.',
        timestamp: '2026-03-14 10:00'
      }
    ],
    isActive: true,
    sku: 'SKU-VEG-1401',
    barcode: '890103014015',
    name: 'Organic Hydroponic Cherry Tomatoes',
    categorySlug: 'veggies',
    brand: 'Tungabhadra Farms',
    description: 'Bite-sized, vibrant sweet cherry tomatoes cultivated in controlled climate polyhouse at Hospete Agro.',
    imageUrl: '/images/tomatoes.jpg',
    rating: 4.9,
    reviewCount: 16,
    isDeal: true,
    dealTag: 'NEW CROP',
    isBestseller: false,
    isFresh: true,
    isBulk: false,
    createdAt: '2026-03-14 10:00',
    variants: [
      { id: 1401, packSize: '250 g Clamshell', price: 45, mrp: 60, stockQty: 30, isDefault: true },
      { id: 1402, packSize: '500 g Punnet', price: 85, mrp: 110, stockQty: 15, isDefault: false }
    ]
  },
  {
    id: 15,
    vendorId: 2,
    approvalStatus: 'pending',
    imageReviewStatus: 'needs_correction',
    imageCorrectionReason: 'Product packaging image is blurry and does not clearly display the FSSAI license number and ingredients panel. Please capture an uncropped photo in bright lighting.',
    additionalImages: ['/images/mixture_snacks.jpg'],
    imageAuditHistory: [
      {
        id: 'img-aud-15-1',
        action: 'VENDOR_UPLOAD',
        actor: 'Prasad Rao (Hospete Sweets & Namkeen)',
        actorRole: 'vendor',
        imageUrl: '/images/mixture_snacks.jpg',
        notes: 'Initial packaging photo uploaded by vendor.',
        timestamp: '2026-03-12 14:30'
      },
      {
        id: 'img-aud-15-2',
        action: 'ADMIN_CORRECTION_REQUEST',
        actor: 'superadmin@hospetegrocery.in',
        actorRole: 'admin',
        imageUrl: '/images/mixture_snacks.jpg',
        notes: 'Product packaging image is blurry and does not clearly display the FSSAI license number and ingredients panel. Please capture an uncropped photo in bright lighting.',
        timestamp: '2026-03-12 16:10'
      }
    ],
    rejectionReason: 'Nutritional facts label missing; packaging photos do not show batch number or FSSAI license.',
    isActive: true,
    sku: 'SKU-SNK-1501',
    barcode: '890103015016',
    name: 'Hampi Special Traditional Mysore Pak (Tin Box)',
    categorySlug: 'snacks',
    brand: 'Hampi Heritage Sweets',
    description: 'Melt-in-mouth traditional ghee Mysore Pak packed in royal gift tin box.',
    imageUrl: '/images/mixture_snacks.jpg',
    rating: 4.5,
    reviewCount: 22,
    isDeal: false,
    isBestseller: false,
    isFresh: false,
    isBulk: false,
    createdAt: '2026-03-12 14:30',
    variants: [
      { id: 1501, packSize: '250 g Gift Tin', price: 180, mrp: 220, stockQty: 25, isDefault: true },
      { id: 1502, packSize: '500 g Festive Box', price: 340, mrp: 400, stockQty: 15, isDefault: false }
    ]
  },
  {
    id: 16,
    vendorId: 1,
    approvalStatus: 'approved',
    isActive: false, // Inactive / Hidden state
    sku: 'SKU-FRU-1601',
    barcode: '890103016017',
    name: 'Seasonal Ratnagiri Alphonso Mangoes',
    categorySlug: 'fruits',
    brand: 'Hospete Orchard',
    description: 'Naturally ripened carbide-free Alphonso (Hapus) mangoes with rich aroma and saffron pulp.',
    imageUrl: '/images/bananas.jpg',
    rating: 4.9,
    reviewCount: 88,
    isDeal: false,
    isBestseller: false,
    isFresh: true,
    isBulk: false,
    createdAt: '2026-03-10 11:00',
    adminNotes: 'Season temporarily concluded. Hidden from customer store by admin.',
    variants: [
      { id: 1601, packSize: '1 kg Box (approx 3-4 pcs)', price: 420, mrp: 500, stockQty: 12, isDefault: true },
      { id: 1602, packSize: '3 kg Semi-Wooden Crate', price: 1200, mrp: 1450, stockQty: 5, isDefault: false }
    ]
  },
  {
    id: 17,
    vendorId: 1,
    approvalStatus: 'approved',
    isActive: true,
    sku: 'SKU-VEG-1701',
    barcode: '890103017018',
    name: 'Fresh Kolar Cauliflower (Gobi)',
    categorySlug: 'veggies',
    brand: 'Local Fresh',
    description: 'Crisp white florets harvested with protective green leaves from Kolar-Bellary farms.',
    imageUrl: '/images/coriander.jpg',
    rating: 4.6,
    reviewCount: 42,
    isDeal: false,
    isBestseller: false,
    isFresh: true,
    isBulk: false,
    createdAt: '2026-03-11 08:00',
    variants: [
      { id: 1701, packSize: '1 Medium Head (approx 500g)', price: 28, mrp: 35, stockQty: 0, isDefault: true } // Out of Stock!
    ]
  },
  {
    id: 18,
    vendorId: 1,
    approvalStatus: 'approved',
    imageReviewStatus: 'approved',
    isActive: true,
    sku: 'SKU-VEG-1801',
    barcode: '890103018019',
    name: 'Potato (Regular)',
    categorySlug: 'veggies',
    subCategorySlug: 'potatoes',
    deliveryEtaMinutes: 20,
    brand: 'Local Fresh',
    description: 'Fresh farm-sourced regular potatoes with smooth thin skin, ideal for everyday cooking and curries.',
    imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&q=80',
    additionalImages: ['https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&q=80'],
    rating: 4.8,
    reviewCount: 156,
    isDeal: true,
    dealTag: '15% OFF',
    isBestseller: true,
    isFresh: true,
    isBulk: false,
    createdAt: '2026-03-01 09:00',
    variants: [
      { id: 1801, packSize: '1 kg', price: 32, mrp: 38, stockQty: 50, isDefault: true },
      { id: 1802, packSize: '2 kg', price: 60, mrp: 75, stockQty: 30, isDefault: false },
    ]
  },
  {
    id: 19,
    vendorId: 1,
    approvalStatus: 'approved',
    imageReviewStatus: 'approved',
    isActive: true,
    sku: 'SKU-VEG-1901',
    barcode: '890103019020',
    name: 'Onion (Red)',
    categorySlug: 'veggies',
    subCategorySlug: 'onions',
    deliveryEtaMinutes: 20,
    brand: 'Local Fresh',
    description: 'Crisp, pungent red onions sourced fresh from North Karnataka farm clusters.',
    imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=500&q=80',
    additionalImages: ['https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=500&q=80'],
    rating: 4.7,
    reviewCount: 180,
    isDeal: true,
    dealTag: '10% OFF',
    isBestseller: true,
    isFresh: true,
    isBulk: false,
    createdAt: '2026-03-01 09:15',
    variants: [
      { id: 1901, packSize: '1 kg', price: 28, mrp: 32, stockQty: 45, isDefault: true },
      { id: 1902, packSize: '2 kg', price: 54, mrp: 64, stockQty: 25, isDefault: false },
      { id: 1903, packSize: '15 kg Commercial Sack', price: 375, mrp: 450, stockQty: 15, isDefault: false },
    ]
  },
  {
    id: 20,
    vendorId: 1,
    approvalStatus: 'approved',
    imageReviewStatus: 'approved',
    isActive: true,
    sku: 'SKU-VEG-2001',
    barcode: '890103020021',
    name: 'Palak / Spinach (Fresh Leafy Greens)',
    categorySlug: 'veggies',
    subCategorySlug: 'leafy_greens',
    deliveryEtaMinutes: 20,
    brand: 'Local Fresh',
    description: 'Tender and nutrient-rich farm palak leaves harvested fresh each morning along the Tungabhadra basin.',
    imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=500&q=80',
    additionalImages: ['https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=500&q=80'],
    rating: 4.8,
    reviewCount: 76,
    isDeal: true,
    dealTag: '18% OFF',
    isBestseller: true,
    isFresh: true,
    isBulk: false,
    createdAt: '2026-03-01 09:30',
    variants: [
      { id: 2001, packSize: '250 g', price: 18, mrp: 22, stockQty: 35, isDefault: true },
      { id: 2002, packSize: '500 g', price: 34, mrp: 42, stockQty: 20, isDefault: false },
    ]
  }
];

export const INITIAL_CATALOG_AUDIT_LOGS: CatalogAuditLog[] = [
  {
    id: 'cal-1',
    adminIdentifier: 'superadmin@hospetegrocery.in',
    productId: 16,
    productName: 'Seasonal Ratnagiri Alphonso Mangoes',
    action: 'HIDE',
    previousState: 'Live Active',
    newState: 'Inactive / Hidden',
    reason: 'Off-season inventory paused per orchard supplier request.',
    timestamp: '2026-03-10 11:15'
  },
  {
    id: 'cal-2',
    adminIdentifier: 'superadmin@hospetegrocery.in',
    productId: 15,
    productName: 'Hampi Special Traditional Mysore Pak (Tin Box)',
    action: 'REJECT',
    previousState: 'Pending Approval',
    newState: 'Rejected',
    reason: 'Nutritional facts label missing; packaging photos do not show batch number or FSSAI license.',
    timestamp: '2026-03-12 14:40'
  },
  {
    id: 'cal-3',
    adminIdentifier: 'superadmin@hospetegrocery.in',
    productId: 12,
    productName: 'Crispy Masala Banana Chips',
    action: 'APPROVE',
    previousState: 'Pending Approval',
    newState: 'Live Active',
    reason: 'FSSAI license verified and batch packaging approved.',
    timestamp: '2026-03-07 12:00'
  }
];

export const DELIVERY_BOYS: DeliveryBoy[] = [
  {
    id: 'dlv-1',
    code: 'DLV-001',
    name: 'Ravi',
    phone: '+91 98450 77112',
    vehicle: 'Honda Activa (KA-35-E-1234)',
    status: 'available',
    activeOrdersCount: 1
  },
  {
    id: 'dlv-2',
    code: 'DLV-002',
    name: 'Suresh',
    phone: '+91 98450 88223',
    vehicle: 'TVS Jupiter (KA-35-M-5678)',
    status: 'available',
    activeOrdersCount: 0
  },
  {
    id: 'dlv-3',
    code: 'DLV-003',
    name: 'Manjunath',
    phone: '+91 98450 99334',
    vehicle: 'Hero Splendor (KA-35-K-9012)',
    status: 'available',
    activeOrdersCount: 2
  },
  {
    id: 'dlv-4',
    code: 'DLV-004',
    name: 'Kiran',
    phone: '+91 98450 66445',
    vehicle: 'Bajaj Pulsar (KA-35-L-4321)',
    status: 'busy',
    activeOrdersCount: 3
  }
];

export const INITIAL_DELIVERY_PARTNERS: DeliveryPartner[] = [
  {
    id: 'dlv-1',
    applicationId: 'DP-2026-00123',
    code: 'DLV-001',
    name: 'Ravi Kumar',
    phone: '9845012345',
    email: 'ravi.kumar@gmail.com',
    address: '#14, Ward 8, Hospete',
    serviceArea: 'Hospete - MP Prakash Nagar',
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    vehicleType: 'Two Wheeler',
    vehicleNumber: 'KA-35-AB-1234',
    licenceNumber: 'DL-1234567890',
    aadhaarNumber: '********1234',
    bankDetails: {
      bankName: 'HDFC Bank Hospete',
      accountNumber: '*********4321',
      ifsc: 'HDFC0001289',
      upiId: 'ravi.dlv@oksbi'
    },
    status: 'approved',
    isOnline: true,
    activeOrdersCount: 1,
    ratings: 4.9,
    totalDeliveries: 128,
    appliedAt: '12 Oct 2026, 10:15 AM',
    approvedAt: '12 Oct 2026, 10:30 AM',
    adminNotes: 'All background checks and driving licence verified valid through 2030.',
    currentLocation: {
      lat: 15.2689,
      lng: 76.3909,
      areaName: 'MP Prakash Nagar'
    },
    assignedRoute: 'MP Prakash Nagar - Kampli Road Hub',
    documents: [
      { id: 'doc-1', name: 'Profile Photo', type: 'photo', fileName: 'ravi_profile.jpg', status: 'verified', uploadedAt: '12 Oct 2026' },
      { id: 'doc-2', name: 'Aadhaar Card', type: 'aadhaar', fileName: 'aadhaar_front_back.pdf', status: 'verified', uploadedAt: '12 Oct 2026' },
      { id: 'doc-3', name: 'Driving Licence', type: 'licence', fileName: 'ka_dl_2022_9901.pdf', status: 'verified', uploadedAt: '12 Oct 2026' },
      { id: 'doc-4', name: 'Vehicle RC', type: 'rc', fileName: 'ka35ab1234_rc.pdf', status: 'verified', uploadedAt: '12 Oct 2026' }
    ],
    earnings: {
      today: 520,
      thisWeek: 3450,
      thisMonth: 14800,
      pendingPayout: 1240,
      history: [
        { id: 'pay-1', date: '11 Oct 2026', amount: 480, orderCount: 10, status: 'paid' },
        { id: 'pay-2', date: '10 Oct 2026', amount: 560, orderCount: 12, status: 'paid' },
        { id: 'pay-3', date: '09 Oct 2026', amount: 420, orderCount: 9, status: 'paid' }
      ]
    },
    notifications: [
      { id: 'n-1', title: 'New Order Assigned', message: 'Order #HF-83921 assigned to you from Sri Lakshmi Store.', time: '10:15 AM', read: false, type: 'order', orderId: 83921 },
      { id: 'n-2', title: 'Payout Credited', message: '₹480 transferred to your HDFC Bank account successfully.', time: 'Yesterday', read: true, type: 'payout' },
      { id: 'n-3', title: 'Welcome to Hospete Fresh!', message: 'Your application has been approved by Admin. You are now live!', time: '12 Oct', read: true, type: 'approval' }
    ]
  },
  {
    id: 'dlv-2',
    applicationId: 'DP-2026-00124',
    code: 'DLV-002',
    name: 'Suresh B',
    phone: '9876543210',
    email: 'suresh.b@gmail.com',
    address: '#56, College Road, Hospete',
    serviceArea: 'Dam Road',
    profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    vehicleType: 'Two Wheeler',
    vehicleNumber: 'KA-35-EB-1088',
    licenceNumber: 'DL-9876543211',
    aadhaarNumber: '********5678',
    bankDetails: {
      bankName: 'State Bank of India',
      accountNumber: '*********9876',
      ifsc: 'SBIN0000845',
      upiId: 'suresh@sbi'
    },
    status: 'approved',
    isOnline: true,
    activeOrdersCount: 2,
    ratings: 4.8,
    totalDeliveries: 95,
    appliedAt: '10 Oct 2026, 09:00 AM',
    approvedAt: '10 Oct 2026, 11:20 AM',
    currentLocation: {
      lat: 15.2750,
      lng: 76.3880,
      areaName: 'Dam Road'
    },
    assignedRoute: 'Dam Road - Station Road Corridor',
    documents: [
      { id: 'doc-21', name: 'Profile Photo', type: 'photo', fileName: 'suresh_photo.jpg', status: 'verified', uploadedAt: '10 Oct 2026' },
      { id: 'doc-22', name: 'Aadhaar Card', type: 'aadhaar', fileName: 'suresh_aadhaar.pdf', status: 'verified', uploadedAt: '10 Oct 2026' },
      { id: 'doc-23', name: 'Driving Licence', type: 'licence', fileName: 'suresh_dl.pdf', status: 'verified', uploadedAt: '10 Oct 2026' }
    ],
    earnings: {
      today: 380,
      thisWeek: 2890,
      thisMonth: 11200,
      pendingPayout: 940,
      history: []
    }
  },
  {
    id: 'dlv-3',
    applicationId: 'DP-2026-00125',
    code: 'DLV-003',
    name: 'Imran Khan',
    phone: '9988776655',
    email: 'imran.k@yahoo.com',
    address: '#89, Station Road Bazaar, Hospete',
    serviceArea: 'Station Road',
    profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    vehicleType: 'Two Wheeler',
    vehicleNumber: 'KA-35-EC-9912',
    licenceNumber: 'DL-5544332211',
    aadhaarNumber: '********8821',
    bankDetails: {
      bankName: 'Canara Bank',
      accountNumber: '*********5544',
      ifsc: 'CNRB0001092',
      upiId: 'imran@okaxis'
    },
    status: 'approved',
    isOnline: true,
    activeOrdersCount: 0,
    ratings: 5.0,
    totalDeliveries: 210,
    appliedAt: '05 Oct 2026, 14:00 PM',
    approvedAt: '05 Oct 2026, 16:30 PM',
    currentLocation: {
      lat: 15.2710,
      lng: 76.3950,
      areaName: 'Station Road'
    },
    assignedRoute: 'Station Road - Amaravathi Hub',
    documents: [
      { id: 'doc-31', name: 'Profile Photo', type: 'photo', fileName: 'imran_photo.jpg', status: 'verified', uploadedAt: '05 Oct 2026' },
      { id: 'doc-32', name: 'Aadhaar Card', type: 'aadhaar', fileName: 'imran_aadhaar.pdf', status: 'verified', uploadedAt: '05 Oct 2026' }
    ],
    earnings: {
      today: 640,
      thisWeek: 4120,
      thisMonth: 18400,
      pendingPayout: 1560,
      history: []
    }
  },
  {
    id: 'dlv-4',
    applicationId: 'DP-2026-00126',
    code: 'DLV-004',
    name: 'Manoj Singh',
    phone: '9123456780',
    email: 'manoj.singh@gmail.com',
    address: '#23, College Road, Hospete',
    serviceArea: 'College Road',
    profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    vehicleType: 'Two Wheeler',
    vehicleNumber: 'KA-35-ED-5521',
    licenceNumber: 'DL-7788990011',
    aadhaarNumber: '********3399',
    bankDetails: {
      bankName: 'Axis Bank',
      accountNumber: '*********7788',
      ifsc: 'UTIB0000492',
      upiId: 'manoj@axis'
    },
    status: 'approved',
    isOnline: true,
    activeOrdersCount: 3,
    ratings: 4.7,
    totalDeliveries: 78,
    appliedAt: '08 Oct 2026, 11:00 AM',
    approvedAt: '08 Oct 2026, 15:45 PM',
    currentLocation: {
      lat: 15.2650,
      lng: 76.3820,
      areaName: 'College Road'
    },
    assignedRoute: 'College Road - Tungabhadra High School',
    documents: [
      { id: 'doc-41', name: 'Profile Photo', type: 'photo', fileName: 'manoj_photo.jpg', status: 'verified', uploadedAt: '08 Oct 2026' }
    ],
    earnings: {
      today: 450,
      thisWeek: 2980,
      thisMonth: 12100,
      pendingPayout: 890,
      history: []
    }
  },
  {
    id: 'dlv-5',
    applicationId: 'DP-2026-00127',
    code: 'DLV-005',
    name: 'Devaraj H',
    phone: '9166667777',
    email: 'devaraj.h@gmail.com',
    address: '#71, Bus Stand Road, Hospete',
    serviceArea: 'Bus Stand',
    profilePhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    vehicleType: 'Two Wheeler',
    vehicleNumber: 'KA-35-EF-7711',
    licenceNumber: 'DL-4455667788',
    aadhaarNumber: '********4455',
    bankDetails: {
      bankName: 'Karnataka Bank',
      accountNumber: '*********4455',
      ifsc: 'KARB0000301',
      upiId: 'devaraj@kbl'
    },
    status: 'pending', // UNDER REVIEW FOR ADMIN SCREEN TEST!
    isOnline: false,
    activeOrdersCount: 0,
    ratings: 0,
    totalDeliveries: 0,
    appliedAt: '12 Oct 2026, 10:15 AM',
    adminNotes: 'Application submitted with all 4 certificates. Awaiting admin review.',
    currentLocation: {
      lat: 15.2790,
      lng: 76.3980,
      areaName: 'Bus Stand'
    },
    assignedRoute: 'Bus Stand - Gandhi Circle',
    documents: [
      { id: 'doc-51', name: 'Profile Photo', type: 'photo', fileName: 'devaraj_profile.jpg', status: 'pending', uploadedAt: '12 Oct 2026' },
      { id: 'doc-52', name: 'Aadhaar Card', type: 'aadhaar', fileName: 'aadhaar_devaraj.pdf', status: 'pending', uploadedAt: '12 Oct 2026' },
      { id: 'doc-53', name: 'Driving Licence', type: 'licence', fileName: 'dl_devaraj.pdf', status: 'pending', uploadedAt: '12 Oct 2026' },
      { id: 'doc-54', name: 'Vehicle RC', type: 'rc', fileName: 'rc_ka35ef7711.pdf', status: 'pending', uploadedAt: '12 Oct 2026' }
    ],
    earnings: {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      pendingPayout: 0,
      history: []
    }
  },
  {
    id: 'dlv-6',
    applicationId: 'DP-2026-00128',
    code: 'DLV-006',
    name: 'Sneha Patil',
    phone: '9448122334',
    email: 'sneha.patil@outlook.com',
    address: '#33, Patel Nagar 4th Cross, Hospete',
    serviceArea: 'Patel Nagar',
    profilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    vehicleType: 'Electric Vehicle',
    vehicleNumber: 'KA-35-EG-8822',
    licenceNumber: 'DL-1122334455',
    aadhaarNumber: '********1122',
    bankDetails: {
      bankName: 'Kotak Mahindra Bank',
      accountNumber: '*********1122',
      ifsc: 'KKBK0008080',
      upiId: 'sneha@kotak'
    },
    status: 'rejected',
    isOnline: false,
    activeOrdersCount: 0,
    ratings: 0,
    totalDeliveries: 0,
    appliedAt: '11 Oct 2026, 16:30 PM',
    adminNotes: 'Driving licence photo is blurry and expired. Please re-upload a clear copy of valid licence.',
    currentLocation: {
      lat: 15.2670,
      lng: 76.3910,
      areaName: 'Patel Nagar'
    },
    assignedRoute: 'Patel Nagar - TB Dam Road',
    documents: [
      { id: 'doc-61', name: 'Profile Photo', type: 'photo', fileName: 'sneha_photo.jpg', status: 'verified', uploadedAt: '11 Oct 2026' },
      { id: 'doc-62', name: 'Aadhaar Card', type: 'aadhaar', fileName: 'sneha_aadhaar.pdf', status: 'verified', uploadedAt: '11 Oct 2026' },
      { id: 'doc-63', name: 'Driving Licence', type: 'licence', fileName: 'blurry_dl.jpg', status: 'rejected', uploadedAt: '11 Oct 2026' }
    ],
    earnings: {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      pendingPayout: 0,
      history: []
    }
  }
];

export const DEFAULT_CAROUSEL_SETTINGS: BannerCarouselSettings = {
  autoRotateIntervalSeconds: 5,
  isAutoRotateEnabled: true,
  pauseOnHover: true,
  pauseOnInteraction: true,
  showIndicators: true,
  showArrows: true
};

export const INITIAL_HOME_BANNERS: HomeBanner[] = [
  {
    id: 'banner-harvest-fest',
    title: 'Tungabhadra Harvest Fest',
    headline: 'Flat 30% OFF on Fresh Farm Staples',
    description: 'Handpicked local veggies, Nandini dairy & freshly made snacks delivered in 15 mins.',
    offerLabel: 'FLAT 30% OFF',
    promoCode: 'HOSPETE30',
    imageUrl: '/banner.jpg',
    altText: 'Tungabhadra Harvest Fest farm produce banner',
    ctaText: 'Claim Offer',
    ctaType: 'offers',
    ctaTargetId: 'offers',
    displayOrder: 1,
    status: 'active',
    isActive: true,
    startDate: '',
    endDate: '',
    createdAt: '12 Oct 2026, 06:00 AM',
    updatedAt: '12 Oct 2026, 06:00 AM',
    backgroundColor: 'from-emerald-800 via-emerald-700 to-teal-600',
    accentColor: '#fbbf24'
  },
  {
    id: 'banner-nandini-dairy',
    title: 'Morning Fresh Milk & Dairy',
    headline: 'Fresh Nandini Milk & Pure Cow Ghee',
    description: 'Chilled dairy packets from local Karnataka milk federations delivered to your doorstep.',
    offerLabel: 'DAILY MORNING 6 AM',
    promoCode: 'NANDINI10',
    imageUrl: '/nandini_milk.jpg',
    altText: 'Nandini Dairy essentials in Hospete',
    ctaText: 'Shop Dairy',
    ctaType: 'category',
    ctaTargetId: 'dairy',
    displayOrder: 2,
    status: 'active',
    isActive: true,
    startDate: '',
    endDate: '',
    createdAt: '12 Oct 2026, 06:30 AM',
    updatedAt: '12 Oct 2026, 06:30 AM',
    backgroundColor: 'from-blue-800 via-sky-700 to-cyan-600',
    accentColor: '#38bdf8'
  },
  {
    id: 'banner-evening-snacks',
    title: 'Hospete Evening Hot Snacks',
    headline: 'Fresh Bellary Mixture & Banana Chips',
    description: 'Crispy savory snacks freshly prepared by local cottage producers in Kampli Road.',
    offerLabel: 'FLAT ₹20 OFF ON COMBO',
    promoCode: 'SNACK20',
    imageUrl: '/mixture_snacks.jpg',
    altText: 'Fresh local snacks and savories',
    ctaText: 'Explore Snacks',
    ctaType: 'category',
    ctaTargetId: 'snacks',
    displayOrder: 3,
    status: 'active',
    isActive: true,
    startDate: '',
    endDate: '',
    createdAt: '12 Oct 2026, 07:00 AM',
    updatedAt: '12 Oct 2026, 07:00 AM',
    backgroundColor: 'from-amber-800 via-orange-700 to-amber-600',
    accentColor: '#f97316'
  }
];

// =========================================================================
// INITIAL FLASH DEALS & CAMPAIGN DATA (Hospete Fresh)
// =========================================================================

export const INITIAL_FLASH_CAMPAIGN: FlashDealsCampaign = {
  id: 'campaign-today-flash',
  title: "Today's Flash Deals",
  subtitle: "Handpicked daily groceries at exclusive limited-time prices",
  isEnabled: true,
  // Initial 3h 40m countdown aligned with screenshot reference
  endDateTime: new Date(Date.now() + (3 * 3600 + 40 * 60) * 1000).toISOString(),
  enablePerDealCountdown: true,
  bannerNotice: "Limited stock available for today's flash deals. Maximum order limits apply per household."
};

export const INITIAL_FLASH_DEALS: FlashDeal[] = [
  {
    id: 'deal-tomato-101',
    productId: 1,
    variantId: 101,
    badgeText: '20% OFF',
    pricingType: 'percentage_discount',
    discountValue: 20,
    dealPrice: 24,
    originalPrice: 24,
    originalMrp: 30,
    calculatedDiscountPercent: 20,
    dealStockLimit: 45,
    dealStockSold: 12,
    perCustomerLimit: 3,
    isActive: true,
    status: 'active',
    startDate: '',
    endDate: new Date(Date.now() + (3 * 3600 + 40 * 60) * 1000).toISOString(),
    createdAt: '2026-10-25 08:00',
    updatedAt: '2026-10-25 08:00'
  },
  {
    id: 'deal-coriander-201',
    productId: 2,
    variantId: 201,
    badgeText: 'BESTSELLER',
    pricingType: 'fixed_price',
    discountValue: 10,
    dealPrice: 10,
    originalPrice: 12,
    originalMrp: 15,
    calculatedDiscountPercent: 33,
    dealStockLimit: 25,
    dealStockSold: 8,
    perCustomerLimit: 2,
    isActive: true,
    status: 'active',
    vendorApproved: true,
    vendorApprovedAt: '2026-10-25 08:00',
    startDate: '',
    endDate: new Date(Date.now() + (3 * 3600 + 40 * 60) * 1000).toISOString(),
    createdAt: '2026-10-25 08:00',
    updatedAt: '2026-10-25 08:00'
  },
  {
    id: 'deal-milk-301',
    productId: 3,
    variantId: 301,
    badgeText: 'DAILY ESSENTIAL',
    pricingType: 'fixed_discount',
    discountValue: 2,
    dealPrice: 22,
    originalPrice: 24,
    originalMrp: 24,
    calculatedDiscountPercent: 8,
    dealStockLimit: 60,
    dealStockSold: 22,
    perCustomerLimit: 4,
    isActive: true,
    status: 'active',
    vendorApproved: true,
    vendorApprovedAt: '2026-10-25 08:00',
    startDate: '',
    endDate: new Date(Date.now() + (3 * 3600 + 40 * 60) * 1000).toISOString(),
    createdAt: '2026-10-25 08:00',
    updatedAt: '2026-10-25 08:00'
  },
  {
    id: 'deal-ghee-401',
    productId: 4,
    variantId: 401,
    badgeText: 'VALUE PACK',
    pricingType: 'percentage_discount',
    discountValue: 15,
    dealPrice: 123,
    originalPrice: 138,
    originalMrp: 145,
    calculatedDiscountPercent: 15,
    dealStockLimit: 20,
    dealStockSold: 5,
    perCustomerLimit: 2,
    isActive: true,
    status: 'active',
    vendorApproved: true,
    vendorApprovedAt: '2026-10-25 08:00',
    startDate: '',
    endDate: new Date(Date.now() + (3 * 3600 + 40 * 60) * 1000).toISOString(),
    createdAt: '2026-10-25 08:00',
    updatedAt: '2026-10-25 08:00'
  },
  {
    id: 'deal-mixture-601',
    productId: 6,
    variantId: 601,
    badgeText: '25% OFF',
    pricingType: 'fixed_price',
    discountValue: 48,
    dealPrice: 48,
    originalPrice: 55,
    originalMrp: 65,
    calculatedDiscountPercent: 26,
    dealStockLimit: 30,
    dealStockSold: 14,
    perCustomerLimit: 3,
    isActive: true,
    status: 'active',
    vendorApproved: true,
    vendorApprovedAt: '2026-10-25 08:00',
    startDate: '',
    endDate: new Date(Date.now() + (3 * 3600 + 40 * 60) * 1000).toISOString(),
    createdAt: '2026-10-25 08:00',
    updatedAt: '2026-10-25 08:00'
  }
];

