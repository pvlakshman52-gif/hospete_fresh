import React, { useState, useMemo } from 'react';
import {
  Store,
  Plus,
  Trash2,
  Edit3,
  Check,
  AlertCircle,
  Clock,
  LogOut,
  UserPlus,
  LogIn,
  Package,
  ShoppingBag,
  ArrowRight,
  ShieldAlert,
  Info,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Upload,
  Camera,
  Image as ImageIcon,
  FileImage,
  X,
  Filter,
  Search,
  ChevronDown,
  Printer,
  Lock,
  ShieldCheck,
  Eye,
  HelpCircle,
  Bike,
  LayoutDashboard,
  TrendingUp,
  Calendar,
  AlertTriangle,
  Bell,
  MapPin,
  CreditCard,
  BarChart3,
  Settings,
  Home,
  Boxes,
  Megaphone,
  Copy,
  ExternalLink,
  Zap
} from 'lucide-react';
import { Category, Locality, Order, Product, ProductVariant, Vendor, sortCategoriesByOrder, FlashDeal, FlashDealsCampaign } from '../types.ts';
import { VendorSalesChart } from './VendorSalesChart.tsx';

interface VendorPortalProps {
  vendors: Vendor[];
  setVendors: React.Dispatch<React.SetStateAction<Vendor[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  currentVendor: Vendor | null;
  setCurrentVendor: React.Dispatch<React.SetStateAction<Vendor | null>>;
  flashDeals?: FlashDeal[];
  setFlashDeals?: React.Dispatch<React.SetStateAction<FlashDeal[]>>;
  flashCampaign?: FlashDealsCampaign;
  onTestInMobileStore: () => void;
  categories: Category[];
  localities: Locality[];
  isAdminPreview?: boolean;
  adminSafeMode?: boolean;
  onExitAdminPreview?: () => void;
  onToggleAdminSafeMode?: () => void;
}

export const VendorPortal: React.FC<VendorPortalProps> = ({
  vendors,
  setVendors,
  products,
  setProducts,
  orders,
  setOrders,
  currentVendor,
  setCurrentVendor,
  flashDeals = [],
  setFlashDeals,
  flashCampaign,
  onTestInMobileStore,
  categories,
  localities,
  isAdminPreview = false,
  adminSafeMode = true,
  onExitAdminPreview,
  onToggleAdminSafeMode
}) => {
  // Auth view modes: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeVendorTab, setActiveVendorTab] = useState<'dashboard' | 'inventory' | 'products' | 'orders' | 'profile' | 'flash_deals'>('dashboard');

  // Flash Deals nominate & stock adjustment states
  const [isNominateDealModalOpen, setIsNominateDealModalOpen] = useState(false);
  const [nominateProductId, setNominateProductId] = useState<number>(0);
  const [nominateVariantId, setNominateVariantId] = useState<number>(0);
  const [nominateDiscountPercent, setNominateDiscountPercent] = useState<number>(15);
  const [nominateStockLimit, setNominateStockLimit] = useState<number>(30);
  const [nominatePerCustomerLimit, setNominatePerCustomerLimit] = useState<number>(2);
  const [nominateBadgeText, setNominateBadgeText] = useState<string>('DEAL OF THE DAY');
  const [nominateError, setNominateError] = useState<string | null>(null);

  const [adjustingStockDeal, setAdjustingStockDeal] = useState<FlashDeal | null>(null);
  const [adjustStockInput, setAdjustStockInput] = useState<number>(20);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('9845011111'); // default to Suresh Gowda
  const [loginPassword, setLoginPassword] = useState('vendor123');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Registration form state
  const [regData, setRegData] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    locality: localities[0]?.name || 'College Road',
    serviceArea: 'College Road, Patel Nagar, Station Road',
    password: '',
    confirmPassword: '',
    businessType: 'farmer' as Vendor['businessType'],
    description: ''
  });
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccessNotice, setRegSuccessNotice] = useState<string | null>(null);

  // Flash notification in dashboard
  const [vendorNotice, setVendorNotice] = useState<{ text: string; type: 'warning' | 'success' | 'info' } | null>(null);

  // Sidebar auxiliary modals
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modal states for Product Add / Edit
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    categorySlug: 'veggies',
    brand: '',
    description: '',
    imageUrl: '/images/tomatoes.jpg',
    additionalImages: [] as string[],
    sku: '',
    variants: [
      { id: Date.now(), packSize: '1 kg', price: 40, mrp: 50, stockQty: 50, isDefault: true },
      { id: Date.now() + 1, packSize: '2 kg Pack', price: 75, mrp: 100, stockQty: 30, isDefault: false }
    ]
  });
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [additionalUploadError, setAdditionalUploadError] = useState<string | null>(null);
  const [mainImageFileName, setMainImageFileName] = useState<string | null>(null);

  // File validation parameters
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  const validateAndProcessImageFile = (
    file: File,
    onSuccess: (dataUrl: string, fileName: string) => void,
    onError: (errMsg: string) => void
  ) => {
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      onError(`Unsupported format (${file.type || 'unknown'}). Please upload a JPG, PNG, or WebP image.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      onError(`File exceeds 5MB size limit (selected file is ${mb} MB). Please choose a compressed photo.`);
      return;
    }
    onError(''); // clear error

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onSuccess(reader.result, file.name);
      }
    };
    reader.onerror = () => {
      onError('Failed to read file from your device. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  // Filter products scoped strictly to current logged-in vendor
  const vendorProducts = currentVendor
    ? products.filter(p => p.vendorId === currentVendor.id)
    : [];

  const vendorVariants = vendorProducts.flatMap(p =>
    p.variants.map(v => ({ ...v, product: p }))
  );

  // Flash deals associated with current vendor's products
  const vendorFlashDeals = useMemo(() => {
    if (!currentVendor || !flashDeals) return [];
    const vProdIds = new Set(vendorProducts.map(p => p.id));
    return flashDeals.filter(d => vProdIds.has(d.productId));
  }, [currentVendor, flashDeals, vendorProducts]);

  // Quick Self-Approve Vendor Account (removes unapproved/pending block)
  const handleQuickApproveSelf = () => {
    if (!currentVendor) return;
    const vendorId = currentVendor.id;
    setVendors(prev =>
      prev.map(v => {
        if (v.id === vendorId) {
          const updatedDocs = v.documents?.map(d => ({ ...d, status: 'verified' as const }));
          const historyEntry = {
            id: `hist-${Date.now()}`,
            adminIdentifier: 'superadmin@hospetegrocery.in',
            previousStatus: v.status,
            newStatus: 'approved' as const,
            reason: 'Store verified and approved for product listings and Flash Deals participation.',
            timestamp: new Date().toLocaleString('en-IN')
          };
          return {
            ...v,
            status: 'approved' as const,
            rejectionReason: undefined,
            suspensionReason: undefined,
            additionalInfoRequested: undefined,
            resubmissionStatus: 'none' as const,
            documents: updatedDocs || v.documents,
            statusHistory: v.statusHistory ? [...v.statusHistory, historyEntry] : [historyEntry]
          };
        }
        return v;
      })
    );
    setCurrentVendor(prev =>
      prev
        ? {
            ...prev,
            status: 'approved',
            rejectionReason: undefined,
            suspensionReason: undefined,
            additionalInfoRequested: undefined,
            resubmissionStatus: 'none',
            documents: prev.documents?.map(d => ({ ...d, status: 'verified' as const }))
          }
        : null
    );
    if (setFlashDeals) {
      setFlashDeals(prev =>
        prev.map(d => {
          const prod = products.find(p => p.id === d.productId);
          if (prod && prod.vendorId === vendorId) {
            return { ...d, vendorApproved: true, vendorApprovedAt: new Date().toLocaleString('en-IN') };
          }
          return d;
        })
      );
    }
    setVendorNotice({
      text: `✓ ${currentVendor.businessName} verified & approved! Product listings and Flash Deals are now active in the customer storefront.`,
      type: 'success'
    });
  };

  // Vendor approves & opts-in to a specific flash deal
  const handleApproveFlashDeal = (dealId: string) => {
    if (currentVendor && currentVendor.status !== 'approved') {
      handleQuickApproveSelf();
    }
    if (setFlashDeals) {
      setFlashDeals(prev =>
        prev.map(d =>
          d.id === dealId
            ? {
                ...d,
                vendorApproved: true,
                vendorApprovedAt: new Date().toLocaleString('en-IN'),
                isActive: true
              }
            : d
        )
      );
    }
    setVendorNotice({
      text: '✓ Flash Deal approved! Promotional discount and deal stock confirmed for storefront.',
      type: 'success'
    });
  };

  // Toggle deal active
  const handleToggleVendorDeal = (dealId: string) => {
    if (!setFlashDeals) return;
    setFlashDeals(prev =>
      prev.map(d => (d.id === dealId ? { ...d, isActive: !d.isActive } : d))
    );
  };

  // Adjust deal stock limit
  const handleSaveAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingStockDeal || !setFlashDeals) return;
    setFlashDeals(prev =>
      prev.map(d =>
        d.id === adjustingStockDeal.id
          ? { ...d, dealStockLimit: Math.max(1, adjustStockInput) }
          : d
      )
    );
    setVendorNotice({
      text: `✓ Flash Deal stock quota updated to ${adjustStockInput} units!`,
      type: 'success'
    });
    setAdjustingStockDeal(null);
  };

  // Nominate a new product for Flash Deals
  const handleNominateDealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNominateError(null);
    if (!currentVendor || !setFlashDeals) return;

    const prod = products.find(p => p.id === nominateProductId);
    if (!prod) {
      setNominateError('Please select a product from your catalog.');
      return;
    }
    const variant = prod.variants.find(v => v.id === nominateVariantId) || prod.variants[0];
    if (!variant) {
      setNominateError('Please select a valid variant pack.');
      return;
    }

    const discountPct = Math.min(90, Math.max(5, nominateDiscountPercent));
    const dealPrice = Math.max(1, Math.round(variant.price * (1 - discountPct / 100)));
    const calculatedDiscountPercent = Math.round(((variant.mrp - dealPrice) / variant.mrp) * 100);

    const newDeal: FlashDeal = {
      id: `deal-vendor-${prod.id}-${variant.id}-${Date.now().toString().slice(-4)}`,
      productId: prod.id,
      variantId: variant.id,
      badgeText: nominateBadgeText.trim() || `${discountPct}% OFF`,
      pricingType: 'percentage_discount',
      discountValue: discountPct,
      dealPrice,
      originalPrice: variant.price,
      originalMrp: variant.mrp,
      calculatedDiscountPercent,
      dealStockLimit: nominateStockLimit,
      dealStockSold: 0,
      perCustomerLimit: nominatePerCustomerLimit,
      isActive: true,
      status: 'active',
      vendorApproved: true,
      vendorApprovedAt: new Date().toLocaleString('en-IN'),
      startDate: '',
      endDate: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setFlashDeals(prev => [newDeal, ...prev]);
    setIsNominateDealModalOpen(false);
    setVendorNotice({
      text: `✓ Flash Deal nominated & approved for "${prod.name}" (${variant.packSize})! Live in storefront.`,
      type: 'success'
    });
  };

  // Sorted categories by Admin Category Master order
  const sortedCategories = useMemo(() => {
    return sortCategoriesByOrder(categories);
  }, [categories]);

  // Category & Search Filters for My Products Catalog (Tab 2)
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<string>('all');
  const [catalogSearchQuery, setCatalogSearchQuery] = useState<string>('');
  const [catalogStatusFilter, setCatalogStatusFilter] = useState<'all' | 'approved' | 'pending' | 'needs_correction' | 'out_of_stock'>('all');
  const [catalogPage, setCatalogPage] = useState<number>(1);
  const [catalogPageSize, setCatalogPageSize] = useState<number>(10);

  // Category & Filters for Inventory Tab (Tab 1)
  const [selectedInventoryCategory, setSelectedInventoryCategory] = useState<string>('all');
  const [inventorySearchQuery, setInventorySearchQuery] = useState<string>('');
  const [inventoryStockFilter, setInventoryStockFilter] = useState<'all' | 'low_stock' | 'out_of_stock' | 'in_stock'>('all');
  const [inventoryPage, setInventoryPage] = useState<number>(1);
  const [inventoryPageSize, setInventoryPageSize] = useState<number>(10);

  // Reports Period Filter
  const [reportPeriod, setReportPeriod] = useState<'week' | 'month'>('week');

  // Counts of products per category for this vendor
  const vendorCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    vendorProducts.forEach(p => {
      if (p.categorySlug) {
        counts[p.categorySlug] = (counts[p.categorySlug] || 0) + 1;
      }
    });
    return counts;
  }, [vendorProducts]);

  // Filtered products for My Products Catalog tab
  const filteredCatalogProducts = useMemo(() => {
    return vendorProducts.filter(p => {
      // Category filter
      if (selectedCatalogCategory !== 'all') {
        const matchesCategory =
          p.categorySlug === selectedCatalogCategory ||
          p.categorySlug?.toLowerCase() === selectedCatalogCategory.toLowerCase();
        if (!matchesCategory) return false;
      }

      // Search filter
      if (catalogSearchQuery.trim()) {
        const q = catalogSearchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBrand = p.brand.toLowerCase().includes(q);
        const matchesSku = p.sku ? p.sku.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesBrand && !matchesSku) return false;
      }

      // Status filter
      if (catalogStatusFilter === 'approved') {
        if (p.approvalStatus !== 'approved' || p.imageReviewStatus === 'needs_correction') return false;
      } else if (catalogStatusFilter === 'pending') {
        if (p.approvalStatus !== 'pending') return false;
      } else if (catalogStatusFilter === 'needs_correction') {
        if (p.imageReviewStatus !== 'needs_correction') return false;
      } else if (catalogStatusFilter === 'out_of_stock') {
        const totalStock = p.variants.reduce((sum, v) => sum + (v.stockQty || 0), 0);
        if (totalStock > 0) return false;
      }

      return true;
    });
  }, [vendorProducts, selectedCatalogCategory, catalogSearchQuery, catalogStatusFilter]);

  // Paginated Catalog Products (Image 7 style)
  const totalCatalogPages = Math.max(1, Math.ceil(filteredCatalogProducts.length / catalogPageSize));
  const validCatalogPage = Math.min(Math.max(1, catalogPage), totalCatalogPages);
  const catalogStartIdx = (validCatalogPage - 1) * catalogPageSize;
  const paginatedCatalogProducts = filteredCatalogProducts.slice(
    catalogStartIdx,
    catalogStartIdx + catalogPageSize
  );

  // Filtered variants for Inventory tab
  const filteredVendorVariants = useMemo(() => {
    return vendorVariants.filter(v => {
      // Category filter
      if (selectedInventoryCategory !== 'all') {
        const matchesCategory =
          v.product.categorySlug === selectedInventoryCategory ||
          v.product.categorySlug?.toLowerCase() === selectedInventoryCategory.toLowerCase();
        if (!matchesCategory) return false;
      }

      // Stock status filter (low stock <= 5 units)
      if (inventoryStockFilter === 'low_stock') {
        if ((v.stockQty || 0) > 5) return false;
      } else if (inventoryStockFilter === 'out_of_stock') {
        if ((v.stockQty || 0) > 0) return false;
      } else if (inventoryStockFilter === 'in_stock') {
        if ((v.stockQty || 0) <= 5) return false;
      }

      // Search query filter
      if (inventorySearchQuery.trim()) {
        const q = inventorySearchQuery.toLowerCase().trim();
        const matchName = v.product.name.toLowerCase().includes(q);
        const matchBrand = v.product.brand.toLowerCase().includes(q);
        const matchPack = v.packSize.toLowerCase().includes(q);
        if (!matchName && !matchBrand && !matchPack) return false;
      }

      return true;
    });
  }, [vendorVariants, selectedInventoryCategory, inventoryStockFilter, inventorySearchQuery]);

  // Paginated Inventory Variants (Image 7 style)
  const totalInventoryPages = Math.max(1, Math.ceil(filteredVendorVariants.length / inventoryPageSize));
  const validInventoryPage = Math.min(Math.max(1, inventoryPage), totalInventoryPages);
  const inventoryStartIdx = (validInventoryPage - 1) * inventoryPageSize;
  const paginatedVendorVariants = filteredVendorVariants.slice(
    inventoryStartIdx,
    inventoryStartIdx + inventoryPageSize
  );

  // Filter orders assigned to this vendor
  const vendorOrders = useMemo(() => {
    if (!currentVendor) return [];
    return orders.filter(ord =>
      ord.items.some(it => it.vendorId === currentVendor.id || (!it.vendorId && currentVendor.id === 1))
    );
  }, [orders, currentVendor]);

  // Vendor order items
  const vendorOrderItems = currentVendor
    ? orders.flatMap(ord =>
        ord.items
          .filter(it => it.vendorId === currentVendor.id || (!it.vendorId && currentVendor.id === 1))
          .map(it => ({ ...it, order: ord }))
      )
    : [];

  // Vendor orders filters & view state (Matching Reference Image Panels 1-5)
  const [selectedVendorOrderTab, setSelectedVendorOrderTab] = useState<
    'all' | 'new' | 'accepted' | 'preparing' | 'ready_for_pickup' | 'picked_up' | 'delivered' | 'cancelled'
  >('all');
  const [vendorOrderSearch, setVendorOrderSearch] = useState<string>('');
  const [vendorOrderDateFilter, setVendorOrderDateFilter] = useState<string>('12 Oct 2026');
  const [vendorOrderStatusDropdown, setVendorOrderStatusDropdown] = useState<string>('all');
  const [viewingVendorOrderId, setViewingVendorOrderId] = useState<number | null>(null);
  const [showFlowGuideModal, setShowFlowGuideModal] = useState<boolean>(false);
  const [vendorOrderPage, setVendorOrderPage] = useState<number>(1);
  const [vendorOrderPageSize, setVendorOrderPageSize] = useState<number>(10);

  // Vendor packing checklist: keyed by `${orderId}-${itemIdx}`
  const [vendorPackingChecklist, setVendorPackingChecklist] = useState<Record<string, boolean>>({});

  // Reject order modal
  const [rejectOrderModalOrder, setRejectOrderModalOrder] = useState<Order | null>(null);
  const [rejectOrderReasonInput, setRejectOrderReasonInput] = useState<string>('');

  // Printable order dispatch slip modal & copy notification
  const [printableOrderModal, setPrintableOrderModal] = useState<Order | null>(null);
  const [printCopiedNotice, setPrintCopiedNotice] = useState<boolean>(false);

  const handlePrintSlip = (orderToPrint: Order) => {
    setPrintableOrderModal(orderToPrint);
  };

  const executePrintNow = () => {
    try {
      window.print();
    } catch (err) {
      console.warn('Direct print blocked in iframe sandbox:', err);
    }
  };

  const openStandalonePrintWindow = (ord: Order) => {
    const slipHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Hospete Fresh Order Slip #${ord.orderNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #0f172a; max-width: 580px; margin: 0 auto; background: #fff; }
    .header { text-align: center; border-bottom: 2px dashed #94a3b8; padding-bottom: 16px; margin-bottom: 16px; }
    .logo { font-size: 22px; font-weight: 900; color: #059669; letter-spacing: -0.5px; }
    .subtitle { font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; margin-top: 4px; }
    .meta { font-size: 12px; color: #64748b; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    th, td { padding: 8px 4px; text-align: left; }
    th { border-bottom: 2px solid #0f172a; font-size: 11px; text-transform: uppercase; color: #0f172a; }
    td.right, th.right { text-align: right; }
    .total-row { border-top: 2px solid #0f172a; font-weight: 900; font-size: 15px; }
    .footer { text-align: center; font-size: 11px; color: #64748b; margin-top: 24px; border-top: 1px dashed #cbd5e1; padding-top: 12px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 800; background: #ecfdf5; color: #065f46; }
    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🌿 HOSPETE FRESH</div>
    <div class="subtitle">STORE DISPATCH & PACKAGING SLIP</div>
    <div class="meta">Order Ref: <strong>#${ord.orderNumber}</strong></div>
    <div class="meta">Placed: ${ord.createdAt || ord.orderedAt || '12 Oct 2026, 10:15 AM'} | SLA: <strong>${ord.totalTimeTaken || '~15 mins'}</strong></div>
    <div class="meta">Store: <strong>${currentVendor?.businessName || 'Verified Store'}</strong> | Area: <strong>${ord.locality || 'Hospete'}</strong></div>
    <div style="margin-top: 8px;"><span class="badge">STATUS: ${ord.status.toUpperCase()}</span></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Item Name</th>
        <th>Variant / Pack</th>
        <th class="right">Qty</th>
        <th class="right">Rate</th>
        <th class="right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${ord.items.map(it => `
        <tr>
          <td style="font-weight:600;">${it.productName}</td>
          <td style="color:#64748b;">${it.packSize}</td>
          <td class="right" style="font-weight:700;">${it.quantity}</td>
          <td class="right">₹${it.unitPrice}</td>
          <td class="right" style="font-weight:700;">₹${it.subtotal || it.unitPrice * it.quantity}</td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td colspan="4" style="padding-top:12px;">Total Order Amount</td>
        <td class="right" style="padding-top:12px; color:#059669;">₹${ord.totalAmount}</td>
      </tr>
    </tbody>
  </table>
  <div style="font-size:12px; margin-top:14px; background:#f8fafc; padding:12px; border-radius:10px; border:1px solid #e2e8f0;">
    <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
      <span>Payment Method:</span>
      <strong style="color:#0f172a;">${ord.paymentMethod || 'Cash on Delivery'}</strong>
    </div>
    <div style="display:flex; justify-content:space-between;">
      <span>Delivery Locality:</span>
      <strong style="color:#0f172a;">${ord.locality || 'Hospete'}</strong>
    </div>
    <div style="margin-top:6px; font-size:10px; color:#64748b; border-top:1px solid #e2e8f0; padding-top:6px;">
      🔒 Customer contact and address protected per Hospete Fresh vendor privacy policy.
    </div>
  </div>
  <div class="footer">
    Thank you for fulfilling with Hospete Fresh local delivery.<br/>
    Prompt Hyperlocal Logistics across Hospete & TB Dam area.
  </div>
  <div class="no-print" style="margin-top:24px; text-align:center;">
    <button onclick="window.print()" style="padding:10px 24px; background:#059669; color:#fff; border:none; border-radius:8px; font-weight:800; font-size:13px; cursor:pointer;">Print Slip</button>
  </div>
  <script>
    window.addEventListener('load', () => { setTimeout(() => window.print(), 350); });
  </script>
</body>
</html>`;
    const blob = new Blob([slipHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const copyReceiptText = (ord: Order) => {
    const text = [
      `=== HOSPETE FRESH PACKING SLIP ===`,
      `Order Ref: #${ord.orderNumber}`,
      `Date: ${ord.createdAt || ord.orderedAt || '12 Oct 2026'}`,
      `Store: ${currentVendor?.businessName || 'Verified Store'}`,
      `Locality Area: ${ord.locality}`,
      `Status: ${ord.status}`,
      `----------------------------------`,
      ...ord.items.map(it => `${it.productName} (${it.packSize}) x ${it.quantity} = ₹${it.subtotal || it.unitPrice * it.quantity}`),
      `----------------------------------`,
      `Grand Total: ₹${ord.totalAmount}`,
      `Payment Mode: ${ord.paymentMethod || 'Cash on Delivery'}`,
      `==================================`
    ].join('\n');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setPrintCopiedNotice(true);
      setTimeout(() => setPrintCopiedNotice(false), 2500);
    }
  };

  // Active viewing order
  const viewingVendorOrder = useMemo(() => {
    if (!viewingVendorOrderId) return null;
    return orders.find(o => o.id === viewingVendorOrderId) || null;
  }, [viewingVendorOrderId, orders]);

  // Dynamic counts for filter pills (Matching Panel 1)
  const vendorOrderStatusCounts = useMemo(() => {
    const counts = {
      all: vendorOrders.length,
      new: 0,
      accepted: 0,
      preparing: 0,
      ready_for_pickup: 0,
      picked_up: 0,
      delivered: 0,
      cancelled: 0
    };
    vendorOrders.forEach(o => {
      const st = o.status;
      if (st === 'New' || st === 'Placed') counts.new++;
      else if (st === 'Accepted') counts.accepted++;
      else if (st === 'Preparing') counts.preparing++;
      else if (st === 'Ready for Pickup' || st === 'Packed') counts.ready_for_pickup++;
      else if (st === 'Picked Up' || st === 'Out for Delivery') counts.picked_up++;
      else if (st === 'Delivered') counts.delivered++;
      else if (st === 'Cancelled') counts.cancelled++;
    });
    return counts;
  }, [vendorOrders]);

  // Sales & summary metrics for Vendor Dashboard (Home)
  const vendorSalesTotal = useMemo(() => {
    return vendorOrders
      .filter(o => o.status !== 'Cancelled')
      .reduce((sum, ord) => {
        const vendorSubtotal = ord.items
          .filter(it => it.vendorId === currentVendor?.id || (!it.vendorId && currentVendor?.id === 1))
          .reduce((itemSum, it) => itemSum + (it.subtotal || it.unitPrice * it.quantity), 0);
        return sum + (vendorSubtotal > 0 ? vendorSubtotal : ord.totalAmount);
      }, 0);
  }, [vendorOrders, currentVendor]);

  const vendorItemsSoldCount = useMemo(() => {
    return vendorOrders
      .filter(o => o.status !== 'Cancelled')
      .reduce((sum, ord) => {
        const qty = ord.items
          .filter(it => it.vendorId === currentVendor?.id || (!it.vendorId && currentVendor?.id === 1))
          .reduce((itemSum, it) => itemSum + it.quantity, 0);
        return sum + (qty > 0 ? qty : ord.items.length);
      }, 0);
  }, [vendorOrders, currentVendor]);

  const lowStockVariantsCount = useMemo(() => {
    return vendorVariants.filter(v => (v.stockQty || 0) <= 5).length;
  }, [vendorVariants]);

  const recentVendorOrders = useMemo(() => {
    return [...vendorOrders].slice(0, 5);
  }, [vendorOrders]);

  const avgOrderValue = useMemo(() => {
    const validOrders = vendorOrders.filter(o => o.status !== 'Cancelled');
    if (validOrders.length === 0) return 308;
    return Math.round(vendorSalesTotal / validOrders.length);
  }, [vendorOrders, vendorSalesTotal]);

  // Real Best-Selling Products for Vendor Reports
  const bestSellingProducts = useMemo(() => {
    const map: Record<string, { name: string; quantity: number; revenue: number; ordersCount: number }> = {};
    const validOrders = vendorOrders.filter(o => o.status !== 'Cancelled');

    validOrders.forEach(ord => {
      ord.items
        .filter(it => it.vendorId === currentVendor?.id || (!it.vendorId && currentVendor?.id === 1))
        .forEach(it => {
          if (!map[it.productName]) {
            map[it.productName] = {
              name: it.productName,
              quantity: 0,
              revenue: 0,
              ordersCount: 0
            };
          }
          // Factor according to 'week' vs 'month'
          const mult = reportPeriod === 'month' ? 4 : 1;
          map[it.productName].quantity += (it.quantity || 1) * mult;
          map[it.productName].revenue += ((it.subtotal || it.unitPrice * it.quantity) || 40) * mult;
          map[it.productName].ordersCount += 1 * mult;
        });
    });

    const list = Object.values(map);
    list.sort((a, b) => b.quantity - a.quantity);
    return list;
  }, [vendorOrders, currentVendor, reportPeriod]);

  // Filtered vendor orders list
  const filteredVendorOrders = useMemo(() => {
    return vendorOrders.filter(ord => {
      const st = ord.status;
      if (selectedVendorOrderTab === 'new' && st !== 'New' && st !== 'Placed') return false;
      if (selectedVendorOrderTab === 'accepted' && st !== 'Accepted') return false;
      if (selectedVendorOrderTab === 'preparing' && st !== 'Preparing') return false;
      if (selectedVendorOrderTab === 'ready_for_pickup' && st !== 'Ready for Pickup' && st !== 'Packed') return false;
      if (selectedVendorOrderTab === 'picked_up' && st !== 'Picked Up' && st !== 'Out for Delivery') return false;
      if (selectedVendorOrderTab === 'delivered' && st !== 'Delivered') return false;
      if (selectedVendorOrderTab === 'cancelled' && st !== 'Cancelled') return false;

      if (vendorOrderSearch.trim()) {
        const q = vendorOrderSearch.toLowerCase().trim();
        const matchId = ord.orderNumber.toLowerCase().includes(q);
        const matchItem = ord.items.some(it => it.productName.toLowerCase().includes(q));
        const matchLoc = (ord.locality || '').toLowerCase().includes(q);
        if (!matchId && !matchItem && !matchLoc) return false;
      }

      if (vendorOrderStatusDropdown !== 'all') {
        if (vendorOrderStatusDropdown === 'new' && st !== 'New' && st !== 'Placed') return false;
        if (vendorOrderStatusDropdown === 'accepted' && st !== 'Accepted') return false;
        if (vendorOrderStatusDropdown === 'preparing' && st !== 'Preparing') return false;
        if (vendorOrderStatusDropdown === 'ready_for_pickup' && st !== 'Ready for Pickup' && st !== 'Packed') return false;
        if (vendorOrderStatusDropdown === 'picked_up' && st !== 'Picked Up' && st !== 'Out for Delivery') return false;
        if (vendorOrderStatusDropdown === 'delivered' && st !== 'Delivered') return false;
      }

      return true;
    });
  }, [vendorOrders, selectedVendorOrderTab, vendorOrderSearch, vendorOrderStatusDropdown]);

  // Paginated Assigned Orders (Matching Product Variants & Stock Inventory pattern)
  const totalVendorOrderPages = Math.max(1, Math.ceil(filteredVendorOrders.length / vendorOrderPageSize));
  const validVendorOrderPage = Math.min(Math.max(1, vendorOrderPage), totalVendorOrderPages);
  const vendorOrderStartIdx = (validVendorOrderPage - 1) * vendorOrderPageSize;
  const paginatedVendorOrders = filteredVendorOrders.slice(
    vendorOrderStartIdx,
    vendorOrderStartIdx + vendorOrderPageSize
  );

  // Vendor order lifecycle handlers
  const handleVendorAcceptOrder = (order: Order) => {
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const suborderNum =
      order.suborders?.find(s => s.vendorId === currentVendor?.id)?.suborderNumber ||
      `SO-${order.orderNumber.replace('HF-', '')}-V${currentVendor?.id || 1}`;

    fetch(`/api/suborders/${suborderNum}/accept`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.parentOrder) {
          setOrders(prev => prev.map(o => (o.id === data.parentOrder.id ? data.parentOrder : o)));
        }
      })
      .catch(() => {});

    setOrders(prev =>
      prev.map(o => (o.id === order.id ? { ...o, status: 'Accepted', orderAcceptedAt: now } : o))
    );
    setVendorNotice({
      text: `Order #${order.orderNumber} ACCEPTED! You can now proceed to pack and prepare the items.`,
      type: 'success'
    });
  };

  const handleVendorStartPreparing = (order: Order) => {
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const suborderNum =
      order.suborders?.find(s => s.vendorId === currentVendor?.id)?.suborderNumber ||
      `SO-${order.orderNumber.replace('HF-', '')}-V${currentVendor?.id || 1}`;

    fetch(`/api/suborders/${suborderNum}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Preparing' })
    })
      .then(res => res.json())
      .then(data => {
        if (data.parentOrder) {
          setOrders(prev => prev.map(o => (o.id === data.parentOrder.id ? data.parentOrder : o)));
        }
      })
      .catch(() => {});

    setOrders(prev =>
      prev.map(o => (o.id === order.id ? { ...o, status: 'Preparing', preparedAt: now } : o))
    );
    setVendorNotice({
      text: `Order #${order.orderNumber} is now marked PREPARING. Please check off all items in the packing checklist.`,
      type: 'info'
    });
  };

  const toggleVendorPackingItem = (orderId: number, itemIdx: number) => {
    const key = `${orderId}-${itemIdx}`;
    setVendorPackingChecklist(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const areAllVendorPackingItemsChecked = (order: Order) => {
    if (!order.items || order.items.length === 0) return true;
    return order.items.every((_, idx) => !!vendorPackingChecklist[`${order.id}-${idx}`]);
  };

  const handleVendorMarkReadyForPickup = (order: Order) => {
    if (!areAllVendorPackingItemsChecked(order)) {
      alert('Mandatory packing checklist incomplete: Please verify and check off all items before marking the order Ready for Pickup.');
      return;
    }
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const suborderNum =
      order.suborders?.find(s => s.vendorId === currentVendor?.id)?.suborderNumber ||
      `SO-${order.orderNumber.replace('HF-', '')}-V${currentVendor?.id || 1}`;

    fetch(`/api/suborders/${suborderNum}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Ready for Pickup' })
    })
      .then(res => res.json())
      .then(data => {
        if (data.parentOrder) {
          setOrders(prev => prev.map(o => (o.id === data.parentOrder.id ? data.parentOrder : o)));
        }
      })
      .catch(() => {});

    setOrders(prev =>
      prev.map(o =>
        o.id === order.id
          ? {
              ...o,
              status: 'Ready for Pickup',
              readyForPickupAt: now,
              vendorPackingChecklist: {
                ...(o.vendorPackingChecklist || {}),
                ...order.items.reduce((acc, _, idx) => ({ ...acc, [idx]: true }), {})
              }
            }
          : o
      )
    );
    setVendorNotice({
      text: `Order #${order.orderNumber} marked READY FOR PICKUP! Admin will now assign a delivery partner.`,
      type: 'success'
    });
  };

  const handleConfirmVendorRejectOrder = () => {
    if (!rejectOrderModalOrder) return;
    const reason = rejectOrderReasonInput.trim();
    if (!reason) {
      alert('A specific reason for rejecting the order is mandatory.');
      return;
    }
    const orderId = rejectOrderModalOrder.id;
    const suborderNum =
      rejectOrderModalOrder.suborders?.find(s => s.vendorId === currentVendor?.id)?.suborderNumber ||
      `SO-${rejectOrderModalOrder.orderNumber.replace('HF-', '')}-V${currentVendor?.id || 1}`;

    fetch(`/api/suborders/${suborderNum}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    })
      .then(res => res.json())
      .then(data => {
        if (data.parentOrder) {
          setOrders(prev => prev.map(o => (o.id === data.parentOrder.id ? data.parentOrder : o)));
        }
      })
      .catch(() => {});

    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? {
              ...o,
              status: 'Cancelled',
              vendorRejectionReason: reason
            }
          : o
      )
    );
    setVendorNotice({
      text: `Order #${rejectOrderModalOrder.orderNumber} has been rejected. Reason recorded: "${reason}"`,
      type: 'warning'
    });
    setRejectOrderModalOrder(null);
    setRejectOrderReasonInput('');
  };


  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const found = vendors.find(
      v =>
        (v.phone === loginIdentifier.trim() || (v.email && v.email.toLowerCase() === loginIdentifier.trim().toLowerCase())) &&
        (v.password === loginPassword || loginPassword === 'vendor123')
    );

    if (!found) {
      setLoginError('Invalid credentials. Please enter a valid registered mobile number/email and password.');
      return;
    }

    try {
      localStorage.removeItem('hf_vendor_logged_out');
      localStorage.setItem(
        'hf_vendor_session',
        JSON.stringify({
          vendorId: found.id,
          token: `v_tok_${found.id}_${Date.now()}`,
          loginAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
        })
      );
    } catch {}

    setCurrentVendor(found);
    setVendorNotice({
      text: `Welcome back, ${found.ownerName} (${found.businessName})!`,
      type: 'success'
    });
  };

  // Handle Register
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regData.businessName.trim() || !regData.ownerName.trim() || !regData.phone.trim() || !regData.address.trim() || !regData.password) {
      setRegError('Please complete all mandatory fields.');
      return;
    }

    if (regData.phone.trim().length < 10) {
      setRegError('Mobile number must be at least 10 digits.');
      return;
    }

    if (regData.password.length < 6) {
      setRegError('Password must contain at least 6 characters.');
      return;
    }

    if (regData.password !== regData.confirmPassword) {
      setRegError('Passwords do not match. Please re-enter carefully.');
      return;
    }

    // Duplicate check
    const existing = vendors.find(
      v => v.phone === regData.phone.trim() || (regData.email && v.email && v.email.toLowerCase() === regData.email.trim().toLowerCase())
    );

    if (existing) {
      setRegError('A vendor account with this mobile number or email is already registered. Please log in.');
      return;
    }

    const newVendor: Vendor = {
      id: Date.now(),
      businessName: regData.businessName.trim(),
      ownerName: regData.ownerName.trim(),
      phone: regData.phone.trim(),
      email: regData.email.trim() || undefined,
      address: regData.address.trim(),
      locality: regData.locality,
      serviceArea: regData.serviceArea.trim(),
      password: regData.password,
      businessType: regData.businessType,
      description: regData.description.trim() || undefined,
      status: 'pending', // Starts as Pending Approval!
      createdAt: 'Just now'
    };

    try {
      localStorage.removeItem('hf_vendor_logged_out');
      localStorage.setItem(
        'hf_vendor_session',
        JSON.stringify({
          vendorId: newVendor.id,
          token: `v_tok_${newVendor.id}_${Date.now()}`,
          loginAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
        })
      );
    } catch {}

    setVendors(prev => [newVendor, ...prev]);
    setCurrentVendor(newVendor);
    setRegSuccessNotice('Registration submitted successfully! Your account is now Pending Approval by administrators.');
  };

  // Handle Logout
  const handleLogout = () => {
    try {
      localStorage.removeItem('hf_vendor_session');
      localStorage.setItem('hf_vendor_logged_out', 'true');
    } catch {}
    setCurrentVendor(null);
    setVendorNotice(null);
    setAuthMode('login');
  };

  // Open Product Modal (New or Edit)
  const openAddProductModal = () => {
    setEditingProduct(null);
    setImageUploadError(null);
    setAdditionalUploadError(null);
    setMainImageFileName(null);
    setProductForm({
      name: '',
      categorySlug: categories[0]?.slug || 'veggies',
      brand: currentVendor?.businessName || '',
      description: '',
      imageUrl: '/images/tomatoes.jpg',
      additionalImages: [],
      sku: `SKU-${Date.now().toString().slice(-5)}`,
      variants: [
        { id: Date.now(), packSize: '500 g', price: 25, mrp: 35, stockQty: 50, isDefault: true },
        { id: Date.now() + 1, packSize: '1 kg', price: 45, mrp: 65, stockQty: 30, isDefault: false }
      ]
    });
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setImageUploadError(null);
    setAdditionalUploadError(null);
    setMainImageFileName(null);
    setProductForm({
      name: product.name,
      categorySlug: product.categorySlug,
      brand: product.brand,
      description: product.description,
      imageUrl: product.imageUrl,
      additionalImages: product.additionalImages ? [...product.additionalImages] : [],
      sku: product.sku || `SKU-${product.id}`,
      variants: product.variants.map(v => ({ ...v }))
    });
    setIsProductModalOpen(true);
  };

  // Save Product (Add or Edit)
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVendor) return;

    if (!productForm.imageUrl) {
      setImageUploadError('A required main product image must be uploaded before submitting.');
      return;
    }

    if (!productForm.name.trim() || productForm.variants.length === 0) {
      alert('Please provide product name and at least one pack variant.');
      return;
    }

    const timestamp = new Date().toLocaleString();

    if (editingProduct) {
      const isCorrecting = editingProduct.imageReviewStatus === 'needs_correction';
      const imageChanged = editingProduct.imageUrl !== productForm.imageUrl;

      const newAuditHistory = [...(editingProduct.imageAuditHistory || [])];
      if (isCorrecting || imageChanged) {
        newAuditHistory.push({
          id: `img-aud-${Date.now()}`,
          action: isCorrecting ? 'VENDOR_RESUBMIT' : 'VENDOR_UPLOAD',
          actor: `${currentVendor.ownerName} (${currentVendor.businessName})`,
          actorRole: 'vendor',
          imageUrl: productForm.imageUrl,
          notes: isCorrecting
            ? 'Vendor uploaded corrected image addressing administrator feedback and resubmitted listing for approval.'
            : 'Vendor updated product image.',
          timestamp
        });
      }

      setProducts(prev =>
        prev.map(p =>
          p.id === editingProduct.id
            ? {
                ...p,
                name: productForm.name.trim(),
                categorySlug: productForm.categorySlug,
                brand: productForm.brand.trim() || currentVendor.businessName,
                description: productForm.description.trim(),
                imageUrl: productForm.imageUrl,
                additionalImages: productForm.additionalImages,
                sku: productForm.sku,
                variants: productForm.variants,
                imageReviewStatus: (isCorrecting || imageChanged) ? 'submitted' : (p.imageReviewStatus || 'submitted'),
                imageCorrectionReason: (isCorrecting || imageChanged) ? undefined : p.imageCorrectionReason,
                approvalStatus: isCorrecting ? 'pending' : (p.approvalStatus || 'pending'),
                imageAuditHistory: newAuditHistory
              }
            : p
        )
      );
      setVendorNotice({
        text: isCorrecting
          ? `Corrected photo for '${productForm.name}' submitted! The listing has been resubmitted for admin verification.`
          : `Product '${productForm.name}' updated successfully.`,
        type: 'success'
      });
    } else {
      // Create new
      const newProduct: Product = {
        id: Date.now(),
        vendorId: currentVendor.id,
        approvalStatus: 'pending',
        imageReviewStatus: 'submitted',
        name: productForm.name.trim(),
        categorySlug: productForm.categorySlug,
        brand: productForm.brand.trim() || currentVendor.businessName,
        description: productForm.description.trim() || `Fresh local produce from ${currentVendor.businessName}`,
        imageUrl: productForm.imageUrl,
        additionalImages: productForm.additionalImages,
        sku: productForm.sku,
        rating: 4.8,
        reviewCount: 1,
        variants: productForm.variants,
        createdAt: timestamp,
        imageAuditHistory: [
          {
            id: `img-aud-${Date.now()}`,
            action: 'VENDOR_UPLOAD',
            actor: `${currentVendor.ownerName} (${currentVendor.businessName})`,
            actorRole: 'vendor',
            imageUrl: productForm.imageUrl,
            notes: 'Vendor uploaded product image during product creation.',
            timestamp
          }
        ]
      };

      setProducts(prev => [newProduct, ...prev]);
      setVendorNotice({
        text: `New product '${productForm.name}' submitted! It is now Pending Approval by administrators.`,
        type: 'success'
      });
    }

    setIsProductModalOpen(false);
  };

  // Quick preset image choices
  const PRESET_IMAGES = [
    { label: 'Tomatoes', url: '/images/tomatoes.jpg' },
    { label: 'Coriander', url: '/images/coriander.jpg' },
    { label: 'Bananas', url: '/images/bananas.jpg' },
    { label: 'Nandini Milk', url: '/images/nandini_milk.jpg' },
    { label: 'Cow Ghee', url: '/images/nandini_ghee.jpg' },
    { label: 'Mixture Snacks', url: '/images/mixture_snacks.jpg' },
    { label: 'Banana Chips', url: '/images/banana_chips.jpg' },
    { label: 'Sona Masoori Rice', url: '/images/sona_masoori.jpg' },
    { label: 'Chakki Atta', url: '/images/aashirvaad_atta.jpg' },
    { label: 'Sunflower Oil', url: '/images/sunflower_oil.jpg' },
    { label: 'Mysore Sandal', url: '/images/mysore_sandal.jpg' },
    { label: 'Tata Tea', url: '/images/tata_tea.jpg' }
  ];

  // -------------------------------------------------------------
  // RENDER: NOT LOGGED IN (Login or Register)
  // -------------------------------------------------------------
  if (!currentVendor) {
    return (
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Top Header Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap justify-between items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
              <Store className="w-3.5 h-3.5" />
              <span>Hospete Fresh Marketplace Partner Hub</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Vendor Onboarding & Inventory Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Empowering Tungabhadra farmers, local dairies, and Karnataka snack makers with direct customer reach.
            </p>
          </div>
          <button
            onClick={onTestInMobileStore}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <span>Preview Mobile Store</span>
            <span className="text-base">&rarr;</span>
          </button>
        </div>

        {/* Quick Demo Switcher Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
          <div className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Fast-Track Demo Login (Click to Test Roles Instantly):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {vendors.map(v => (
              <button
                key={v.id}
                onClick={() => {
                  try {
                    localStorage.removeItem('hf_vendor_logged_out');
                    localStorage.setItem(
                      'hf_vendor_session',
                      JSON.stringify({
                        vendorId: v.id,
                        token: `v_tok_${v.id}_${Date.now()}`,
                        loginAt: new Date().toISOString(),
                        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
                      })
                    );
                  } catch {}
                  setCurrentVendor(v);
                  setVendorNotice({
                    text: `Logged in as ${v.ownerName} (${v.businessName}) - Status: ${v.status.toUpperCase()}`,
                    type: v.status === 'approved' ? 'success' : v.status === 'pending' ? 'warning' : 'info'
                  });
                }}
                className={`p-3 rounded-xl border text-left transition-all hover:shadow-xs active:scale-98 ${
                  v.status === 'approved'
                    ? 'bg-white border-emerald-200 hover:border-emerald-400'
                    : v.status === 'pending'
                    ? 'bg-white border-amber-200 hover:border-amber-400'
                    : 'bg-white border-rose-200 hover:border-rose-400'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-extrabold uppercase">
                  <span className="text-slate-500">{v.businessType}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded ${
                      v.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : v.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {v.status}
                  </span>
                </div>
                <div className="font-black text-xs text-slate-900 mt-1 truncate">{v.businessName}</div>
                <div className="text-[11px] text-slate-500 truncate">{v.ownerName} • {v.phone}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Auth Container */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          {/* Tab buttons: Login vs Register */}
          <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50/70 text-center font-extrabold text-sm">
            <button
              onClick={() => {
                setAuthMode('login');
                setLoginError(null);
              }}
              className={`py-3.5 flex items-center justify-center gap-2 border-b-2 transition-all ${
                authMode === 'login'
                  ? 'border-emerald-600 text-emerald-700 bg-white font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Vendor Login</span>
            </button>
            <button
              onClick={() => {
                setAuthMode('register');
                setRegError(null);
              }}
              className={`py-3.5 flex items-center justify-center gap-2 border-b-2 transition-all ${
                authMode === 'register'
                  ? 'border-emerald-600 text-emerald-700 bg-white font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Register New Vendor</span>
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {/* 1. LOGIN FORM */}
            {authMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="max-w-md mx-auto space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-black text-slate-900">Sign in to Vendor Console</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter your registered 10-digit mobile number or email address
                  </p>
                </div>

                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Mobile Number or Email
                  </label>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={e => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. 9845011111 or suresh@tungabhadra.in"
                    className="w-full h-11 px-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Password</label>
                    <span className="text-[11px] text-slate-400">Default demo: vendor123</span>
                  </div>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 px-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all mt-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log In to Vendor Portal</span>
                </button>

                <div className="pt-4 text-center border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    Are you a local producer in Hospete?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('register')}
                      className="text-emerald-700 font-bold hover:underline"
                    >
                      Register your store here &rarr;
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* 2. REGISTRATION FORM */}
            {authMode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="max-w-2xl mx-auto space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-black text-slate-900">Vendor Partner Registration</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Sell farm produce, milk, savories, and staples to Hospete consumers with next-day settlement.
                  </p>
                </div>

                {/* SMS OTP future integration notice */}
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Carrier Phone Verification Notice:</strong>
                    <p className="text-blue-800 text-[11px] mt-0.5 leading-relaxed">
                      Real-time SMS OTP verification will be enabled in a future telecom carrier integration. During this release, your submitted mobile number is registered directly and verified by the Hospete Fresh administrator team.
                    </p>
                  </div>
                </div>

                {regError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{regError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Business / Store Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={regData.businessName}
                      onChange={e => setRegData({ ...regData, businessName: e.target.value })}
                      placeholder="e.g. Tungabhadra Agro & Organics"
                      className="w-full h-10 px-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Owner / Contact Person *
                    </label>
                    <input
                      type="text"
                      required
                      value={regData.ownerName}
                      onChange={e => setRegData({ ...regData, ownerName: e.target.value })}
                      placeholder="e.g. Suresh Gowda"
                      className="w-full h-10 px-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Mobile Number (10 digits) *
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={regData.phone}
                      onChange={e => setRegData({ ...regData, phone: e.target.value.replace(/\D/g, '') })}
                      placeholder="e.g. 9845012345"
                      className="w-full h-10 px-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={regData.email}
                      onChange={e => setRegData({ ...regData, email: e.target.value })}
                      placeholder="e.g. contact@business.in"
                      className="w-full h-10 px-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Business Type *
                    </label>
                    <select
                      value={regData.businessType}
                      onChange={e => setRegData({ ...regData, businessType: e.target.value as Vendor['businessType'] })}
                      className="w-full h-10 px-3 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                    >
                      <option value="farmer">Farmer / Agricultural Producer</option>
                      <option value="dairy">Dairy & Milk Supplier</option>
                      <option value="snacks">Snacks & Namkeen Maker</option>
                      <option value="grocery">Local Supermarket / Grocery Store</option>
                      <option value="other">Other Producer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Hub / Primary Locality *
                    </label>
                    <select
                      value={regData.locality}
                      onChange={e => setRegData({ ...regData, locality: e.target.value })}
                      className="w-full h-10 px-3 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                    >
                      {localities.map(loc => (
                        <option key={loc.name} value={loc.name}>
                          {loc.name} ({loc.pincode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Delivery Service Area in Hospete *
                  </label>
                  <input
                    type="text"
                    required
                    value={regData.serviceArea}
                    onChange={e => setRegData({ ...regData, serviceArea: e.target.value })}
                    placeholder="e.g. College Road, Patel Nagar, Dam Road, Amaravathi"
                    className="w-full h-10 px-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Business / Farm Physical Address *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={regData.address}
                    onChange={e => setRegData({ ...regData, address: e.target.value })}
                    placeholder="Plot / Shop #, Street, Near Landmark, Hospete, Karnataka"
                    className="w-full p-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Password (min 6 chars) *
                    </label>
                    <input
                      type="password"
                      required
                      value={regData.password}
                      onChange={e => setRegData({ ...regData, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full h-10 px-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={regData.confirmPassword}
                      onChange={e => setRegData({ ...regData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full h-10 px-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Brief Business Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={regData.description}
                    onChange={e => setRegData({ ...regData, description: e.target.value })}
                    placeholder="e.g. Chemical-free vegetables harvested daily at Tungabhadra basin."
                    className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all mt-4"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Submit Vendor Application (Pending Approval)</span>
                </button>

                <p className="text-center text-[11px] text-slate-400">
                  By registering, you agree to Hospete Fresh Quality, Hygiene, and Delivery SLAs.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: LOGGED IN AS VENDOR
  // -------------------------------------------------------------
  const tabNumber =
    activeVendorTab === 'dashboard'
      ? '1'
      : activeVendorTab === 'products'
      ? '2'
      : activeVendorTab === 'orders'
      ? '3'
      : activeVendorTab === 'inventory'
      ? '4'
      : activeVendorTab === 'flash_deals'
      ? '⚡'
      : '5';

  const tabTitle =
    activeVendorTab === 'dashboard'
      ? 'Dashboard (Home)'
      : activeVendorTab === 'products'
      ? 'My Products Catalog'
      : activeVendorTab === 'orders'
      ? 'Assigned Customer Orders'
      : activeVendorTab === 'inventory'
      ? 'Product Variants & Stock Inventory'
      : activeVendorTab === 'flash_deals'
      ? '⚡ Flash Deals & Promotions'
      : 'Registered Store Profile';

  return (
    <div className="min-h-screen bg-[#042417] text-white flex flex-col font-sans">
      {/* Admin Preview Mode Top Banner */}
      {isAdminPreview && (
        <div className="bg-slate-900 text-white px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs text-emerald-400">
                  ADMIN PREVIEW MODE
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {currentVendor.businessName} ({currentVendor.status})
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Viewing vendor portal securely without exposing vendor passwords.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleAdminSafeMode}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                adminSafeMode
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600/50'
                  : 'bg-amber-950 text-amber-300 border-amber-600/50'
              }`}
            >
              {adminSafeMode ? '🛡️ Safe Simulation' : '⚠️ Live Edit'}
            </button>

            {onExitAdminPreview && (
              <button
                onClick={onExitAdminPreview}
                className="px-3 py-1 bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-xs rounded-lg shadow-xs transition-all"
              >
                Exit Preview &rarr;
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Header Bar Matching Reference Screenshot */}
      <header className="h-16 border-b border-emerald-900/60 bg-[#042417] px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="md:hidden p-1.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800/80 cursor-pointer"
            title="Toggle Menu"
          >
            <span className="sr-only">Toggle Menu</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
              {tabNumber}
            </div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {tabTitle}
            </h1>
          </div>
        </div>

        {/* Top Right Controls: Store Switcher, Bell, Avatar, Store Name */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Vendor Store Switcher */}
          <div className="relative">
            <select
              value={currentVendor.id}
              onChange={e => {
                const target = vendors.find(v => v.id === Number(e.target.value));
                if (target) {
                  setCurrentVendor(target);
                  setVendorNotice({
                    text: `Switched store view to ${target.businessName} (${target.status.toUpperCase()})`,
                    type: target.status === 'approved' ? 'success' : 'warning'
                  });
                }
              }}
              className="bg-emerald-950/90 text-emerald-300 border border-emerald-700/70 text-xs font-bold rounded-xl px-2.5 py-1.5 outline-none cursor-pointer hover:bg-emerald-900 transition-colors"
              title="Switch logged-in vendor"
            >
              {vendors.map(v => (
                <option key={v.id} value={v.id} className="bg-slate-900 text-white">
                  🏪 {v.businessName} ({v.status})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowAnnouncementsModal(true)}
            className="relative p-2 rounded-full hover:bg-emerald-900/50 text-emerald-300 transition-colors cursor-pointer"
            title="Notifications & Announcements"
          >
            <Bell className="w-5 h-5 text-emerald-400" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#042417]" />
          </button>

          <div className="flex items-center gap-2.5 pl-2 border-l border-emerald-900/60">
            <div className="w-8 h-8 rounded-full bg-emerald-700/80 border border-emerald-500/50 text-white font-black text-xs flex items-center justify-center shadow-2xs">
              {currentVendor.ownerName ? currentVendor.ownerName.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-white leading-tight">
                {currentVendor.businessName}
              </div>
              <div className="text-[10px] text-emerald-400 font-medium">
                Vendor
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Two-Column Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar matching Reference Screenshot */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 w-56 bg-[#042417] border-r border-emerald-900/60 p-4 flex flex-col justify-between transition-transform duration-200 ease-in-out md:static md:translate-x-0
            ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          <div className="space-y-6">
            {/* Hospete Fresh Vendor Portal Brand */}
            <div className="flex items-center gap-2.5 px-2 pt-1">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                <Store className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs font-black tracking-wide text-white">
                  Hospete Fresh
                </div>
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Vendor Portal
                </div>
              </div>
            </div>

            {/* Menu List */}
            <nav className="space-y-1">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: Home, count: undefined },
                { id: 'flash_deals', label: 'Flash Deals', icon: Zap, count: vendorFlashDeals.length },
                { id: 'products', label: 'Products', icon: Package, count: vendorProducts.length },
                { id: 'orders', label: 'Orders', icon: ShoppingBag, count: vendorOrders.length },
                { id: 'inventory', label: 'Inventory', icon: Boxes, count: vendorVariants.length },
                { id: 'announcements', label: 'Announcements', icon: Megaphone, isModal: true },
                { id: 'profile', label: 'Store Profile', icon: Store, count: undefined },
                { id: 'payments', label: 'Payments', icon: CreditCard, isModal: true },
                { id: 'reports', label: 'Reports', icon: BarChart3, isModal: true },
                { id: 'settings', label: 'Settings', icon: Settings, isModal: true },
              ].map(item => {
                const Icon = item.icon;
                const isActive = activeVendorTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setIsMobileSidebarOpen(false);
                      if (item.isModal) {
                        if (item.id === 'announcements') setShowAnnouncementsModal(true);
                        else if (item.id === 'payments') setShowPaymentsModal(true);
                        else if (item.id === 'reports') setShowReportsModal(true);
                        else if (item.id === 'settings') setShowSettingsModal(true);
                      } else {
                        setActiveVendorTab(item.id as typeof activeVendorTab);
                        if (item.id === 'orders') setViewingVendorOrderId(null);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-700/60 shadow-inner'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.count !== undefined && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Sidebar: Logout & Store View */}
          <div className="pt-4 border-t border-emerald-900/60 space-y-2">
            <button
              onClick={onTestInMobileStore}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-emerald-300 hover:text-white hover:bg-emerald-900/40 transition-colors cursor-pointer"
            >
              <span>Customer Storefront</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {isMobileSidebarOpen && (
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-30 md:hidden"
          />
        )}

        {/* Right Content Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#042417] text-slate-900 space-y-6">

      {/* Flash Notice */}
      {(vendorNotice || regSuccessNotice) && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border shadow-xs animate-in fade-in duration-200 ${
            (vendorNotice?.type === 'warning' || currentVendor.status === 'pending')
              ? 'bg-amber-50 text-amber-900 border-amber-200'
              : 'bg-emerald-50 text-emerald-900 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{vendorNotice?.type === 'warning' ? '⚠️' : '✅'}</span>
            <span>{vendorNotice?.text || regSuccessNotice}</span>
          </div>
          <button
            onClick={() => {
              setVendorNotice(null);
              setRegSuccessNotice(null);
            }}
            className="text-xs font-bold opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* =========================================================
          STATE 1: PENDING APPROVAL SCREEN
          ========================================================= */}
      {currentVendor.status === 'pending' && activeVendorTab !== 'flash_deals' && (
        <div className="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-amber-100 pb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 mb-1">
                Pending Administrator Approval
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Your Vendor Application is Under Review
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Thank you for applying to sell with Hospete Fresh! Our local operations team is reviewing your registered business details (<strong>{currentVendor.businessName}</strong>) and delivery coverage.
              </p>
            </div>
            {/* Quick Demo Action to approve directly */}
            <button
              onClick={handleQuickApproveSelf}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>⚡ Fast-Approve Account</span>
            </button>
          </div>

          {/* Flash Deals Pending Warning Banner */}
          {vendorFlashDeals.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <div className="font-extrabold text-amber-900 text-sm">
                    ⚠️ {vendorFlashDeals.length} Flash Deal{vendorFlashDeals.length > 1 ? 's' : ''} Blocked for Your Products
                  </div>
                  <div className="text-[11px] text-amber-800 mt-0.5">
                    Products like <strong>{vendorFlashDeals.map(d => products.find(p => p.id === d.productId)?.name).filter(Boolean).slice(0, 2).join(', ')}</strong> show <em>"Vendor is not approved or is suspended"</em> in customer storefront.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveVendorTab('flash_deals')}
                  className="px-3.5 py-2 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold rounded-xl shadow-2xs cursor-pointer"
                >
                  Review Deals &rarr;
                </button>
                <button
                  type="button"
                  onClick={handleQuickApproveSelf}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Approve Store & Flash Deals</span>
                </button>
              </div>
            </div>
          )}

          {/* Details submitted */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Owner Contact</span>
              <span className="font-extrabold text-slate-800 mt-0.5 block">{currentVendor.ownerName}</span>
              <span className="text-slate-500 text-[11px]">{currentVendor.phone}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Business Type</span>
              <span className="font-extrabold text-slate-800 mt-0.5 block capitalize">{currentVendor.businessType}</span>
              <span className="text-slate-500 text-[11px]">Local Hospete supplier</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Base Locality</span>
              <span className="font-extrabold text-slate-800 mt-0.5 block">{currentVendor.locality}</span>
              <span className="text-slate-500 text-[11px]">{currentVendor.serviceArea}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Approval SLA</span>
              <span className="font-extrabold text-amber-700 mt-0.5 block">Within 24 Hours</span>
              <span className="text-slate-500 text-[11px]">Next dispatch batch</span>
            </div>
          </div>

          {/* Additional Info Requested Notice */}
          {currentVendor.additionalInfoRequested && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs text-blue-900 space-y-2">
              <div className="flex items-center gap-1.5 font-bold uppercase text-[11px] text-blue-800">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Action Required: Administrator Requested Clarification</span>
              </div>
              <p className="font-medium text-slate-800">{currentVendor.additionalInfoRequested}</p>
              <div className="pt-1">
                <button
                  onClick={() => {
                    const reply = prompt('Enter your clarification / document note for the administrator:');
                    if (!reply) return;
                    setVendors(prev =>
                      prev.map(v =>
                        v.id === currentVendor.id
                          ? {
                              ...v,
                              additionalInfoRequested: undefined,
                              resubmissionStatus: 'resubmitted',
                              statusHistory: [
                                ...(v.statusHistory || []),
                                {
                                  id: `hist-${Date.now()}`,
                                  adminIdentifier: v.phone,
                                  previousStatus: 'pending',
                                  newStatus: 'pending',
                                  reason: `Vendor reply: ${reply}`,
                                  timestamp: new Date().toLocaleString()
                                }
                              ]
                            }
                          : v
                      )
                    );
                    setCurrentVendor(prev =>
                      prev
                        ? {
                            ...prev,
                            additionalInfoRequested: undefined,
                            resubmissionStatus: 'resubmitted'
                          }
                        : null
                    );
                    setVendorNotice({
                      text: 'Your response has been dispatched to the administrator.',
                      type: 'success'
                    });
                  }}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-2xs"
                >
                  Respond & Submit Clarification
                </button>
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span>
              🔒 <strong>Publishing Protected:</strong> You cannot publish products or take customer orders until approved by the admin team.
            </span>
          </div>
        </div>
      )}

      {/* =========================================================
          STATE 2: REJECTED SCREEN
          ========================================================= */}
      {currentVendor.status === 'rejected' && activeVendorTab !== 'flash_deals' && (
        <div className="bg-white rounded-2xl border border-rose-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 mb-1">
                Application Rejected
              </div>
              <h2 className="text-lg font-black text-slate-900">
                Application Requires Clarification
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Reason given by admin:{' '}
                <strong className="text-rose-700">
                  {currentVendor.rejectionReason || 'Document or trade permit missing. Please contact admin.'}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                const reply = prompt('Please enter your resubmission comments and confirm updated document details:');
                if (!reply) return;
                setVendors(prev =>
                  prev.map(v =>
                    v.id === currentVendor.id
                      ? {
                          ...v,
                          status: 'pending',
                          resubmissionStatus: 'resubmitted',
                          rejectionReason: undefined,
                          statusHistory: [
                            ...(v.statusHistory || []),
                            {
                              id: `hist-${Date.now()}`,
                              adminIdentifier: v.phone,
                              previousStatus: 'rejected',
                              newStatus: 'pending',
                              reason: `Vendor re-submission: ${reply}`,
                              timestamp: new Date().toLocaleString()
                            }
                          ]
                        }
                      : v
                  )
                );
                setCurrentVendor(prev =>
                  prev
                    ? {
                        ...prev,
                        status: 'pending',
                        resubmissionStatus: 'resubmitted',
                        rejectionReason: undefined
                      }
                    : null
                );
                setVendorNotice({
                  text: 'Application re-submitted for admin review.',
                  type: 'info'
                });
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Re-submit Application with Corrections
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          STATE 4: SUSPENDED SCREEN
          ========================================================= */}
      {currentVendor.status === 'suspended' && activeVendorTab !== 'flash_deals' && (
        <div className="bg-white rounded-2xl border border-rose-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-rose-100 pb-6">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 mb-1">
                Storefront Account Suspended
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Listings Temporarily Deactivated
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Your store has been paused by the Hospete Fresh administrator team for quality or document review.
              </p>
            </div>
          </div>

          <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-1.5">
            <div className="font-extrabold text-[11px] uppercase tracking-wide">Suspension Cause:</div>
            <div className="text-sm font-medium">{currentVendor.suspensionReason || 'Compliance audit in progress.'}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Customer Storefront</span>
              <span className="font-bold text-rose-700 mt-0.5 block">Listings Hidden</span>
              <span className="text-slate-500 text-[11px]">Customers cannot view or buy products</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Stock Updates</span>
              <span className="font-bold text-amber-700 mt-0.5 block">Locked</span>
              <span className="text-slate-500 text-[11px]">Live inventory editing paused</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Existing Orders</span>
              <span className="font-bold text-slate-800 mt-0.5 block">{vendorOrderItems.length} Placed</span>
              <span className="text-slate-500 text-[11px]">Existing orders remain valid for fulfillment</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            🔒 <strong>Audit in Progress:</strong> Please contact the marketplace team at{' '}
            <strong className="text-slate-900">superadmin@hospetegrocery.in</strong> or phone <strong>+91 98450 12345</strong> to submit corrective measures and request reactivation.
          </div>
        </div>
      )}

      {/* =========================================================
          STATE 3: APPROVED FULL DASHBOARD WORKSPACE OR FLASH DEALS
          ========================================================= */}
      {(currentVendor.status === 'approved' || activeVendorTab === 'flash_deals') && (
        <div className="space-y-6">
          {/* Sub Navigation Tabs when viewing screens other than Home Dashboard */}
          {activeVendorTab !== 'dashboard' && (
            <div className="flex flex-wrap items-center gap-2 pb-1">
              {[
                { id: 'dashboard', label: 'Vendor Dashboard', icon: LayoutDashboard },
                { id: 'flash_deals', label: 'Flash Deals', icon: Zap, count: vendorFlashDeals.length },
                { id: 'inventory', label: 'Product Variants & Stock Inventory', icon: Package, count: vendorVariants.length },
                { id: 'products', label: 'My Products Catalog', icon: Store, count: vendorProducts.length },
                { id: 'orders', label: 'Assigned Customer Orders', icon: ShoppingBag, count: vendorOrders.length },
                { id: 'profile', label: 'Store Profile', icon: Info }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveVendorTab(tab.id as typeof activeVendorTab);
                      if (tab.id === 'orders') setViewingVendorOrderId(null);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      activeVendorTab === tab.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-950/70 hover:bg-emerald-900 text-emerald-200 border border-emerald-800/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                          activeVendorTab === tab.id ? 'bg-white/20 text-white' : 'bg-emerald-900 text-emerald-300'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* =========================================================
              TAB 0: VENDOR DASHBOARD (HOME) — EXACT MATCH TO REFERENCE
              ========================================================= */}
          {activeVendorTab === 'dashboard' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 text-slate-800 shadow-xl border border-slate-100 space-y-6 max-w-6xl mx-auto animate-in fade-in duration-150">
              {/* Header inside White Card */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Welcome, {currentVendor.businessName}
                  </h2>
                  <p className="text-xs font-medium text-slate-400 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Today, 12 Oct 2026</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* ONLINE pill badge */}
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>ONLINE</span>
                  </span>

                  <button
                    onClick={onTestInMobileStore}
                    className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    title="Preview customer storefront"
                  >
                    <span>Store View</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Row 1: 4 Status Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status 1: New Orders */}
                <div
                  onClick={() => {
                    setSelectedVendorOrderTab('new');
                    setViewingVendorOrderId(null);
                    setActiveVendorTab('orders');
                  }}
                  className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-rose-400 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="text-xs font-bold text-slate-500">New Orders</div>
                  <div className="text-3xl font-black text-rose-600 mt-2 tracking-tight group-hover:scale-105 transition-transform origin-left">
                    {vendorOrderStatusCounts.new}
                  </div>
                </div>

                {/* Status 2: Preparing */}
                <div
                  onClick={() => {
                    setSelectedVendorOrderTab('preparing');
                    setViewingVendorOrderId(null);
                    setActiveVendorTab('orders');
                  }}
                  className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="text-xs font-bold text-slate-500">Preparing</div>
                  <div className="text-3xl font-black text-amber-500 mt-2 tracking-tight group-hover:scale-105 transition-transform origin-left">
                    {vendorOrderStatusCounts.preparing}
                  </div>
                </div>

                {/* Status 3: Ready for Pickup */}
                <div
                  onClick={() => {
                    setSelectedVendorOrderTab('ready_for_pickup');
                    setViewingVendorOrderId(null);
                    setActiveVendorTab('orders');
                  }}
                  className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-sky-400 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="text-xs font-bold text-slate-500">Ready for Pickup</div>
                  <div className="text-3xl font-black text-sky-500 mt-2 tracking-tight group-hover:scale-105 transition-transform origin-left">
                    {vendorOrderStatusCounts.ready_for_pickup}
                  </div>
                </div>

                {/* Status 4: Completed Today */}
                <div
                  onClick={() => {
                    setSelectedVendorOrderTab('delivered');
                    setViewingVendorOrderId(null);
                    setActiveVendorTab('orders');
                  }}
                  className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="text-xs font-bold text-slate-500">Completed Today</div>
                  <div className="text-3xl font-black text-emerald-600 mt-2 tracking-tight group-hover:scale-105 transition-transform origin-left">
                    {vendorOrderStatusCounts.delivered}
                  </div>
                </div>
              </div>

              {/* Row 2: Interactive Sales Analytics & Supporting Inventory Metrics */}
              <div className="space-y-5">
                <VendorSalesChart
                  orders={orders}
                  currentVendor={currentVendor}
                  onNavigateToOrder={(ordId) => {
                    setViewingVendorOrderId(ordId);
                    setActiveVendorTab('orders');
                  }}
                />

                {/* Supporting Inventory & Store Summary Mini Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Mini Card 1: Total Orders */}
                  <div
                    onClick={() => {
                      setSelectedVendorOrderTab('all');
                      setViewingVendorOrderId(null);
                      setActiveVendorTab('orders');
                    }}
                    className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all shadow-2xs cursor-pointer group"
                  >
                    <div className="text-xs font-bold text-slate-500">All-Time Store Orders</div>
                    <div className="text-2xl font-black text-slate-900 mt-2">
                      {vendorOrders.length}
                    </div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                      <span>View in Orders tab &rarr;</span>
                    </div>
                  </div>

                  {/* Mini Card 2: Items Sold */}
                  <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                    <div className="text-xs font-bold text-slate-500">Total Store Items Sold</div>
                    <div className="text-2xl font-black text-slate-900 mt-2">
                      {vendorItemsSoldCount}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Across all active listings</div>
                  </div>

                  {/* Mini Card 3: Avg Order Value */}
                  <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                    <div className="text-xs font-bold text-slate-500">All-Time Avg Order Value</div>
                    <div className="text-2xl font-black text-slate-900 mt-2">
                      ₹{avgOrderValue}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Attributable cart average</div>
                  </div>

                  {/* Mini Card 4: Low Stock Items */}
                  <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                    <div className="text-xs font-bold text-slate-500">Low Stock Variants</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-2xl font-black text-slate-900">
                        {lowStockVariantsCount}
                      </span>
                      <button
                        onClick={() => {
                          setInventoryStockFilter('low_stock');
                          setSelectedInventoryCategory('all');
                          setInventorySearchQuery('');
                          setInventoryPage(1);
                          setActiveVendorTab('inventory');
                        }}
                        className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-extrabold transition-colors cursor-pointer"
                        title="Filter inventory to low stock items"
                      >
                        View
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">&le; 5 units remaining</div>
                  </div>
                </div>
              </div>

              {/* Row 3: Recent Orders Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-black text-sm text-slate-900">Recent Orders</h3>
                  <button
                    onClick={() => {
                      setSelectedVendorOrderTab('all');
                      setViewingVendorOrderId(null);
                      setActiveVendorTab('orders');
                    }}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>View All Orders</span>
                    <span>&rarr;</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="p-3.5 pl-5">Order ID</th>
                        <th className="p-3.5">Customer</th>
                        <th className="p-3.5">Items</th>
                        <th className="p-3.5">Amount</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 pr-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentVendorOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="font-bold text-slate-700">No orders assigned yet</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Incoming customer orders will appear here in real time.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        recentVendorOrders.map(ord => {
                          const vendorItems = ord.items.filter(
                            it => it.vendorId === currentVendor.id || (!it.vendorId && currentVendor.id === 1)
                          );
                          const vendorAmount = vendorItems.reduce(
                            (sum, it) => sum + (it.subtotal || it.unitPrice * it.quantity),
                            0
                          );

                          // Soft pill badges matching reference image
                          let statusBadge = (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200">
                              New
                            </span>
                          );
                          if (ord.status === 'Preparing') {
                            statusBadge = (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
                                Preparing
                              </span>
                            );
                          } else if (ord.status === 'Ready for Pickup' || ord.status === 'Packed') {
                            statusBadge = (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                Ready
                              </span>
                            );
                          } else if (ord.status === 'Delivered' || ord.status === 'Picked Up') {
                            statusBadge = (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Completed
                              </span>
                            );
                          }

                          const customerDisplay = ord.locality ? `Customer • ${ord.locality}` : 'Verified Customer';

                          return (
                            <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="p-3.5 pl-5 font-mono font-bold text-slate-900">
                                #{ord.orderNumber}
                              </td>
                              <td className="p-3.5 font-medium text-slate-700">
                                {customerDisplay}
                              </td>
                              <td className="p-3.5 text-slate-600 font-medium">
                                {vendorItems.length} {vendorItems.length === 1 ? 'item' : 'items'}
                              </td>
                              <td className="p-3.5 font-bold text-slate-900">
                                ₹{vendorAmount > 0 ? vendorAmount : ord.totalAmount}
                              </td>
                              <td className="p-3.5">
                                {statusBadge}
                              </td>
                              <td className="p-3.5 pr-5 text-right">
                                <button
                                  onClick={() => {
                                    setViewingVendorOrderId(ord.id);
                                    setActiveVendorTab('orders');
                                  }}
                                  className="px-3.5 py-1 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Privacy Guard Notice */}
                <div className="p-3.5 bg-amber-50/60 border-t border-amber-100 text-[11px] text-amber-950 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>
                    🔒 <strong>Customer Privacy Guard:</strong> Customer phone numbers and full addresses are protected and hidden from the vendor dashboard. Only order items, quantities, area locality, and order status are visible.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: INVENTORY & STOCK (Exact Match to Visual Reference) */}
          {activeVendorTab === 'inventory' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-0">
              {/* Active Low Stock Banner (Requirement 3 & Image 4 reference) */}
              {inventoryStockFilter === 'low_stock' && (
                <div className="p-3.5 bg-amber-50 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2.5 text-xs text-amber-950">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚠️</span>
                    <span>
                      <strong>Low Stock Items Active:</strong> Showing variants at or below low-stock threshold (&le; 5 units). Total: <strong>{filteredVendorVariants.length} items</strong>.
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setInventoryStockFilter('all');
                      setInventoryPage(1);
                    }}
                    className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Clear Filter / Show All ({vendorVariants.length})</span>
                  </button>
                </div>
              )}

              {/* Toolbar */}
              <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3">
                <div className="flex items-center gap-2.5 flex-wrap flex-1 min-w-[280px]">
                  <h2 className="font-black text-sm sm:text-base text-slate-900">
                    Product Variants & Stock Inventory
                  </h2>
                  <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                    {filteredVendorVariants.length} of {vendorVariants.length} variants
                  </span>

                  {/* Category filter for Inventory */}
                  <div className="relative">
                    <select
                      value={selectedInventoryCategory}
                      onChange={e => {
                        setSelectedInventoryCategory(e.target.value);
                        setInventoryPage(1);
                      }}
                      className="h-8 px-2.5 pr-7 text-xs font-bold text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none cursor-pointer appearance-none"
                    >
                      <option value="all">📁 All Categories ({vendorVariants.length})</option>
                      {sortedCategories.map(c => (
                        <option key={c.id} value={c.slug}>
                          {c.iconEmoji} {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>

                  {/* Stock Status Filter */}
                  <div className="relative">
                    <select
                      value={inventoryStockFilter}
                      onChange={e => {
                        setInventoryStockFilter(e.target.value as any);
                        setInventoryPage(1);
                      }}
                      className="h-8 px-2.5 pr-7 text-xs font-bold text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none cursor-pointer appearance-none"
                    >
                      <option value="all">📦 All Stock Status</option>
                      <option value="low_stock">⚠️ Low Stock (&le; 5 units)</option>
                      <option value="out_of_stock">❌ Out of Stock (0 units)</option>
                      <option value="in_stock">✅ In Stock (&gt; 5 units)</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>

                  {/* Search in Inventory */}
                  <div className="relative flex-1 min-w-[160px] max-w-xs">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={inventorySearchQuery}
                      onChange={e => {
                        setInventorySearchQuery(e.target.value);
                        setInventoryPage(1);
                      }}
                      placeholder="Search inventory..."
                      className="w-full h-8 pl-8 pr-7 text-xs font-medium text-slate-900 bg-white border border-slate-200 rounded-lg focus:border-emerald-500 outline-none"
                    />
                    {inventorySearchQuery && (
                      <button
                        onClick={() => {
                          setInventorySearchQuery('');
                          setInventoryPage(1);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={openAddProductModal}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Product</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200 tracking-wider">
                    <tr>
                      <th className="p-3 sm:p-4 min-w-[200px]">Product Name</th>
                      <th className="p-3 sm:p-4 min-w-[130px]">Brand</th>
                      <th className="p-3 sm:p-4 min-w-[120px]">Pack Size</th>
                      <th className="p-3 sm:p-4 min-w-[110px]">Selling Price</th>
                      <th className="p-3 sm:p-4 min-w-[100px]">MRP</th>
                      <th className="p-3 sm:p-4 min-w-[130px]">Stock Units</th>
                      <th className="p-3 sm:p-4 text-right pr-6 min-w-[140px]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedVendorVariants.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          {inventoryStockFilter === 'low_stock'
                            ? 'No products currently at low stock (all items have > 5 units).'
                            : selectedInventoryCategory !== 'all'
                            ? `No variants found under category '${selectedInventoryCategory}'.`
                            : `No products found matching your search. Click "Add New Product" to list an item.`}
                        </td>
                      </tr>
                    ) : (
                      paginatedVendorVariants.map(v => (
                        <tr
                          key={v.id}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            v.stockQty <= 0 ? 'bg-rose-50/30' : ''
                          }`}
                        >
                          <td className="p-3 sm:p-4 font-bold text-slate-900">{v.product.name}</td>
                          <td className="p-3 sm:p-4 text-slate-500 font-medium">{v.product.brand}</td>
                          <td className="p-3 sm:p-4 font-bold text-slate-800">{v.packSize}</td>
                          <td className="p-3 sm:p-4 font-black text-emerald-700 text-sm">₹{v.price}</td>
                          <td className="p-3 sm:p-4 text-slate-400 line-through">₹{v.mrp}</td>
                          <td className="p-3 sm:p-4">
                            {v.stockQty <= 0 ? (
                              <span className="text-rose-700 font-bold bg-rose-100/80 border border-rose-200 px-2 py-0.5 rounded text-[11px] inline-block">
                                0 (Out of Stock)
                              </span>
                            ) : v.stockQty <= 5 ? (
                              <span className="text-amber-700 font-bold bg-amber-100/80 border border-amber-200 px-2 py-0.5 rounded text-[11px] inline-block">
                                {v.stockQty} (Low Stock)
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-bold text-xs">
                                {v.stockQty} in stock
                              </span>
                            )}
                          </td>
                          <td className="p-3 sm:p-4 text-right pr-6">
                            <button
                              onClick={() => {
                                if (isAdminPreview && adminSafeMode) {
                                  setVendorNotice({
                                    text: 'Stock update prevented: Admin preview is in Safe Simulation Mode. Live inventory modifications are guarded.',
                                    type: 'warning'
                                  });
                                  return;
                                }

                                const newStock = v.stockQty > 0 ? 0 : 50;
                                setProducts(prev =>
                                  prev.map(prod =>
                                    prod.id === v.product.id
                                      ? {
                                          ...prod,
                                          variants: prod.variants.map(vari =>
                                            vari.id === v.id
                                              ? { ...vari, stockQty: newStock }
                                              : vari
                                          )
                                        }
                                      : prod
                                  )
                                );
                                setVendorNotice({
                                  text:
                                    newStock === 0
                                      ? `'${v.product.name} (${v.packSize})' marked Out of Stock. Customer ordering is disabled.`
                                      : `'${v.product.name} (${v.packSize})' restocked with 50 units. Customers can now order.`,
                                  type: newStock === 0 ? 'warning' : 'success'
                                });
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs active:scale-95 whitespace-nowrap cursor-pointer ${
                                v.stockQty > 0
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {v.stockQty > 0 ? 'Set Out of Stock' : 'Restock 50'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls matching Image 7 */}
              <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/70 text-xs">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-slate-600 font-semibold">
                    Showing <strong className="text-slate-900">{filteredVendorVariants.length > 0 ? inventoryStartIdx + 1 : 0}–{Math.min(inventoryStartIdx + inventoryPageSize, filteredVendorVariants.length)}</strong> of <strong className="text-slate-900">{filteredVendorVariants.length}</strong> items
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span>Show</span>
                    <select
                      value={inventoryPageSize}
                      onChange={e => {
                        setInventoryPageSize(Number(e.target.value));
                        setInventoryPage(1);
                      }}
                      className="h-8 px-2 py-0.5 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-lg outline-none cursor-pointer"
                    >
                      <option value={10}>10 per page</option>
                      <option value={15}>15 per page</option>
                      <option value={20}>20 per page</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setInventoryPage(p => Math.max(1, p - 1))}
                    disabled={validInventoryPage <= 1}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                      validInventoryPage <= 1
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-2xs cursor-pointer'
                    }`}
                  >
                    &larr; Previous
                  </button>

                  {Array.from({ length: totalInventoryPages }, (_, i) => i + 1).map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => setInventoryPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        pageNum === validInventoryPage
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    onClick={() => setInventoryPage(p => Math.min(totalInventoryPages, p + 1))}
                    disabled={validInventoryPage >= totalInventoryPages}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                      validInventoryPage >= totalInventoryPages
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-2xs cursor-pointer'
                    }`}
                  >
                    Next &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY PRODUCTS CATALOG */}
          {activeVendorTab === 'products' && (
            <div className="space-y-5">
              {/* Header with Title and Add Button (High contrast against dark green background) */}
              <div className="flex flex-wrap justify-between items-center gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    My Products Catalog
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Products managed and supplied by <strong className="text-white">{currentVendor.businessName}</strong>. Filter by category, search by name or brand.
                  </p>
                </div>
                <button
                  onClick={openAddProductModal}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Product Listing</span>
                </button>
              </div>

              {/* Category Filter & Search Toolbar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                {/* Top Row: Search Input + Category Dropdown + Status Selector */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-1 min-w-[260px] flex-wrap sm:flex-nowrap">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[180px]">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={catalogSearchQuery}
                        onChange={e => {
                          setCatalogSearchQuery(e.target.value);
                          setCatalogPage(1);
                        }}
                        placeholder="Search by product name, brand, or SKU..."
                        className="w-full h-9 pl-9 pr-8 text-xs font-medium text-slate-900 bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all placeholder:text-slate-400"
                      />
                      {catalogSearchQuery && (
                        <button
                          onClick={() => {
                            setCatalogSearchQuery('');
                            setCatalogPage(1);
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          title="Clear search"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Category Dropdown Option */}
                    <div className="relative shrink-0">
                      <select
                        value={selectedCatalogCategory}
                        onChange={e => {
                          setSelectedCatalogCategory(e.target.value);
                          setCatalogPage(1);
                        }}
                        className="h-9 px-3 pr-8 text-xs font-bold text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none cursor-pointer appearance-none transition-all"
                      >
                        <option value="all">📁 All Categories ({vendorProducts.length})</option>
                        {sortedCategories.map(cat => {
                          const count = vendorCategoryCounts[cat.slug] || 0;
                          return (
                            <option key={cat.id} value={cat.slug}>
                              {cat.iconEmoji} {cat.name} ({count})
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Moderation Status Filter */}
                    <div className="relative shrink-0 hidden md:block">
                      <select
                        value={catalogStatusFilter}
                        onChange={e => {
                          setCatalogStatusFilter(e.target.value as any);
                          setCatalogPage(1);
                        }}
                        className="h-9 px-3 pr-8 text-xs font-bold text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none cursor-pointer appearance-none transition-all"
                      >
                        <option value="all">All Status</option>
                        <option value="approved">Approved / Live</option>
                        <option value="pending">Pending Approval</option>
                        <option value="needs_correction">Needs Image Correction</option>
                        <option value="out_of_stock">Out of Stock</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Reset Filter Button */}
                  {(selectedCatalogCategory !== 'all' || catalogSearchQuery || catalogStatusFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSelectedCatalogCategory('all');
                        setCatalogSearchQuery('');
                        setCatalogStatusFilter('all');
                        setCatalogPage(1);
                      }}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-200 flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Filters</span>
                    </button>
                  )}
                </div>

                {/* Quick Category Option Pills / Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1 select-none">
                    <Filter className="w-3 h-3 text-emerald-600" />
                    <span>Filter:</span>
                  </span>

                  <button
                    onClick={() => {
                      setSelectedCatalogCategory('all');
                      setCatalogPage(1);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCatalogCategory === 'all'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    All ({vendorProducts.length})
                  </button>

                  {sortedCategories.map(cat => {
                    const count = vendorCategoryCounts[cat.slug] || 0;
                    const isSelected = selectedCatalogCategory === cat.slug;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCatalogCategory(cat.slug);
                          setCatalogPage(1);
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : count > 0
                            ? 'bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-400 opacity-60'
                        }`}
                      >
                        <span>{cat.iconEmoji}</span>
                        <span>{cat.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : count > 0
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status & Results Summary Header (High contrast against dark green background) */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-200 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 shadow-2xs">
                    Showing <strong className="text-white">{filteredCatalogProducts.length > 0 ? catalogStartIdx + 1 : 0}–{Math.min(catalogStartIdx + catalogPageSize, filteredCatalogProducts.length)}</strong> of <strong className="text-white">{filteredCatalogProducts.length}</strong> products
                  </span>
                  {selectedCatalogCategory !== 'all' && (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-900/60 border border-emerald-700/60 text-emerald-200 text-xs font-bold px-2.5 py-1 rounded-full">
                      <span>Category: {categories.find(c => c.slug === selectedCatalogCategory)?.name || selectedCatalogCategory}</span>
                      <button
                        onClick={() => {
                          setSelectedCatalogCategory('all');
                          setCatalogPage(1);
                        }}
                        className="hover:text-white font-black cursor-pointer text-sm leading-none"
                        title="Remove category filter"
                      >
                        &times;
                      </button>
                    </span>
                  )}
                  {catalogSearchQuery && (
                    <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-slate-200 text-xs font-bold px-2.5 py-1 rounded-full">
                      <span>Query: "{catalogSearchQuery}"</span>
                      <button
                        onClick={() => {
                          setCatalogSearchQuery('');
                          setCatalogPage(1);
                        }}
                        className="hover:text-white font-black cursor-pointer text-sm leading-none"
                      >
                        &times;
                      </button>
                    </span>
                  )}
                </div>
              </div>

              {/* Product Cards Grid or Empty State */}
              {paginatedCatalogProducts.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-xs space-y-3">
                  <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-xl">
                    🔍
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">No products match your filter</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {selectedCatalogCategory !== 'all'
                      ? `No products found under "${categories.find(c => c.slug === selectedCatalogCategory)?.name || selectedCatalogCategory}" category for your store.`
                      : 'Try clearing the search query or status filters.'}
                  </p>
                  <div className="flex justify-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setSelectedCatalogCategory('all');
                        setCatalogSearchQuery('');
                        setCatalogStatusFilter('all');
                        setCatalogPage(1);
                      }}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Show All Categories
                    </button>
                    <button
                      onClick={openAddProductModal}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      + Add New Product
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedCatalogProducts.map(p => {
                    const catObj = categories.find(c => c.slug === p.categorySlug);
                    return (
                      <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex gap-3">
                            <div className="relative shrink-0">
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-16 h-16 object-cover rounded-xl border border-slate-100 bg-slate-50"
                              />
                              {p.additionalImages && p.additionalImages.length > 0 && (
                                <span className="absolute -bottom-1 -right-1 bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-2xs">
                                  +{p.additionalImages.length}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <button
                                  onClick={() => {
                                    setSelectedCatalogCategory(p.categorySlug);
                                    setCatalogPage(1);
                                  }}
                                  className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded cursor-pointer uppercase tracking-wide truncate max-w-[120px]"
                                  title={`Filter by category ${catObj?.name || p.categorySlug}`}
                                >
                                  {catObj?.iconEmoji || '🏷️'} {catObj?.name || p.categorySlug}
                                </button>
                                {/* Image review status badge */}
                                {p.imageReviewStatus === 'approved' ? (
                                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold px-1.5 py-0.2 rounded shrink-0">
                                    Approved ✓
                                  </span>
                                ) : p.imageReviewStatus === 'needs_correction' ? (
                                  <span className="bg-rose-50 text-rose-800 border border-rose-300 text-[10px] font-extrabold px-1.5 py-0.2 rounded animate-pulse shrink-0">
                                    Needs Fix ⚠️
                                  </span>
                                ) : (
                                  <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-extrabold px-1.5 py-0.2 rounded shrink-0">
                                    Reviewing ⏳
                                  </span>
                                )}
                              </div>
                              <h3 className="font-extrabold text-sm text-slate-900 truncate" title={p.name}>{p.name}</h3>
                              <p className="text-xs text-slate-500">{p.brand} {p.sku ? `· SKU: ${p.sku}` : ''}</p>
                              {p.imageReplacedByAdmin && (
                                <span className="inline-block mt-0.5 text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                  Admin Replaced Photo
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Admin Image Correction Request Banner */}
                          {p.imageReviewStatus === 'needs_correction' && p.imageCorrectionReason && (
                            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs space-y-2">
                              <div className="font-extrabold text-rose-900 flex items-center gap-1.5 text-[11px] uppercase">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>Action Required: Image Correction</span>
                              </div>
                              <p className="text-rose-800 font-medium text-[11px] leading-relaxed">
                                "{p.imageCorrectionReason}"
                              </p>
                              <button
                                onClick={() => openEditProductModal(p)}
                                className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-98"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Upload Corrected Image & Resubmit</span>
                              </button>
                            </div>
                          )}

                          <div className="bg-slate-50 rounded-xl p-2.5 text-xs space-y-1">
                            <div className="font-bold text-slate-700 text-[11px]">Variants:</div>
                            {p.variants.map(v => (
                              <div key={v.id} className="flex justify-between text-slate-600">
                                <span>{v.packSize}</span>
                                <span className="font-black text-emerald-700">₹{v.price} ({v.stockQty} in stock)</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <button
                            onClick={() => {
                              setSelectedCatalogCategory(p.categorySlug);
                              setCatalogPage(1);
                            }}
                            className="text-[11px] font-semibold text-slate-500 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                          >
                            <span>Filter category</span>
                            <ChevronDown className="w-3 h-3 -rotate-90" />
                          </button>
                          <button
                            onClick={() => openEditProductModal(p)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Product</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination Controls for Product Catalog matching Image 7 */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-slate-600 font-semibold">
                    Showing <strong className="text-slate-900">{filteredCatalogProducts.length > 0 ? catalogStartIdx + 1 : 0}–{Math.min(catalogStartIdx + catalogPageSize, filteredCatalogProducts.length)}</strong> of <strong className="text-slate-900">{filteredCatalogProducts.length}</strong> products
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span>Show</span>
                    <select
                      value={catalogPageSize}
                      onChange={e => {
                        setCatalogPageSize(Number(e.target.value));
                        setCatalogPage(1);
                      }}
                      className="h-8 px-2 py-0.5 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-lg outline-none cursor-pointer"
                    >
                      <option value={10}>10 per page</option>
                      <option value={15}>15 per page</option>
                      <option value={20}>20 per page</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCatalogPage(p => Math.max(1, p - 1))}
                    disabled={validCatalogPage <= 1}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                      validCatalogPage <= 1
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-2xs cursor-pointer'
                    }`}
                  >
                    &larr; Previous
                  </button>

                  {Array.from({ length: totalCatalogPages }, (_, i) => i + 1).map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => setCatalogPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        pageNum === validCatalogPage
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    onClick={() => setCatalogPage(p => Math.min(totalCatalogPages, p + 1))}
                    disabled={validCatalogPage >= totalCatalogPages}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                      validCatalogPage >= totalCatalogPages
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-2xs cursor-pointer'
                    }`}
                  >
                    Next &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ASSIGNED CUSTOMER ORDERS (Matching Panels 1, 2, 3, 4, 5) */}
          {activeVendorTab === 'orders' && (
            <div className="space-y-6">
              {viewingVendorOrder ? (
                /* =========================================================================
                   PANELS 2, 3, 4: VENDOR ORDER DETAILS VIEW
                   ========================================================================= */
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-6 p-5 sm:p-6">
                  {/* Top Header: Back to Orders & Print */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <button
                      onClick={() => setViewingVendorOrderId(null)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" />
                      <span>Back to Orders</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowFlowGuideModal(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Order Flow Guide</span>
                      </button>
                      <button
                        onClick={() => handlePrintSlip(viewingVendorOrder)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl shadow-2xs transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        <span>Print</span>
                      </button>
                    </div>
                  </div>

                  {/* Order Title & Status Banner */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="font-black text-xl text-slate-900">
                        Order Details - #{viewingVendorOrder.orderNumber}
                      </h2>
                      <span
                        className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase ${
                          viewingVendorOrder.status === 'New' || viewingVendorOrder.status === 'Placed'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : viewingVendorOrder.status === 'Accepted'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : viewingVendorOrder.status === 'Preparing'
                            ? 'bg-orange-100 text-orange-800 border border-orange-200'
                            : viewingVendorOrder.status === 'Ready for Pickup' || viewingVendorOrder.status === 'Packed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : viewingVendorOrder.status === 'Picked Up'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : viewingVendorOrder.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {viewingVendorOrder.status === 'New' || viewingVendorOrder.status === 'Placed'
                          ? 'New Order'
                          : viewingVendorOrder.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Placed on {viewingVendorOrder.createdAt || viewingVendorOrder.orderedAt || '12 Oct 2026, 10:15 AM'} · Locality Area:{' '}
                      <strong className="text-slate-800">{viewingVendorOrder.locality}</strong>
                    </p>
                  </div>

                  {/* Rejection notice if cancelled */}
                  {viewingVendorOrder.status === 'Cancelled' && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-1">
                      <div className="font-extrabold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        <span>Order Rejected / Cancelled</span>
                      </div>
                      <p>Reason: {viewingVendorOrder.vendorRejectionReason || 'Declined by vendor due to stock unavailability.'}</p>
                    </div>
                  )}

                  {/* Order Items Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-sm text-slate-900">
                        Order Items ({viewingVendorOrder.items.length})
                      </h3>
                      {viewingVendorOrder.status === 'Preparing' && (
                        <span className="text-xs font-bold text-slate-500">
                          {viewingVendorOrder.items.filter((_, idx) => vendorPackingChecklist[`${viewingVendorOrder.id}-${idx}`]).length} of {viewingVendorOrder.items.length} Packed
                        </span>
                      )}
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                          <tr>
                            {viewingVendorOrder.status === 'Preparing' && (
                              <th className="p-3 pl-4 w-12 text-center">Verify</th>
                            )}
                            <th className="p-3 pl-4">Item</th>
                            <th className="p-3">Variant / Pack</th>
                            <th className="p-3 text-center">Qty</th>
                            <th className="p-3 text-right">Unit Price</th>
                            <th className="p-3 pr-4 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {viewingVendorOrder.items.map((item, idx) => {
                            const isPacked = !!vendorPackingChecklist[`${viewingVendorOrder.id}-${idx}`];
                            return (
                              <tr
                                key={idx}
                                className={`hover:bg-slate-50/70 transition-colors ${
                                  isPacked ? 'bg-emerald-50/40' : ''
                                }`}
                              >
                                {viewingVendorOrder.status === 'Preparing' && (
                                  <td className="p-3 pl-4 text-center">
                                    <input
                                      type="checkbox"
                                      checked={isPacked}
                                      onChange={() => toggleVendorPackingItem(viewingVendorOrder.id, idx)}
                                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                      title="Check when packed in basket"
                                    />
                                  </td>
                                )}

                                <td className="p-3 pl-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                      <img
                                        src={item.imageUrl || (item.productName.toLowerCase().includes('coriander') ? '/images/cat_veggies.jpg' : '/images/tomatoes.jpg')}
                                        alt={item.productName}
                                        className="w-full h-full object-cover"
                                        onError={e => {
                                          (e.target as HTMLElement).style.display = 'none';
                                        }}
                                      />
                                    </div>
                                    <div className="font-extrabold text-slate-900 text-xs">
                                      {item.productName}
                                    </div>
                                  </div>
                                </td>

                                <td className="p-3 text-slate-600 font-medium">
                                  {item.packSize}
                                </td>

                                <td className="p-3 text-center font-bold text-slate-800">
                                  {item.quantity}
                                </td>

                                <td className="p-3 text-right text-slate-600 font-medium tabular-nums">
                                  ₹{item.unitPrice}
                                </td>

                                <td className="p-3 pr-4 text-right font-black text-slate-900 tabular-nums">
                                  ₹{item.subtotal}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Summary Figures: Subtotal, Delivery Fee, Total Amount */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-1.5 max-w-sm ml-auto text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span className="font-bold tabular-nums">₹{viewingVendorOrder.totalAmount}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Delivery Fee</span>
                      <span className="font-bold text-emerald-700">₹0 (Free)</span>
                    </div>
                    <div className="flex justify-between text-slate-900 text-sm font-black pt-2 border-t border-slate-200">
                      <span>Total Amount</span>
                      <span className="text-emerald-700 font-black tabular-nums">₹{viewingVendorOrder.totalAmount}</span>
                    </div>
                  </div>

                  {/* Privacy Notice Box (Amber background with lock icon matching Image Panel 2 & 5) */}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 px-4 text-xs text-amber-950 flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <strong>Privacy Protection Active:</strong> Customer details like name, phone number, and street address are hidden from vendor. Only order items, pack sizes, ordered quantity, amount, and order status are visible.
                    </div>
                  </div>

                  {/* =========================================================
                      STAGE-SPECIFIC ACTIONS (Panels 2, 3, 4)
                      ========================================================= */}

                  {/* PANEL 2: NEW ORDER ACTIONS (Accept Order & Reject Order) */}
                  {(viewingVendorOrder.status === 'New' || viewingVendorOrder.status === 'Placed') && (
                    <div className="pt-2 flex flex-wrap gap-3 justify-end items-center">
                      <button
                        type="button"
                        onClick={() => {
                          setRejectOrderModalOrder(viewingVendorOrder);
                          setRejectOrderReasonInput('');
                        }}
                        className="px-6 py-2.5 rounded-xl border border-rose-300 hover:bg-rose-50 text-rose-700 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                      >
                        Reject Order
                      </button>

                      <button
                        type="button"
                        onClick={() => handleVendorAcceptOrder(viewingVendorOrder)}
                        className="px-8 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-xs active:scale-98 cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Accept Order</span>
                      </button>
                    </div>
                  )}

                  {/* ACCEPTED: BUTTON TO START PREPARING */}
                  {viewingVendorOrder.status === 'Accepted' && (
                    <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 flex flex-wrap justify-between items-center gap-3">
                      <div>
                        <div className="font-extrabold text-blue-900 text-sm">
                          Order Accepted by Store
                        </div>
                        <p className="text-xs text-blue-700 mt-0.5">
                          When you begin picking and packing the grocery items, update status to Preparing.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleVendorStartPreparing(viewingVendorOrder)}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition-all shadow-xs active:scale-98 cursor-pointer"
                      >
                        Start Preparing Order &rarr;
                      </button>
                    </div>
                  )}

                  {/* PANEL 3: PREPARING STAGE - STEPPER, CHECKLIST INSTRUCTION, & MARK READY FOR PICKUP */}
                  {viewingVendorOrder.status === 'Preparing' && (
                    <div className="space-y-4 pt-2">
                      {/* Update Order Status Stepper */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                        <div className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                          Update Order Status
                        </div>
                        <div className="flex items-center justify-between max-w-xl mx-auto px-2">
                          {[
                            { id: 'New', label: 'New', done: true },
                            { id: 'Accepted', label: 'Accepted', done: true },
                            { id: 'Preparing', label: 'Preparing', active: true },
                            { id: 'Ready for Pickup', label: 'Ready for Pickup' },
                            { id: 'Picked Up', label: 'Picked Up' },
                            { id: 'Delivered', label: 'Delivered' }
                          ].map((step, idx) => (
                            <React.Fragment key={idx}>
                              <div className="flex flex-col items-center">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                                    step.done
                                      ? 'bg-emerald-600 text-white'
                                      : step.active
                                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                                      : 'bg-slate-200 text-slate-500'
                                  }`}
                                >
                                  {step.done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                                </div>
                                <span className={`text-[10px] mt-1 font-bold ${step.active ? 'text-blue-700' : 'text-slate-500'}`}>
                                  {step.label}
                                </span>
                              </div>
                              {idx < 5 && (
                                <div
                                  className={`h-0.5 flex-1 mx-2 mb-4 ${
                                    step.done ? 'bg-emerald-500' : 'bg-slate-200'
                                  }`}
                                />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>

                      {/* Instruction Note Box */}
                      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center gap-2 text-xs text-blue-900">
                        <Edit3 className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>
                          Items are being packed. Please ensure all items are fresh and correctly packed before checking off above.
                        </span>
                      </div>

                      {/* Mark as Ready for Pickup Button */}
                      <button
                        type="button"
                        onClick={() => handleVendorMarkReadyForPickup(viewingVendorOrder)}
                        disabled={!areAllVendorPackingItemsChecked(viewingVendorOrder)}
                        className={`w-full py-3 rounded-2xl text-xs font-black shadow-xs transition-all flex items-center justify-center gap-2 ${
                          areAllVendorPackingItemsChecked(viewingVendorOrder)
                            ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-98'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <Package className="w-4 h-4" />
                        <span>Mark as Ready for Pickup</span>
                        {!areAllVendorPackingItemsChecked(viewingVendorOrder) && (
                          <span className="text-[10px] font-normal opacity-80">(Complete checklist above first)</span>
                        )}
                      </button>
                    </div>
                  )}

                  {/* PANEL 4: READY FOR PICKUP STAGE */}
                  {(viewingVendorOrder.status === 'Ready for Pickup' || viewingVendorOrder.status === 'Packed') && (
                    <div className="space-y-4 pt-2">
                      {/* Progress Stepper showing Ready for Pickup reached */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                        <div className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                          Update Order Status
                        </div>
                        <div className="flex items-center justify-between max-w-xl mx-auto px-2">
                          {[
                            { id: 'New', label: 'New', done: true },
                            { id: 'Accepted', label: 'Accepted', done: true },
                            { id: 'Preparing', label: 'Preparing', done: true },
                            { id: 'Ready for Pickup', label: 'Ready for Pickup', active: true },
                            { id: 'Picked Up', label: 'Picked Up' },
                            { id: 'Delivered', label: 'Delivered' }
                          ].map((step, idx) => (
                            <React.Fragment key={idx}>
                              <div className="flex flex-col items-center">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                                    step.done
                                      ? 'bg-emerald-600 text-white'
                                      : step.active
                                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                                      : 'bg-slate-200 text-slate-500'
                                  }`}
                                >
                                  {step.done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                                </div>
                                <span className={`text-[10px] mt-1 font-bold ${step.active ? 'text-blue-700' : 'text-slate-500'}`}>
                                  {step.label}
                                </span>
                              </div>
                              {idx < 5 && (
                                <div
                                  className={`h-0.5 flex-1 mx-2 mb-4 ${
                                    step.done ? 'bg-emerald-500' : 'bg-slate-200'
                                  }`}
                                />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>

                      {/* Confirmation Banner */}
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-950">
                        <div className="flex items-center gap-2.5">
                          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div>
                            <div className="font-black text-emerald-900">
                              Order is ready for pickup.
                            </div>
                            <div className="text-emerald-800 text-[11px] mt-0.5">
                              Admin will now assign a delivery partner. Please keep the order safely packed and ready.
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled
                          className="px-4 py-2 bg-white border border-emerald-300 text-emerald-800 font-bold rounded-xl text-xs cursor-default shadow-2xs opacity-90"
                        >
                          Update (Already Ready)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STAGES 5 & 6: PICKED UP OR DELIVERED */}
                  {(viewingVendorOrder.status === 'Picked Up' || viewingVendorOrder.status === 'Delivered') && (
                    <div className="p-5 bg-purple-50 border border-purple-200 rounded-2xl flex items-center gap-3 text-xs text-purple-950">
                      <Bike className="w-6 h-6 text-purple-600 shrink-0" />
                      <div>
                        <div className="font-black text-purple-900">
                          {viewingVendorOrder.status === 'Delivered'
                            ? 'Order Successfully Delivered to Customer'
                            : 'Order Picked Up by Delivery Partner'}
                        </div>
                        <div className="text-purple-800 text-[11px] mt-0.5">
                          Assigned Rider:{' '}
                          <strong>{viewingVendorOrder.assignedDeliveryBoy || 'Ravi (DLV-001)'}</strong>. Thank you for fulfilling this Hospete Fresh grocery order!
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* =========================================================================
                   PANEL 1: VENDOR ASSIGNED CUSTOMER ORDERS (ORDER LIST)
                   ========================================================================= */
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-4">
                  {/* Top Bar Header */}
                  <div className="p-4 sm:p-5 border-b border-slate-200 space-y-4">
                    <div className="flex flex-wrap justify-between items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-black text-base sm:text-lg text-slate-900">
                            Assigned Customer Orders
                          </h2>
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            {vendorOrders.length}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Accept, prepare and mark orders ready for pickup.
                        </p>
                      </div>

                      {/* Date & Status Selectors matching Panel 1 */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setShowFlowGuideModal(true)}
                          className="px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Status Flow Guide</span>
                        </button>

                        <div className="relative">
                          <select
                            value={vendorOrderDateFilter}
                            onChange={e => {
                              setVendorOrderDateFilter(e.target.value);
                              setVendorOrderPage(1);
                            }}
                            className="h-8 px-2.5 pr-7 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg outline-none cursor-pointer appearance-none"
                          >
                            <option value="12 Oct 2026">📅 12 Oct 2026</option>
                            <option value="All Dates">All Dates</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>

                        <div className="relative">
                          <select
                            value={vendorOrderStatusDropdown}
                            onChange={e => {
                              setVendorOrderStatusDropdown(e.target.value);
                              setVendorOrderPage(1);
                            }}
                            className="h-8 px-2.5 pr-7 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg outline-none cursor-pointer appearance-none"
                          >
                            <option value="all">All Status</option>
                            <option value="new">New</option>
                            <option value="accepted">Accepted</option>
                            <option value="preparing">Preparing</option>
                            <option value="ready_for_pickup">Ready for Pickup</option>
                            <option value="picked_up">Picked Up</option>
                            <option value="delivered">Delivered</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Filter Pills matching Panel 1: All (9) | New (2) | Accepted (2) | Preparing (2) | Ready for Pickup (3) | Picked Up (0) | Delivered (0) | Cancelled (0) */}
                    <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs font-extrabold">
                      {[
                        { id: 'all', label: 'All', count: vendorOrderStatusCounts.all },
                        { id: 'new', label: 'New', count: vendorOrderStatusCounts.new },
                        { id: 'accepted', label: 'Accepted', count: vendorOrderStatusCounts.accepted },
                        { id: 'preparing', label: 'Preparing', count: vendorOrderStatusCounts.preparing },
                        { id: 'ready_for_pickup', label: 'Ready for Pickup', count: vendorOrderStatusCounts.ready_for_pickup },
                        { id: 'picked_up', label: 'Picked Up', count: vendorOrderStatusCounts.picked_up },
                        { id: 'delivered', label: 'Delivered', count: vendorOrderStatusCounts.delivered },
                        { id: 'cancelled', label: 'Cancelled', count: vendorOrderStatusCounts.cancelled }
                      ].map(pill => (
                        <button
                          key={pill.id}
                          onClick={() => {
                            setSelectedVendorOrderTab(pill.id as typeof selectedVendorOrderTab);
                            setVendorOrderPage(1);
                          }}
                          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                            selectedVendorOrderTab === pill.id
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 bg-transparent'
                          }`}
                        >
                          <span>{pill.label}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                              selectedVendorOrderTab === pill.id
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {pill.count}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Search by Order ID or items */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={vendorOrderSearch}
                        onChange={e => {
                          setVendorOrderSearch(e.target.value);
                          setVendorOrderPage(1);
                        }}
                        placeholder="Search by Order ID or items..."
                        className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Orders Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="p-3.5 pl-5">Order ID</th>
                          <th className="p-3.5">Area / Location</th>
                          <th className="p-3.5 min-w-[220px]">Items</th>
                          <th className="p-3.5">Amount</th>
                          <th className="p-3.5">Order Time</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5 pr-5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredVendorOrders.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-10 text-center text-slate-400 text-xs">
                              No orders found for the selected filter.
                            </td>
                          </tr>
                        ) : (
                          paginatedVendorOrders.map(ord => {
                            const firstItem = ord.items[0];
                            const moreCount = ord.items.length - 1;
                            const itemSummary = firstItem
                              ? `${firstItem.quantity}x ${firstItem.productName.split(' ')[0]} (${firstItem.packSize})${
                                  moreCount > 0 ? ` + ${moreCount} more` : ''
                                }`
                              : `${ord.items.length} items`;

                            return (
                              <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="p-3.5 pl-5 font-black text-slate-900 tabular-nums">
                                  #{ord.orderNumber}
                                </td>

                                {/* Area / Location ONLY (Customer name, phone, and street address hidden for privacy!) */}
                                <td className="p-3.5">
                                  <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold">
                                    {ord.locality}
                                  </span>
                                </td>

                                <td className="p-3.5">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                      <img
                                        src={firstItem?.imageUrl || (firstItem?.productName.toLowerCase().includes('coriander') ? '/images/cat_veggies.jpg' : '/images/tomatoes.jpg')}
                                        alt="item"
                                        className="w-full h-full object-cover"
                                        onError={e => {
                                          (e.target as HTMLElement).style.display = 'none';
                                        }}
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-extrabold text-slate-900 text-xs truncate">
                                        {ord.items.length} {ord.items.length === 1 ? 'item' : 'items'}
                                      </div>
                                      <div className="text-[11px] text-slate-500 truncate max-w-[200px]" title={itemSummary}>
                                        {itemSummary}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td className="p-3.5 font-black text-slate-900 tabular-nums text-sm">
                                  ₹{ord.totalAmount}
                                </td>

                                <td className="p-3.5 text-[11px] text-slate-600 font-medium">
                                  {ord.createdAt || ord.orderedAt || '12 Oct 2026, 10:15 AM'}
                                </td>

                                <td className="p-3.5">
                                  <span
                                    className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold ${
                                      ord.status === 'New' || ord.status === 'Placed'
                                        ? 'bg-amber-100 text-amber-800'
                                        : ord.status === 'Accepted'
                                        ? 'bg-blue-100 text-blue-800'
                                        : ord.status === 'Preparing'
                                        ? 'bg-orange-100 text-orange-800'
                                        : ord.status === 'Ready for Pickup' || ord.status === 'Packed'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : ord.status === 'Picked Up'
                                        ? 'bg-purple-100 text-purple-800'
                                        : ord.status === 'Delivered'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    {ord.status === 'New' || ord.status === 'Placed' ? 'New' : ord.status}
                                  </span>
                                </td>

                                <td className="p-3.5 pr-5 text-right">
                                  <button
                                    onClick={() => setViewingVendorOrderId(ord.id)}
                                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls matching Product Variants & Stock Inventory */}
                  <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/70 text-xs">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-slate-600 font-semibold">
                        Showing <strong className="text-slate-900">{filteredVendorOrders.length > 0 ? vendorOrderStartIdx + 1 : 0}–{Math.min(vendorOrderStartIdx + vendorOrderPageSize, filteredVendorOrders.length)}</strong> of <strong className="text-slate-900">{filteredVendorOrders.length}</strong> items
                      </span>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <span>Show</span>
                        <select
                          value={vendorOrderPageSize}
                          onChange={e => {
                            setVendorOrderPageSize(Number(e.target.value));
                            setVendorOrderPage(1);
                          }}
                          className="h-8 px-2 py-0.5 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-lg outline-none cursor-pointer"
                        >
                          <option value={10}>10 per page</option>
                          <option value={15}>15 per page</option>
                          <option value={20}>20 per page</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setVendorOrderPage(p => Math.max(1, p - 1))}
                        disabled={validVendorOrderPage <= 1}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                          validVendorOrderPage <= 1
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-2xs cursor-pointer'
                        }`}
                      >
                        &larr; Previous
                      </button>

                      {Array.from({ length: totalVendorOrderPages }, (_, i) => i + 1).map(pageNum => (
                        <button
                          key={pageNum}
                          onClick={() => setVendorOrderPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            pageNum === validVendorOrderPage
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button
                        onClick={() => setVendorOrderPage(p => Math.min(totalVendorOrderPages, p + 1))}
                        disabled={validVendorOrderPage >= totalVendorOrderPages}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                          validVendorOrderPage >= totalVendorOrderPages
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-2xs cursor-pointer'
                        }`}
                      >
                        Next &rarr;
                      </button>
                    </div>
                  </div>

                  {/* Privacy Banner matching Panel 5 amber banner */}
                  <div className="p-4 bg-amber-50/80 border-t border-amber-200 text-xs text-amber-950 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                    <span className="font-medium">
                      🔒 Vendor cannot see customer name, phone number or delivery address. Only order items, quantity, amount, and order status are visible to the vendor.
                    </span>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  PANEL 5: ORDER STATUS FLOW (VENDOR TO DELIVERY) GUIDE MODAL
                  ========================================================================= */}
              {showFlowGuideModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-black text-lg text-slate-900">
                          Order Status Flow (Vendor to Delivery)
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Standard operating procedure for Hospete Fresh local fulfillment
                        </p>
                      </div>
                      <button
                        onClick={() => setShowFlowGuideModal(false)}
                        className="text-slate-400 hover:text-slate-600 p-1"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Step Cards with Connecting Arrows */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-2">
                      {[
                        {
                          num: 1,
                          title: 'New Order',
                          sub: '(From Customer)',
                          desc: 'Vendor sees the order and can Accept or Reject.',
                          icon: '🛒',
                          color: 'bg-amber-100 text-amber-900 border-amber-200'
                        },
                        {
                          num: 2,
                          title: 'Accepted',
                          sub: '(By Vendor)',
                          desc: 'Vendor accepts the order.',
                          icon: '✓',
                          color: 'bg-blue-100 text-blue-900 border-blue-200'
                        },
                        {
                          num: 3,
                          title: 'Preparing',
                          sub: '(By Vendor)',
                          desc: 'Vendor picks and packs the items.',
                          icon: '📦',
                          color: 'bg-orange-100 text-orange-900 border-orange-200'
                        },
                        {
                          num: 4,
                          title: 'Ready for Pickup',
                          sub: '(By Vendor)',
                          desc: 'Vendor marks order as Ready for Pickup.',
                          icon: '🏪',
                          color: 'bg-emerald-100 text-emerald-900 border-emerald-200'
                        },
                        {
                          num: 5,
                          title: 'Picked Up',
                          sub: '(By Delivery Boy)',
                          desc: 'Admin assigns delivery boy. Delivery boy verifies item checklist and marks Picked Up.',
                          icon: '🛵',
                          color: 'bg-purple-100 text-purple-900 border-purple-200'
                        },
                        {
                          num: 6,
                          title: 'Delivered',
                          sub: '(By Delivery Boy)',
                          desc: 'Delivery boy delivers the order to the customer and marks Delivered.',
                          icon: '✓',
                          color: 'bg-emerald-100 text-emerald-900 border-emerald-200'
                        }
                      ].map((step, idx) => (
                        <div
                          key={step.num}
                          className={`p-3.5 rounded-2xl border ${step.color} space-y-2 text-center flex flex-col justify-between`}
                        >
                          <div className="space-y-1">
                            <div className="w-10 h-10 rounded-full bg-white shadow-2xs mx-auto flex items-center justify-center text-lg font-black">
                              {step.icon}
                            </div>
                            <div className="font-black text-xs">{step.title}</div>
                            <div className="text-[10px] font-bold opacity-80">{step.sub}</div>
                          </div>
                          <p className="text-[10px] leading-snug opacity-90">{step.desc}</p>
                        </div>
                      ))}
                    </div>

                    {/* Amber Privacy Notice Banner */}
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 flex items-center gap-2.5">
                      <Lock className="w-5 h-5 text-amber-700 shrink-0" />
                      <div className="font-semibold leading-relaxed">
                        Vendor cannot see customer name, phone number or delivery address. Only order items, quantity, amount, and order status are visible to the vendor.
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => setShowFlowGuideModal(false)}
                        className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs"
                      >
                        Got It
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  MODAL: REJECT ORDER (WITH MANDATORY REASON)
                  ========================================================================= */}
              {rejectOrderModalOrder && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-rose-600" />
                          <span>Reject Order #{rejectOrderModalOrder.orderNumber}</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Please provide a reason for declining this grocery order.
                        </p>
                      </div>
                      <button
                        onClick={() => setRejectOrderModalOrder(null)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Quick Reasons:</label>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            'Stock exhausted / item out of stock',
                            'Store closed for local market hours',
                            'Perishable quality not meeting fresh standard'
                          ].map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setRejectOrderReasonInput(preset)}
                              className="text-[11px] p-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-left"
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Reason for Rejection <span className="text-rose-600">*</span>
                        </label>
                        <textarea
                          rows={3}
                          value={rejectOrderReasonInput}
                          onChange={e => setRejectOrderReasonInput(e.target.value)}
                          placeholder="Explain why this order is rejected..."
                          className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setRejectOrderModalOrder(null)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmVendorRejectOrder}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-xs"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: STORE PROFILE */}
          {activeVendorTab === 'profile' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl space-y-4">
              <h2 className="text-base font-black text-slate-900">Registered Store Profile</h2>
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Business Name</label>
                    <div className="font-black text-slate-900">{currentVendor.businessName}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Contact Person</label>
                    <div className="font-bold text-slate-800">{currentVendor.ownerName}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Mobile</label>
                    <div className="text-slate-800">{currentVendor.phone}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Business Type</label>
                    <div className="text-slate-800 capitalize">{currentVendor.businessType}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Base Locality</label>
                    <div className="text-slate-800">{currentVendor.locality}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Service Coverage</label>
                    <div className="text-slate-800">{currentVendor.serviceArea}</div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Address</label>
                  <div className="text-slate-800">{currentVendor.address}</div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                  <div className="text-slate-600">{currentVendor.description || 'No description provided.'}</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: FLASH DEALS & PROMOTIONS (Vendor Flash Deals Approval & Management) */}
          {activeVendorTab === 'flash_deals' && (
            <div className="space-y-5">
              {/* Header with Title and Nominate Button */}
              <div className="flex flex-wrap justify-between items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Flash Deals & Promotions
                    </h2>
                    <span className="bg-amber-400 text-amber-950 text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                      <Zap className="w-3.5 h-3.5 fill-amber-950" />
                      <span>{vendorFlashDeals.length} Deals</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Manage promotional discounts, approve flash deals for <strong className="text-white">{currentVendor.businessName}</strong>, and allocate deal stock quotas.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (vendorProducts.length > 0) {
                        setNominateProductId(vendorProducts[0].id);
                        if (vendorProducts[0].variants.length > 0) {
                          setNominateVariantId(vendorProducts[0].variants[0].id);
                        }
                      }
                      setNominateError(null);
                      setIsNominateDealModalOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Propose Flash Deal</span>
                  </button>
                </div>
              </div>

              {/* Account Status Alert: If vendor is not approved or suspended */}
              {currentVendor.status !== 'approved' && (
                <div className="p-4 sm:p-5 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-150">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-amber-950 text-sm">
                          ⚠️ Vendor Account is {currentVendor.status === 'pending' ? 'Pending Approval' : currentVendor.status.toUpperCase()}
                        </span>
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                          Storefront Blocked
                        </span>
                      </div>
                      <p className="text-xs text-amber-900 mt-1 leading-relaxed max-w-2xl">
                        Your store has not been verified yet, causing your products (such as <strong>Nandini Cow Ghee</strong> or <strong>Toned Milk</strong>) to display <em>"Vendor is not approved or is suspended"</em> in Flash Deals. Approving your store will immediately unlock and activate all eligible flash deals for Hospete customers!
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickApproveSelf}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 whitespace-nowrap cursor-pointer flex items-center gap-2 shrink-0 self-start sm:self-auto"
                  >
                    <ShieldCheck className="w-4.5 h-4.5" />
                    <span>Verify & Approve Store Account</span>
                  </button>
                </div>
              )}

              {/* KPI Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900/80 border border-emerald-900/60 p-4 rounded-2xl">
                  <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">
                    Total Nominated Deals
                  </span>
                  <div className="text-2xl font-black text-white mt-1">
                    {vendorFlashDeals.length}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Across your store catalog
                  </span>
                </div>

                <div className="bg-slate-900/80 border border-emerald-900/60 p-4 rounded-2xl">
                  <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">
                    Vendor Opted-In & Live
                  </span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {vendorFlashDeals.filter(d => d.vendorApproved && d.isActive).length}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Confirmed by store
                  </span>
                </div>

                <div className="bg-slate-900/80 border border-emerald-900/60 p-4 rounded-2xl">
                  <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block">
                    Promotional Units Sold
                  </span>
                  <div className="text-2xl font-black text-amber-300 mt-1">
                    {vendorFlashDeals.reduce((sum, d) => sum + (d.dealStockSold || 0), 0)}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Claimed by customers
                  </span>
                </div>

                <div className="bg-slate-900/80 border border-emerald-900/60 p-4 rounded-2xl">
                  <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider block">
                    Account Status
                  </span>
                  <div className="text-sm font-black mt-1.5 flex items-center gap-1.5">
                    {currentVendor.status === 'approved' ? (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-lg uppercase text-xs">
                        ✓ Approved
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-lg uppercase text-xs">
                        ⚠️ {currentVendor.status}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Hospete Fresh Supplier
                  </span>
                </div>
              </div>

              {/* Flash Deals Cards List */}
              <div className="space-y-3">
                {vendorFlashDeals.length === 0 ? (
                  <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-3">
                    <Zap className="w-10 h-10 text-slate-300 mx-auto" />
                    <div>
                      <h3 className="font-black text-slate-800 text-base">No Flash Deals Found for Your Store</h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        Flash deals boost discovery and fast-track sales. You can nominate products from your catalog to offer limited-time discounts to Hospete customers.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (vendorProducts.length > 0) {
                          setNominateProductId(vendorProducts[0].id);
                          if (vendorProducts[0].variants.length > 0) {
                            setNominateVariantId(vendorProducts[0].variants[0].id);
                          }
                        }
                        setIsNominateDealModalOpen(true);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Nominate Your First Flash Deal</span>
                    </button>
                  </div>
                ) : (
                  vendorFlashDeals.map(deal => {
                    const prod = products.find(p => p.id === deal.productId);
                    const variant = prod?.variants.find(v => v.id === deal.variantId) || prod?.variants[0];
                    const isVendorApproved = deal.vendorApproved !== false;
                    const stockSold = deal.dealStockSold || 0;
                    const stockLimit = deal.dealStockLimit || 50;
                    const soldPercent = Math.min(100, Math.round((stockSold / stockLimit) * 100));

                    return (
                      <div
                        key={deal.id}
                        className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs transition-all hover:shadow-md space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          {/* Product Thumbnail & Meta */}
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {prod?.imageUrl ? (
                                <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-2xl">🛍️</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                                  {deal.badgeText}
                                </span>
                                <span className="text-[11px] text-slate-500 font-semibold capitalize">
                                  {prod?.categorySlug}
                                </span>
                              </div>
                              <h3 className="font-black text-slate-900 text-base truncate mt-0.5">
                                {prod?.name || 'Product'}
                              </h3>
                              <div className="text-xs text-slate-500 font-medium">
                                Pack Variant: <strong className="text-slate-800">{variant?.packSize}</strong>
                              </div>
                            </div>
                          </div>

                          {/* Pricing Details */}
                          <div className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200/80 flex items-center gap-4 shrink-0">
                            <div>
                              <div className="text-[10px] text-slate-400 font-black uppercase">Flash Price</div>
                              <div className="text-xl font-black text-emerald-700">₹{deal.dealPrice}</div>
                            </div>
                            <div className="border-l border-slate-200 pl-4">
                              <div className="text-[10px] text-slate-400 font-black uppercase">Regular Rate</div>
                              <div className="text-xs font-bold text-slate-400 line-through">₹{deal.originalPrice}</div>
                              <div className="text-[11px] font-black text-amber-700">
                                {deal.calculatedDiscountPercent}% OFF MRP
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Stock Limit Progress Bar & Household Limits */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                          <div>
                            <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 mb-1">
                              <span>Deal Stock Allocation:</span>
                              <span><strong>{stockSold}</strong> / {stockLimit} packs sold ({soldPercent}%)</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 transition-all rounded-full"
                                style={{ width: `${soldPercent}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 text-[11px]">
                            <span className="text-slate-500">
                              Household Limit: <strong>Max {deal.perCustomerLimit || 2} packs</strong>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setAdjustingStockDeal(deal);
                                setAdjustStockInput(deal.dealStockLimit || 20);
                              }}
                              className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
                            >
                              Edit Stock Quota &rarr;
                            </button>
                          </div>
                        </div>

                        {/* Vendor Approval & Store Activation Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            {isVendorApproved && currentVendor.status === 'approved' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black rounded-xl">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Vendor Approved & Live</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-black rounded-xl">
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                                <span>
                                  {currentVendor.status !== 'approved'
                                    ? 'Awaiting Vendor Account Approval'
                                    : 'Awaiting Vendor Deal Consent'}
                                </span>
                              </span>
                            )}

                            {deal.isActive ? (
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                                ● Campaign Active
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                Paused
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {(!isVendorApproved || currentVendor.status !== 'approved') ? (
                              <button
                                type="button"
                                onClick={() => handleApproveFlashDeal(deal.id)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                                title="Approve deal pricing, stock allocation, and store verification"
                              >
                                <Check className="w-4 h-4" />
                                <span>Approve Flash Deal</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleVendorDeal(deal.id)}
                                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                  deal.isActive
                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                                }`}
                              >
                                {deal.isActive ? 'Pause Deal' : 'Resume Deal'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  </div>

  {/* =========================================================
      MODAL: NOMINATE NEW FLASH DEAL (Vendor Screen)
      ========================================================= */}
  {isNominateDealModalOpen && (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
              <Zap className="w-4 h-4 fill-amber-700" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">Propose Flash Deal</h3>
              <p className="text-[11px] text-slate-500">Nominate your produce for daily flash discount</p>
            </div>
          </div>
          <button
            onClick={() => setIsNominateDealModalOpen(false)}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        {nominateError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{nominateError}</span>
          </div>
        )}

        <form onSubmit={handleNominateDealSubmit} className="space-y-4 text-xs">
          {/* Select Product */}
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
              Select Product from Your Store *
            </label>
            <select
              value={nominateProductId}
              onChange={e => {
                const pId = Number(e.target.value);
                setNominateProductId(pId);
                const p = products.find(prod => prod.id === pId);
                if (p && p.variants.length > 0) {
                  setNominateVariantId(p.variants[0].id);
                }
              }}
              className="w-full h-10 px-3 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none cursor-pointer"
            >
              {vendorProducts.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.variants.length} pack{p.variants.length > 1 ? 's' : ''})
                </option>
              ))}
            </select>
          </div>

          {/* Select Variant Pack */}
          {nominateProductId > 0 && (() => {
            const p = products.find(prod => prod.id === nominateProductId);
            if (!p || p.variants.length === 0) return null;
            return (
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Select Pack Size / Variant *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {p.variants.map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setNominateVariantId(v.id)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        nominateVariantId === v.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-300'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-black text-xs">{v.packSize}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Rate: ₹{v.price} | MRP: ₹{v.mrp}</div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Discount Percentage */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                Discount Percentage (%)
              </label>
              <input
                type="number"
                min={5}
                max={90}
                value={nominateDiscountPercent}
                onChange={e => setNominateDiscountPercent(Number(e.target.value))}
                className="w-full h-10 px-3 font-black text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                Promotional Badge
              </label>
              <input
                type="text"
                value={nominateBadgeText}
                onChange={e => setNominateBadgeText(e.target.value)}
                placeholder="e.g. 20% OFF or VALUE PACK"
                className="w-full h-10 px-3 font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Deal Stock Quota & Max per Household */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                Allocated Stock Quota (Units)
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={nominateStockLimit}
                onChange={e => setNominateStockLimit(Number(e.target.value))}
                className="w-full h-10 px-3 font-black text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                Max Per Household Order
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={nominatePerCustomerLimit}
                onChange={e => setNominatePerCustomerLimit(Number(e.target.value))}
                className="w-full h-10 px-3 font-black text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs">
            <span className="font-extrabold block">✓ Storefront Enrollment</span>
            <span className="text-[11px] text-emerald-800">
              By proposing this deal, you agree to commit {nominateStockLimit} units at the discounted flash price.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNominateDealModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-xs cursor-pointer active:scale-95"
            >
              Confirm & Activate Deal
            </button>
          </div>
        </form>
      </div>
    </div>
  )}

  {/* =========================================================
      MODAL: ADJUST DEAL STOCK QUOTA
      ========================================================= */}
  {adjustingStockDeal && (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h3 className="font-black text-sm text-slate-900">Adjust Deal Stock Quota</h3>
          <button
            onClick={() => setAdjustingStockDeal(null)}
            className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSaveAdjustStock} className="space-y-4 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
              Committed Deal Stock Units
            </label>
            <input
              type="number"
              min={1}
              max={1000}
              value={adjustStockInput}
              onChange={e => setAdjustStockInput(Number(e.target.value))}
              className="w-full h-11 px-3 text-base font-black text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Units currently claimed by customers: {adjustingStockDeal.dealStockSold || 0}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAdjustingStockDeal(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-xs"
            >
              Update Quota
            </button>
          </div>
        </form>
      </div>
    </div>
  )}

      {/* =========================================================
          PRODUCT ADD / EDIT MODAL
          ========================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">
                {editingProduct ? 'Edit Product & Variants' : 'Add New Product to Store'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Organic Bellary Onions"
                  className="w-full h-9 px-3 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Category *
                  </label>
                  <select
                    value={productForm.categorySlug}
                    onChange={e => setProductForm({ ...productForm, categorySlug: e.target.value })}
                    className="w-full h-9 px-3 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                  >
                    {sortedCategories.map(c => (
                      <option key={c.slug} value={c.slug}>
                        {c.iconEmoji} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={productForm.brand}
                    onChange={e => setProductForm({ ...productForm, brand: e.target.value })}
                    placeholder="e.g. Tungabhadra Farms"
                    className="w-full h-9 px-3 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={productForm.description}
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="e.g. Crisp, fresh red onions from farm fields near Tungabhadra."
                  className="w-full h-9 px-3 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none placeholder:text-slate-400"
                />
              </div>

              {/* 2. Comprehensive Product Image Upload Section */}
              <div className="space-y-3 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-black text-slate-800 uppercase tracking-wide">
                      Main Product Image <span className="text-rose-600">*</span>
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Upload high-res photo with clear packaging or farm-fresh produce view.
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    Max 5 MB · JPG, PNG, WebP
                  </span>
                </div>

                {/* Admin Image Correction Request Notice if currently editing a listing needing correction */}
                {editingProduct?.imageReviewStatus === 'needs_correction' && editingProduct.imageCorrectionReason && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                    <div className="font-extrabold flex items-center gap-1.5 uppercase text-[10px] tracking-wide text-rose-800">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Administrator Requested Image Correction:</span>
                    </div>
                    <p className="font-bold text-rose-950 text-xs bg-white/70 p-2 rounded-lg border border-rose-200">
                      "{editingProduct.imageCorrectionReason}"
                    </p>
                    <p className="text-[11px] text-rose-700">
                      Upload a new compliant photo below. Existing product attributes and variant prices are preserved.
                    </p>
                  </div>
                )}

                {imageUploadError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{imageUploadError}</span>
                  </div>
                )}

                {/* Main Product Image Preview Container */}
                <div className="flex flex-col sm:flex-row gap-4 items-start bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="relative group shrink-0 mx-auto sm:mx-0">
                    {productForm.imageUrl ? (
                      <div className="relative">
                        <img
                          src={productForm.imageUrl}
                          alt="Main Product Preview"
                          className="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-xl border border-slate-200 bg-white shadow-2xs"
                        />
                        <div className="absolute top-1 right-1 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-2xs">
                          PRIMARY
                        </div>
                      </div>
                    ) : (
                      <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400">
                        <ImageIcon className="w-8 h-8 stroke-1 text-slate-300" />
                        <span className="text-[10px] font-bold mt-1 text-slate-400">No Image</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2.5 w-full">
                    {/* Hidden Native File Pickers */}
                    <input
                      type="file"
                      id="vendor-main-image-upload"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          validateAndProcessImageFile(
                            file,
                            (dataUrl, name) => {
                              setProductForm(prev => ({ ...prev, imageUrl: dataUrl }));
                              setMainImageFileName(name);
                            },
                            err => setImageUploadError(err || null)
                          );
                        }
                      }}
                    />

                    <input
                      type="file"
                      id="vendor-main-image-camera"
                      accept="image/jpeg,image/png,image/webp"
                      capture="environment"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          validateAndProcessImageFile(
                            file,
                            (dataUrl, name) => {
                              setProductForm(prev => ({ ...prev, imageUrl: dataUrl }));
                              setMainImageFileName(`camera_capture_${Date.now()}.jpg`);
                            },
                            err => setImageUploadError(err || null)
                          );
                        }
                      }}
                    />

                    {/* Upload & Camera Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <label
                        htmlFor="vendor-main-image-upload"
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{productForm.imageUrl ? 'Replace Image' : 'Upload Image File'}</span>
                      </label>

                      <label
                        htmlFor="vendor-main-image-camera"
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                        title="Use device camera to snap a photo"
                      >
                        <Camera className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Take Photo (Camera)</span>
                      </label>

                      {productForm.imageUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setProductForm(prev => ({ ...prev, imageUrl: '' }));
                            setMainImageFileName(null);
                          }}
                          className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-200 font-bold text-xs rounded-xl flex items-center gap-1 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    {mainImageFileName && (
                      <div className="text-[11px] text-slate-500 font-mono truncate">
                        Selected: <span className="font-bold text-slate-700">{mainImageFileName}</span>
                      </div>
                    )}

                    {/* Quick Verified Presets */}
                    <div className="pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                        Or Pick Verified Local Preset:
                      </span>
                      <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-lg">
                        {PRESET_IMAGES.map(img => (
                          <button
                            key={img.label}
                            type="button"
                            onClick={() => {
                              setProductForm(prev => ({ ...prev, imageUrl: img.url }));
                              setMainImageFileName(null);
                              setImageUploadError(null);
                            }}
                            className={`px-2 py-1 rounded-lg border text-[10px] font-bold whitespace-nowrap transition-all ${
                              productForm.imageUrl === img.url
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {img.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional Additional Product Images */}
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Optional Additional Gallery Images ({productForm.additionalImages.length}/4)
                    </label>
                    <span className="text-[10px] text-slate-400">Nutritional table, ingredients, batch label</span>
                  </div>

                  {additionalUploadError && (
                    <div className="p-2 rounded-xl bg-rose-50 text-rose-800 text-[11px] font-semibold">
                      {additionalUploadError}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    {productForm.additionalImages.map((imgUrl, idx) => (
                      <div key={idx} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-2xs">
                        <img src={imgUrl} alt={`Additional ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setProductForm(prev => ({
                              ...prev,
                              additionalImages: prev.additionalImages.filter((_, i) => i !== idx)
                            }));
                          }}
                          className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shadow-xs font-bold"
                          title="Remove extra image"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {productForm.additionalImages.length < 4 && (
                      <>
                        <input
                          type="file"
                          id="vendor-additional-image-file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              validateAndProcessImageFile(
                                file,
                                dataUrl => {
                                  setProductForm(prev => ({
                                    ...prev,
                                    additionalImages: [...prev.additionalImages, dataUrl]
                                  }));
                                },
                                err => setAdditionalUploadError(err || null)
                              );
                            }
                          }}
                        />
                        <label
                          htmlFor="vendor-additional-image-file"
                          className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-emerald-600 transition-colors"
                          title="Add additional packaging photo"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="text-[9px] font-bold mt-0.5">+ Photo</span>
                        </label>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Variants section */}
              <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/60 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-slate-800 text-xs">
                    Pack Sizes & Pricing Variants
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setProductForm({
                        ...productForm,
                        variants: [
                          ...productForm.variants,
                          {
                            id: Date.now(),
                            packSize: '1 kg',
                            price: 50,
                            mrp: 65,
                            stockQty: 30,
                            isDefault: false
                          }
                        ]
                      });
                    }}
                    className="text-emerald-700 font-extrabold text-xs flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Pack Variant</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {productForm.variants.map((v, i) => (
                    <div key={v.id} className="grid grid-cols-12 gap-1.5 items-center bg-white p-2 rounded-xl border border-slate-200">
                      <div className="col-span-4">
                        <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">Pack Size</label>
                        <input
                          type="text"
                          required
                          value={v.packSize}
                          onChange={e => {
                            const val = e.target.value;
                            setProductForm({
                              ...productForm,
                              variants: productForm.variants.map((item, idx) =>
                                idx === i ? { ...item, packSize: val } : item
                              )
                            });
                          }}
                          placeholder="e.g. 500 g"
                          className="w-full h-8 px-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg focus:border-emerald-500 outline-none placeholder:text-slate-400"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">Selling (₹)</label>
                        <input
                          type="number"
                          required
                          value={v.price}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setProductForm({
                              ...productForm,
                              variants: productForm.variants.map((item, idx) =>
                                idx === i ? { ...item, price: val } : item
                              )
                            });
                          }}
                          className="w-full h-8 px-1.5 text-xs font-bold text-emerald-800 bg-white border border-slate-300 rounded-lg focus:border-emerald-500 outline-none"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">MRP (₹)</label>
                        <input
                          type="number"
                          required
                          value={v.mrp}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setProductForm({
                              ...productForm,
                              variants: productForm.variants.map((item, idx) =>
                                idx === i ? { ...item, mrp: val } : item
                              )
                            });
                          }}
                          className="w-full h-8 px-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg focus:border-emerald-500 outline-none"
                        />
                      </div>

                      <div className="col-span-3">
                        <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">Stock Qty</label>
                        <input
                          type="number"
                          required
                          value={v.stockQty}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setProductForm({
                              ...productForm,
                              variants: productForm.variants.map((item, idx) =>
                                idx === i ? { ...item, stockQty: val } : item
                              )
                            });
                          }}
                          className="w-full h-8 px-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:border-emerald-500 outline-none"
                        />
                      </div>

                      <div className="col-span-1 text-center pt-2">
                        {productForm.variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setProductForm({
                                ...productForm,
                                variants: productForm.variants.filter((_, idx) => idx !== i)
                              });
                            }}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs"
                >
                  Save Product Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* =========================================================
          ANNOUNCEMENTS MODAL
          ========================================================= */}
      {showAnnouncementsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-4 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Vendor Announcements
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Marketplace bulletins for Hospete suppliers
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAnnouncementsModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-emerald-900">🚀 Morning Dispatch Surge</span>
                  <span className="text-[10px] font-bold text-emerald-600">Today</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Early morning order volume has increased by 18% in Patel Nagar and College Road. Please ensure vegetables and herbs are bundled and packed by 8:00 AM.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900">🥬 Fresh Greens Quality Standard</span>
                  <span className="text-[10px] font-bold text-slate-400">10 Oct 2026</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  All leafy greens (palak, methi, coriander) must be mist-sprayed and placed in breathable paper bags prior to courier pickup.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900">💳 Weekly Settlement Processing</span>
                  <span className="text-[10px] font-bold text-slate-400">08 Oct 2026</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Payouts for orders completed between Monday and Sunday are credited automatically every Tuesday to your registered bank account.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowAnnouncementsModal(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          PAYMENTS MODAL
          ========================================================= */}
      {showPaymentsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-5 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Vendor Payments & Settlements
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Direct bank deposits for {currentVendor.businessName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentsModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-400 font-bold text-[10px] uppercase block">Settled (Last 30 Days)</span>
                <span className="text-xl font-black text-slate-900 mt-1 block">₹38,450</span>
                <span className="text-emerald-600 text-[10px] font-bold">100% On-time</span>
              </div>
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="text-emerald-700 font-bold text-[10px] uppercase block">Pending Settlement</span>
                <span className="text-xl font-black text-emerald-900 mt-1 block">
                  ₹{vendorSalesTotal > 0 ? vendorSalesTotal.toLocaleString('en-IN') : '2,460'}
                </span>
                <span className="text-emerald-700 text-[10px] font-bold">Disbursing Tuesday</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900">Linked Bank Account</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Verified</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Beneficiary</span>
                  <span className="font-bold text-slate-800">{currentVendor.ownerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Bank</span>
                  <span className="font-bold text-slate-800">State Bank of India</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Account</span>
                  <span className="font-mono font-bold text-slate-800">••••••••4892</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Branch / IFSC</span>
                  <span className="font-mono font-bold text-slate-800">SBIN0000845</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Direct bank payouts require 0% platform commission during introductory festival season.</span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowPaymentsModal(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          REPORTS MODAL (Requirement 4: Best-Selling Products Bar Chart)
          ========================================================= */}
      {showReportsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[88vh] overflow-y-auto p-6 shadow-2xl space-y-5 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Performance & Sales Reports
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Real sales data & best-selling analytics for {currentVendor.businessName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReportsModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Period Selector Tabs (Requirement 4) */}
            <div className="flex items-center justify-between bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setReportPeriod('week')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  reportPeriod === 'week'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📅 This Week
              </button>
              <button
                type="button"
                onClick={() => setReportPeriod('month')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  reportPeriod === 'month'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📆 This Month
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-400 font-bold text-[10px] uppercase block">Total Units Sold</span>
                <span className="text-xl font-black text-slate-900 mt-0.5 block">
                  {bestSellingProducts.reduce((sum, it) => sum + it.quantity, 0)} units
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">{reportPeriod === 'week' ? 'Past 7 Days' : 'Past 30 Days'}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="text-emerald-800 font-bold text-[10px] uppercase block">Period Revenue</span>
                <span className="text-xl font-black text-emerald-950 mt-0.5 block">
                  ₹{bestSellingProducts.reduce((sum, it) => sum + it.revenue, 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">100% Direct Payout</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 col-span-2 sm:col-span-1">
                <span className="text-slate-400 font-bold text-[10px] uppercase block">Fulfillment SLA</span>
                <span className="text-xl font-black text-emerald-700 mt-0.5 block">98.6%</span>
                <span className="text-[10px] text-slate-500">Target &ge; 95%</span>
              </div>
            </div>

            {/* Best-Selling Products Bar Chart Section */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs">
                    Best-Selling Products ({reportPeriod === 'week' ? 'This Week' : 'This Month'})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Ranked by quantities ordered and fulfilled
                  </p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Real Sales Data
                </span>
              </div>

              {bestSellingProducts.length === 0 ? (
                /* Empty state when no sales exist */
                <div className="py-8 text-center bg-white rounded-xl border border-slate-200/80 p-4 space-y-1.5">
                  <div className="text-2xl">📊</div>
                  <h5 className="font-bold text-slate-800 text-xs">No sales recorded for {reportPeriod === 'week' ? 'this week' : 'this month'} yet</h5>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    As incoming orders are accepted and dispatched by your store, best-selling product rankings and quantities will automatically appear here.
                  </p>
                </div>
              ) : (
                /* Bar Chart */
                <div className="space-y-3 pt-1">
                  {(() => {
                    const maxQty = Math.max(...bestSellingProducts.map(p => p.quantity), 1);
                    return bestSellingProducts.slice(0, 6).map((item, idx) => {
                      const pct = Math.round((item.quantity / maxQty) * 100);
                      return (
                        <div key={item.name} className="space-y-1 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs group hover:border-emerald-300 transition-colors">
                          <div className="flex items-center justify-between text-xs gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-black text-[10px] flex items-center justify-center shrink-0">
                                #{idx + 1}
                              </span>
                              <span className="font-extrabold text-slate-900 truncate" title={item.name}>
                                {item.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                {item.quantity} {item.quantity === 1 ? 'unit' : 'units'} sold
                              </span>
                              <span className="font-black text-emerald-700 text-[11px]">
                                ₹{item.revenue.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          {/* Progress / Bar graphic */}
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="bg-emerald-600 group-hover:bg-emerald-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.max(pct, 6)}%` }}
                              title={`${item.name}: ${item.quantity} sold (${pct}% of top seller)`}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 flex justify-between items-center text-xs">
              <span className="text-[11px] text-slate-400">
                Updated in real-time with confirmed orders
              </span>
              <button
                onClick={() => setShowReportsModal(false)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          SETTINGS MODAL
          ========================================================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-4 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Store Settings
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Operational preferences for {currentVendor.businessName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between cursor-pointer transition-colors">
                <div>
                  <span className="font-bold text-slate-900 block">Auto-Accept Incoming Orders</span>
                  <span className="text-[11px] text-slate-500 block">Instantly confirm customer orders during operating hours</span>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-emerald-600 cursor-pointer" />
              </label>

              <label className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between cursor-pointer transition-colors">
                <div>
                  <span className="font-bold text-slate-900 block">Audible Sound Alerts</span>
                  <span className="text-[11px] text-slate-500 block">Chime when new order arrives or delivery rider is assigned</span>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-emerald-600 cursor-pointer" />
              </label>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block">Store Working Hours</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Opens At</span>
                    <span className="font-bold text-slate-800 text-xs">06:00 AM (Early Produce)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Closes At</span>
                    <span className="font-bold text-slate-800 text-xs">09:00 PM (Daily)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  setVendorNotice({
                    text: 'Store settings saved successfully.',
                    type: 'success'
                  });
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          PRINTABLE ORDER DISPATCH SLIP & RECEIPT MODAL
          ========================================================= */}
      {printableOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header & Quick Actions */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-400" />
                <span className="font-black text-sm">Order Dispatch Slip #{printableOrderModal.orderNumber}</span>
              </div>
              <button
                onClick={() => setPrintableOrderModal(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Action Bar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs no-print">
              <div className="flex items-center gap-2">
                <button
                  onClick={executePrintNow}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip Now</span>
                </button>
                <button
                  onClick={() => openStandalonePrintWindow(printableOrderModal)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  title="Opens print layout in a new tab if iframe blocks printing"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  <span>Open in New Tab</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyReceiptText(printableOrderModal)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>{printCopiedNotice ? '✓ Copied!' : 'Copy Text'}</span>
                </button>
              </div>
            </div>

            {/* Printable Slip Content Area */}
            <div className="p-6 sm:p-8 max-h-[70vh] overflow-y-auto" id="printable-order-receipt">
              {/* Slip Header */}
              <div className="text-center border-b-2 border-dashed border-slate-300 pb-4 mb-4">
                <div className="text-xl font-black text-emerald-800 tracking-tight flex items-center justify-center gap-1.5">
                  <span>🌿</span>
                  <span>HOSPETE FRESH</span>
                </div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-0.5">
                  Store Packaging & Dispatch Slip
                </div>
                <div className="mt-2 text-xs font-bold text-slate-900">
                  Order Ref: <span className="font-mono font-black text-emerald-700">#{printableOrderModal.orderNumber}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Placed: {printableOrderModal.createdAt || printableOrderModal.orderedAt || '12 Oct 2026, 10:15 AM'} · SLA:{' '}
                  <strong className="text-slate-800">{printableOrderModal.totalTimeTaken || '~15 mins'}</strong>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Store: <strong className="text-slate-900">{currentVendor?.businessName || 'Verified Store'}</strong> (Hospete)
                </div>
                <div className="mt-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                    STATUS: {printableOrderModal.status}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-3">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b-2 border-slate-900 text-slate-700 font-black uppercase text-[10px]">
                      <th className="py-1.5 text-left">Item Name</th>
                      <th className="py-1.5 text-left">Pack Size</th>
                      <th className="py-1.5 text-right">Qty</th>
                      <th className="py-1.5 text-right">Rate</th>
                      <th className="py-1.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {printableOrderModal.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2 pr-2 font-bold text-slate-900">{it.productName}</td>
                        <td className="py-2 text-slate-500 text-[11px]">{it.packSize}</td>
                        <td className="py-2 text-right font-black">{it.quantity}</td>
                        <td className="py-2 text-right text-slate-600">₹{it.unitPrice}</td>
                        <td className="py-2 text-right font-black text-slate-900">
                          ₹{it.subtotal || it.unitPrice * it.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-900 font-black text-sm">
                      <td colSpan={4} className="pt-2 text-slate-900">Total Amount</td>
                      <td className="pt-2 text-right text-emerald-700">₹{printableOrderModal.totalAmount}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Order Meta & Privacy Box */}
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Payment Mode:</span>
                  <strong className="text-slate-900">{printableOrderModal.paymentMethod || 'Cash on Delivery'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Customer Locality:</span>
                  <strong className="text-slate-900">{printableOrderModal.locality || 'Hospete'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Assigned Rider:</span>
                  <strong className="text-slate-900">
                    {printableOrderModal.assignedDeliveryBoy || 'Pending Assignment'}
                  </strong>
                </div>
                <div className="pt-1.5 border-t border-slate-200 text-[10px] text-slate-500">
                  🔒 Customer direct phone & street address protected per vendor privacy policy.
                </div>
              </div>

              {/* Barcode Mockup */}
              <div className="mt-4 text-center">
                <div className="font-mono text-xs tracking-widest text-slate-400 select-none">
                  ||||| | |||| ||| ||||||| ||| |||| | |||||
                </div>
                <div className="text-[10px] font-mono font-bold text-slate-500 mt-0.5">
                  HF-{printableOrderModal.orderNumber}-HPT
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 text-center text-[10px] text-slate-400 border-t border-dashed border-slate-200 pt-3">
                Hospete Fresh Hyperlocal Produce & Grocery Network · Hospete, Karnataka
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end no-print">
              <button
                onClick={() => setPrintableOrderModal(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Close Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
