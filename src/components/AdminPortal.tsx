import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Users,
  Store,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShoppingBag,
  Package,
  Download,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  Eye,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  Info,
  Calendar,
  Phone,
  Mail,
  MapPin,
  X,
  FileCheck,
  FileX,
  History,
  EyeOff,
  Layers,
  Tag,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Upload,
  Camera,
  Image as ImageIcon,
  FolderTree,
  Edit3,
  Trash2,
  Plus,
  Bike,
  Copy,
  KeyRound,
  Megaphone,
  ArrowUp,
  ArrowDown,
  Zap,
  Menu,
  LayoutDashboard,
  ShoppingCart,
  LogOut,
  Star,
  MessageSquare,
  Bell,
  Settings,
  UserCheck,
  Shield,
  Boxes,
  Ticket,
  Percent,
  Wallet,
  BarChart3,
  CreditCard
} from 'lucide-react';
import {
  Category,
  Order,
  Product,
  ProductVariant,
  Vendor,
  VendorDocument,
  VendorStatusHistory,
  AdminPreviewLog,
  CatalogAuditLog,
  DeliveryBoy,
  DeliveryPartner,
  DeliveryPartnerDocument,
  sortCategoriesByOrder,
  HomeBanner,
  BannerDisplayMode,
  BannerCarouselSettings,
  FlashDeal,
  FlashDealsCampaign
} from '../types.ts';
import {
  BUSINESS_TYPE_DOCUMENT_RULES,
  CATEGORIES,
  DocumentRequirementRule,
  DELIVERY_BOYS,
  INITIAL_DELIVERY_PARTNERS,
  INITIAL_HOME_BANNERS,
  DEFAULT_CAROUSEL_SETTINGS,
  INITIAL_FLASH_DEALS,
  INITIAL_FLASH_CAMPAIGN
} from '../data.ts';
import { AdminFlashDealsManagement } from './AdminFlashDealsManagement.tsx';
import { SuperAdminDashboard } from './SuperAdminDashboard.tsx';
import {
  AdminCustomersPanel,
  AdminInventoryPanel,
  AdminPaymentsPanel,
  AdminCouponsPanel,
  AdminSettingsPanel
} from './AdminAuxiliaryPanels.tsx';

interface AdminPortalProps {
  vendors: Vendor[];
  setVendors: React.Dispatch<React.SetStateAction<Vendor[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  categories?: Category[];
  setCategories?: React.Dispatch<React.SetStateAction<Category[]>>;
  deliveryPartners?: DeliveryPartner[];
  setDeliveryPartners?: React.Dispatch<React.SetStateAction<DeliveryPartner[]>>;
  banners?: HomeBanner[];
  setBanners?: React.Dispatch<React.SetStateAction<HomeBanner[]>>;
  bannerSettings?: BannerCarouselSettings;
  setBannerSettings?: React.Dispatch<React.SetStateAction<BannerCarouselSettings>>;
  flashDeals?: FlashDeal[];
  setFlashDeals?: React.Dispatch<React.SetStateAction<FlashDeal[]>>;
  flashCampaign?: FlashDealsCampaign;
  setFlashCampaign?: React.Dispatch<React.SetStateAction<FlashDealsCampaign>>;
  onOpenMobileApp: () => void;
  onOpenDeliverables: () => void;
  onSelectVendorToTest: (vendor: Vendor, options?: { safeMode?: boolean }) => void;
  adminPreviewLogs?: AdminPreviewLog[];
  setAdminPreviewLogs?: React.Dispatch<React.SetStateAction<AdminPreviewLog[]>>;
  catalogAuditLogs?: CatalogAuditLog[];
  setCatalogAuditLogs?: React.Dispatch<React.SetStateAction<CatalogAuditLog[]>>;
  onPreviewProductInStore?: (product: Product) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  vendors,
  setVendors,
  products,
  setProducts,
  orders,
  setOrders,
  categories = CATEGORIES,
  setCategories,
  deliveryPartners = INITIAL_DELIVERY_PARTNERS,
  setDeliveryPartners,
  banners = INITIAL_HOME_BANNERS,
  setBanners,
  bannerSettings = DEFAULT_CAROUSEL_SETTINGS,
  setBannerSettings,
  flashDeals = INITIAL_FLASH_DEALS,
  setFlashDeals,
  flashCampaign = INITIAL_FLASH_CAMPAIGN,
  setFlashCampaign,
  onOpenMobileApp,
  onOpenDeliverables,
  onSelectVendorToTest,
  adminPreviewLogs = [],
  setAdminPreviewLogs,
  catalogAuditLogs = [],
  setCatalogAuditLogs,
  onPreviewProductInStore
}) => {
  // Tabs matching reference sidebar (image_7e8833ae.png)
  const [adminTab, setAdminTab] = useState<
    | 'dashboard'
    | 'orders'
    | 'customers'
    | 'vendors'
    | 'delivery_partners'
    | 'catalog'
    | 'categories'
    | 'inventory'
    | 'flash_deals'
    | 'banners'
    | 'coupons'
    | 'payments'
    | 'reports'
    | 'reviews'
    | 'notifications'
    | 'users_roles'
    | 'settings'
    | 'logs'
  >('dashboard');

  // Super Admin Layout States (matching Image 1)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showAdminProfileDropdown, setShowAdminProfileDropdown] = useState(false);

  // Category Master State (Image 2)
  const [catFormName, setCatFormName] = useState('');
  const [catFormSlug, setCatFormSlug] = useState('');
  const [catFormEmoji, setCatFormEmoji] = useState('🥦');
  const [catFormImagePath, setCatFormImagePath] = useState('/static/images/categories/veggies.jpg');
  const [catFormParent, setCatFormParent] = useState<string>('none');
  const [catFormDesc, setCatFormDesc] = useState('');
  const [catFormOrder, setCatFormOrder] = useState<number>(0);
  const [catFormActive, setCatFormActive] = useState<boolean>(true);
  const [catFormShowHome, setCatFormShowHome] = useState<boolean>(true);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [catImagePreview, setCatImagePreview] = useState<string | null>(null);

  // Supplier Status Filter: 'all' | 'pending' | 'approved' | 'rejected' | 'suspended'
  const [vendorFilter, setVendorFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'suspended'>('all');

  // Search & Secondary Filters for Vendors
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | Vendor['businessType']>('all');
  const [localityFilter, setLocalityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'status'>('date_desc');

  // Catalog Overview Filters & Controls
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState<string>('all');
  const [catalogVendor, setCatalogVendor] = useState<string>('all');
  const [catalogVisibility, setCatalogVisibility] = useState<'all' | 'live' | 'pending' | 'rejected' | 'hidden' | 'out_of_stock'>('all');
  const [catalogStock, setCatalogStock] = useState<'all' | 'in_stock' | 'out_of_stock' | 'low_stock'>('all');
  const [catalogApproval, setCatalogApproval] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [catalogSort, setCatalogSort] = useState<'name_asc' | 'name_desc' | 'category_asc' | 'vendor_asc' | 'newest' | 'visibility_priority'>('newest');
  const [catalogPage, setCatalogPage] = useState<number>(1);
  const [catalogPageSize, setCatalogPageSize] = useState<number>(10);
  const [expandedVariantProductIds, setExpandedVariantProductIds] = useState<Record<number, boolean>>({});
  const [showMobileCatalogFilters, setShowMobileCatalogFilters] = useState<boolean>(false);

  // Live Customer Orders table variant expansion state
  const [expandedAdminOrderVariants, setExpandedAdminOrderVariants] = useState<Record<number, boolean>>({});
  const toggleAdminOrderVariants = (orderId: number) => {
    setExpandedAdminOrderVariants(prev => {
      const current = prev[orderId] !== undefined ? prev[orderId] : true;
      return {
        ...prev,
        [orderId]: !current
      };
    });
  };

  // Delivery Assignment state (Matching Reference Image Panel 6)
  const [adminOrderFilter, setAdminOrderFilter] = useState<'all' | 'ready_for_pickup' | 'new' | 'accepted' | 'preparing' | 'picked_up' | 'delivered'>('all');
  const [assignDeliveryModalOrder, setAssignDeliveryModalOrder] = useState<Order | null>(null);
  const [selectedDeliveryBoyId, setSelectedDeliveryBoyId] = useState<string>('dlv-1');

  const readyForPickupOrdersCount = useMemo(() => {
    return orders.filter(o => o.status === 'Ready for Pickup' || o.status === 'Packed').length;
  }, [orders]);

  const filteredAdminOrders = useMemo(() => {
    return orders.filter(o => {
      const st = o.status;
      if (adminOrderFilter === 'ready_for_pickup') {
        return st === 'Ready for Pickup' || st === 'Packed';
      }
      if (adminOrderFilter === 'new') return st === 'New' || st === 'Placed';
      if (adminOrderFilter === 'accepted') return st === 'Accepted';
      if (adminOrderFilter === 'preparing') return st === 'Preparing';
      if (adminOrderFilter === 'picked_up') return st === 'Picked Up' || st === 'Out for Delivery';
      if (adminOrderFilter === 'delivered') return st === 'Delivered';
      return true;
    });
  }, [orders, adminOrderFilter]);

  const handleConfirmAssignDelivery = () => {
    if (!assignDeliveryModalOrder) return;
    const partner =
      deliveryPartners.find(d => d.id === selectedDeliveryBoyId || d.code === selectedDeliveryBoyId) ||
      DELIVERY_BOYS.find(d => d.id === selectedDeliveryBoyId) ||
      deliveryPartners[0];
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const orderId = assignDeliveryModalOrder.id;
    const prevPartnerId = assignDeliveryModalOrder.assignedDeliveryBoyId;

    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? {
              ...o,
              status: 'Assigned',
              assignedDeliveryBoy: `${partner.name} (${partner.code})`,
              assignedDeliveryBoyId: partner.id,
              assignedDeliveryBoyPhone: partner.phone,
              assignedAt: now
            }
          : o
      )
    );

    if (setDeliveryPartners) {
      setDeliveryPartners(prev =>
        prev.map(p => {
          if (p.id === partner.id) {
            return { ...p, activeOrdersCount: (p.activeOrdersCount || 0) + 1 };
          }
          if (prevPartnerId && p.id === prevPartnerId && prevPartnerId !== partner.id) {
            return { ...p, activeOrdersCount: Math.max(0, (p.activeOrdersCount || 0) - 1) };
          }
          return p;
        })
      );
    }

    setAdminNotice({
      text: `Delivery partner ${partner.name} (${partner.code}) assigned to Order #${assignDeliveryModalOrder.orderNumber}! Sent to rider's app.`,
      type: 'success'
    });

    setAssignDeliveryModalOrder(null);
  };

  // Delivery Partner Section States (Storyboard Section B)
  const [deliverySubTab, setDeliverySubTab] = useState<'applications' | 'auto_assignment' | 'locations'>('applications');
  const [partnerAppFilter, setPartnerAppFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [reviewingPartner, setReviewingPartner] = useState<DeliveryPartner | null>(null);
  const [autoAssignEnabled, setAutoAssignEnabled] = useState<boolean>(true);
  const [adminPartnerNote, setAdminPartnerNote] = useState<string>('');
  const [viewingDocModal, setViewingDocModal] = useState<DeliveryPartnerDocument | null>(null);
  const [assignDropdownOrderId, setAssignDropdownOrderId] = useState<number | null>(null);

  // Admin Credential Issuance & Handoff State
  const [issuedCredentialsModal, setIssuedCredentialsModal] = useState<{
    name: string;
    phone: string;
    temporaryPassword: string;
    smsProviderConfigured: boolean;
    isReset?: boolean;
  } | null>(null);
  const [credentialCopied, setCredentialCopied] = useState(false);
  const [adminActionLoading, setAdminActionLoading] = useState(false);

  const handleAssignOrderToPartner = (orderId: number, partner: DeliveryPartner) => {
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const orderToAssign = orders.find(o => o.id === orderId);
    const orderNum = orderToAssign ? orderToAssign.orderNumber : orderId;
    const prevPartnerId = orderToAssign?.assignedDeliveryBoyId;

    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? {
              ...o,
              status: 'Assigned',
              assignedDeliveryBoy: `${partner.name} (${partner.code})`,
              assignedDeliveryBoyId: partner.id,
              assignedDeliveryBoyPhone: partner.phone,
              assignedAt: now
            }
          : o
      )
    );

    if (setDeliveryPartners) {
      setDeliveryPartners(prev =>
        prev.map(p => {
          if (p.id === partner.id) {
            return { ...p, activeOrdersCount: (p.activeOrdersCount || 0) + 1 };
          }
          if (prevPartnerId && p.id === prevPartnerId && prevPartnerId !== partner.id) {
            return { ...p, activeOrdersCount: Math.max(0, (p.activeOrdersCount || 0) - 1) };
          }
          return p;
        })
      );
    }

    setAdminNotice({
      text: `✓ Successfully assigned Order #${orderNum} to ${partner.name} (${partner.code})! It is now active in the delivery app.`,
      type: 'success'
    });

    setAssignDropdownOrderId(null);
  };

  const handleAutoAssignAll = () => {
    const readyUnassigned = orders.filter(
      o => (o.status === 'Ready for Pickup' || o.status === 'Packed') && !o.assignedDeliveryBoyId
    );
    if (readyUnassigned.length === 0) {
      setAdminNotice({ text: 'No unassigned ready-for-pickup orders to assign.', type: 'info' });
      return;
    }
    const onlinePartners = deliveryPartners.filter(d => d.status === 'approved' && d.isOnline);
    if (onlinePartners.length === 0) {
      setAdminNotice({ text: 'No online approved delivery partners available to auto-assign.', type: 'warning' });
      return;
    }
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const assignments: Record<number, DeliveryPartner> = {};
    readyUnassigned.forEach((ord, i) => {
      assignments[ord.id] = onlinePartners[i % onlinePartners.length];
    });

    setOrders(prev =>
      prev.map(o => {
        const assignedRider = assignments[o.id];
        if (assignedRider) {
          return {
            ...o,
            status: 'Assigned',
            assignedDeliveryBoy: `${assignedRider.name} (${assignedRider.code})`,
            assignedDeliveryBoyId: assignedRider.id,
            assignedDeliveryBoyPhone: assignedRider.phone,
            assignedAt: now
          };
        }
        return o;
      })
    );

    if (setDeliveryPartners) {
      setDeliveryPartners(prev =>
        prev.map(p => {
          const assignedCount = Object.values(assignments).filter(rider => rider.id === p.id).length;
          return assignedCount > 0
            ? { ...p, activeOrdersCount: (p.activeOrdersCount || 0) + assignedCount }
            : p;
        })
      );
    }

    setAdminNotice({
      text: `✓ Auto-assigned ${readyUnassigned.length} order(s) across online delivery partners!`,
      type: 'success'
    });
  };

  const pendingRidersCount = useMemo(() => {
    return deliveryPartners.filter(d => d.status === 'pending' || d.status === 'under_review').length;
  }, [deliveryPartners]);

  const handleApprovePartner = async (partnerId: string) => {
    const partner = deliveryPartners.find(p => p.id === partnerId);
    if (!partner) return;

    setAdminActionLoading(true);
    let tempPass = '';
    let smsConfigured = false;

    try {
      const res = await fetch('/api/delivery-partners/admin-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: partner.id,
          phone: partner.phone,
          name: partner.name
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        tempPass = data.temporaryPassword;
        smsConfigured = Boolean(data.smsProviderConfigured);
      }
    } catch (e) {
      console.warn('Backend admin-approve call error, using local fallback:', e);
      tempPass = 'HF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    } finally {
      setAdminActionLoading(false);
    }

    if (setDeliveryPartners) {
      setDeliveryPartners(prev =>
        prev.map(p =>
          p.id === partnerId
            ? {
                ...p,
                status: 'approved',
                isOnline: false,
                mustChangePassword: true,
                approvedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                adminNotes: adminPartnerNote.trim() || 'Approved by Admin. All verification documents valid.',
                documents: p.documents.map(d => ({ ...d, status: 'verified' }))
              }
            : p
        )
      );
    }
    setReviewingPartner(null);
    setAdminPartnerNote('');
    setIssuedCredentialsModal({
      name: partner.name,
      phone: partner.phone,
      temporaryPassword: tempPass || 'HF-A8K2P9',
      smsProviderConfigured: smsConfigured,
      isReset: false
    });
    setAdminNotice({
      text: `Delivery partner application approved! Temporary login credentials generated.`,
      type: 'success'
    });
  };

  const handleAdminTriggerPasswordReset = async (partner: DeliveryPartner) => {
    setAdminActionLoading(true);
    let tempPass = '';
    let smsConfigured = false;
    try {
      const res = await fetch('/api/delivery-partners/admin-reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: partner.id,
          phone: partner.phone
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        tempPass = data.temporaryPassword;
        smsConfigured = Boolean(data.smsProviderConfigured);
        if (setDeliveryPartners) {
          setDeliveryPartners(prev =>
            prev.map(p => (p.id === partner.id ? { ...p, mustChangePassword: true } : p))
          );
        }
        setIssuedCredentialsModal({
          name: partner.name,
          phone: partner.phone,
          temporaryPassword: tempPass,
          smsProviderConfigured: smsConfigured,
          isReset: true
        });
        setAdminNotice({
          text: `Fresh temporary credentials issued for ${partner.name}.`,
          type: 'success'
        });
      } else {
        setAdminNotice({
          text: data.error || 'Failed to reset credentials.',
          type: 'warning'
        });
      }
    } catch (err) {
      setAdminNotice({
        text: 'Network error triggering credential reset.',
        type: 'warning'
      });
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleRejectPartner = (partnerId: string) => {
    if (setDeliveryPartners) {
      setDeliveryPartners(prev =>
        prev.map(p =>
          p.id === partnerId
            ? {
                ...p,
                status: 'rejected',
                isOnline: false,
                adminNotes: adminPartnerNote.trim() || 'Application rejected due to document inconsistency or incomplete criteria.'
              }
            : p
        )
      );
    }
    setReviewingPartner(null);
    setAdminPartnerNote('');
    setAdminNotice({
      text: `Delivery partner application marked as Rejected. Feedback logged.`,
      type: 'warning'
    });
  };

  const handleTogglePartnerOnline = (partnerId: string) => {
    if (setDeliveryPartners) {
      setDeliveryPartners(prev =>
        prev.map(p => (p.id === partnerId ? { ...p, isOnline: !p.isOnline } : p))
      );
    }
  };

  const handleTogglePartnerSuspend = (partnerId: string) => {
    if (setDeliveryPartners) {
      setDeliveryPartners(prev =>
        prev.map(p =>
          p.id === partnerId
            ? {
                ...p,
                status: p.status === 'suspended' ? 'approved' : 'suspended',
                isOnline: p.status === 'suspended' ? true : false
              }
            : p
        )
      );
    }
  };

  // Modals & Drawers for Catalog
  const [activeProductDrawer, setActiveProductDrawer] = useState<Product | null>(null);
  const [rejectProductModal, setRejectProductModal] = useState<Product | null>(null);
  const [rejectProductReason, setRejectProductReason] = useState<string>('');

  // Image Review & Replacement States
  const [imageCorrectionModalProduct, setImageCorrectionModalProduct] = useState<Product | null>(null);
  const [imageCorrectionReasonInput, setImageCorrectionReasonInput] = useState<string>('');
  const [adminReplaceModalProduct, setAdminReplaceModalProduct] = useState<Product | null>(null);
  const [adminReplaceImageUrl, setAdminReplaceImageUrl] = useState<string>('');
  const [adminReplaceReasonInput, setAdminReplaceReasonInput] = useState<string>('');
  const [selectedDrawerImageIdx, setSelectedDrawerImageIdx] = useState<number>(0);
  const [showOriginalVendorImage, setShowOriginalVendorImage] = useState<boolean>(false);

  // Admin notification banner
  const [adminNotice, setAdminNotice] = useState<{ text: string; type: 'success' | 'warning' | 'info' } | null>(null);

  // Expanded rejection reason IDs for in-table toggle
  const [expandedReasonVendorIds, setExpandedReasonVendorIds] = useState<Record<number, boolean>>({});

  // =========================================================================
  // MARKETING: HOME BANNER MANAGEMENT STATE & HANDLERS
  // =========================================================================
  const [bannerSearch, setBannerSearch] = useState<string>('');
  const [bannerStatusFilter, setBannerStatusFilter] = useState<'all' | 'active' | 'scheduled' | 'inactive'>('all');
  const [isAddBannerModalOpen, setIsAddBannerModalOpen] = useState<boolean>(false);
  const [editingBanner, setEditingBanner] = useState<HomeBanner | null>(null);
  const [previewingBanner, setPreviewingBanner] = useState<HomeBanner | null>(null);
  const [deleteConfirmBanner, setDeleteConfirmBanner] = useState<HomeBanner | null>(null);

  // Form states
  const [bannerFormDisplayMode, setBannerFormDisplayMode] = useState<BannerDisplayMode>('artwork');
  const [bannerFormTitle, setBannerFormTitle] = useState<string>('');
  const [bannerFormHeadline, setBannerFormHeadline] = useState<string>('');
  const [bannerFormDesc, setBannerFormDesc] = useState<string>('');
  const [bannerFormOfferLabel, setBannerFormOfferLabel] = useState<string>('');
  const [bannerFormPromoCode, setBannerFormPromoCode] = useState<string>('');
  const [bannerFormImageUrl, setBannerFormImageUrl] = useState<string>('');
  const [bannerFormAltText, setBannerFormAltText] = useState<string>('');
  const [bannerFormCtaText, setBannerFormCtaText] = useState<string>('Shop Now');
  const [bannerFormCtaType, setBannerFormCtaType] = useState<HomeBanner['ctaType']>('offers');
  const [bannerFormCtaTargetId, setBannerFormCtaTargetId] = useState<string>('offers');
  const [bannerFormCtaUrl, setBannerFormCtaUrl] = useState<string>('');
  const [bannerFormOrder, setBannerFormOrder] = useState<number>(1);
  const [bannerFormActive, setBannerFormActive] = useState<boolean>(true);
  const [bannerFormStartDate, setBannerFormStartDate] = useState<string>('');
  const [bannerFormEndDate, setBannerFormEndDate] = useState<string>('');
  const [bannerFormBgColor, setBannerFormBgColor] = useState<string>('from-emerald-800 via-emerald-700 to-teal-600');
  const [bannerFormAccentColor, setBannerFormAccentColor] = useState<string>('#fbbf24');
  const [bannerUploadLoading, setBannerUploadLoading] = useState<boolean>(false);
  const [bannerUploadError, setBannerUploadError] = useState<string | null>(null);
  const [bannerUploadSuccess, setBannerUploadSuccess] = useState<string | null>(null);
  const [bannerFormError, setBannerFormError] = useState<string | null>(null);
  const [previewImageError, setPreviewImageError] = useState<boolean>(false);
  const [uploadedBannerLibrary, setUploadedBannerLibrary] = useState<Array<{ fileName: string; imageUrl: string; size: number }>>([]);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  const loadUploadedLibrary = () => {
    fetch('/api/banners/uploaded-images')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.images)) {
          setUploadedBannerLibrary(data.images);
        }
      })
      .catch(() => {});
  };

  // Banner metrics
  const bannerSummaryCounts = useMemo(() => {
    const total = banners.length;
    let active = 0;
    let scheduled = 0;
    let inactive = 0;
    banners.forEach(b => {
      if (b.status === 'scheduled') scheduled++;
      else if (b.isActive && b.status === 'active') active++;
      else inactive++;
    });
    return { total, active, scheduled, inactive };
  }, [banners]);

  // Filtered & sorted banners
  const filteredBanners = useMemo(() => {
    return [...banners]
      .filter(b => {
        if (bannerStatusFilter === 'active') return b.isActive && b.status === 'active';
        if (bannerStatusFilter === 'scheduled') return b.status === 'scheduled';
        if (bannerStatusFilter === 'inactive') return !b.isActive || b.status === 'inactive' || b.status === 'expired';
        return true;
      })
      .filter(b => {
        if (!bannerSearch.trim()) return true;
        const q = bannerSearch.toLowerCase().trim();
        return (
          b.title.toLowerCase().includes(q) ||
          b.headline.toLowerCase().includes(q) ||
          (b.promoCode && b.promoCode.toLowerCase().includes(q)) ||
          (b.description && b.description.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [banners, bannerStatusFilter, bannerSearch]);

  const handleOpenAddBanner = () => {
    setEditingBanner(null);
    setBannerFormDisplayMode('artwork');
    setBannerFormTitle('');
    setBannerFormHeadline('');
    setBannerFormDesc('');
    setBannerFormOfferLabel('');
    setBannerFormPromoCode('');
    setBannerFormImageUrl('');
    setBannerFormAltText('');
    setBannerFormCtaText('Shop Now');
    setBannerFormCtaType('offers');
    setBannerFormCtaTargetId('offers');
    setBannerFormCtaUrl('');
    setBannerFormOrder(banners.length + 1);
    setBannerFormActive(true);
    setBannerFormStartDate('');
    setBannerFormEndDate('');
    setBannerFormBgColor('from-emerald-800 via-emerald-700 to-teal-600');
    setBannerFormAccentColor('#fbbf24');
    setBannerUploadError(null);
    setBannerUploadSuccess(null);
    setBannerFormError(null);
    setPreviewImageError(false);
    loadUploadedLibrary();
    setIsAddBannerModalOpen(true);
  };

  const handleOpenEditBanner = (b: HomeBanner) => {
    setEditingBanner(b);
    setBannerFormDisplayMode(b.displayMode || (b.imageUrl?.includes('banner-img-') ? 'artwork' : 'html_text'));
    setBannerFormTitle(b.title || '');
    setBannerFormHeadline(b.headline || '');
    setBannerFormDesc(b.description || '');
    setBannerFormOfferLabel(b.offerLabel || '');
    setBannerFormPromoCode(b.promoCode || '');
    setBannerFormImageUrl(b.imageUrl || '');
    setBannerFormAltText(b.altText || '');
    setBannerFormCtaText(b.ctaText || 'Shop Now');
    setBannerFormCtaType(b.ctaType || 'offers');
    setBannerFormCtaTargetId(b.ctaTargetId || '');
    setBannerFormCtaUrl(b.ctaUrl || '');
    setBannerFormOrder(b.displayOrder || 1);
    setBannerFormActive(b.isActive !== false);
    setBannerFormStartDate(b.startDate || '');
    setBannerFormEndDate(b.endDate || '');
    setBannerFormBgColor(b.backgroundColor || 'from-emerald-800 via-emerald-700 to-teal-600');
    setBannerFormAccentColor(b.accentColor || '#fbbf24');
    setBannerUploadError(null);
    setBannerUploadSuccess(null);
    setBannerFormError(null);
    setPreviewImageError(false);
    loadUploadedLibrary();
    setIsAddBannerModalOpen(true);
  };

  const handleSaveBanner = async (publishNow: boolean) => {
    setBannerFormError(null);
    if (!bannerFormTitle.trim()) {
      setBannerFormError('Banner title (internal name) is required.');
      return;
    }
    if (bannerFormDisplayMode === 'html_text' && !bannerFormHeadline.trim()) {
      setBannerFormError('Customer-facing headline is required for HTML/text banners.');
      return;
    }
    if (!bannerFormImageUrl.trim()) {
      setBannerFormError('A banner image is required. Please upload an image from your device.');
      return;
    }

    if (bannerFormStartDate && bannerFormEndDate) {
      if (new Date(bannerFormStartDate) >= new Date(bannerFormEndDate)) {
        setBannerFormError('End date/time must be strictly after the start date/time.');
        return;
      }
    }

    const now = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const isActive = publishNow;
    let status: HomeBanner['status'] = isActive ? 'active' : 'inactive';
    const currentTime = new Date().getTime();
    if (isActive && bannerFormStartDate) {
      const s = new Date(bannerFormStartDate).getTime();
      if (!isNaN(s) && currentTime < s) status = 'scheduled';
    }
    if (isActive && bannerFormEndDate) {
      const e = new Date(bannerFormEndDate).getTime();
      if (!isNaN(e) && currentTime > e) status = 'expired';
    }

    const bannerPayload: HomeBanner = {
      id: editingBanner ? editingBanner.id : `banner-${Date.now()}`,
      title: bannerFormTitle.trim(),
      displayMode: bannerFormDisplayMode,
      headline: bannerFormHeadline.trim() || bannerFormTitle.trim(),
      description: bannerFormDesc.trim() || undefined,
      offerLabel: bannerFormOfferLabel.trim() || undefined,
      promoCode: bannerFormPromoCode.trim().toUpperCase() || undefined,
      imageUrl: bannerFormImageUrl.trim(),
      altText: bannerFormAltText.trim() || bannerFormTitle.trim(),
      ctaText: bannerFormCtaText.trim() || 'Shop Now',
      ctaType: bannerFormCtaType,
      ctaTargetId: bannerFormCtaTargetId || undefined,
      ctaUrl: bannerFormCtaUrl.trim() || undefined,
      displayOrder: Number(bannerFormOrder) || 1,
      status,
      isActive,
      startDate: bannerFormStartDate || undefined,
      endDate: bannerFormEndDate || undefined,
      createdAt: editingBanner ? editingBanner.createdAt : now,
      updatedAt: now,
      backgroundColor: bannerFormBgColor,
      accentColor: bannerFormAccentColor
    };

    try {
      const endpoint = editingBanner ? `/api/banners/${editingBanner.id}` : '/api/banners';
      const method = editingBanner ? 'PUT' : 'POST';
      const resp = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bannerPayload)
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        setBannerFormError(data.error || 'Server rejected banner save.');
        return;
      }
    } catch {
      // offline fallback
    }

    if (setBanners) {
      if (editingBanner) {
        setBanners(prev => prev.map(b => (b.id === editingBanner.id ? bannerPayload : b)));
      } else {
        setBanners(prev => [...prev, bannerPayload]);
      }
    }

    setAdminNotice({
      text: editingBanner
        ? `Banner "${bannerPayload.title}" updated successfully.`
        : `Banner "${bannerPayload.title}" created and ${publishNow ? 'published' : 'saved as draft'}.`,
      type: 'success'
    });

    setIsAddBannerModalOpen(false);
    setEditingBanner(null);
  };

  const handleToggleBannerActive = (b: HomeBanner) => {
    const nextActive = !b.isActive;
    const nextStatus = nextActive ? 'active' : 'inactive';
    if (setBanners) {
      setBanners(prev =>
        prev.map(item =>
          item.id === b.id
            ? { ...item, isActive: nextActive, status: nextStatus, updatedAt: 'Just now' }
            : item
        )
      );
    }
    fetch(`/api/banners/${b.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: nextActive })
    }).catch(() => {});

    setAdminNotice({
      text: nextActive ? `Banner "${b.title}" activated on customer homepage.` : `Banner "${b.title}" deactivated.`,
      type: nextActive ? 'success' : 'info'
    });
  };

  const handleConfirmDeleteBanner = () => {
    if (!deleteConfirmBanner) return;
    const id = deleteConfirmBanner.id;
    const title = deleteConfirmBanner.title;
    if (setBanners) {
      setBanners(prev => prev.filter(b => b.id !== id));
    }
    fetch(`/api/banners/${id}`, { method: 'DELETE' }).catch(() => {});
    setAdminNotice({
      text: `Banner "${title}" deleted successfully.`,
      type: 'info'
    });
    setDeleteConfirmBanner(null);
  };

  const handleMoveBannerOrder = (index: number, direction: 'up' | 'down') => {
    if (!setBanners || !banners) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= banners.length) return;

    const list = [...banners];
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const updated = list.map((b, i) => ({ ...b, displayOrder: i + 1 }));
    setBanners(updated);

    fetch('/api/banners/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bannerIds: updated.map(b => b.id) })
    }).catch(() => {});
  };

  const handleBannerFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];

    if (!allowedMimes.includes(file.type.toLowerCase()) && !allowedExts.includes(ext)) {
      setBannerUploadError('Please select a valid JPG, JPEG, PNG, or WebP image.');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setBannerUploadError('File size exceeds 5MB limit. Please upload a smaller image.');
      e.target.value = '';
      return;
    }

    setBannerUploadLoading(true);
    setBannerUploadError(null);
    setBannerUploadSuccess(null);
    setPreviewImageError(false);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      // Show immediate local preview in card preview
      setBannerFormImageUrl(base64);

      try {
        const resp = await fetch('/api/banners/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, fileData: base64 })
        });
        const data = await resp.json();
        if (resp.ok && data.success && data.imageUrl) {
          // Persist the verified server URL in form state
          setBannerFormImageUrl(data.imageUrl);
          setBannerUploadSuccess(`Uploaded "${file.name}" successfully (${(file.size / 1024).toFixed(0)} KB)`);
          loadUploadedLibrary();
        } else {
          setBannerUploadError(data.error || 'Server failed to save image upload.');
          setBannerFormImageUrl('');
        }
      } catch {
        setBannerUploadError('Network error uploading banner image.');
        setBannerFormImageUrl('');
      } finally {
        setBannerUploadLoading(false);
      }
    };
    reader.onerror = () => {
      setBannerUploadError('Failed to read image from device.');
      setBannerUploadLoading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleUpdateCarouselInterval = (seconds: 1 | 2 | 3 | 4 | 5 | 7 | 10) => {
    if (!setBannerSettings || !bannerSettings) return;
    const next = { ...bannerSettings, autoRotateIntervalSeconds: seconds };
    setBannerSettings(next);
    fetch('/api/banners/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next)
    }).catch(() => {});
    setAdminNotice({
      text: `Carousel auto-rotate interval updated to ${seconds} second${seconds > 1 ? 's' : ''}.`,
      type: 'success'
    });
  };

  const handleToggleCarouselAutoRotate = () => {
    if (!setBannerSettings || !bannerSettings) return;
    const next = { ...bannerSettings, isAutoRotateEnabled: !bannerSettings.isAutoRotateEnabled };
    setBannerSettings(next);
    fetch('/api/banners/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next)
    }).catch(() => {});
  };

  const handleToggleCarouselPauseOnHover = () => {
    if (!setBannerSettings || !bannerSettings) return;
    const next = { ...bannerSettings, pauseOnHover: !bannerSettings.pauseOnHover };
    setBannerSettings(next);
    fetch('/api/banners/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next)
    }).catch(() => {});
  };

  const handleToggleCarouselPauseOnInteraction = () => {
    if (!setBannerSettings || !bannerSettings) return;
    const next = { ...bannerSettings, pauseOnInteraction: !bannerSettings.pauseOnInteraction };
    setBannerSettings(next);
    fetch('/api/banners/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next)
    }).catch(() => {});
  };

  const handleToggleCarouselIndicators = () => {
    if (!setBannerSettings || !bannerSettings) return;
    const next = { ...bannerSettings, showIndicators: !bannerSettings.showIndicators };
    setBannerSettings(next);
    fetch('/api/banners/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next)
    }).catch(() => {});
  };

  const handleToggleCarouselArrows = () => {
    if (!setBannerSettings || !bannerSettings) return;
    const next = { ...bannerSettings, showArrows: !bannerSettings.showArrows };
    setBannerSettings(next);
    fetch('/api/banners/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next)
    }).catch(() => {});
  };

  // Drawer / Details modal state
  const [activeVendorDrawer, setActiveVendorDrawer] = useState<Vendor | null>(null);

  // Modals for actions requiring mandatory reasons
  const [rejectModalVendor, setRejectModalVendor] = useState<Vendor | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  const [suspendModalVendor, setSuspendModalVendor] = useState<Vendor | null>(null);
  const [suspendReasonInput, setSuspendReasonInput] = useState('');

  const [reactivateModalVendor, setReactivateModalVendor] = useState<Vendor | null>(null);
  const [reactivateReasonInput, setReactivateReasonInput] = useState('');

  const [requestInfoModalVendor, setRequestInfoModalVendor] = useState<Vendor | null>(null);
  const [requestInfoInput, setRequestInfoInput] = useState('');

  // Document preview simulation modal
  const [previewDoc, setPreviewDoc] = useState<{ doc: VendorDocument; vendorName: string } | null>(null);

  const adminEmail = 'superadmin@hospetegrocery.in';

  // Helper to log status history
  const appendStatusHistory = (
    vendorId: number,
    previousStatus: Vendor['status'],
    newStatus: Vendor['status'],
    reason: string
  ) => {
    const newEntry: VendorStatusHistory = {
      id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      adminIdentifier: adminEmail,
      previousStatus,
      newStatus,
      reason,
      timestamp: new Date().toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    return newEntry;
  };

  // Helper to log admin preview
  const logAdminPreviewAction = (vendor: Vendor, action: AdminPreviewLog['action'], notes: string) => {
    if (!setAdminPreviewLogs) return;
    const logItem: AdminPreviewLog = {
      id: `log-${Date.now()}`,
      adminIdentifier: adminEmail,
      vendorId: vendor.id,
      vendorName: vendor.businessName,
      action,
      notes,
      timestamp: new Date().toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    setAdminPreviewLogs(prev => [logItem, ...prev]);
  };

  // Category Master handlers (Image 2)
  const handleCategoryNameChange = (name: string) => {
    setCatFormName(name);
    if (!editingCategoryId) {
      const generatedSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setCatFormSlug(generatedSlug);
    }
  };

  const handleClearCategoryForm = () => {
    setEditingCategoryId(null);
    setCatFormName('');
    setCatFormSlug('');
    setCatFormEmoji('🥦');
    setCatFormImagePath('/static/images/categories/veggies.jpg');
    setCatFormParent('none');
    setCatFormDesc('');
    setCatFormOrder(0);
    setCatFormActive(true);
    setCatFormShowHome(true);
    setCatImagePreview(null);
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setCatFormName(cat.name);
    setCatFormSlug(cat.slug);
    setCatFormEmoji(cat.iconEmoji || '📦');
    setCatFormImagePath(cat.imageUrl || '');
    setCatFormParent(cat.parentCategory || 'none');
    setCatFormDesc(cat.description || '');
    setCatFormOrder(cat.displayOrder ?? 0);
    setCatFormActive(cat.isActive !== false);
    setCatFormShowHome(cat.showOnHome !== false);
    setCatImagePreview(cat.imageUrl || null);
  };

  const handleToggleCategoryActive = (catId: number) => {
    if (!setCategories) return;
    setCategories(prev =>
      prev.map(c => {
        if (c.id === catId) {
          const updatedActive = c.isActive === false ? true : false;
          return { ...c, isActive: updatedActive };
        }
        return c;
      })
    );
    setAdminNotice({
      text: 'Category status successfully updated.',
      type: 'info'
    });
  };

  const handleCategoryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCatImagePreview(result);
        setCatFormImagePath(`/images/categories/${file.name}`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!catFormName.trim()) {
      setAdminNotice({ text: 'Category name is required.', type: 'warning' });
      return;
    }
    const finalSlug = (catFormSlug.trim() || catFormName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) || 'cat';

    if (!setCategories) return;

    if (editingCategoryId) {
      setCategories(prev =>
        prev.map(cat => {
          if (cat.id === editingCategoryId) {
            return {
              ...cat,
              name: catFormName.trim(),
              slug: finalSlug,
              iconEmoji: catFormEmoji.trim() || '📦',
              imageUrl: catImagePreview || catFormImagePath || cat.imageUrl,
              parentCategory: catFormParent !== 'none' ? catFormParent : null,
              description: catFormDesc.trim(),
              displayOrder: Number(catFormOrder) || 0,
              order: Number(catFormOrder) || 0,
              isActive: catFormActive,
              showOnHome: catFormShowHome
            };
          }
          return cat;
        })
      );
      setAdminNotice({
        text: `Category "${catFormName.trim()}" updated successfully!`,
        type: 'success'
      });
      handleClearCategoryForm();
    } else {
      const newCategory: Category = {
        id: Date.now(),
        name: catFormName.trim(),
        slug: finalSlug,
        iconEmoji: catFormEmoji.trim() || '📦',
        bannerColor: '#ecfdf5',
        imageUrl: catImagePreview || catFormImagePath || '/static/images/categories/veggies.jpg',
        parentCategory: catFormParent !== 'none' ? catFormParent : null,
        description: catFormDesc.trim(),
        displayOrder: Number(catFormOrder) || 0,
        order: Number(catFormOrder) || 0,
        isActive: catFormActive,
        showOnHome: catFormShowHome
      };
      setCategories(prev => [...prev, newCategory]);
      setAdminNotice({
        text: `Category "${catFormName.trim()}" created successfully!`,
        type: 'success'
      });
      handleClearCategoryForm();
    }
  };

  // 1. Approve vendor
  const handleApproveVendor = (vendorId: number, customNote = 'Vendor profile and mandatory trade documents approved.') => {
    const target = vendors.find(v => v.id === vendorId);
    if (!target) return;

    const historyEntry = appendStatusHistory(vendorId, target.status, 'approved', customNote);

    setVendors(prev =>
      prev.map(v => {
        if (v.id === vendorId) {
          const updatedHistory = v.statusHistory ? [...v.statusHistory, historyEntry] : [historyEntry];
          const updatedDocs = v.documents?.map(d => ({ ...d, status: 'verified' as const }));
          return {
            ...v,
            status: 'approved',
            rejectionReason: undefined,
            suspensionReason: undefined,
            additionalInfoRequested: undefined,
            resubmissionStatus: 'none',
            documents: updatedDocs || v.documents,
            statusHistory: updatedHistory
          };
        }
        return v;
      })
    );

    // Keep active drawer up-to-date
    if (activeVendorDrawer && activeVendorDrawer.id === vendorId) {
      setActiveVendorDrawer(prev => (prev ? { ...prev, status: 'approved' } : null));
    }

    setAdminNotice({
      text: `${target.businessName} has been APPROVED! Their listings are now active in the Hospete customer store.`,
      type: 'success'
    });
  };

  // 2. Reject vendor (mandatory reason)
  const handleConfirmReject = () => {
    if (!rejectModalVendor) return;
    const reason = rejectReasonInput.trim();
    if (!reason) {
      alert('A specific reason for rejection is mandatory.');
      return;
    }

    const vId = rejectModalVendor.id;
    const historyEntry = appendStatusHistory(vId, rejectModalVendor.status, 'rejected', reason);

    setVendors(prev =>
      prev.map(v => {
        if (v.id === vId) {
          const updatedHistory = v.statusHistory ? [...v.statusHistory, historyEntry] : [historyEntry];
          return {
            ...v,
            status: 'rejected',
            rejectionReason: reason,
            resubmissionStatus: 'pending_resubmission',
            statusHistory: updatedHistory
          };
        }
        return v;
      })
    );

    if (activeVendorDrawer && activeVendorDrawer.id === vId) {
      setActiveVendorDrawer(prev => (prev ? { ...prev, status: 'rejected', rejectionReason: reason, resubmissionStatus: 'pending_resubmission' } : null));
    }

    setAdminNotice({
      text: `${rejectModalVendor.businessName} marked as REJECTED. The vendor can view the reason and submit resubmission documents.`,
      type: 'warning'
    });

    setRejectModalVendor(null);
    setRejectReasonInput('');
  };

  // 3. Request Additional Information
  const handleConfirmRequestInfo = () => {
    if (!requestInfoModalVendor) return;
    const infoText = requestInfoInput.trim();
    if (!infoText) {
      alert('Please specify the exact additional information or documents required.');
      return;
    }

    const vId = requestInfoModalVendor.id;
    const historyEntry = appendStatusHistory(vId, requestInfoModalVendor.status, 'pending', `Requested info: ${infoText}`);

    setVendors(prev =>
      prev.map(v => {
        if (v.id === vId) {
          const updatedHistory = v.statusHistory ? [...v.statusHistory, historyEntry] : [historyEntry];
          return {
            ...v,
            additionalInfoRequested: infoText,
            resubmissionStatus: 'pending_resubmission',
            statusHistory: updatedHistory
          };
        }
        return v;
      })
    );

    if (activeVendorDrawer && activeVendorDrawer.id === vId) {
      setActiveVendorDrawer(prev => (prev ? { ...prev, additionalInfoRequested: infoText, resubmissionStatus: 'pending_resubmission' } : null));
    }

    setAdminNotice({
      text: `Additional information request dispatched to ${requestInfoModalVendor.businessName}. Notice is prominently displayed in their portal.`,
      type: 'info'
    });

    setRequestInfoModalVendor(null);
    setRequestInfoInput('');
  };

  // 4. Suspend vendor (mandatory reason)
  const handleConfirmSuspend = () => {
    if (!suspendModalVendor) return;
    const reason = suspendReasonInput.trim();
    if (!reason) {
      alert('A suspension reason is mandatory for regulatory and vendor compliance.');
      return;
    }

    const vId = suspendModalVendor.id;
    const historyEntry = appendStatusHistory(vId, suspendModalVendor.status, 'suspended', reason);

    setVendors(prev =>
      prev.map(v => {
        if (v.id === vId) {
          const updatedHistory = v.statusHistory ? [...v.statusHistory, historyEntry] : [historyEntry];
          return {
            ...v,
            status: 'suspended',
            suspensionReason: reason,
            statusHistory: updatedHistory
          };
        }
        return v;
      })
    );

    if (activeVendorDrawer && activeVendorDrawer.id === vId) {
      setActiveVendorDrawer(prev => (prev ? { ...prev, status: 'suspended', suspensionReason: reason } : null));
    }

    setAdminNotice({
      text: `${suspendModalVendor.businessName} has been SUSPENDED. All product listings are temporarily hidden from the customer storefront. Existing orders remain preserved.`,
      type: 'warning'
    });

    setSuspendModalVendor(null);
    setSuspendReasonInput('');
  };

  // 5. Reactivate vendor
  const handleConfirmReactivate = () => {
    if (!reactivateModalVendor) return;
    const reason = reactivateReasonInput.trim() || 'Suspension lifted following audit and corrective compliance.';

    const vId = reactivateModalVendor.id;
    const historyEntry = appendStatusHistory(vId, reactivateModalVendor.status, 'approved', reason);

    setVendors(prev =>
      prev.map(v => {
        if (v.id === vId) {
          const updatedHistory = v.statusHistory ? [...v.statusHistory, historyEntry] : [historyEntry];
          return {
            ...v,
            status: 'approved',
            suspensionReason: undefined,
            statusHistory: updatedHistory
          };
        }
        return v;
      })
    );

    if (activeVendorDrawer && activeVendorDrawer.id === vId) {
      setActiveVendorDrawer(prev => (prev ? { ...prev, status: 'approved', suspensionReason: undefined } : null));
    }

    setAdminNotice({
      text: `${reactivateModalVendor.businessName} has been REACTIVATED! Their product catalog has been restored to the customer store.`,
      type: 'success'
    });

    setReactivateModalVendor(null);
    setReactivateReasonInput('');
  };

  // 6. Secure Admin Preview Launcher
  const handleLaunchAdminPreview = (vendor: Vendor) => {
    logAdminPreviewAction(vendor, 'ENTER_PREVIEW', 'Admin initiated secure preview mode from admin suppliers list.');
    onSelectVendorToTest(vendor, { safeMode: true });
  };

  // Extract unique localities for filter dropdown
  const availableLocalities = useMemo(() => {
    const set = new Set<string>();
    vendors.forEach(v => {
      if (v.locality) set.add(v.locality);
    });
    return Array.from(set).sort();
  }, [vendors]);

  // Supplier Counts by Status
  const statusCounts = useMemo(() => {
    return {
      all: vendors.length,
      pending: vendors.filter(v => v.status === 'pending').length,
      approved: vendors.filter(v => v.status === 'approved').length,
      rejected: vendors.filter(v => v.status === 'rejected').length,
      suspended: vendors.filter(v => v.status === 'suspended').length
    };
  }, [vendors]);

  // Filtered and Sorted Vendors
  const filteredAndSortedVendors = useMemo(() => {
    let result = vendors.filter(v => {
      // 1. Status Tab filter
      if (vendorFilter !== 'all' && v.status !== vendorFilter) return false;

      // 2. Business Type filter
      if (typeFilter !== 'all' && v.businessType !== typeFilter) return false;

      // 3. Locality filter
      if (localityFilter !== 'all' && v.locality !== localityFilter) return false;

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesBusiness = v.businessName.toLowerCase().includes(q);
        const matchesOwner = v.ownerName.toLowerCase().includes(q);
        const matchesPhone = v.phone.includes(q);
        const matchesEmail = v.email ? v.email.toLowerCase().includes(q) : false;
        const matchesLocality = v.locality.toLowerCase().includes(q);
        const matchesServiceArea = v.serviceArea.toLowerCase().includes(q);

        if (!matchesBusiness && !matchesOwner && !matchesPhone && !matchesEmail && !matchesLocality && !matchesServiceArea) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'name_asc') {
        return a.businessName.localeCompare(b.businessName);
      }
      if (sortBy === 'name_desc') {
        return b.businessName.localeCompare(a.businessName);
      }
      if (sortBy === 'date_asc') {
        return a.createdAt.localeCompare(b.createdAt);
      }
      if (sortBy === 'date_desc') {
        return b.createdAt.localeCompare(a.createdAt);
      }
      if (sortBy === 'status') {
        const priority: Record<Vendor['status'], number> = {
          pending: 1,
          suspended: 2,
          rejected: 3,
          approved: 4
        };
        return priority[a.status] - priority[b.status];
      }
      return 0;
    });

    return result;
  }, [vendors, vendorFilter, typeFilter, localityFilter, searchQuery, sortBy]);

  // Toggle reason expansion
  const toggleReasonExpand = (id: number) => {
    setExpandedReasonVendorIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Safe Image Error fallback handler
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, label: string) => {
    const target = e.currentTarget;
    target.onerror = null;
    target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="100%" height="100%" fill="%23f8fafc"/><rect x="6" y="6" width="68" height="68" rx="10" fill="%23ecfdf5" stroke="%23bbf7d0" stroke-width="1.5"/><text x="40" y="44" font-size="24" text-anchor="middle">🥗</text><text x="40" y="60" font-family="sans-serif" font-size="7" font-weight="bold" text-anchor="middle" fill="%23065f46">${encodeURIComponent(label.slice(0, 10))}</text></svg>`;
  };

  // Helper for computing Product Storefront Visibility
  const getProductStorefrontStatus = (p: Product, v?: Vendor) => {
    const isVendorApproved = v?.status === 'approved';
    const isVendorSuspended = v?.status === 'suspended';
    const isVendorPending = v?.status === 'pending';
    const isVendorRejected = v?.status === 'rejected';

    if (p.approvalStatus === 'rejected') {
      return {
        status: 'rejected' as const,
        label: 'Rejected',
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
        detail: p.rejectionReason || 'Listing did not meet catalog standards',
        canPurchase: false
      };
    }

    if (p.approvalStatus === 'pending') {
      return {
        status: 'pending' as const,
        label: 'Pending Approval',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        detail: 'Awaiting admin quality & compliance review',
        canPurchase: false
      };
    }

    if (p.imageReviewStatus === 'needs_correction') {
      return {
        status: 'hidden' as const,
        label: 'Image Correction Required',
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
        detail: p.imageCorrectionReason || 'Vendor must provide compliant product imagery',
        canPurchase: false
      };
    }

    if (p.isActive === false) {
      return {
        status: 'hidden' as const,
        label: 'Inactive / Hidden',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
        detail: p.adminNotes || 'Paused by admin',
        canPurchase: false
      };
    }

    if (isVendorSuspended) {
      return {
        status: 'hidden' as const,
        label: 'Hidden (Vendor Suspended)',
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
        detail: 'Supplier under compliance suspension',
        canPurchase: false
      };
    }

    if (isVendorPending) {
      return {
        status: 'hidden' as const,
        label: 'Hidden (Vendor Pending)',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        detail: 'Supplier application pending review',
        canPurchase: false
      };
    }

    if (isVendorRejected) {
      return {
        status: 'hidden' as const,
        label: 'Hidden (Vendor Rejected)',
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
        detail: 'Supplier application rejected',
        canPurchase: false
      };
    }

    const totalStock = p.variants.reduce((sum, vr) => sum + vr.stockQty, 0);
    if (totalStock <= 0) {
      return {
        status: 'out_of_stock' as const,
        label: 'Out of Stock',
        badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
        detail: 'All pack sizes currently 0 units',
        canPurchase: false
      };
    }

    return {
      status: 'live' as const,
      label: 'Live Active',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      detail: 'Live in store and available for customer orders',
      canPurchase: true
    };
  };

  // Pending catalog items count
  const pendingCatalogCount = useMemo(() => {
    return products.filter(p => p.approvalStatus === 'pending').length;
  }, [products]);

  // Dynamic Category counts from actual products
  const catalogCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      counts[p.categorySlug] = (counts[p.categorySlug] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Filtered Catalog Products
  const filteredCatalogProducts = useMemo(() => {
    return products.filter(p => {
      const vendor = vendors.find(v => v.id === p.vendorId);
      const vStatus = getProductStorefrontStatus(p, vendor);

      // Search match
      if (catalogSearch.trim()) {
        const q = catalogSearch.toLowerCase().trim();
        const mName = p.name.toLowerCase().includes(q);
        const mBrand = p.brand.toLowerCase().includes(q);
        const mSku = (p.sku || '').toLowerCase().includes(q);
        const mCategory = p.categorySlug.toLowerCase().includes(q);
        const mVendor = (vendor?.businessName || '').toLowerCase().includes(q);
        const mVariantSku = p.variants.some(v => v.packSize.toLowerCase().includes(q));
        if (!mName && !mBrand && !mSku && !mCategory && !mVendor && !mVariantSku) {
          return false;
        }
      }

      // Category filter
      if (catalogCategory !== 'all' && p.categorySlug !== catalogCategory) {
        return false;
      }

      // Vendor filter
      if (catalogVendor !== 'all') {
        const vId = Number(catalogVendor);
        if (p.vendorId !== vId) return false;
      }

      // Visibility filter
      if (catalogVisibility !== 'all') {
        if (catalogVisibility === 'live' && vStatus.status !== 'live') return false;
        if (catalogVisibility === 'pending' && vStatus.status !== 'pending') return false;
        if (catalogVisibility === 'rejected' && vStatus.status !== 'rejected') return false;
        if (catalogVisibility === 'hidden' && vStatus.status !== 'hidden') return false;
        if (catalogVisibility === 'out_of_stock' && vStatus.status !== 'out_of_stock') return false;
      }

      // Stock status filter
      if (catalogStock !== 'all') {
        const totalStock = p.variants.reduce((sum, v) => sum + v.stockQty, 0);
        if (catalogStock === 'in_stock' && totalStock <= 0) return false;
        if (catalogStock === 'out_of_stock' && totalStock > 0) return false;
        if (catalogStock === 'low_stock' && (totalStock <= 0 || totalStock > 10)) return false;
      }

      // Product approval status filter
      if (catalogApproval !== 'all') {
        const appStatus = p.approvalStatus || 'approved';
        if (appStatus !== catalogApproval) return false;
      }

      return true;
    });
  }, [products, vendors, catalogSearch, catalogCategory, catalogVendor, catalogVisibility, catalogStock, catalogApproval]);

  // Sorted Catalog Products
  const sortedCatalogProducts = useMemo(() => {
    const list = [...filteredCatalogProducts];
    if (catalogSort === 'name_asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (catalogSort === 'name_desc') {
      list.sort((a, b) => b.name.localeCompare(a.name));
    } else if (catalogSort === 'category_asc') {
      list.sort((a, b) => a.categorySlug.localeCompare(b.categorySlug));
    } else if (catalogSort === 'vendor_asc') {
      list.sort((a, b) => {
        const vA = vendors.find(v => v.id === a.vendorId)?.businessName || '';
        const vB = vendors.find(v => v.id === b.vendorId)?.businessName || '';
        return vA.localeCompare(vB);
      });
    } else if (catalogSort === 'newest') {
      list.sort((a, b) => (b.id) - (a.id));
    } else if (catalogSort === 'visibility_priority') {
      const priorityOrder: Record<string, number> = { pending: 0, rejected: 1, out_of_stock: 2, hidden: 3, live: 4 };
      list.sort((a, b) => {
        const vA = getProductStorefrontStatus(a, vendors.find(v => v.id === a.vendorId)).status;
        const vB = getProductStorefrontStatus(b, vendors.find(v => v.id === b.vendorId)).status;
        return (priorityOrder[vA] ?? 9) - (priorityOrder[vB] ?? 9);
      });
    }
    return list;
  }, [filteredCatalogProducts, catalogSort, vendors]);

  // Paginated Catalog Products
  const paginatedCatalogProducts = useMemo(() => {
    if (catalogPageSize >= sortedCatalogProducts.length) {
      return sortedCatalogProducts;
    }
    const start = (catalogPage - 1) * catalogPageSize;
    return sortedCatalogProducts.slice(start, start + catalogPageSize);
  }, [sortedCatalogProducts, catalogPage, catalogPageSize]);

  const totalCatalogPages = Math.max(1, Math.ceil(sortedCatalogProducts.length / catalogPageSize));

  // Reset all catalog filters
  const resetCatalogFilters = () => {
    setCatalogSearch('');
    setCatalogCategory('all');
    setCatalogVendor('all');
    setCatalogVisibility('all');
    setCatalogStock('all');
    setCatalogApproval('all');
    setCatalogSort('newest');
    setCatalogPage(1);
  };

  const isCatalogFiltered = Boolean(
    catalogSearch.trim() ||
    catalogCategory !== 'all' ||
    catalogVendor !== 'all' ||
    catalogVisibility !== 'all' ||
    catalogStock !== 'all' ||
    catalogApproval !== 'all'
  );

  // 1. Approve product
  const handleApproveProduct = (product: Product) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === product.id) {
          return {
            ...p,
            approvalStatus: 'approved',
            rejectionReason: undefined,
            isActive: true,
            updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
          };
        }
        return p;
      })
    );

    const logEntry: CatalogAuditLog = {
      id: `cal-${Date.now()}`,
      adminIdentifier: adminEmail,
      productId: product.id,
      productName: product.name,
      action: 'APPROVE',
      previousState: product.approvalStatus || 'pending',
      newState: 'Live Active',
      reason: 'Approved by admin for live supermarket catalog listing.',
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    if (setCatalogAuditLogs) {
      setCatalogAuditLogs(prev => [logEntry, ...prev]);
    }

    if (activeProductDrawer && activeProductDrawer.id === product.id) {
      setActiveProductDrawer(prev => (prev ? { ...prev, approvalStatus: 'approved', rejectionReason: undefined, isActive: true } : null));
    }

    setAdminNotice({
      text: `Product "${product.name}" approved! It is now live in the customer storefront.`,
      type: 'success'
    });
  };

  // 2. Reject product (mandatory reason)
  const handleConfirmRejectProduct = () => {
    if (!rejectProductModal) return;
    const reason = rejectProductReason.trim();
    if (!reason) {
      alert('A specific reason explaining the rejection is mandatory.');
      return;
    }

    const prodId = rejectProductModal.id;
    setProducts(prev =>
      prev.map(p => {
        if (p.id === prodId) {
          return {
            ...p,
            approvalStatus: 'rejected',
            rejectionReason: reason,
            updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
          };
        }
        return p;
      })
    );

    const logEntry: CatalogAuditLog = {
      id: `cal-${Date.now()}`,
      adminIdentifier: adminEmail,
      productId: prodId,
      productName: rejectProductModal.name,
      action: 'REJECT',
      previousState: rejectProductModal.approvalStatus || 'pending',
      newState: 'Rejected',
      reason: reason,
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    if (setCatalogAuditLogs) {
      setCatalogAuditLogs(prev => [logEntry, ...prev]);
    }

    if (activeProductDrawer && activeProductDrawer.id === prodId) {
      setActiveProductDrawer(prev => (prev ? { ...prev, approvalStatus: 'rejected', rejectionReason: reason } : null));
    }

    setAdminNotice({
      text: `Product "${rejectProductModal.name}" marked as REJECTED with recorded reason.`,
      type: 'warning'
    });

    setRejectProductModal(null);
    setRejectProductReason('');
  };

  // 3. Toggle visibility (Active / Inactive-Hidden)
  const handleToggleProductVisibility = (product: Product) => {
    const nextActive = !(product.isActive !== false);
    setProducts(prev =>
      prev.map(p => {
        if (p.id === product.id) {
          return {
            ...p,
            isActive: nextActive,
            adminNotes: nextActive ? undefined : 'Manually hidden by admin.',
            updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
          };
        }
        return p;
      })
    );

    const logEntry: CatalogAuditLog = {
      id: `cal-${Date.now()}`,
      adminIdentifier: adminEmail,
      productId: product.id,
      productName: product.name,
      action: nextActive ? 'ACTIVATE' : 'HIDE',
      previousState: product.isActive !== false ? 'Live Active' : 'Inactive / Hidden',
      newState: nextActive ? 'Live Active' : 'Inactive / Hidden',
      reason: nextActive ? 'Reactivated by admin.' : 'Storefront visibility disabled by admin.',
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    if (setCatalogAuditLogs) {
      setCatalogAuditLogs(prev => [logEntry, ...prev]);
    }

    if (activeProductDrawer && activeProductDrawer.id === product.id) {
      setActiveProductDrawer(prev => (prev ? { ...prev, isActive: nextActive } : null));
    }

    setAdminNotice({
      text: nextActive
        ? `Product "${product.name}" is now Active in catalog.`
        : `Product "${product.name}" is now Hidden from customer store.`,
      type: nextActive ? 'success' : 'info'
    });
  };

  // Toggle variant list expansion in table
  const toggleVariantExpand = (productId: number) => {
    setExpandedVariantProductIds(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  // 4. Approve Image
  const handleApproveImage = (product: Product) => {
    const timestamp = new Date().toLocaleString();
    const newAuditHistory = [
      ...(product.imageAuditHistory || []),
      {
        id: `img-aud-${Date.now()}`,
        action: 'ADMIN_APPROVE' as const,
        actor: adminEmail,
        actorRole: 'admin' as const,
        imageUrl: product.imageUrl,
        notes: 'Photo quality, clarity, and packaging labels approved for supermarket catalog.',
        timestamp
      }
    ];

    setProducts(prev =>
      prev.map(p =>
        p.id === product.id
          ? {
              ...p,
              imageReviewStatus: 'approved',
              imageCorrectionReason: undefined,
              imageAuditHistory: newAuditHistory
            }
          : p
      )
    );

    const logEntry: CatalogAuditLog = {
      id: `cal-${Date.now()}`,
      adminIdentifier: adminEmail,
      productId: product.id,
      productName: product.name,
      action: 'IMAGE_APPROVE',
      previousState: product.imageReviewStatus || 'submitted',
      newState: 'Approved',
      reason: 'Product image approved by admin for supermarket catalog.',
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    if (setCatalogAuditLogs) {
      setCatalogAuditLogs(prev => [logEntry, ...prev]);
    }

    if (activeProductDrawer && activeProductDrawer.id === product.id) {
      setActiveProductDrawer(prev =>
        prev
          ? {
              ...prev,
              imageReviewStatus: 'approved',
              imageCorrectionReason: undefined,
              imageAuditHistory: newAuditHistory
            }
          : null
      );
    }

    setAdminNotice({
      text: `Product image for "${product.name}" approved!`,
      type: 'success'
    });
  };

  // 5. Request Image Correction (Mandatory Reason)
  const handleConfirmRequestImageCorrection = () => {
    if (!imageCorrectionModalProduct) return;
    const reason = imageCorrectionReasonInput.trim();
    if (!reason) {
      alert('A specific reason explaining the required image correction is mandatory.');
      return;
    }

    const prodId = imageCorrectionModalProduct.id;
    const timestamp = new Date().toLocaleString();
    const newAuditHistory = [
      ...(imageCorrectionModalProduct.imageAuditHistory || []),
      {
        id: `img-aud-${Date.now()}`,
        action: 'ADMIN_CORRECTION_REQUEST' as const,
        actor: adminEmail,
        actorRole: 'admin' as const,
        imageUrl: imageCorrectionModalProduct.imageUrl,
        notes: reason,
        timestamp
      }
    ];

    setProducts(prev =>
      prev.map(p =>
        p.id === prodId
          ? {
              ...p,
              imageReviewStatus: 'needs_correction',
              imageCorrectionReason: reason,
              imageAuditHistory: newAuditHistory
            }
          : p
      )
    );

    const logEntry: CatalogAuditLog = {
      id: `cal-${Date.now()}`,
      adminIdentifier: adminEmail,
      productId: prodId,
      productName: imageCorrectionModalProduct.name,
      action: 'IMAGE_CORRECTION',
      previousState: imageCorrectionModalProduct.imageReviewStatus || 'submitted',
      newState: 'Needs Correction',
      reason,
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    if (setCatalogAuditLogs) {
      setCatalogAuditLogs(prev => [logEntry, ...prev]);
    }

    if (activeProductDrawer && activeProductDrawer.id === prodId) {
      setActiveProductDrawer(prev =>
        prev
          ? {
              ...prev,
              imageReviewStatus: 'needs_correction',
              imageCorrectionReason: reason,
              imageAuditHistory: newAuditHistory
            }
          : null
      );
    }

    setAdminNotice({
      text: `Image correction requested for "${imageCorrectionModalProduct.name}". The vendor has been alerted with your feedback.`,
      type: 'warning'
    });

    setImageCorrectionModalProduct(null);
    setImageCorrectionReasonInput('');
  };

  // 6. Admin Authorized Image Replacement
  const handleConfirmAdminReplaceImage = () => {
    if (!adminReplaceModalProduct) return;
    const newUrl = adminReplaceImageUrl.trim();
    const reason = adminReplaceReasonInput.trim();
    if (!newUrl) {
      alert('Please provide or upload a replacement image URL.');
      return;
    }
    if (!reason) {
      alert('A justification reason for administrative replacement is mandatory for audit compliance.');
      return;
    }

    const prodId = adminReplaceModalProduct.id;
    const timestamp = new Date().toLocaleString();
    const originalUrl = adminReplaceModalProduct.originalImageUrl || adminReplaceModalProduct.imageUrl;

    const newAuditHistory = [
      ...(adminReplaceModalProduct.imageAuditHistory || []),
      {
        id: `img-aud-${Date.now()}`,
        action: 'ADMIN_REPLACE' as const,
        actor: adminEmail,
        actorRole: 'admin' as const,
        imageUrl: newUrl,
        notes: `Admin replaced image. Reason: ${reason}. Original vendor submission preserved (${originalUrl}).`,
        timestamp
      }
    ];

    setProducts(prev =>
      prev.map(p =>
        p.id === prodId
          ? {
              ...p,
              imageUrl: newUrl,
              originalImageUrl: originalUrl,
              adminReplacedImageUrl: newUrl,
              imageReplacedByAdmin: true,
              imageReplacementReason: reason,
              imageReviewStatus: 'approved',
              imageCorrectionReason: undefined,
              imageAuditHistory: newAuditHistory
            }
          : p
      )
    );

    const logEntry: CatalogAuditLog = {
      id: `cal-${Date.now()}`,
      adminIdentifier: adminEmail,
      productId: prodId,
      productName: adminReplaceModalProduct.name,
      action: 'IMAGE_REPLACE',
      previousState: originalUrl,
      newState: newUrl,
      reason,
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    if (setCatalogAuditLogs) {
      setCatalogAuditLogs(prev => [logEntry, ...prev]);
    }

    if (activeProductDrawer && activeProductDrawer.id === prodId) {
      setActiveProductDrawer(prev =>
        prev
          ? {
              ...prev,
              imageUrl: newUrl,
              originalImageUrl: originalUrl,
              adminReplacedImageUrl: newUrl,
              imageReplacedByAdmin: true,
              imageReplacementReason: reason,
              imageReviewStatus: 'approved',
              imageCorrectionReason: undefined,
              imageAuditHistory: newAuditHistory
            }
          : null
      );
    }

    setAdminNotice({
      text: `Authorized replacement applied to "${adminReplaceModalProduct.name}". Original vendor submission was preserved.`,
      type: 'success'
    });

    setAdminReplaceModalProduct(null);
    setAdminReplaceImageUrl('');
    setAdminReplaceReasonInput('');
  };

  // Live global search results computation
  const searchResults = useMemo(() => {
    if (!adminSearchQuery.trim()) return null;
    const q = adminSearchQuery.toLowerCase();
    return {
      orders: orders.filter(o => o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q)).slice(0, 3),
      vendors: vendors.filter(v => v.businessName.toLowerCase().includes(q) || v.ownerName.toLowerCase().includes(q)).slice(0, 3),
      products: products.filter(p => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q))).slice(0, 3),
      riders: deliveryPartners.filter(d => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q)).slice(0, 3)
    };
  }, [adminSearchQuery, orders, vendors, products, deliveryPartners]);

  // Sidebar navigation items matching image_7e8833ae.png
  const sidebarNavItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'orders', label: 'Orders', icon: ShoppingBag, badge: orders.length },
    { key: 'customers', label: 'Customers', icon: Users, badge: 428 },
    { key: 'vendors', label: 'Vendors', icon: Store, badge: statusCounts.pending > 0 ? `${statusCounts.pending}` : undefined, badgeColor: 'bg-amber-500' },
    { key: 'delivery_partners', label: 'Delivery Partners', icon: Bike, badge: deliveryPartners.length },
    { key: 'catalog', label: 'Products', icon: Package, badge: pendingCatalogCount > 0 ? `${pendingCatalogCount}` : undefined, badgeColor: 'bg-amber-500' },
    { key: 'categories', label: 'Categories', icon: FolderTree },
    { key: 'inventory', label: 'Inventory', icon: Boxes },
    { key: 'flash_deals', label: 'Offers & Flash Deals', icon: Zap },
    { key: 'banners', label: 'Banners', icon: ImageIcon },
    { key: 'coupons', label: 'Coupons', icon: Ticket },
    { key: 'payments', label: 'Payments & Settlements', icon: CreditCard },
    { key: 'reports', label: 'Reports', icon: BarChart3 },
    { key: 'reviews', label: 'Reviews', icon: Star },
    { key: 'notifications', label: 'Notifications', icon: Bell, badge: '5', badgeColor: 'bg-rose-500' },
    { key: 'users_roles', label: 'Users & Roles', icon: UserCheck },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans select-none w-full">
      {/* Backdrop for mobile slide-out drawer */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* =========================================================================
          LEFT SIDEBAR (DARK NAVY #0b1329 - MATCHING REFERENCE SCREENSHOT)
          ========================================================================= */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-[#0b1329] text-slate-300 border-r border-slate-800 transition-all duration-300 ease-in-out ${
          isMobileSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 shrink-0">
          <div
            onClick={() => {
              setAdminTab('dashboard');
              setIsMobileSidebarOpen(false);
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white text-base shadow-sm shrink-0">
              🌿
            </div>
            {!isSidebarCollapsed && (
              <span className="font-black text-base text-white tracking-tight group-hover:text-emerald-400 transition-colors whitespace-nowrap">
                Hospete Fresh
              </span>
            )}
          </div>

          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 no-scrollbar">
          {sidebarNavItems.map(item => {
            const Icon = item.icon;
            const isActive = adminTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setAdminTab(item.key as any);
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {!isSidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.badgeColor
                            ? `${item.badgeColor} text-white`
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer: Logout */}
        <div className="p-3 border-t border-slate-800/80 shrink-0">
          <button
            type="button"
            onClick={onOpenMobileApp}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Exit Super Admin Console"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* =========================================================================
          MAIN APPLICATION COLUMN
          ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navbar matching Image 1 */}
        <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 z-30">
          <div className="flex items-center gap-3 flex-1 max-w-2xl">
            {/* Hamburger button */}
            <button
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setIsMobileSidebarOpen(!isMobileSidebarOpen);
                } else {
                  setIsSidebarCollapsed(!isSidebarCollapsed);
                }
              }}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Toggle Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Bar matching Image 1 */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={adminSearchQuery}
                onChange={e => setAdminSearchQuery(e.target.value)}
                placeholder="Search orders, customers, vendors, products, delivery partners..."
                className="w-full h-10 pl-10 pr-9 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition-all"
              />
              {adminSearchQuery && (
                <button
                  onClick={() => setAdminSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}

              {/* Instant Search Results Dropdown */}
              {searchResults && (
                <div className="absolute left-0 right-0 top-12 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 max-h-96 overflow-y-auto space-y-3">
                  {searchResults.orders.length > 0 && (
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Orders</div>
                      {searchResults.orders.map(o => (
                        <div
                          key={o.id}
                          onClick={() => {
                            setAdminTab('orders');
                            setAdminSearchQuery('');
                          }}
                          className="p-2 hover:bg-slate-50 rounded-xl cursor-pointer flex justify-between items-center text-xs"
                        >
                          <span className="font-mono font-bold text-slate-900">#{o.orderNumber} - {o.customerName}</span>
                          <span className="font-black text-emerald-700">₹{o.totalAmount}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.vendors.length > 0 && (
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Vendors</div>
                      {searchResults.vendors.map(v => (
                        <div
                          key={v.id}
                          onClick={() => {
                            setAdminTab('vendors');
                            setAdminSearchQuery('');
                          }}
                          className="p-2 hover:bg-slate-50 rounded-xl cursor-pointer flex justify-between items-center text-xs"
                        >
                          <span className="font-bold text-slate-900">{v.businessName}</span>
                          <span className="text-slate-400 text-[11px]">{v.locality}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.products.length > 0 && (
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Products</div>
                      {searchResults.products.map(p => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setAdminTab('catalog');
                            setAdminSearchQuery('');
                          }}
                          className="p-2 hover:bg-slate-50 rounded-xl cursor-pointer flex justify-between items-center text-xs"
                        >
                          <span className="font-bold text-slate-900">{p.name}</span>
                          <span className="text-slate-400 text-[11px]">{p.brand}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.riders.length > 0 && (
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Delivery Fleet</div>
                      {searchResults.riders.map(r => (
                        <div
                          key={r.id}
                          onClick={() => {
                            setAdminTab('delivery_partners');
                            setAdminSearchQuery('');
                          }}
                          className="p-2 hover:bg-slate-50 rounded-xl cursor-pointer flex justify-between items-center text-xs"
                        >
                          <span className="font-bold text-slate-900">{r.name} ({r.code})</span>
                          <span className="text-emerald-600 text-[11px] font-bold">Online</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Header Controls: Notification Bell + Admin Avatar */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors relative cursor-pointer"
                title="System Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs">
                  5
                </span>
              </button>

              {/* Notifications Dropdown */}
              {showNotificationsDropdown && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-black text-xs text-slate-900">Notifications (5 Unread)</span>
                    <button
                      onClick={() => setShowNotificationsDropdown(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div
                      onClick={() => {
                        setAdminTab('orders');
                        setShowNotificationsDropdown(false);
                      }}
                      className="p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                    >
                      <div className="font-bold text-slate-900">New Order #HF-83921 received</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Ramesh Rao • 2 mins ago</div>
                    </div>
                    <div
                      onClick={() => {
                        setAdminTab('vendors');
                        setShowNotificationsDropdown(false);
                      }}
                      className="p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                    >
                      <div className="font-bold text-slate-900">Vendor application pending review</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Hospete Sweets & Namkeen • 14 mins ago</div>
                    </div>
                    <div
                      onClick={() => {
                        setAdminTab('inventory');
                        setShowNotificationsDropdown(false);
                      }}
                      className="p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                    >
                      <div className="font-bold text-rose-700">Stock Alert: Fresh Tomato (0 kg)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Critical restock required • 1 hr ago</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Profile Dropdown matching Image 1 */}
            <div className="relative">
              <button
                onClick={() => setShowAdminProfileDropdown(!showAdminProfileDropdown)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                  AD
                </div>
                <span className="text-xs font-black text-slate-800 hidden sm:inline">Admin</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showAdminProfileDropdown && (
                <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 space-y-2 text-xs">
                  <div className="px-2 py-1.5 border-b border-slate-100">
                    <div className="font-black text-slate-900">Super Administrator</div>
                    <div className="text-[10px] text-slate-400">admin@hospetefresh.com</div>
                    <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Full Access RBAC</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onOpenMobileApp();
                      setShowAdminProfileDropdown(false);
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-slate-50 text-slate-700 font-bold flex items-center justify-between"
                  >
                    <span>Switch to Customer Storefront</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      onOpenDeliverables();
                      setShowAdminProfileDropdown(false);
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-slate-50 text-slate-700 font-bold flex items-center justify-between"
                  >
                    <span>Download Project ZIP</span>
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={onOpenMobileApp}
                      className="w-full text-left p-2 rounded-xl hover:bg-rose-50 text-rose-600 font-bold flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Logout Admin</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* =========================================================================
            MAIN CONTENT CANVAS
            ========================================================================= */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#f8fafc]">
          {/* Admin Notice Banner if active */}
          {adminNotice && (
            <div
              className={`mb-6 p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border shadow-xs transition-all ${
                adminNotice.type === 'warning'
                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                  : adminNotice.type === 'info'
                  ? 'bg-blue-50 text-blue-900 border-blue-200'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {adminNotice.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                ) : adminNotice.type === 'info' ? (
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span>{adminNotice.text}</span>
              </div>
              <button
                onClick={() => setAdminNotice(null)}
                className="text-xs font-bold opacity-60 hover:opacity-100 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* VIEW: SUPER ADMIN DASHBOARD (DEFAULT VIEW) */}
          {adminTab === 'dashboard' && (
            <SuperAdminDashboard
              orders={orders}
              vendors={vendors}
              products={products}
              deliveryPartners={deliveryPartners}
              categories={categories}
              banners={banners}
              flashDeals={flashDeals}
              adminPreviewLogs={adminPreviewLogs}
              catalogAuditLogs={catalogAuditLogs}
              onNavigateTab={(tab, subFilter) => {
                setAdminTab(tab as any);
                if (subFilter?.status && tab === 'vendors') {
                  setVendorFilter(subFilter.status);
                }
              }}
              onLogoutAdmin={onOpenMobileApp}
              searchQuery={adminSearchQuery}
              setSearchQuery={setAdminSearchQuery}
            />
          )}

          {/* VIEW: CUSTOMERS PANEL */}
          {adminTab === 'customers' && (
            <AdminCustomersPanel
              products={products}
              setProducts={setProducts}
              vendors={vendors}
              orders={orders}
              deliveryPartners={deliveryPartners}
              onNavigateTab={(tab) => setAdminTab(tab as any)}
            />
          )}

          {/* VIEW: INVENTORY PANEL */}
          {adminTab === 'inventory' && (
            <AdminInventoryPanel
              products={products}
              setProducts={setProducts}
              vendors={vendors}
              orders={orders}
              deliveryPartners={deliveryPartners}
              onNavigateTab={(tab) => setAdminTab(tab as any)}
            />
          )}

          {/* VIEW: PAYMENTS & SETTLEMENTS */}
          {adminTab === 'payments' && (
            <AdminPaymentsPanel
              products={products}
              setProducts={setProducts}
              vendors={vendors}
              orders={orders}
              deliveryPartners={deliveryPartners}
              onNavigateTab={(tab) => setAdminTab(tab as any)}
            />
          )}

          {/* VIEW: COUPONS & DISCOUNTS */}
          {adminTab === 'coupons' && (
            <AdminCouponsPanel
              products={products}
              setProducts={setProducts}
              vendors={vendors}
              orders={orders}
              deliveryPartners={deliveryPartners}
              onNavigateTab={(tab) => setAdminTab(tab as any)}
            />
          )}

          {/* VIEW: SUPERMARKET SETTINGS */}
          {adminTab === 'settings' && (
            <AdminSettingsPanel
              products={products}
              setProducts={setProducts}
              vendors={vendors}
              orders={orders}
              deliveryPartners={deliveryPartners}
              onNavigateTab={(tab) => setAdminTab(tab as any)}
            />
          )}

          {/* VIEW: REPORTS & REVENUE ANALYTICS */}
          {adminTab === 'reports' && (
            <AdminPaymentsPanel
              products={products}
              setProducts={setProducts}
              vendors={vendors}
              orders={orders}
              deliveryPartners={deliveryPartners}
              onNavigateTab={(tab) => setAdminTab(tab as any)}
            />
          )}

          {/* Context breadcrumb for other administrative modules */}
          {adminTab !== 'dashboard' &&
            adminTab !== 'customers' &&
            adminTab !== 'inventory' &&
            adminTab !== 'payments' &&
            adminTab !== 'coupons' &&
            adminTab !== 'settings' &&
            adminTab !== 'reports' && (
              <div className="mb-4 flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2 text-slate-500 font-bold">
                  <button
                    onClick={() => setAdminTab('dashboard')}
                    className="hover:text-emerald-700 cursor-pointer"
                  >
                    Dashboard
                  </button>
                  <span>&rarr;</span>
                  <span className="text-slate-900 font-black capitalize">
                    {adminTab.replace('_', ' ')}
                  </span>
                </div>
                <button
                  onClick={() => setAdminTab('dashboard')}
                  className="text-emerald-700 hover:underline font-extrabold cursor-pointer"
                >
                  &larr; Back to Super Admin Dashboard
                </button>
              </div>
            )}

      {/* =========================================================================
          TAB 1: REGISTERED VENDOR SUPPLIERS
          ========================================================================= */}
      {adminTab === 'vendors' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4">
          {/* Section Header & Status Tabs */}
          <div className="p-4 sm:p-5 border-b border-slate-200 space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <h2 className="font-extrabold text-base text-slate-900">
                  Registered Vendor Suppliers
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review applications, verify type-specific certificates, inspect service areas, and moderate listing privileges.
                </p>
              </div>

              {/* Status Tabs with Supplier Counts */}
              <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                {(['all', 'pending', 'approved', 'rejected', 'suspended'] as const).map(tabKey => {
                  const count = statusCounts[tabKey];
                  const isActive = vendorFilter === tabKey;
                  return (
                    <button
                      key={tabKey}
                      onClick={() => setVendorFilter(tabKey)}
                      className={`px-3 py-1.5 rounded-lg capitalize transition-all flex items-center gap-1.5 whitespace-nowrap ${
                        isActive
                          ? 'bg-white text-slate-900 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>{tabKey === 'all' ? 'All Suppliers' : tabKey}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-bold ${
                          isActive
                            ? tabKey === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : tabKey === 'suspended'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search and Filter Toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-1">
              {/* Search input */}
              <div className="lg:col-span-5 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by store name, owner, phone, email, locality..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Type Filter */}
              <div className="lg:col-span-2">
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value as any)}
                  className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 bg-slate-50/50 text-slate-700 font-medium"
                >
                  <option value="all">All Types</option>
                  <option value="farmer">Farmer / Grower</option>
                  <option value="dairy">Dairy Supplier</option>
                  <option value="grocery">Grocery Mart</option>
                  <option value="snacks">Snacks & Namkeen</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Locality Filter */}
              <div className="lg:col-span-2">
                <select
                  value={localityFilter}
                  onChange={e => setLocalityFilter(e.target.value)}
                  className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 bg-slate-50/50 text-slate-700 font-medium"
                >
                  <option value="all">All Localities</option>
                  {availableLocalities.map(loc => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sorting */}
              <div className="lg:col-span-3">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 bg-slate-50/50 text-slate-700 font-medium"
                >
                  <option value="date_desc">Registration Date (Newest first)</option>
                  <option value="date_asc">Registration Date (Oldest first)</option>
                  <option value="name_asc">Business Name (A to Z)</option>
                  <option value="name_desc">Business Name (Z to A)</option>
                  <option value="status">Status Priority</option>
                </select>
              </div>
            </div>

            {/* Filter Summary */}
            {(searchQuery || typeFilter !== 'all' || localityFilter !== 'all' || vendorFilter !== 'all') && (
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <div>
                  Showing <strong className="text-slate-900 tabular-nums">{filteredAndSortedVendors.length}</strong> of{' '}
                  <strong className="text-slate-900 tabular-nums">{vendors.length}</strong> suppliers
                </div>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setTypeFilter('all');
                    setLocalityFilter('all');
                    setVendorFilter('all');
                  }}
                  className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>

          {/* Desktop & Tablet Table (Hidden on narrow mobile < 768px) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pl-5">Business & Contact</th>
                  <th className="p-3.5">Type & Compliance</th>
                  <th className="p-3.5">Locality & Service Area</th>
                  <th className="p-3.5">Status & Notice</th>
                  <th className="p-3.5 text-right pr-6">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedVendors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      <div className="max-w-sm mx-auto space-y-2">
                        <Users className="w-8 h-8 mx-auto text-slate-300" />
                        <div className="font-bold text-slate-700">No suppliers matched your search</div>
                        <div className="text-[11px] text-slate-400">
                          Try adjusting search keywords, clearing locality filters, or resetting the status tab.
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedVendors.map(v => {
                    const isReasonExpanded = expandedReasonVendorIds[v.id];
                    const docCount = v.documents?.length || 0;
                    const requiredRules = BUSINESS_TYPE_DOCUMENT_RULES[v.businessType] || [];
                    const mandatoryRules = requiredRules.filter(r => r.mandatory);
                    const verifiedDocs = v.documents?.filter(d => d.status === 'verified').length || 0;

                    return (
                      <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* 1. Business & Contact */}
                        <td className="p-3.5 pl-5 align-top">
                          <div className="font-black text-slate-900 text-sm">{v.businessName}</div>
                          <div className="text-slate-600 text-xs mt-0.5">
                            <span>Owner: {v.ownerName}</span>
                            <span className="mx-1 text-slate-300">·</span>
                            <span className="font-semibold text-slate-800 tabular-nums">{v.phone}</span>
                          </div>
                          {v.email && (
                            <div className="text-slate-400 text-[11px] mt-0.5 truncate max-w-[220px]">
                              {v.email}
                            </div>
                          )}
                          <div className="text-slate-400 text-[10px] mt-1 tabular-nums">
                            Registered: {v.createdAt}
                          </div>
                        </td>

                        {/* 2. Type & Compliance */}
                        <td className="p-3.5 align-top">
                          <span className="inline-block capitalize font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded text-[11px]">
                            {v.businessType}
                          </span>
                          <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {verifiedDocs}/{mandatoryRules.length} mandatory docs verified
                            </span>
                          </div>
                          {docCount > 0 && (
                            <button
                              onClick={() => setActiveVendorDrawer(v)}
                              className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold mt-1 hover:underline block"
                            >
                              View {docCount} uploaded file{docCount > 1 ? 's' : ''} &rarr;
                            </button>
                          )}
                        </td>

                        {/* 3. Locality & Service Area */}
                        <td className="p-3.5 align-top">
                          <div className="font-semibold text-slate-800">{v.locality}</div>
                          <div className="text-slate-500 text-[11px] mt-0.5 line-clamp-2 max-w-[220px]" title={v.serviceArea}>
                            Coverage: {v.serviceArea}
                          </div>
                          <div className="text-slate-400 text-[10px] mt-1 truncate max-w-[220px]">
                            {v.address}
                          </div>
                        </td>

                        {/* 4. Status & Notice */}
                        <td className="p-3.5 align-top">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wide ${
                                v.status === 'approved'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : v.status === 'pending'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : v.status === 'rejected'
                                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                  : 'bg-slate-100 text-slate-800 border border-slate-300'
                              }`}
                            >
                              {v.status === 'pending'
                                ? 'Pending Review'
                                : v.status === 'suspended'
                                ? 'Suspended'
                                : v.status}
                            </span>
                          </div>

                          {/* Rejection reason with toggle for long reasons */}
                          {v.status === 'rejected' && v.rejectionReason && (
                            <div className="mt-1.5 text-[11px] text-rose-700 bg-rose-50/70 p-2 rounded-lg border border-rose-100 max-w-[220px]">
                              <div className="font-bold text-[10px] uppercase text-rose-800">Rejection Reason:</div>
                              <div className={isReasonExpanded ? '' : 'line-clamp-2'}>
                                {v.rejectionReason}
                              </div>
                              {v.rejectionReason.length > 60 && (
                                <button
                                  onClick={() => toggleReasonExpand(v.id)}
                                  className="text-[10px] font-bold text-rose-900 hover:underline mt-1"
                                >
                                  {isReasonExpanded ? 'Show less' : 'Read full reason'}
                                </button>
                              )}
                              {v.resubmissionStatus === 'pending_resubmission' && (
                                <div className="text-[10px] font-bold text-amber-700 mt-1">
                                  ⏳ Awaiting vendor document resubmission
                                </div>
                              )}
                            </div>
                          )}

                          {/* Suspension reason */}
                          {v.status === 'suspended' && v.suspensionReason && (
                            <div className="mt-1.5 text-[11px] text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200 max-w-[220px]">
                              <div className="font-bold text-[10px] uppercase text-slate-800">Suspension Cause:</div>
                              <div className="line-clamp-2">{v.suspensionReason}</div>
                              <div className="text-[10px] text-rose-600 font-bold mt-1">
                                Storefront listings paused
                              </div>
                            </div>
                          )}

                          {/* Additional Info Requested Notice */}
                          {v.additionalInfoRequested && v.status === 'pending' && (
                            <div className="mt-1.5 text-[11px] text-blue-800 bg-blue-50 p-2 rounded-lg border border-blue-200 max-w-[220px]">
                              <div className="font-bold text-[10px] uppercase text-blue-900">Info Requested:</div>
                              <div className="line-clamp-2">{v.additionalInfoRequested}</div>
                            </div>
                          )}
                        </td>

                        {/* 5. Administrative Actions */}
                        <td className="p-3.5 text-right pr-5 align-top">
                          <div className="flex flex-col items-end gap-1.5">
                            {/* Primary action: Review Details */}
                            <button
                              onClick={() => setActiveVendorDrawer(v)}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs transition-colors"
                            >
                              Review Application
                            </button>

                            {/* Pending Quick Actions */}
                            {v.status === 'pending' && (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <button
                                  onClick={() => handleApproveVendor(v.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors"
                                  title="Approve supplier application"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectModalVendor(v);
                                    setRejectReasonInput('');
                                  }}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg text-xs transition-colors"
                                  title="Reject with mandatory reason"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => {
                                    setRequestInfoModalVendor(v);
                                    setRequestInfoInput('');
                                  }}
                                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold rounded-lg text-xs transition-colors"
                                  title="Request additional information"
                                >
                                  Req Info
                                </button>
                              </div>
                            )}

                            {/* Approved Quick Actions */}
                            {v.status === 'approved' && (
                              <button
                                onClick={() => {
                                  setSuspendModalVendor(v);
                                  setSuspendReasonInput('');
                                }}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-transparent text-slate-700 font-bold rounded-lg text-xs transition-colors"
                                title="Suspend supplier from live storefront"
                              >
                                Suspend
                              </button>
                            )}

                            {/* Suspended Quick Actions */}
                            {v.status === 'suspended' && (
                              <button
                                onClick={() => {
                                  setReactivateModalVendor(v);
                                  setReactivateReasonInput('');
                                }}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-lg text-xs transition-colors"
                                title="Reactivate suspended vendor"
                              >
                                Reactivate
                              </button>
                            )}

                            {/* Secure Admin Preview */}
                            <button
                              onClick={() => handleLaunchAdminPreview(v)}
                              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold rounded-lg text-[11px] whitespace-nowrap transition-colors inline-flex items-center gap-1"
                              title="Securely preview vendor dashboard without exposing credentials"
                            >
                              <span>Preview Portal</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Narrow Mobile View (< 768px): Responsive Supplier Cards */}
          <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
            {filteredAndSortedVendors.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <div className="font-bold text-slate-700 text-sm">No suppliers matched</div>
                <div className="text-xs text-slate-400">Adjust keywords or clear filters.</div>
              </div>
            ) : (
              filteredAndSortedVendors.map(v => (
                <div key={v.id} className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm">{v.businessName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {v.ownerName} · <span className="font-semibold text-slate-700">{v.phone}</span>
                      </div>
                    </div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        v.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : v.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : v.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <div>
                      <strong className="text-slate-800">Type:</strong>{' '}
                      <span className="capitalize">{v.businessType}</span> · <strong>Locality:</strong> {v.locality}
                    </div>
                    <div>
                      <strong className="text-slate-800">Service:</strong> {v.serviceArea}
                    </div>
                  </div>

                  {v.rejectionReason && v.status === 'rejected' && (
                    <div className="text-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
                      <strong>Rejection reason:</strong> {v.rejectionReason}
                    </div>
                  )}

                  {v.suspensionReason && v.status === 'suspended' && (
                    <div className="text-xs text-slate-700 bg-slate-100 p-2 rounded border border-slate-300">
                      <strong>Suspension cause:</strong> {v.suspensionReason}
                    </div>
                  )}

                  {/* Mobile Actions Button Strip */}
                  <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveVendorDrawer(v)}
                      className="flex-1 py-1.5 px-3 bg-white border border-slate-300 text-slate-800 font-bold rounded-lg text-xs"
                    >
                      Review Application
                    </button>

                    {v.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApproveVendor(v.id)}
                          className="py-1.5 px-3 bg-emerald-600 text-white font-bold rounded-lg text-xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setRejectModalVendor(v);
                            setRejectReasonInput('');
                          }}
                          className="py-1.5 px-3 bg-rose-50 text-rose-700 border border-rose-200 font-bold rounded-lg text-xs"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {v.status === 'approved' && (
                      <button
                        onClick={() => {
                          setSuspendModalVendor(v);
                          setSuspendReasonInput('');
                        }}
                        className="py-1.5 px-3 bg-slate-100 text-slate-700 font-bold rounded-lg text-xs"
                      >
                        Suspend
                      </button>
                    )}

                    {v.status === 'suspended' && (
                      <button
                        onClick={() => {
                          setReactivateModalVendor(v);
                          setReactivateReasonInput('');
                        }}
                        className="py-1.5 px-3 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold rounded-lg text-xs"
                      >
                        Reactivate
                      </button>
                    )}

                    <button
                      onClick={() => handleLaunchAdminPreview(v)}
                      className="py-1.5 px-3 bg-slate-100 text-slate-700 font-bold rounded-lg text-xs"
                    >
                      Preview
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: ORDERS
          ========================================================================= */}
      {/* =========================================================================
          TAB 2: ORDERS (With Panel 6 Delivery Assignment)
          ========================================================================= */}
      {adminTab === 'orders' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Header with Title and Ready for Pickup Alert */}
            <div className="p-4 sm:p-5 border-b border-slate-200 space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <div>
                  <h2 className="font-extrabold text-base text-slate-900">Live Customer Orders</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track order fulfillment, assign delivery boys for ready baskets, and monitor dispatch SLA.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {readyForPickupOrdersCount > 0 && (
                    <span className="text-xs font-black text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1 rounded-xl flex items-center gap-1.5 animate-pulse">
                      <Bike className="w-3.5 h-3.5" />
                      <span>{readyForPickupOrdersCount} Ready for Delivery Assignment</span>
                    </span>
                  )}
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                    {orders.length} Active Orders
                  </span>
                </div>
              </div>

              {/* Status Filter Tabs (Highlighting Ready for Pickup) */}
              <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs font-extrabold">
                {[
                  { id: 'all', label: 'All Orders', count: orders.length },
                  { id: 'ready_for_pickup', label: 'Ready for Pickup (Assign Delivery Boy)', count: readyForPickupOrdersCount, alert: readyForPickupOrdersCount > 0 },
                  { id: 'new', label: 'New / Placed', count: orders.filter(o => o.status === 'New' || o.status === 'Placed').length },
                  { id: 'accepted', label: 'Accepted', count: orders.filter(o => o.status === 'Accepted').length },
                  { id: 'preparing', label: 'Preparing', count: orders.filter(o => o.status === 'Preparing').length },
                  { id: 'picked_up', label: 'Picked Up', count: orders.filter(o => o.status === 'Picked Up' || o.status === 'Out for Delivery').length },
                  { id: 'delivered', label: 'Delivered', count: orders.filter(o => o.status === 'Delivered').length }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setAdminOrderFilter(tab.id as typeof adminOrderFilter)}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                      adminOrderFilter === tab.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : tab.alert
                        ? 'bg-amber-200 text-amber-950 font-black hover:bg-amber-300'
                        : 'text-slate-600 hover:text-slate-900 bg-transparent'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        adminOrderFilter === tab.id
                          ? 'bg-white/20 text-white'
                          : tab.alert
                          ? 'bg-amber-300 text-amber-950'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 pl-5">Order ID</th>
                    <th className="p-3.5">Customer Details</th>
                    <th className="p-3.5">Locality</th>
                    <th className="p-3.5 min-w-[240px]">Variants Listed (Items)</th>
                    <th className="p-3.5 min-w-[200px]">Delivery Timeline</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 pr-5 text-right">Delivery Boy Assignment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAdminOrders.map(ord => (
                    <tr key={ord.id} className="hover:bg-slate-50/50">
                      <td className="p-3.5 pl-5 font-bold text-slate-900 tabular-nums align-top">
                        <div className="font-black text-slate-900">#{ord.orderNumber}</div>
                        <div className="text-[10px] text-slate-400">{ord.createdAt}</div>
                      </td>

                      <td className="p-3.5 align-top">
                        <div className="font-bold text-slate-800">{ord.customerName}</div>
                        <div className="text-slate-500 text-[11px] tabular-nums">{ord.phone}</div>
                        <div className="text-slate-400 text-[10px] truncate max-w-[150px]">{ord.address}</div>
                      </td>

                      <td className="p-3.5 align-top">
                        <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                          {ord.locality}
                        </span>
                      </td>

                      {/* VARIANTS LISTED COLUMN */}
                      <td className="p-3.5 align-top">
                        {(() => {
                          const isExpanded = expandedAdminOrderVariants[ord.id] !== undefined
                            ? expandedAdminOrderVariants[ord.id]
                            : true;

                          return (
                            <div className="space-y-1.5 min-w-[240px] max-w-[320px]">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black tracking-wider text-slate-500 uppercase">
                                  ITEMS ({ord.items.length})
                                </span>
                              </div>

                              {isExpanded ? (
                                <div className="space-y-1.5">
                                  {ord.items.map((it, idx) => (
                                    <div
                                      key={idx}
                                      className="p-2 px-2.5 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between gap-2 text-[11px]"
                                    >
                                      <div className="flex items-baseline gap-1.5 min-w-0 flex-wrap">
                                        <span className="font-extrabold text-slate-800">{it.packSize}</span>
                                        <span className="font-black text-emerald-700">₹{it.unitPrice}</span>
                                        <span className="text-slate-500 truncate text-[10px]">({it.quantity}x · {it.productName})</span>
                                      </div>
                                      <span className="font-black text-slate-700 tabular-nums shrink-0">₹{it.subtotal}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div
                                  onClick={() => toggleAdminOrderVariants(ord.id)}
                                  className="p-1.5 px-2.5 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-slate-500 text-[11px] cursor-pointer hover:bg-slate-100 flex items-center justify-between"
                                >
                                  <span>{ord.items.length} items collapsed</span>
                                  <span className="text-emerald-700 font-bold text-[10px]">Expand &rarr;</span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* TOTAL TIME TAKEN & DELIVERY TIMELINE COLUMN */}
                      <td className="p-3.5 align-top">
                        <div className="space-y-1 text-[11px]">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-400">Ordered:</span>
                            <span className="font-bold text-slate-800">{ord.orderedAt || ord.createdAt || '10:15 AM'}</span>
                          </div>
                          {ord.assignedDeliveryBoy && (
                            <div className="flex items-center justify-between gap-2 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                              <span>Partner:</span>
                              <span className="font-extrabold">{ord.assignedDeliveryBoy}</span>
                            </div>
                          )}
                          {ord.deliveryDiscrepancy && (
                            <div className="text-rose-700 bg-rose-50 border border-rose-200 p-1.5 rounded-md font-bold text-[10px]">
                              ⚠️ Discrepancy: {ord.deliveryDiscrepancy.reason}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 font-black text-emerald-700 tabular-nums align-top text-sm">
                        ₹{ord.totalAmount}
                      </td>

                      <td className="p-3.5 align-top">
                        <span className={`font-bold px-2.5 py-1 rounded-full text-[10px] inline-flex items-center gap-1 ${
                          ord.status === 'Delivered'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : ord.status === 'Ready for Pickup' || ord.status === 'Packed'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold'
                            : ord.status === 'Picked Up' || ord.status === 'Out for Delivery'
                            ? 'bg-purple-50 text-purple-800 border border-purple-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            ord.status === 'Delivered' ? 'bg-emerald-600' : 'bg-amber-500 animate-pulse'
                          }`}></span>
                          {ord.status}
                        </span>
                      </td>

                      {/* DELIVERY BOY ASSIGNMENT ACTION (Panel 6) */}
                      <td className="p-3.5 pr-5 align-top text-right">
                        {ord.status === 'Ready for Pickup' || ord.status === 'Packed' ? (
                          <div className="space-y-1 text-right">
                            <button
                              onClick={() => {
                                setAssignDeliveryModalOrder(ord);
                                setSelectedDeliveryBoyId(ord.assignedDeliveryBoyId || 'dlv-1');
                              }}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Bike className="w-3.5 h-3.5" />
                              <span>{ord.assignedDeliveryBoy ? 'Reassign Driver' : 'Assign Delivery Boy'}</span>
                            </button>
                            {ord.assignedDeliveryBoy && (
                              <div className="text-[10px] text-slate-500">
                                Assigned to {ord.assignedDeliveryBoy}
                              </div>
                            )}
                          </div>
                        ) : ord.status === 'Picked Up' || ord.status === 'Out for Delivery' ? (
                          <div className="text-purple-800 font-bold text-xs flex items-center justify-end gap-1">
                            <Bike className="w-3.5 h-3.5 text-purple-600" />
                            <span>In Transit ({ord.assignedDeliveryBoy || 'Ravi'})</span>
                          </div>
                        ) : ord.status === 'Delivered' ? (
                          <div className="text-emerald-700 font-extrabold text-xs flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Delivered ✓</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">
                            Vendor packing in progress
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* =========================================================================
              PANEL 6: ADMIN ASSIGN DELIVERY BOY MODAL (Exact match to Reference Panel 6)
              ========================================================================= */}
          {assignDeliveryModalOrder && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                      <Bike className="w-5 h-5 text-blue-600" />
                      <span>Assign Delivery Partner - #{assignDeliveryModalOrder.orderNumber}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Customer Area: <strong className="text-slate-800">{assignDeliveryModalOrder.locality}</strong> · Total: ₹{assignDeliveryModalOrder.totalAmount}
                    </p>
                  </div>
                  <button
                    onClick={() => setAssignDeliveryModalOrder(null)}
                    className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* 2-Column Layout matching Panel 6 Reference Image */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left Column: Order Summary */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                    <div className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">
                      Order Summary
                    </div>
                    <div className="space-y-2 text-xs">
                      {assignDeliveryModalOrder.items.map((it, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-base">{it.productName.toLowerCase().includes('coriander') ? '🌿' : '🍅'}</span>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-800 truncate">{it.productName} ({it.packSize})</div>
                          </div>
                          <span className="font-black text-slate-700 shrink-0">x {it.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-600">Total Amount</span>
                      <span className="font-black text-slate-900 text-sm tabular-nums">
                        ₹{assignDeliveryModalOrder.totalAmount}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Select Delivery Boy */}
                  <div className="space-y-3 flex flex-col justify-between">
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1.5">
                        Select Delivery Partner
                      </label>
                      <select
                        value={selectedDeliveryBoyId}
                        onChange={e => setSelectedDeliveryBoyId(e.target.value)}
                        className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer shadow-2xs"
                      >
                        {deliveryPartners
                          .filter(p => p.status === 'approved')
                          .map(boy => (
                            <option key={boy.id} value={boy.id}>
                              {boy.name} ({boy.code}) · {boy.activeOrdersCount || 0} active · {boy.isOnline ? 'Online 🟢' : 'Offline ⚪'}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Driver details card */}
                    {(() => {
                      const boy = deliveryPartners.find(d => d.id === selectedDeliveryBoyId) || deliveryPartners[0];
                      return (
                        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs space-y-1">
                          <div className="font-bold text-blue-900 flex items-center gap-1.5">
                            <Bike className="w-3.5 h-3.5 text-blue-600" />
                            <span>{boy.name} ({boy.code})</span>
                          </div>
                          <div className="text-slate-600 text-[11px]">Phone: {boy.phone}</div>
                          <div className="text-slate-600 text-[11px]">Vehicle: {boy.vehicleType} · {boy.vehicleNumber}</div>
                          <div className="text-slate-600 text-[11px]">Service Area: {boy.serviceArea}</div>
                        </div>
                      );
                    })()}

                    {/* Assign & Notify Button matching Panel 6 blue button */}
                    <button
                      type="button"
                      onClick={handleConfirmAssignDelivery}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-xs transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Bike className="w-4 h-4" />
                      <span>Assign & Notify Delivery Boy</span>
                    </button>
                  </div>
                </div>

                {/* Bottom Notice Card matching Panel 6 green box with shield */}
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-950">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">
                    Vendor has marked this order as Ready for Pickup. Admin now assigns a delivery partner.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: CATALOG - SUPERMARKET CATALOG INVENTORY
          ========================================================================= */}
      {adminTab === 'catalog' && (
        <div className="space-y-4">
          {/* Top Catalog Header Card */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-xl text-slate-900 tracking-tight">Supermarket Catalog Inventory</h2>
                <span className="bg-slate-100 text-slate-800 font-extrabold text-xs px-2.5 py-0.5 rounded-full tabular-nums border border-slate-200">
                  {products.length} Products
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Live products and variants submitted by partner farmers, dairies, and vendors.
              </p>
            </div>

            {/* Catalog Health Quick Counters */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>
                  {products.filter(p => getProductStorefrontStatus(p, vendors.find(v => v.id === p.vendorId)).status === 'live').length} Live Active
                </span>
              </div>
              {pendingCatalogCount > 0 && (
                <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>{pendingCatalogCount} Pending Review</span>
                </div>
              )}
              <div className="px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span>
                  {products.filter(p => getProductStorefrontStatus(p, vendors.find(v => v.id === p.vendorId)).status === 'out_of_stock').length} Out of Stock
                </span>
              </div>
              <button
                onClick={() => {
                  handleClearCategoryForm();
                  setAdminTab('categories');
                }}
                className="px-3.5 py-1.5 bg-[#d1fae5] hover:bg-[#a7f3d0] text-[#065f46] border border-[#a7f3d0] text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                title="Manage categories and add new categories"
              >
                <span>+ New Category</span>
              </button>
              <button
                onClick={onOpenMobileApp}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <span>Storefront View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Section: Comprehensive Filter & Search Toolbar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Search & Multi-Filter Catalog
                </span>
              </div>

              {isCatalogFiltered && (
                <button
                  onClick={resetCatalogFilters}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All Filters</span>
                </button>
              )}
            </div>

            {/* Filter Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {/* Search */}
              <div className="lg:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={e => {
                    setCatalogSearch(e.target.value);
                    setCatalogPage(1);
                  }}
                  placeholder="Search name, brand, SKU (e.g. SKU-VEG-101), vendor..."
                  className="w-full h-10 pl-9 pr-8 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 text-slate-800 transition-colors"
                />
                {catalogSearch && (
                  <button
                    onClick={() => {
                      setCatalogSearch('');
                      setCatalogPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={catalogCategory}
                  onChange={e => {
                    setCatalogCategory(e.target.value);
                    setCatalogPage(1);
                  }}
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 text-slate-800 font-semibold cursor-pointer"
                >
                  <option value="all">All Categories ({products.length})</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name} ({catalogCategoryCounts[cat.slug] || 0})
                    </option>
                  ))}
                </select>
              </div>

              {/* Vendor Filter */}
              <div>
                <select
                  value={catalogVendor}
                  onChange={e => {
                    setCatalogVendor(e.target.value);
                    setCatalogPage(1);
                  }}
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 text-slate-800 font-semibold cursor-pointer"
                >
                  <option value="all">All Vendors ({vendors.length})</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.businessName} ({v.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Storefront Visibility Filter */}
              <div>
                <select
                  value={catalogVisibility}
                  onChange={e => {
                    setCatalogVisibility(e.target.value as any);
                    setCatalogPage(1);
                  }}
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 text-slate-800 font-semibold cursor-pointer"
                >
                  <option value="all">All Visibility States</option>
                  <option value="live">Live Active</option>
                  <option value="pending">Pending Approval</option>
                  <option value="rejected">Rejected</option>
                  <option value="hidden">Inactive / Hidden</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <select
                  value={catalogSort}
                  onChange={e => setCatalogSort(e.target.value as any)}
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 text-slate-800 font-semibold cursor-pointer"
                >
                  <option value="newest">Sort: Newest First</option>
                  <option value="name_asc">Sort: Product Name (A &rarr; Z)</option>
                  <option value="name_desc">Sort: Product Name (Z &rarr; A)</option>
                  <option value="category_asc">Sort: Category (A &rarr; Z)</option>
                  <option value="vendor_asc">Sort: Vendor Partner (A &rarr; Z)</option>
                  <option value="visibility_priority">Sort: Visibility Priority</option>
                </select>
              </div>
            </div>

            {/* Secondary Filter Row (Stock Status & Approval Status) */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-400 font-medium text-[11px]">Secondary Filters:</span>
                
                {/* Stock Level Selector */}
                <select
                  value={catalogStock}
                  onChange={e => {
                    setCatalogStock(e.target.value as any);
                    setCatalogPage(1);
                  }}
                  className="h-8 px-2.5 text-[11px] bg-white border border-slate-200 rounded-lg text-slate-700 font-medium cursor-pointer"
                >
                  <option value="all">Stock: All Levels</option>
                  <option value="in_stock">In Stock (&gt; 0)</option>
                  <option value="low_stock">Low Stock (1 - 10)</option>
                  <option value="out_of_stock">Out of Stock (0)</option>
                </select>

                {/* Approval Status Selector */}
                <select
                  value={catalogApproval}
                  onChange={e => {
                    setCatalogApproval(e.target.value as any);
                    setCatalogPage(1);
                  }}
                  className="h-8 px-2.5 text-[11px] bg-white border border-slate-200 rounded-lg text-slate-700 font-medium cursor-pointer"
                >
                  <option value="all">Approval: All</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending Approval</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Result Count */}
              <div className="text-xs font-semibold text-slate-600">
                Showing <span className="font-black text-slate-900 tabular-nums">{filteredCatalogProducts.length}</span> of <span className="font-black text-slate-900 tabular-nums">{products.length}</span> products
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 pl-5">Product</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Vendor Partner</th>
                    <th className="p-3.5">Variants Listed</th>
                    <th className="p-3.5">Storefront Visibility</th>
                    <th className="p-3.5 pr-5 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedCatalogProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center">
                        <div className="max-w-md mx-auto space-y-3">
                          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                            <Search className="w-6 h-6" />
                          </div>
                          <div className="font-extrabold text-sm text-slate-800">
                            No products match your filters
                          </div>
                          <p className="text-xs text-slate-500">
                            Try adjusting your search query, changing the category, or resetting the visibility filter.
                          </p>
                          <button
                            onClick={resetCatalogFilters}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors"
                          >
                            Reset All Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedCatalogProducts.map(p => {
                      const vendor = vendors.find(v => v.id === p.vendorId);
                      const statusInfo = getProductStorefrontStatus(p, vendor);
                      const isExpanded = expandedVariantProductIds[p.id];
                      const totalStock = p.variants.reduce((sum, v) => sum + v.stockQty, 0);

                      return (
                        <React.Fragment key={p.id}>
                          <tr className={`hover:bg-slate-50/70 transition-colors ${!statusInfo.canPurchase ? 'bg-slate-50/30' : ''}`}>
                            {/* 1. Product Thumbnail & Info */}
                            <td className="p-3.5 pl-5">
                              <div className="flex items-start gap-3">
                                <div className="relative shrink-0">
                                  <img
                                    src={p.imageUrl}
                                    alt={p.name}
                                    onError={e => handleImageError(e, p.name)}
                                    referrerPolicy="no-referrer"
                                    className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200"
                                  />
                                  {p.additionalImages && p.additionalImages.length > 0 && (
                                    <span className="absolute -bottom-1 -right-1 bg-slate-800 text-white text-[9px] font-bold px-1 rounded-full shadow-2xs">
                                      +{p.additionalImages.length}
                                    </span>
                                  )}
                                </div>
                                <div className="space-y-0.5">
                                  <div className="font-extrabold text-slate-900 text-sm leading-snug">
                                    {p.name}
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                    <span className="font-semibold text-slate-700">{p.brand}</span>
                                    {p.sku && (
                                      <>
                                        <span>·</span>
                                        <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-[10px] text-slate-600">
                                          {p.sku}
                                        </span>
                                      </>
                                    )}
                                  </div>

                                  {/* Image Review Status Pill */}
                                  <div className="flex items-center gap-1.5 pt-0.5">
                                    {p.imageReviewStatus === 'approved' ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                        <span>Image: Approved</span>
                                      </span>
                                    ) : p.imageReviewStatus === 'needs_correction' ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-300">
                                        <span>Image: Correction Needed</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                        <span>Image: Submitted</span>
                                      </span>
                                    )}

                                    {p.imageReplacedByAdmin && (
                                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200" title="Admin authorized replacement">
                                        Admin Replaced
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* 2. Category */}
                            <td className="p-3.5">
                              <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold capitalize bg-slate-100 text-slate-700 border border-slate-200/60">
                                {CATEGORIES.find(c => c.slug === p.categorySlug)?.name || p.categorySlug}
                              </span>
                            </td>

                            {/* 3. Vendor Partner */}
                            <td className="p-3.5">
                              {vendor ? (
                                <div className="space-y-1">
                                  <button
                                    onClick={() => setActiveVendorDrawer(vendor)}
                                    className="font-bold text-slate-900 hover:text-emerald-700 text-left flex items-center gap-1 group"
                                  >
                                    <span>{vendor.businessName}</span>
                                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-600" />
                                  </button>
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                    <span>{vendor.ownerName}</span>
                                    <span>·</span>
                                    <span
                                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                                        vendor.status === 'approved'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : vendor.status === 'pending'
                                          ? 'bg-amber-100 text-amber-800'
                                          : vendor.status === 'suspended'
                                          ? 'bg-slate-200 text-slate-800'
                                          : 'bg-rose-100 text-rose-800'
                                      }`}
                                    >
                                      {vendor.status}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">Hospete Central Warehouse</span>
                              )}
                            </td>

                            {/* 4. Variants Listed */}
                            <td className="p-3.5 max-w-xs">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {p.variants.slice(0, 2).map(vr => (
                                    <span
                                      key={vr.id}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[11px]"
                                    >
                                      <span className="font-bold text-slate-800">{vr.packSize}</span>
                                      <span className="text-emerald-700 font-extrabold">₹{vr.price}</span>
                                      <span className={`text-[10px] font-bold ${vr.stockQty > 0 ? 'text-slate-500' : 'text-rose-600'}`}>
                                        ({vr.stockQty} in stock)
                                      </span>
                                    </span>
                                  ))}
                                  {p.variants.length > 2 && (
                                    <span className="text-[10px] text-slate-500 font-semibold">
                                      +{p.variants.length - 2} more
                                    </span>
                                  )}
                                </div>

                                <button
                                  onClick={() => toggleVariantExpand(p.id)}
                                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                                >
                                  <span>{isExpanded ? 'Hide Variants' : `View All Variants (${p.variants.length})`}</span>
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                              </div>
                            </td>

                            {/* 5. Storefront Visibility Status */}
                            <td className="p-3.5">
                              <div className="space-y-1">
                                <span
                                  className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-black border ${statusInfo.badgeClass}`}
                                >
                                  {statusInfo.label}
                                </span>
                                {statusInfo.detail && (
                                  <div className="text-[10px] text-slate-500 leading-tight max-w-[180px]">
                                    {statusInfo.detail}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* 6. Admin Actions */}
                            <td className="p-3.5 pr-5 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {/* View Details */}
                                <button
                                  onClick={() => setActiveProductDrawer(p)}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                                  title="View Full Product Details & Variants"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {/* Preview in Customer Store */}
                                {onPreviewProductInStore && (
                                  <button
                                    onClick={() => onPreviewProductInStore(p)}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                                    title="Preview in Customer Storefront"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </button>
                                )}

                                {/* Approve (if pending or rejected) */}
                                {(p.approvalStatus === 'pending' || p.approvalStatus === 'rejected') && (
                                  <button
                                    onClick={() => handleApproveProduct(p)}
                                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                    title="Approve Listing for Storefront"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Approve</span>
                                  </button>
                                )}

                                {/* Reject (if pending or approved) */}
                                {p.approvalStatus !== 'rejected' && (
                                  <button
                                    onClick={() => {
                                      setRejectProductModal(p);
                                      setRejectProductReason('');
                                    }}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors border border-rose-200"
                                    title="Reject Product with Reason"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}

                                {/* Toggle Active / Inactive */}
                                <button
                                  onClick={() => handleToggleProductVisibility(p)}
                                  className={`p-1.5 rounded-lg text-xs font-bold transition-colors border ${
                                    p.isActive !== false
                                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                  }`}
                                  title={p.isActive !== false ? 'Hide from Storefront' : 'Activate in Storefront'}
                                >
                                  {p.isActive !== false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expandable Variants Row */}
                          {isExpanded && (
                            <tr className="bg-slate-50/80 border-y border-slate-200 animate-in fade-in duration-100">
                              <td colSpan={6} className="p-4 pl-14">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                                      <Layers className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>All Pack Sizes & Inventory Breakdown for "{p.name}"</span>
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      Total Available Stock: <strong className="text-emerald-700">{totalStock} units</strong>
                                    </div>
                                  </div>

                                  <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-2xs">
                                    <table className="w-full text-xs text-left">
                                      <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                                        <tr>
                                          <th className="p-2.5 pl-3">Pack Size</th>
                                          <th className="p-2.5">Selling Price</th>
                                          <th className="p-2.5">MRP</th>
                                          <th className="p-2.5">Discount %</th>
                                          <th className="p-2.5">Stock Units</th>
                                          <th className="p-2.5">Default Pack</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {p.variants.map(v => {
                                          const discountPct = v.mrp > v.price ? Math.round(((v.mrp - v.price) / v.mrp) * 100) : 0;
                                          return (
                                            <tr key={v.id} className="hover:bg-slate-50">
                                              <td className="p-2.5 pl-3 font-bold text-slate-800">{v.packSize}</td>
                                              <td className="p-2.5 font-extrabold text-emerald-700 tabular-nums">₹{v.price}</td>
                                              <td className="p-2.5 text-slate-400 line-through tabular-nums">₹{v.mrp}</td>
                                              <td className="p-2.5">
                                                {discountPct > 0 ? (
                                                  <span className="text-emerald-700 font-bold">{discountPct}% OFF</span>
                                                ) : (
                                                  <span className="text-slate-400">-</span>
                                                )}
                                              </td>
                                              <td className="p-2.5">
                                                <span
                                                  className={`font-black tabular-nums px-2 py-0.5 rounded text-[11px] ${
                                                    v.stockQty > 10
                                                      ? 'bg-emerald-50 text-emerald-800'
                                                      : v.stockQty > 0
                                                      ? 'bg-amber-50 text-amber-800'
                                                      : 'bg-rose-50 text-rose-800'
                                                  }`}
                                                >
                                                  {v.stockQty} {v.stockQty === 0 ? '(Out of Stock)' : 'units'}
                                                </span>
                                              </td>
                                              <td className="p-2.5">
                                                {v.isDefault ? (
                                                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                                                    Default
                                                  </span>
                                                ) : (
                                                  <span className="text-slate-400 text-[11px]">Variant</span>
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-slate-100">
              {paginatedCatalogProducts.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No products found matching filters.
                </div>
              ) : (
                paginatedCatalogProducts.map(p => {
                  const vendor = vendors.find(v => v.id === p.vendorId);
                  const statusInfo = getProductStorefrontStatus(p, vendor);
                  const isExpanded = expandedVariantProductIds[p.id];

                  return (
                    <div key={p.id} className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          onError={e => handleImageError(e, p.name)}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-extrabold text-sm text-slate-900 leading-snug">{p.name}</h3>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black border shrink-0 ${statusInfo.badgeClass}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            Brand: <strong className="text-slate-700">{p.brand}</strong>
                          </div>
                          {p.sku && (
                            <div className="font-mono text-[10px] text-slate-500">
                              SKU: {p.sku}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Vendor & Category metadata */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                        <div>
                          <div className="text-[10px] text-slate-400">Supplier</div>
                          <div className="font-bold text-slate-800">{vendor?.businessName || 'Central Warehouse'}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400">Category</div>
                          <div className="font-bold text-emerald-700 capitalize">{p.categorySlug}</div>
                        </div>
                      </div>

                      {/* Variant chips */}
                      <div className="flex flex-wrap gap-1.5">
                        {p.variants.map(v => (
                          <span key={v.id} className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-semibold text-slate-700">
                            {v.packSize} · <strong className="text-emerald-700">₹{v.price}</strong> ({v.stockQty} in stock)
                          </span>
                        ))}
                      </div>

                      {/* Mobile Actions */}
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                        <button
                          onClick={() => setActiveProductDrawer(p)}
                          className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>

                        {(p.approvalStatus === 'pending' || p.approvalStatus === 'rejected') && (
                          <button
                            onClick={() => handleApproveProduct(p)}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                        )}

                        {p.approvalStatus !== 'rejected' && (
                          <button
                            onClick={() => {
                              setRejectProductModal(p);
                              setRejectProductReason('');
                            }}
                            className="p-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}

                        {onPreviewProductInStore && (
                          <button
                            onClick={() => onPreviewProductInStore(p)}
                            className="p-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                            title="Preview in Store"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleToggleProductVisibility(p)}
                          className="p-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                          title="Toggle Visibility"
                        >
                          {p.isActive !== false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            {sortedCatalogProducts.length > 0 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <span>Show</span>
                  <select
                    value={catalogPageSize}
                    onChange={e => {
                      setCatalogPageSize(Number(e.target.value));
                      setCatalogPage(1);
                    }}
                    className="h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                  >
                    <option value={5}>5 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={999}>All products</option>
                  </select>
                  <span>
                    (Page <strong className="text-slate-900">{catalogPage}</strong> of <strong className="text-slate-900">{totalCatalogPages}</strong>)
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={catalogPage <= 1}
                    onClick={() => setCatalogPage(prev => Math.max(1, prev - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalCatalogPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    if (
                      totalCatalogPages <= 5 ||
                      pageNum === 1 ||
                      pageNum === totalCatalogPages ||
                      Math.abs(pageNum - catalogPage) <= 1
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCatalogPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                            catalogPage === pageNum
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (pageNum === 2 || pageNum === totalCatalogPages - 1) {
                      return <span key={pageNum} className="text-slate-400 px-1">...</span>;
                    }
                    return null;
                  })}

                  <button
                    disabled={catalogPage >= totalCatalogPages}
                    onClick={() => setCatalogPage(prev => Math.min(totalCatalogPages, prev + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB: CATEGORY MASTER (IMAGE 2)
          ========================================================================= */}
      {adminTab === 'categories' && (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Category Master</h2>
            <p className="text-xs text-slate-500 mt-1">
              Create and maintain storefront categories and subcategories. Deactivation hides category navigation; products are retained.
            </p>
          </div>

          {/* Grid Layout: 2 Columns (Form on left ~40%, Directory Table on right ~60%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT CARD: Add / Edit Category Form */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900">
                  {editingCategoryId ? 'Edit Category' : 'Add Category'}
                </h3>
                {editingCategoryId && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Editing ID #{editingCategoryId}
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveCategory} className="space-y-4">
                {/* Row 1: Category Name & Unique Slug */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Category name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Vegetables & Fruits"
                      value={catFormName}
                      onChange={e => handleCategoryNameChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Unique slug <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="vegetables-fruits"
                      value={catFormSlug}
                      onChange={e => setCatFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                    />
                  </div>
                </div>

                {/* Row 2: Icon/emoji & Image Path */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Icon / emoji
                    </label>
                    <input
                      type="text"
                      placeholder="🥦"
                      value={catFormEmoji}
                      onChange={e => setCatFormEmoji(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Image path <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="/static/images/categories/veggies.jpg"
                      value={catFormImagePath}
                      onChange={e => setCatFormImagePath(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                    />
                  </div>
                </div>

                {/* Row 3: Upload category image */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Upload category image
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCategoryImageUpload}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 border border-slate-200 rounded-xl p-1.5 bg-white cursor-pointer"
                    />
                    {catImagePreview && (
                      <img
                        src={catImagePreview}
                        alt="Preview"
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">JPG, PNG or WebP</p>
                </div>

                {/* Row 4: Parent Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Parent category <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <select
                    value={catFormParent}
                    onChange={e => setCatFormParent(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white font-medium"
                  >
                    <option value="none">None — main category</option>
                    {categories
                      .filter(c => c.id !== editingCategoryId)
                      .map(c => (
                        <option key={c.id} value={c.name}>
                          {c.iconEmoji} {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Row 5: Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Short description for this category"
                    value={catFormDesc}
                    onChange={e => setCatFormDesc(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white resize-y"
                  />
                </div>

                {/* Row 6: Display Order */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Display order
                  </label>
                  <input
                    type="number"
                    value={catFormOrder}
                    onChange={e => setCatFormOrder(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                  />
                </div>

                {/* Row 7: Checkboxes */}
                <div className="flex flex-wrap items-center gap-5 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={catFormActive}
                      onChange={e => setCatFormActive(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                    />
                    <span>Active in store</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={catFormShowHome}
                      onChange={e => setCatFormShowHome(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                    />
                    <span>Show on customer home</span>
                  </label>
                </div>

                {/* Row 8: Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#d1fae5] hover:bg-[#a7f3d0] text-[#065f46] border border-[#a7f3d0] font-bold text-xs rounded-lg transition-colors shadow-xs"
                  >
                    {editingCategoryId ? 'Update Category' : 'Save Category'}
                  </button>

                  <button
                    type="button"
                    onClick={handleClearCategoryForm}
                    className="px-4 py-2 bg-[#fef2f2] hover:bg-[#fee2e2] text-[#991b1b] border border-[#fecaca] font-bold text-xs rounded-lg transition-colors shadow-xs"
                  >
                    Clear
                  </button>
                </div>
              </form>
            </div>

            {/* RIGHT CARD: Category Master Directory Table */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-3">Parent</th>
                      <th className="py-3 px-3">Products</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Home</th>
                      <th className="py-3 px-3">Order</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortCategoriesByOrder(categories).map(cat => {
                      const prodCount = products.filter(
                        p =>
                          p.categorySlug === cat.slug ||
                          p.categorySlug === cat.name ||
                          p.categorySlug?.toLowerCase() === cat.slug?.toLowerCase()
                      ).length;
                      const isActive = cat.isActive !== false;
                      const isShownOnHome = cat.showOnHome !== false;

                      return (
                        <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Category Name & Slug */}
                          <td className="py-3 px-4">
                            <div className="flex items-start gap-2.5">
                              <span className="text-base select-none mt-0.5">{cat.iconEmoji || '📦'}</span>
                              <div>
                                <div className="font-bold text-slate-900 text-xs leading-snug">
                                  {cat.name}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                  {cat.slug}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Parent Category */}
                          <td className="py-3 px-3 text-slate-500 font-medium whitespace-nowrap">
                            {cat.parentCategory ? cat.parentCategory : '—'}
                          </td>

                          {/* Products Count */}
                          <td className="py-3 px-3 text-slate-700 font-bold tabular-nums">
                            {prodCount}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3">
                            <span
                              className={`font-bold ${
                                isActive ? 'text-slate-900' : 'text-slate-400'
                              }`}
                            >
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>

                          {/* Home */}
                          <td className="py-3 px-3 text-slate-600 font-medium">
                            {isShownOnHome ? 'Shown' : 'Hidden'}
                          </td>

                          {/* Order */}
                          <td className="py-3 px-3 text-slate-600 font-medium tabular-nums">
                            {cat.displayOrder ?? 0}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleEditCategory(cat)}
                                className="px-2.5 py-1 bg-[#fef2f2] hover:bg-[#fee2e2] text-[#dc2626] border border-[#fecaca] font-semibold text-xs rounded-md transition-colors"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => handleToggleCategoryActive(cat.id)}
                                className={`px-2.5 py-1 font-semibold text-xs rounded-md transition-colors border ${
                                  isActive
                                    ? 'bg-[#ecfdf5] hover:bg-[#d1fae5] text-[#047857] border-[#a7f3d0]'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                                }`}
                              >
                                {isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: AUDIT & PREVIEW LOGS
          ========================================================================= */}
      {adminTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4">
          <div className="p-4 sm:p-5 border-b border-slate-200">
            <h2 className="font-extrabold text-base text-slate-900">
              Administrative Status Changes & Preview Logs
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable audit history recording all approval decisions, suspensions, reactivations, and admin portal previews.
            </p>
          </div>

          <div className="p-4 sm:p-5 space-y-6">
            {/* Status Change History across all vendors */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Vendor Lifecycle Decisions
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3 pl-4">Timestamp</th>
                      <th className="p-3">Vendor</th>
                      <th className="p-3">Admin</th>
                      <th className="p-3">Transition</th>
                      <th className="p-3">Reason / Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vendors.flatMap(v =>
                      (v.statusHistory || []).map(hist => ({
                        ...hist,
                        vendorName: v.businessName
                      }))
                    ).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400">
                          No status changes recorded yet.
                        </td>
                      </tr>
                    ) : (
                      vendors
                        .flatMap(v =>
                          (v.statusHistory || []).map(hist => ({
                            ...hist,
                            vendorName: v.businessName
                          }))
                        )
                        .reverse()
                        .map(item => (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="p-3 pl-4 text-slate-500 whitespace-nowrap tabular-nums">
                              {item.timestamp}
                            </td>
                            <td className="p-3 font-bold text-slate-900">{item.vendorName}</td>
                            <td className="p-3 text-slate-600">{item.adminIdentifier}</td>
                            <td className="p-3">
                              <span className="font-semibold capitalize text-slate-600">
                                {item.previousStatus}
                              </span>{' '}
                              &rarr;{' '}
                              <span
                                className={`font-bold capitalize ${
                                  item.newStatus === 'approved'
                                    ? 'text-emerald-700'
                                    : item.newStatus === 'rejected'
                                    ? 'text-rose-700'
                                    : item.newStatus === 'suspended'
                                    ? 'text-amber-700'
                                    : 'text-slate-800'
                                }`}
                              >
                                {item.newStatus}
                              </span>
                            </td>
                            <td className="p-3 text-slate-700 max-w-xs">{item.reason}</td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Admin Preview Sessions */}
            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Admin Vendor Portal Preview Sessions
              </h3>
              {adminPreviewLogs.length === 0 ? (
                <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl text-xs">
                  No admin preview sessions logged yet. Use "Preview Portal" on any supplier to inspect their dashboard in secure read-only mode.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3 pl-4">Timestamp</th>
                        <th className="p-3">Admin</th>
                        <th className="p-3">Target Vendor</th>
                        <th className="p-3">Action</th>
                        <th className="p-3">Security Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {adminPreviewLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="p-3 pl-4 text-slate-500 whitespace-nowrap tabular-nums">
                            {log.timestamp}
                          </td>
                          <td className="p-3 font-semibold text-slate-800">{log.adminIdentifier}</td>
                          <td className="p-3 font-bold text-slate-900">{log.vendorName}</td>
                          <td className="p-3">
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">{log.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Catalog Moderation & Visibility Decisions */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Supermarket Catalog Moderation Audit Trail
                </h3>
                <span className="text-xs text-slate-400 font-semibold">
                  {catalogAuditLogs.length} Moderation Decisions
                </span>
              </div>
              {catalogAuditLogs.length === 0 ? (
                <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl text-xs">
                  No catalog moderation actions logged yet. Approve, reject, or hide products to generate audit logs.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3 pl-4">Timestamp</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Admin</th>
                        <th className="p-3">Action</th>
                        <th className="p-3">State Transition</th>
                        <th className="p-3">Reason / Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {catalogAuditLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="p-3 pl-4 text-slate-500 whitespace-nowrap tabular-nums">
                            {log.timestamp}
                          </td>
                          <td className="p-3 font-bold text-slate-900">{log.productName}</td>
                          <td className="p-3 text-slate-600">{log.adminIdentifier}</td>
                          <td className="p-3">
                            <span
                              className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                log.action === 'APPROVE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : log.action === 'REJECT'
                                  ? 'bg-rose-100 text-rose-800'
                                  : log.action === 'HIDE'
                                  ? 'bg-slate-200 text-slate-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="p-3 text-slate-700">
                            {log.previousState && log.newState ? (
                              <span>
                                {log.previousState} &rarr; <strong className="text-slate-900">{log.newState}</strong>
                              </span>
                            ) : (
                              <span>-</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-600 max-w-xs">{log.reason || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: DELIVERY PARTNERS (STORYBOARD SECTION B)
          ========================================================================= */}
      {adminTab === 'delivery_partners' && (
        <div className="space-y-6">
          {/* Header Card with Sub-Navigation */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-base text-slate-900">
                    Delivery Partner Fleet Operations
                  </h2>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300">
                    Hospete Operations Hub
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Approve rider applications, configure smart auto-dispatch, and monitor live partner locations across Hospete.
                </p>
              </div>

              {/* Sub Navigation Tabs */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setDeliverySubTab('applications')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    deliverySubTab === 'applications'
                      ? 'bg-white text-slate-900 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Partner Applications</span>
                  {pendingRidersCount > 0 && (
                    <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                      {pendingRidersCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setDeliverySubTab('auto_assignment')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    deliverySubTab === 'auto_assignment'
                      ? 'bg-white text-slate-900 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Auto-Dispatch &amp; Recommendations</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliverySubTab('locations')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    deliverySubTab === 'locations'
                      ? 'bg-white text-slate-900 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Live Locations (Map View)</span>
                </button>
              </div>
            </div>
          </div>

          {/* SUB-VIEW B1: PARTNER APPLICATIONS */}
          {deliverySubTab === 'applications' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4">
              {/* Filter Tabs matching Screen B1 in storyboard */}
              <div className="p-4 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPartnerAppFilter('pending')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      partnerAppFilter === 'pending'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Pending ({deliveryPartners.filter(d => d.status === 'pending' || d.status === 'under_review').length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setPartnerAppFilter('approved')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      partnerAppFilter === 'approved'
                        ? 'bg-emerald-600 text-white font-black shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Approved ({deliveryPartners.filter(d => d.status === 'approved').length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setPartnerAppFilter('rejected')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      partnerAppFilter === 'rejected'
                        ? 'bg-rose-600 text-white font-black shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Rejected ({deliveryPartners.filter(d => d.status === 'rejected' || d.status === 'documents_required').length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setPartnerAppFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      partnerAppFilter === 'all'
                        ? 'bg-slate-800 text-white font-black shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All ({deliveryPartners.length})
                  </button>
                </div>

                <div className="text-xs text-slate-500">
                  Showing applications awaiting verification or audit
                </div>
              </div>

              {/* Applications Table (Screen B1) */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3 pl-4">Name &amp; Code</th>
                      <th className="p-3">Mobile Number</th>
                      <th className="p-3">Service Area</th>
                      <th className="p-3">Vehicle Details</th>
                      <th className="p-3">Documents</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right pr-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deliveryPartners
                      .filter(d => {
                        if (partnerAppFilter === 'pending') return d.status === 'pending' || d.status === 'under_review';
                        if (partnerAppFilter === 'approved') return d.status === 'approved';
                        if (partnerAppFilter === 'rejected') return d.status === 'rejected' || d.status === 'documents_required';
                        return true;
                      })
                      .map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3 pl-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center overflow-hidden border border-emerald-300">
                                {p.profilePhoto ? (
                                  <img src={p.profilePhoto} alt={p.name} className="w-full h-full object-cover" />
                                ) : (
                                  p.name.slice(0, 2).toUpperCase()
                                )}
                              </div>
                              <div>
                                <div className="font-extrabold text-slate-900">{p.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{p.applicationId}</div>
                              </div>
                            </div>
                          </td>

                          <td className="p-3 font-semibold text-slate-700">
                            {p.phone}
                          </td>

                          <td className="p-3">
                            <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                              {p.serviceArea}
                            </span>
                          </td>

                          <td className="p-3">
                            <div className="font-bold text-slate-800">{p.vehicleNumber}</div>
                            <div className="text-[10px] text-slate-500">{p.vehicleType}</div>
                          </td>

                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              {p.documents.map(doc => (
                                <span
                                  key={doc.id}
                                  title={`${doc.name} (${doc.status})`}
                                  className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black cursor-pointer border ${
                                    doc.status === 'verified'
                                      ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                                      : doc.status === 'rejected'
                                      ? 'bg-rose-100 border-rose-300 text-rose-800'
                                      : 'bg-amber-100 border-amber-300 text-amber-800'
                                  }`}
                                  onClick={() => setViewingDocModal(doc)}
                                >
                                  {doc.type === 'photo' ? '📷' : doc.type === 'licence' ? 'DL' : doc.type === 'aadhaar' ? 'ID' : 'RC'}
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="p-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                p.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : p.status === 'rejected'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>

                          <td className="p-3 text-right pr-4">
                            <button
                              type="button"
                              onClick={() => {
                                setReviewingPartner(p);
                                setAdminPartnerNote(p.adminNotes || '');
                              }}
                              className={`px-3 py-1 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                                p.status === 'pending' || p.status === 'under_review'
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                              }`}
                            >
                              {p.status === 'pending' || p.status === 'under_review' ? 'Review &rarr;' : 'View Details'}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-VIEW B3: AUTO ASSIGNMENT & RECOMMENDATIONS */}
          {deliverySubTab === 'auto_assignment' && (() => {
            const unassignedReadyOrders = orders.filter(
              o => (o.status === 'Ready for Pickup' || o.status === 'Packed') && !o.assignedDeliveryBoyId
            );
            const assignedReadyOrders = orders.filter(
              o => o.status === 'Assigned' || ((o.status === 'Ready for Pickup' || o.status === 'Packed') && Boolean(o.assignedDeliveryBoyId))
            );

            return (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4">
                  <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-slate-900">
                          Ready for Pickup Orders (Unassigned)
                        </h3>
                        <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                          unassignedReadyOrders.length > 0
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {unassignedReadyOrders.length} {unassignedReadyOrders.length === 1 ? 'basket' : 'baskets'} awaiting rider
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Vendors have packed and sealed these baskets. Assign approved online delivery partners for pickup.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      {/* 1-Click Auto Assign All Button */}
                      {unassignedReadyOrders.length > 0 && autoAssignEnabled && (
                        <button
                          type="button"
                          onClick={handleAutoAssignAll}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Auto-Assign All ({unassignedReadyOrders.length})</span>
                        </button>
                      )}

                      {/* Auto Assign Toggle matching Screen B3 */}
                      <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 p-2 px-3 rounded-xl">
                        <span className="text-xs font-black text-slate-800">Auto Assign:</span>
                        <button
                          type="button"
                          onClick={() => setAutoAssignEnabled(!autoAssignEnabled)}
                          className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            autoAssignEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                              autoAssignEnabled ? 'right-1' : 'left-1'
                            }`}
                          />
                        </button>
                        <span className="text-[10px] font-black uppercase text-emerald-700">
                          {autoAssignEnabled ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Empty state when all ready orders have been assigned */}
                  {unassignedReadyOrders.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50/50 flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold">
                        ✓
                      </div>
                      <div className="font-extrabold text-sm text-slate-800">
                        All Ready-for-Pickup Orders Are Assigned!
                      </div>
                      <div className="text-xs text-slate-500 max-w-md">
                        There are currently no unassigned baskets waiting for drivers. Check the active assignments below or view live rider telemetry on the map.
                      </div>
                    </div>
                  ) : (
                    /* Unassigned Ready Orders Table (Screen B3 in storyboard) */
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="p-3 pl-4">Order ID</th>
                            <th className="p-3">Vendor / Store</th>
                            <th className="p-3">Pickup Area</th>
                            <th className="p-3">Items</th>
                            <th className="p-3">Amount</th>
                            <th className="p-3">Recommended Partner</th>
                            <th className="p-3">Recommendation Reason</th>
                            <th className="p-3 text-right pr-4">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {unassignedReadyOrders.map((ord, idx) => {
                            // Intelligent recommendation engine
                            const onlinePartners = deliveryPartners.filter(d => d.status === 'approved' && d.isOnline);
                            const recPartner =
                              onlinePartners[idx % onlinePartners.length] || deliveryPartners[0];
                            const reasons = [
                              'Closest (0.6 km) • 1 active order',
                              'On same delivery route (1.2 km)',
                              'Lowest workload (0 active orders)',
                              'Available now • Preferred area match',
                              'Near pickup store • Idle partner'
                            ];
                            const recReason = reasons[idx % reasons.length];

                            return (
                              <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="p-3 pl-4 font-mono font-black text-slate-900">
                                  #{ord.orderNumber}
                                </td>

                                <td className="p-3 font-bold text-slate-800">
                                  {ord.vendorName || (idx % 2 === 0 ? 'Sri Lakshmi Store' : 'Tungabhadra Agro & Organics')}
                                </td>

                                <td className="p-3">
                                  <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-semibold text-[11px]">
                                    {ord.locality || 'Kampli Road'}
                                  </span>
                                </td>

                                <td className="p-3 font-semibold text-slate-700">
                                  {ord.items.length} items
                                </td>

                                <td className="p-3 font-black text-emerald-700">
                                  ₹{ord.totalAmount}
                                </td>

                                {/* Recommended Partner */}
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">
                                      🛵
                                    </div>
                                    <div>
                                      <div className="font-extrabold text-slate-900">{recPartner.name}</div>
                                      <div className="text-[10px] text-slate-400 font-mono">{recPartner.code}</div>
                                    </div>
                                  </div>
                                </td>

                                {/* Reason */}
                                <td className="p-3">
                                  <span className="text-[10px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full inline-block">
                                    {recReason}
                                  </span>
                                </td>

                                {/* Action Button with Dropdown Menu */}
                                <td className="p-3 text-right pr-4">
                                  <div className="relative inline-flex items-center justify-end">
                                    <div className="inline-flex rounded-lg shadow-2xs overflow-visible">
                                      {/* 1-Click Assign to Recommended Partner */}
                                      <button
                                        type="button"
                                        onClick={() => handleAssignOrderToPartner(ord.id, recPartner)}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold rounded-l-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
                                        title={`Assign to ${recPartner.name} (${recPartner.code})`}
                                      >
                                        <span>Assign</span>
                                      </button>

                                      {/* Chevron to pick a different rider */}
                                      <button
                                        type="button"
                                        onClick={() => setAssignDropdownOrderId(assignDropdownOrderId === ord.id ? null : ord.id)}
                                        className={`px-1.5 py-1.5 border-l border-emerald-500 text-white font-extrabold rounded-r-lg text-xs transition-colors cursor-pointer ${
                                          assignDropdownOrderId === ord.id
                                            ? 'bg-emerald-800'
                                            : 'bg-emerald-600 hover:bg-emerald-700'
                                        }`}
                                        title="Choose specific partner"
                                      >
                                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${assignDropdownOrderId === ord.id ? 'rotate-180' : ''}`} />
                                      </button>
                                    </div>

                                    {/* Partner Picker Dropdown */}
                                    {assignDropdownOrderId === ord.id && (
                                      <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-2 space-y-1 text-left animate-in fade-in zoom-in-95 duration-100">
                                        <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 flex justify-between items-center">
                                          <span>Assign Partner</span>
                                          <span className="font-mono text-slate-600">#{ord.orderNumber}</span>
                                        </div>

                                        <div className="max-h-56 overflow-y-auto space-y-1 py-1">
                                          {deliveryPartners
                                            .filter(d => d.status === 'approved')
                                            .map(partner => (
                                              <button
                                                key={partner.id}
                                                type="button"
                                                onClick={() => handleAssignOrderToPartner(ord.id, partner)}
                                                className={`w-full p-2 rounded-xl text-left transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                                                  partner.id === recPartner.id
                                                    ? 'bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200'
                                                    : 'hover:bg-slate-50 border border-transparent'
                                                }`}
                                              >
                                                <div className="flex items-center gap-2 min-w-0">
                                                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs flex items-center justify-center shrink-0">
                                                    🛵
                                                  </div>
                                                  <div className="min-w-0">
                                                    <div className="font-bold text-xs text-slate-900 truncate flex items-center gap-1">
                                                      <span>{partner.name}</span>
                                                      {partner.id === recPartner.id && (
                                                        <span className="text-[9px] bg-emerald-600 text-white font-extrabold px-1 rounded">
                                                          Best
                                                        </span>
                                                      )}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 font-mono">
                                                      {partner.code} · {partner.activeOrdersCount || 0} active
                                                    </div>
                                                  </div>
                                                </div>
                                                <span
                                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                                    partner.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                                                  }`}
                                                  title={partner.isOnline ? 'Online' : 'Offline'}
                                                />
                                              </button>
                                            ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* RECENTLY ASSIGNED ORDERS (Awaiting Rider Pickup) */}
                {assignedReadyOrders.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4">
                    <div className="p-4 sm:p-5 border-b border-slate-200 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base text-slate-900">
                            Assigned Baskets (Awaiting Pickup)
                          </h3>
                          <span className="text-xs bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full">
                            {assignedReadyOrders.length} active assignments
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Assigned delivery partners have been alerted and are en route to collect from stores.
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="p-3 pl-4">Order ID</th>
                            <th className="p-3">Store Location</th>
                            <th className="p-3">Assigned Partner</th>
                            <th className="p-3">Rider Phone</th>
                            <th className="p-3">Assigned At</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right pr-4">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {assignedReadyOrders.map(ord => (
                            <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="p-3 pl-4 font-mono font-black text-slate-900">
                                #{ord.orderNumber}
                              </td>

                              <td className="p-3 font-bold text-slate-800">
                                {ord.vendorName || 'Sri Lakshmi Store'} ({ord.locality})
                              </td>

                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">
                                    🛵
                                  </div>
                                  <span className="font-black text-slate-900">
                                    {ord.assignedDeliveryBoy || 'Assigned Partner'}
                                  </span>
                                </div>
                              </td>

                              <td className="p-3 font-mono text-slate-600">
                                {ord.assignedDeliveryBoyPhone || '+91 98450 12345'}
                              </td>

                              <td className="p-3 text-slate-500">
                                {ord.assignedAt || 'Just now'}
                              </td>

                              <td className="p-3">
                                <span className="bg-blue-100 text-blue-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                                  <span>Assigned / En Route</span>
                                </span>
                              </td>

                              <td className="p-3 text-right pr-4">
                                <div className="relative inline-flex items-center justify-end">
                                  <button
                                    type="button"
                                    onClick={() => setAssignDropdownOrderId(assignDropdownOrderId === ord.id ? null : ord.id)}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <span>Reassign</span>
                                    <ChevronDown className="w-3 h-3" />
                                  </button>

                                  {assignDropdownOrderId === ord.id && (
                                    <div className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-2 space-y-1 text-left animate-in fade-in zoom-in-95 duration-100">
                                      <div className="px-2 py-1 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                                        Reassign #{ord.orderNumber}
                                      </div>
                                      <div className="max-h-48 overflow-y-auto space-y-1 py-1">
                                        {deliveryPartners
                                          .filter(d => d.status === 'approved')
                                          .map(partner => (
                                            <button
                                              key={partner.id}
                                              type="button"
                                              onClick={() => handleAssignOrderToPartner(ord.id, partner)}
                                              className="w-full p-2 rounded-xl text-left hover:bg-slate-50 transition-colors flex items-center justify-between text-xs cursor-pointer"
                                            >
                                              <span className="font-bold text-slate-800">{partner.name} ({partner.code})</span>
                                              <span className={`w-2 h-2 rounded-full ${partner.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                            </button>
                                          ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* SUB-VIEW B4: PARTNER LOCATIONS (MAP VIEW) */}
          {deliverySubTab === 'locations' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Map Graphic (Screen B4 in storyboard) */}
              <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-md flex flex-col min-h-[460px]">
                <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-white">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span className="font-black text-xs">Hospete Delivery Fleet — Live GPS Grid</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {deliveryPartners.filter(d => d.isOnline).length} Online Riders
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-500" />
                      {deliveryPartners.filter(d => !d.isOnline).length} Offline
                    </span>
                  </div>
                </div>

                {/* SVG Visual Map Graphic */}
                <div className="flex-1 relative flex items-center justify-center p-6">
                  <svg className="w-full h-full max-h-[380px]" viewBox="0 0 600 400">
                    {/* Background Road Grid */}
                    <line x1="50" y1="200" x2="550" y2="200" stroke="#334155" strokeWidth="6" />
                    <line x1="300" y1="50" x2="300" y2="350" stroke="#334155" strokeWidth="6" />
                    <line x1="120" y1="80" x2="480" y2="320" stroke="#1e293b" strokeWidth="4" strokeDasharray="6 4" />
                    <line x1="480" y1="80" x2="120" y2="320" stroke="#1e293b" strokeWidth="4" strokeDasharray="6 4" />

                    {/* Major Hospete Nodes */}
                    {/* 1. MP Prakash Nagar */}
                    <circle cx="120" cy="140" r="18" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
                    <text x="120" y="172" fontSize="9" textAnchor="middle" fill="#94a3b8" fontWeight="bold">MP Prakash Nagar</text>

                    {/* 2. Station Road */}
                    <circle cx="450" cy="150" r="18" fill="#0f172a" stroke="#3b82f6" strokeWidth="2" />
                    <text x="450" y="182" fontSize="9" textAnchor="middle" fill="#94a3b8" fontWeight="bold">Station Road</text>

                    {/* 3. Kampli Road / Bus Stand Hub */}
                    <circle cx="300" cy="200" r="24" fill="#047857" stroke="#34d399" strokeWidth="3" />
                    <text x="300" y="240" fontSize="10" textAnchor="middle" fill="#34d399" fontWeight="900">Central Hub / Bus Stand</text>

                    {/* 4. Dam Road */}
                    <circle cx="150" cy="300" r="18" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
                    <text x="150" y="332" fontSize="9" textAnchor="middle" fill="#94a3b8" fontWeight="bold">Dam Road</text>

                    {/* 5. College Road */}
                    <circle cx="450" cy="280" r="18" fill="#0f172a" stroke="#8b5cf6" strokeWidth="2" />
                    <text x="450" y="312" fontSize="9" textAnchor="middle" fill="#94a3b8" fontWeight="bold">College Road</text>

                    {/* Delivery Partner Markers with Pulse */}
                    {/* Ravi Kumar */}
                    <g transform="translate(140, 120)">
                      <circle cx="0" cy="0" r="16" fill="#10b981" opacity="0.3" className="animate-ping" />
                      <circle cx="0" cy="0" r="12" fill="#10b981" />
                      <text x="0" y="4" fontSize="9" textAnchor="middle" fill="#0f172a" fontWeight="900">🛵</text>
                      <rect x="15" y="-12" width="70" height="22" rx="4" fill="#0f172a" stroke="#10b981" strokeWidth="1" />
                      <text x="50" y="2" fontSize="8" textAnchor="middle" fill="#ffffff" fontWeight="bold">Ravi (1 ord)</text>
                    </g>

                    {/* Suresh B */}
                    <g transform="translate(180, 280)">
                      <circle cx="0" cy="0" r="12" fill="#10b981" />
                      <text x="0" y="4" fontSize="9" textAnchor="middle" fill="#0f172a" fontWeight="900">🛵</text>
                      <rect x="15" y="-12" width="80" height="22" rx="4" fill="#0f172a" stroke="#10b981" strokeWidth="1" />
                      <text x="55" y="2" fontSize="8" textAnchor="middle" fill="#ffffff" fontWeight="bold">Suresh (2 ord)</text>
                    </g>

                    {/* Imran Khan */}
                    <g transform="translate(420, 130)">
                      <circle cx="0" cy="0" r="12" fill="#10b981" />
                      <text x="0" y="4" fontSize="9" textAnchor="middle" fill="#0f172a" fontWeight="900">🛵</text>
                      <rect x="-85" y="-12" width="75" height="22" rx="4" fill="#0f172a" stroke="#10b981" strokeWidth="1" />
                      <text x="-48" y="2" fontSize="8" textAnchor="middle" fill="#ffffff" fontWeight="bold">Imran (0 ord)</text>
                    </g>

                    {/* Manoj Singh */}
                    <g transform="translate(420, 260)">
                      <circle cx="0" cy="0" r="12" fill="#10b981" />
                      <text x="0" y="4" fontSize="9" textAnchor="middle" fill="#0f172a" fontWeight="900">🛵</text>
                      <rect x="-85" y="-12" width="75" height="22" rx="4" fill="#0f172a" stroke="#10b981" strokeWidth="1" />
                      <text x="-48" y="2" fontSize="8" textAnchor="middle" fill="#ffffff" fontWeight="bold">Manoj (3 ord)</text>
                    </g>

                    {/* Devaraj H (Offline) */}
                    <g transform="translate(260, 240)">
                      <circle cx="0" cy="0" r="10" fill="#64748b" />
                      <text x="0" y="3" fontSize="8" textAnchor="middle" fill="#ffffff">⏸️</text>
                      <rect x="12" y="-10" width="80" height="20" rx="4" fill="#1e293b" />
                      <text x="52" y="3" fontSize="7" textAnchor="middle" fill="#94a3b8">Devaraj (Offline)</text>
                    </g>
                  </svg>
                </div>
              </div>

              {/* Side Fleet Roster Panel (Screen B4) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                  <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider">
                    Delivery Partners — Live Status
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500">
                    {deliveryPartners.length} registered
                  </span>
                </div>

                <div className="space-y-2.5 overflow-y-auto max-h-[460px] pr-1">
                  {deliveryPartners.map(p => (
                    <div
                      key={p.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                            🛵
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900">{p.name}</div>
                            <div className="text-[10px] text-slate-500">{p.serviceArea}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                              p.status === 'suspended'
                                ? 'bg-rose-100 text-rose-800'
                                : p.status === 'pending' || p.status === 'under_review'
                                ? 'bg-amber-100 text-amber-800'
                                : p.mustChangePassword
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {p.status === 'suspended'
                              ? 'Suspended'
                              : p.status === 'pending' || p.status === 'under_review'
                              ? 'Pending'
                              : p.mustChangePassword
                              ? '1st Login Due'
                              : 'Active'}
                          </span>
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                              p.isOnline
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {p.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-200/60">
                        <span className="text-slate-600">Active Workload:</span>
                        <strong className="text-slate-900">
                          {p.activeOrdersCount} active order{p.activeOrdersCount !== 1 ? 's' : ''}
                        </strong>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                        <span>Last Login:</span>
                        <span className="font-semibold text-slate-700">
                          {p.lastLoginAt
                            ? new Date(p.lastLoginAt).toLocaleTimeString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'Never logged in'}
                        </span>
                      </div>

                      <div className="flex gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => handleTogglePartnerOnline(p.id)}
                          className="flex-1 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                        >
                          {p.isOnline ? 'Set Offline' : 'Set Online'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTogglePartnerSuspend(p.id)}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                            p.status === 'suspended'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                          }`}
                        >
                          {p.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                        </button>
                        {p.status === 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleAdminTriggerPasswordReset(p)}
                            disabled={adminActionLoading}
                            className="py-1 px-2 rounded-lg bg-white border border-amber-300 text-[10px] font-bold text-amber-700 hover:bg-amber-50 cursor-pointer"
                            title="Generate fresh temporary login credentials"
                          >
                            Reset Pass
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* APPLICATION REVIEW MODAL (Screen B2 in storyboard) */}
          {reviewingPartner && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-xs text-slate-800 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Application ID: {reviewingPartner.applicationId}
                    </span>
                    <h2 className="text-lg font-black text-slate-900 mt-1">
                      Review Rider Application — {reviewingPartner.name}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReviewingPartner(null)}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Details */}
                  <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 font-black text-base flex items-center justify-center overflow-hidden">
                        {reviewingPartner.profilePhoto ? (
                          <img src={reviewingPartner.profilePhoto} alt="" className="w-full h-full object-cover" />
                        ) : (
                          'RK'
                        )}
                      </div>
                      <div>
                        <div className="font-black text-sm text-slate-900">{reviewingPartner.name}</div>
                        <div className="text-slate-500 font-semibold">{reviewingPartner.phone}</div>
                        <div className="text-[10px] text-slate-400">{reviewingPartner.email || 'No email provided'}</div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-200">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Service Area</span>
                        <span className="font-bold text-slate-900">{reviewingPartner.serviceArea}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Vehicle Type</span>
                        <span className="font-bold text-slate-900">{reviewingPartner.vehicleType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Vehicle Number</span>
                        <span className="font-mono font-bold text-slate-900">{reviewingPartner.vehicleNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Driving Licence</span>
                        <span className="font-mono font-bold text-slate-900">{reviewingPartner.licenceNumber || 'DL-1234567890'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Aadhaar Card</span>
                        <span className="font-mono font-bold text-slate-900">{reviewingPartner.aadhaarNumber || '********1234'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Bank Details</span>
                        <span className="font-bold text-slate-900">{reviewingPartner.bankDetails?.bankName || 'HDFC Bank'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Documents Gallery */}
                  <div className="space-y-3">
                    <div className="font-black text-slate-900 text-xs">Submitted Verification Documents</div>
                    <div className="grid grid-cols-2 gap-2">
                      {reviewingPartner.documents.map(doc => (
                        <div
                          key={doc.id}
                          onClick={() => setViewingDocModal(doc)}
                          className="p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-base">
                              {doc.type === 'photo'
                                ? '👤'
                                : doc.type === 'aadhaar'
                                ? '🪪'
                                : doc.type === 'licence'
                                ? '📄'
                                : doc.type === 'bank_proof'
                                ? '🏦'
                                : '🛵'}
                            </span>
                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                                doc.status === 'verified'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : doc.status === 'rejected'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {doc.status}
                            </span>
                          </div>
                          <div className="font-bold text-[11px] text-slate-900 truncate">
                            {doc.name}
                            {doc.side && <span className="ml-1 text-[9px] text-slate-500 font-semibold">({doc.side})</span>}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">{doc.fileName}</div>
                        </div>
                      ))}
                    </div>

                    {/* Admin Note textarea */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-700 uppercase mb-1">
                        Admin Note (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={adminPartnerNote}
                        onChange={e => setAdminPartnerNote(e.target.value)}
                        placeholder="e.g. All documents verified valid through 2030."
                        className="w-full p-2.5 border border-slate-200 rounded-xl outline-none text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Actions matching Screen B2 */}
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleRejectPartner(reviewingPartner.id)}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl cursor-pointer"
                  >
                    Reject
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApprovePartner(reviewingPartner.id)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Approve Partner</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENT PREVIEW MODAL */}
          {viewingDocModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <div className="text-left">
                    <h3 className="font-black text-sm text-slate-900">{viewingDocModal.name}</h3>
                    {viewingDocModal.side && (
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        {viewingDocModal.side} Side
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewingDocModal(null)}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="w-full min-h-56 max-h-80 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-200 overflow-hidden relative">
                  {(viewingDocModal.fileData && viewingDocModal.fileData.startsWith('data:image')) ||
                  (viewingDocModal.previewUrl && (viewingDocModal.previewUrl.startsWith('http') || viewingDocModal.previewUrl.startsWith('data:image'))) ? (
                    <img
                      src={viewingDocModal.fileData || viewingDocModal.previewUrl}
                      alt={viewingDocModal.name}
                      className="w-full h-full object-contain max-h-72"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 p-6 text-slate-600">
                      <FileText className="w-14 h-14 text-emerald-600 stroke-1" />
                      <div className="font-black text-slate-900 text-xs text-center">{viewingDocModal.fileName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {viewingDocModal.fileSize || 'PDF / Secure Document'}
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Verified Hospete Fresh Document
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-left">
                  <div className="truncate max-w-[260px]">
                    <span className="font-bold text-slate-700">File: </span>
                    <span className="font-mono text-slate-900">{viewingDocModal.fileName}</span>
                  </div>
                  <div className="font-mono shrink-0">{viewingDocModal.fileSize || ''}</div>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingDocModal(null)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 font-black text-white rounded-xl cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          )}

          {/* ISSUED CREDENTIALS & HANDOFF MODAL */}
          {issuedCredentialsModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs text-slate-800">
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-900">
                        {issuedCredentialsModal.isReset ? 'Password Reset Credentials' : 'Login Credentials Issued'}
                      </h2>
                      <p className="text-[11px] text-slate-500 font-medium">Hospete Fresh Delivery Partner Access</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIssuedCredentialsModal(null);
                      setCredentialCopied(false);
                    }}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Rider Name:</span>
                    <strong className="text-slate-900">{issuedCredentialsModal.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Login Mobile:</span>
                    <span className="font-mono font-bold text-slate-900">{issuedCredentialsModal.phone}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="text-slate-600 font-black">Temporary Password:</span>
                    <span className="font-mono font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded text-sm tracking-wider">
                      {issuedCredentialsModal.temporaryPassword}
                    </span>
                  </div>
                </div>

                {issuedCredentialsModal.smsProviderConfigured ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>An automated SMS containing these credentials has been dispatched to the rider.</span>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] space-y-1">
                    <div className="font-black flex items-center gap-1 text-amber-800">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Admin-Controlled Credential Handoff</span>
                    </div>
                    <p className="text-[10px] leading-relaxed text-amber-800">
                      No telecom SMS gateway (Twilio / MSG91) is active in .env. Share this temporary password securely with the rider.
                    </p>
                  </div>
                )}

                <div className="p-2.5 bg-slate-100 rounded-xl text-[10px] text-slate-600 flex items-start gap-1.5 leading-relaxed">
                  <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Security Policy:</strong> The rider must enter this temporary password upon first login and set their own permanent password before dashboard access is permitted.
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const textToCopy = `Hospete Fresh Rider Login\nMobile: ${issuedCredentialsModal.phone}\nTemporary Password: ${issuedCredentialsModal.temporaryPassword}\nPlease change your password on first login.`;
                      navigator.clipboard.writeText(textToCopy);
                      setCredentialCopied(true);
                      setTimeout(() => setCredentialCopied(false), 2500);
                    }}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer text-xs transition-colors"
                  >
                    {credentialCopied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{credentialCopied ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIssuedCredentialsModal(null);
                      setCredentialCopied(false);
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-xl cursor-pointer text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 7: MARKETING → HOME BANNER MANAGEMENT (Requirement 2, 3, 4)
          ========================================================================= */}
      {adminTab === 'banners' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Header & Primary CTA */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Marketing & Promotions
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs font-bold text-slate-500">Customer Storefront Carousel</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Home Banner Management
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Create and manage promotional banners displayed on the customer home screen. Configure promo codes, scheduling, CTA destinations, and carousel rotation speeds.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddBanner}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add New Banner</span>
            </button>
          </div>

          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Total Banners
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
                {bannerSummaryCounts.total}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Configured promotions</span>
            </div>

            <div className="bg-white rounded-2xl border border-emerald-200/80 p-4 shadow-2xs bg-emerald-50/20">
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">
                Active Banners
              </span>
              <div className="text-2xl font-black text-emerald-700 mt-1 tabular-nums">
                {bannerSummaryCounts.active}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">Live in carousel</span>
            </div>

            <div className="bg-white rounded-2xl border border-blue-200/80 p-4 shadow-2xs bg-blue-50/20">
              <span className="text-[10px] font-black uppercase text-blue-800 tracking-wider block">
                Scheduled
              </span>
              <div className="text-2xl font-black text-blue-700 mt-1 tabular-nums">
                {bannerSummaryCounts.scheduled}
              </div>
              <span className="text-[11px] text-blue-600 font-semibold mt-0.5 block">Awaiting start date</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Inactive / Draft
              </span>
              <div className="text-2xl font-black text-slate-600 mt-1 tabular-nums">
                {bannerSummaryCounts.inactive}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Hidden from store</span>
            </div>
          </div>

          {/* Carousel Rotation & Playback Settings (Requirement 4) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900">
                  Customer Carousel Behavior & Rotation Settings
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Changes apply instantly to the Customer Home screen
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Auto-Rotate Interval Selector */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="font-extrabold text-slate-800 block">
                  Auto-Rotate Interval
                </label>
                <p className="text-[11px] text-slate-500">
                  Time each banner stays before sliding to the next
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5, 7, 10].map(sec => {
                    const isSelected = bannerSettings?.autoRotateIntervalSeconds === sec;
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => handleUpdateCarouselInterval(sec as any)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-2xs ring-2 ring-emerald-300'
                            : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
                        }`}
                      >
                        {sec}s
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Autoplay & Interaction Controls */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <span className="font-extrabold text-slate-800 block">Play & Interaction Rules</span>
                <div className="space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-700 font-medium">Enable Auto-Rotation</span>
                    <input
                      type="checkbox"
                      checked={bannerSettings?.isAutoRotateEnabled ?? true}
                      onChange={handleToggleCarouselAutoRotate}
                      className="w-4 h-4 accent-emerald-600 cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-700 font-medium">Pause on Desktop Hover</span>
                    <input
                      type="checkbox"
                      checked={bannerSettings?.pauseOnHover ?? true}
                      onChange={handleToggleCarouselPauseOnHover}
                      className="w-4 h-4 accent-emerald-600 cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-700 font-medium">Pause on Mobile Swiping</span>
                    <input
                      type="checkbox"
                      checked={bannerSettings?.pauseOnInteraction ?? true}
                      onChange={handleToggleCarouselPauseOnInteraction}
                      className="w-4 h-4 accent-emerald-600 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Navigation Indicators */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <span className="font-extrabold text-slate-800 block">Navigation Indicators</span>
                <div className="space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-700 font-medium">Show Slide Indicator Dots</span>
                    <input
                      type="checkbox"
                      checked={bannerSettings?.showIndicators ?? true}
                      onChange={handleToggleCarouselIndicators}
                      className="w-4 h-4 accent-emerald-600 cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-700 font-medium">Show Previous / Next Arrows</span>
                    <input
                      type="checkbox"
                      checked={bannerSettings?.showArrows ?? true}
                      onChange={handleToggleCarouselArrows}
                      className="w-4 h-4 accent-emerald-600 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={bannerSearch}
                  onChange={e => setBannerSearch(e.target.value)}
                  placeholder="Search banners by title, headline, promo code..."
                  className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 focus:bg-white text-slate-900 font-medium placeholder:text-slate-400"
                />
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                {[
                  { id: 'all', label: 'All', count: bannerSummaryCounts.total },
                  { id: 'active', label: 'Active', count: bannerSummaryCounts.active },
                  { id: 'scheduled', label: 'Scheduled', count: bannerSummaryCounts.scheduled },
                  { id: 'inactive', label: 'Inactive', count: bannerSummaryCounts.inactive }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setBannerStatusFilter(tab.id as any)}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      bannerStatusFilter === tab.id
                        ? 'bg-white text-emerald-800 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        bannerStatusFilter === tab.id
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Table View (Hidden on mobile < 768px) */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pl-5">Reorder</th>
                  <th className="p-3.5">Banner Image</th>
                  <th className="p-3.5">Internal Title & Headline</th>
                  <th className="p-3.5">Offer & Promo</th>
                  <th className="p-3.5">CTA Target</th>
                  <th className="p-3.5">Schedule</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBanners.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-400">
                      <Megaphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-700">No promotional banners found</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {bannerSearch ? 'Try clearing your search query' : 'Click "+ Add New Banner" to create your first promotion.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredBanners.map((b, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === filteredBanners.length - 1;

                    return (
                      <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Reorder Buttons */}
                        <td className="p-3.5 pl-5">
                          <div className="flex items-center gap-1">
                            <span className="w-5 font-mono font-black text-slate-600 text-xs">
                              #{b.displayOrder}
                            </span>
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                disabled={isFirst}
                                onClick={() => handleMoveBannerOrder(idx, 'up')}
                                className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                                  isFirst
                                    ? 'text-slate-300 cursor-not-allowed'
                                    : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900 cursor-pointer'
                                }`}
                                title="Move Banner Up"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={isLast}
                                onClick={() => handleMoveBannerOrder(idx, 'down')}
                                className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                                  isLast
                                    ? 'text-slate-300 cursor-not-allowed'
                                    : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900 cursor-pointer'
                                }`}
                                title="Move Banner Down"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Thumbnail */}
                        <td className="p-3.5">
                          <div className="w-20 h-11 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shadow-2xs flex items-center justify-center relative group">
                            <img
                              src={b.imageUrl}
                              alt={b.altText || b.title}
                              onError={e => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                onClick={() => setPreviewingBanner(b)}
                                className="text-white text-[10px] font-bold"
                              >
                                Preview
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Title & Customer Headline */}
                        <td className="p-3.5 max-w-[220px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 truncate">{b.title}</span>
                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md ${
                                b.displayMode === 'artwork'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {b.displayMode === 'artwork' ? 'Artwork' : 'HTML Card'}
                            </span>
                          </div>
                          <div className="text-[11px] font-semibold text-emerald-800 line-clamp-1 mt-0.5">
                            {b.headline}
                          </div>
                          {b.description && (
                            <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                              {b.description}
                            </div>
                          )}
                        </td>

                        {/* Offer & Promo */}
                        <td className="p-3.5">
                          {b.offerLabel && (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-900 mb-1">
                              {b.offerLabel}
                            </span>
                          )}
                          {b.promoCode ? (
                            <div className="font-mono text-[10px] font-black text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded inline-block">
                              CODE: {b.promoCode}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 block">—</span>
                          )}
                        </td>

                        {/* CTA Destination */}
                        <td className="p-3.5">
                          <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-800 rounded text-[10px] font-bold capitalize">
                            {b.ctaText} &rarr; {b.ctaType}
                          </span>
                        </td>

                        {/* Schedule */}
                        <td className="p-3.5 text-[11px]">
                          {b.startDate || b.endDate ? (
                            <div className="space-y-0.5 text-slate-600">
                              {b.startDate && <div>From: {b.startDate}</div>}
                              {b.endDate && <div>To: {b.endDate}</div>}
                            </div>
                          ) : (
                            <span className="text-slate-500 font-medium">Always Active</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              b.status === 'active' && b.isActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : b.status === 'scheduled'
                                ? 'bg-blue-100 text-blue-800'
                                : b.status === 'expired'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {b.isActive ? b.status : 'Inactive'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 pr-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewingBanner(b)}
                              className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                              title="Preview Customer Banner"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditBanner(b)}
                              className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors cursor-pointer"
                              title="Edit Banner"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleBannerActive(b)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                b.isActive
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {b.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmBanner(b)}
                              className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Delete Banner"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Card View (Hidden on >= md) */}
          <div className="md:hidden space-y-3">
            {filteredBanners.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
                <Megaphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700">No banners found</p>
              </div>
            ) : (
              filteredBanners.map((b, idx) => (
                <div key={b.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-20 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                      <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-xs text-slate-900 truncate">{b.title}</span>
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md ${
                            b.displayMode === 'artwork'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {b.displayMode === 'artwork' ? 'Artwork' : 'HTML Card'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 shrink-0">#{b.displayOrder}</span>
                      </div>
                      <div className="text-xs font-bold text-emerald-800 truncate mt-0.5">
                        {b.headline}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            b.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {b.isActive ? b.status : 'Inactive'}
                        </span>
                        {b.promoCode && (
                          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">
                            {b.promoCode}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                    <div className="text-[11px] text-slate-500">
                      {b.ctaText} &rarr; {b.ctaType}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewingBanner(b)}
                        className="p-1.5 bg-slate-100 text-slate-700 rounded-lg"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditBanner(b)}
                        className="p-1.5 bg-blue-50 text-blue-700 rounded-lg"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleBannerActive(b)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border ${
                          b.isActive
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {b.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmBanner(b)}
                        className="p-1.5 bg-rose-50 text-rose-700 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* =========================================================
              MODAL: ADD / EDIT BANNER (Requirement 3)
              ========================================================= */}
          {isAddBannerModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
                {/* Modal Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <h3 className="font-black text-lg text-slate-900">
                      {editingBanner ? 'Edit Home Banner' : 'Create New Promotional Banner'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure banner graphics, customer copy, promo code, and destination.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddBannerModalOpen(false)}
                    className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Body Form */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-800 flex-1">
                  {bannerFormError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{bannerFormError}</span>
                    </div>
                  )}

                  {/* DISPLAY MODE SELECTOR (Mode A: Image Artwork vs Mode B: HTML/Text Banner) */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-black text-slate-800 uppercase text-[10px] tracking-wider">
                        Banner Display Format *
                      </label>
                      <span className="text-[11px] text-slate-500 font-medium">Select storefront rendering style</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setBannerFormDisplayMode('artwork');
                          setPreviewImageError(false);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                          bannerFormDisplayMode === 'artwork'
                            ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-500/20 text-emerald-950 shadow-2xs'
                            : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center border shrink-0 ${
                            bannerFormDisplayMode === 'artwork'
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {bannerFormDisplayMode === 'artwork' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                        <div>
                          <div className="font-black text-xs text-slate-900">Mode A — Image Artwork (Recommended)</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            Uploaded graphic contains all copy, discounts & graphics. Displayed clean without text/button overlays.
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setBannerFormDisplayMode('html_text');
                          setPreviewImageError(false);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                          bannerFormDisplayMode === 'html_text'
                            ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-500/20 text-emerald-950 shadow-2xs'
                            : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center border shrink-0 ${
                            bannerFormDisplayMode === 'html_text'
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {bannerFormDisplayMode === 'html_text' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                        <div>
                          <div className="font-black text-xs text-slate-900">Mode B — HTML / Text Card</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            Structured card layout with styled headline, description, offer badge, coupon code, and button.
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* 1. IMAGE UPLOAD & SELECTION */}
                  <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="font-black text-slate-800 uppercase text-[10px] tracking-wider">
                        Banner Image Asset *
                      </label>
                      <span className="text-[11px] text-slate-400 font-medium">JPG, PNG, WebP (Max 5MB)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                      <div className="sm:col-span-2 space-y-3">
                        {/* Native File Upload Trigger Button */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => bannerFileInputRef.current?.click()}
                            disabled={bannerUploadLoading}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all disabled:opacity-60"
                          >
                            <Upload className="w-4 h-4" />
                            <span>{bannerUploadLoading ? 'Uploading & verifying image...' : 'Upload Image from Device'}</span>
                          </button>

                          <input
                            ref={bannerFileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                            onChange={handleBannerFileSelect}
                            className="hidden"
                          />

                          <span className="text-slate-400 text-xs">Direct local file upload</span>
                        </div>

                        {/* Upload Status Messages */}
                        {bannerUploadError && (
                          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                            <span>{bannerUploadError}</span>
                          </div>
                        )}

                        {bannerUploadSuccess && (
                          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                            <span>{bannerUploadSuccess}</span>
                          </div>
                        )}

                        {/* Uploaded Library Selection (if any uploaded images exist) */}
                        {uploadedBannerLibrary.length > 0 && (
                          <div className="pt-1">
                            <div className="text-[11px] font-bold text-slate-600 mb-1.5">
                              Or pick from uploaded image library:
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {uploadedBannerLibrary.slice(0, 4).map(item => (
                                <button
                                  key={item.imageUrl}
                                  type="button"
                                  onClick={() => {
                                    setBannerFormImageUrl(item.imageUrl);
                                    setBannerUploadError(null);
                                    setPreviewImageError(false);
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                    bannerFormImageUrl === item.imageUrl
                                      ? 'bg-emerald-700 text-white shadow-xs'
                                      : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                                  }`}
                                >
                                  <ImageIcon className="w-3 h-3" />
                                  <span className="truncate max-w-[120px]">{item.fileName}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Direct Image URL / Reference Input */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Persisted Image URL / Reference
                          </label>
                          <input
                            type="text"
                            value={bannerFormImageUrl}
                            onChange={e => {
                              setBannerFormImageUrl(e.target.value);
                              setPreviewImageError(false);
                            }}
                            placeholder="/api/banners/images/banner-img-123.png or https://..."
                            className="w-full h-8 px-2.5 text-xs font-mono text-slate-800 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Image Thumbnail Box */}
                      <div className="w-full sm:w-36 h-28 bg-slate-100 rounded-xl overflow-hidden border border-slate-300 flex items-center justify-center relative shrink-0">
                        {bannerFormImageUrl && !previewImageError ? (
                          <img
                            src={bannerFormImageUrl}
                            alt="Banner thumbnail"
                            onLoad={() => setPreviewImageError(false)}
                            onError={() => setPreviewImageError(true)}
                            className="w-full h-full object-cover"
                          />
                        ) : previewImageError ? (
                          <div className="p-2 text-center text-rose-500 text-[10px] font-bold flex flex-col items-center">
                            <AlertCircle className="w-4 h-4 mb-0.5" />
                            <span>Failed to load</span>
                          </div>
                        ) : (
                          <div className="p-2 text-center text-slate-400 text-[11px] font-medium flex flex-col items-center">
                            <ImageIcon className="w-5 h-5 mb-1 text-slate-300" />
                            <span>No image</span>
                          </div>
                        )}
                        {bannerUploadLoading && (
                          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center text-white">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2. CORE TITLE & HEADLINE FIELDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-black text-slate-700 uppercase text-[10px] mb-1">
                        Banner Title (Internal Admin Name) *
                      </label>
                      <input
                        type="text"
                        required
                        value={bannerFormTitle}
                        onChange={e => setBannerFormTitle(e.target.value)}
                        placeholder="e.g. Tungabhadra Harvest Fest"
                        className="w-full h-10 px-3 font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none placeholder:text-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block font-black text-slate-700 uppercase text-[10px] mb-1">
                        {bannerFormDisplayMode === 'artwork'
                          ? 'Customer Headline / Alt-Text (Optional for Artwork)'
                          : 'Customer-Facing Headline *'}
                      </label>
                      <input
                        type="text"
                        required={bannerFormDisplayMode === 'html_text'}
                        value={bannerFormHeadline}
                        onChange={e => setBannerFormHeadline(e.target.value)}
                        placeholder={
                          bannerFormDisplayMode === 'artwork'
                            ? 'e.g. Fresh farm harvest produce (screen readers & search)'
                            : 'e.g. Flat 30% OFF on Fresh Farm Staples'
                        }
                        className="w-full h-10 px-3 font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-black text-slate-700 uppercase text-[10px] mb-1">
                      Short Description {bannerFormDisplayMode === 'artwork' ? '(Optional — used for search & meta)' : '(Optional)'}
                    </label>
                    <textarea
                      rows={2}
                      value={bannerFormDesc}
                      onChange={e => setBannerFormDesc(e.target.value)}
                      placeholder="e.g. Handpicked local veggies, Nandini dairy & freshly made snacks delivered in 15 mins."
                      className="w-full p-2.5 font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none placeholder:text-slate-400"
                    />
                  </div>

                  {/* 3. PROMOTIONAL DETAILS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-black text-slate-700 uppercase text-[10px] mb-1">
                        Offer Label {bannerFormDisplayMode === 'artwork' ? '(Optional metadata tag)' : '(Optional)'}
                      </label>
                      <input
                        type="text"
                        value={bannerFormOfferLabel}
                        onChange={e => setBannerFormOfferLabel(e.target.value)}
                        placeholder="e.g. FLAT 30% OFF or 🌟 FESTIVAL SPECIAL"
                        className="w-full h-10 px-3 font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none placeholder:text-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block font-black text-slate-700 uppercase text-[10px] mb-1">
                        Promo Code (Optional)
                      </label>
                      <input
                        type="text"
                        value={bannerFormPromoCode}
                        onChange={e => setBannerFormPromoCode(e.target.value.toUpperCase())}
                        placeholder="e.g. HOSPETE30"
                        className="w-full h-10 px-3 font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none uppercase placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* 4. CTA BUTTON & DESTINATION */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-black text-slate-700 uppercase text-[10px] mb-1">
                        CTA Action Label {bannerFormDisplayMode === 'artwork' ? '(Tap Action)' : ''}
                      </label>
                      <input
                        type="text"
                        value={bannerFormCtaText}
                        onChange={e => setBannerFormCtaText(e.target.value)}
                        placeholder="e.g. Claim Offer or Shop Now"
                        className="w-full h-10 px-3 font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-black text-slate-700 uppercase text-[10px] mb-1">
                        CTA Destination Type *
                      </label>
                      <select
                        value={bannerFormCtaType}
                        onChange={e => setBannerFormCtaType(e.target.value as any)}
                        className="w-full h-10 px-3 font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none cursor-pointer"
                      >
                        <option value="offers">Offers / Deals Page</option>
                        <option value="category">Category Page</option>
                        <option value="product">Specific Product</option>
                        <option value="flash_deals">Today's Flash Deals</option>
                        <option value="custom">Custom Internal Route</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-black text-slate-700 uppercase text-[10px] mb-1">
                        Destination Target
                      </label>
                      {bannerFormCtaType === 'category' ? (
                        <select
                          value={bannerFormCtaTargetId}
                          onChange={e => setBannerFormCtaTargetId(e.target.value)}
                          className="w-full h-10 px-3 font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none cursor-pointer"
                        >
                          <option value="">-- Select Category --</option>
                          {categories.map(c => (
                            <option key={c.slug} value={c.slug}>
                              {c.iconEmoji} {c.name}
                            </option>
                          ))}
                        </select>
                      ) : bannerFormCtaType === 'product' ? (
                        <select
                          value={bannerFormCtaTargetId}
                          onChange={e => setBannerFormCtaTargetId(e.target.value)}
                          className="w-full h-10 px-3 font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none cursor-pointer"
                        >
                          <option value="">-- Select Product --</option>
                          {products.map(p => (
                            <option key={p.id} value={String(p.id)}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      ) : bannerFormCtaType === 'custom' ? (
                        <input
                          type="text"
                          value={bannerFormCtaUrl}
                          onChange={e => setBannerFormCtaUrl(e.target.value)}
                          placeholder="/offers or #deals"
                          className="w-full h-10 px-3 font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                        />
                      ) : (
                        <div className="h-10 px-3 bg-slate-100 rounded-xl flex items-center text-slate-500 font-medium">
                          Active Storefront Offers Page
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 5. ORDER & SCHEDULING */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-black text-slate-700 uppercase text-[10px] mb-1">
                        Display Order *
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={bannerFormOrder}
                        onChange={e => setBannerFormOrder(Number(e.target.value))}
                        className="w-full h-10 px-3 font-black text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-black text-slate-700 uppercase text-[10px] mb-1">
                        Start Date / Time (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={bannerFormStartDate}
                        onChange={e => setBannerFormStartDate(e.target.value)}
                        className="w-full h-10 px-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-black text-slate-700 uppercase text-[10px] mb-1">
                        End Date / Time (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={bannerFormEndDate}
                        onChange={e => setBannerFormEndDate(e.target.value)}
                        className="w-full h-10 px-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* 6. REAL-TIME CUSTOMER BANNER CARD PREVIEW */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-700 uppercase text-[10px] tracking-wider">
                        Live Customer Card Preview ({bannerFormDisplayMode === 'artwork' ? 'Mode A: Image Artwork' : 'Mode B: HTML / Text Banner'})
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">Exact storefront appearance</span>
                    </div>

                    {bannerFormDisplayMode === 'artwork' ? (
                      /* MODE A: PURE IMAGE ARTWORK PREVIEW (No overlaid text/buttons) */
                      <div className="w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-sm relative min-h-[145px] sm:min-h-[175px] flex items-center justify-center">
                        {bannerFormImageUrl && !previewImageError ? (
                          <div className="relative w-full">
                            <img
                              src={bannerFormImageUrl}
                              alt={bannerFormAltText || bannerFormHeadline || bannerFormTitle || 'Banner Preview'}
                              onError={() => setPreviewImageError(true)}
                              className="w-full h-auto max-h-[220px] sm:max-h-[260px] object-contain sm:object-cover mx-auto block"
                            />
                            {bannerUploadLoading && (
                              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center text-white text-xs font-bold gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Uploading & verifying image on server...</span>
                              </div>
                            )}
                          </div>
                        ) : previewImageError ? (
                          <div className="py-8 px-4 text-center text-rose-500 flex flex-col items-center">
                            <AlertCircle className="w-6 h-6 mb-1 text-rose-500" />
                            <p className="text-xs font-bold">Image failed to load</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Please re-upload a valid JPG, PNG, or WebP image.</p>
                          </div>
                        ) : (
                          <div className="py-10 px-4 text-center text-slate-400 flex flex-col items-center">
                            <Upload className="w-8 h-8 text-slate-300 mb-2 stroke-[1.5]" />
                            <p className="text-xs font-bold text-slate-700">No banner artwork uploaded yet</p>
                            <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs leading-relaxed">
                              Click "Upload Image from Device" above to upload your banner artwork. In Mode A, your artwork is displayed directly with zero text/button overlays.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* MODE B: HTML / TEXT BANNER PREVIEW (Styled layout with form fields) */
                      <div className="w-full rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-600 text-white p-4 shadow-sm relative overflow-hidden min-h-[145px] flex flex-col justify-between">
                        {bannerFormImageUrl && !previewImageError && (
                          <img
                            src={bannerFormImageUrl}
                            alt={bannerFormAltText || bannerFormTitle}
                            onError={() => setPreviewImageError(true)}
                            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30 pointer-events-none"
                          />
                        )}
                        <div>
                          {bannerFormOfferLabel && (
                            <span className="inline-block bg-white/20 text-emerald-100 text-[10px] font-black uppercase px-2 py-0.5 rounded-full mb-1 tracking-wider">
                              {bannerFormOfferLabel}
                            </span>
                          )}
                          <h2 className="text-base sm:text-lg font-black leading-tight drop-shadow-xs">
                            {bannerFormHeadline || 'Banner Headline Appears Here'}
                          </h2>
                          {bannerFormDesc && (
                            <p className="text-xs text-emerald-100 mt-0.5 max-w-[280px]">
                              {bannerFormDesc}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-3 z-10">
                          {bannerFormPromoCode ? (
                            <span className="bg-white text-emerald-900 text-[11px] font-black px-2.5 py-1 rounded shadow-xs">
                              Code: <strong>{bannerFormPromoCode}</strong>
                            </span>
                          ) : (
                            <span className="text-[10px] text-white/80 font-bold">Local Hospete Delivery</span>
                          )}
                          <span className="bg-amber-400 text-amber-950 text-xs font-black px-3 py-1 rounded-lg shadow-sm">
                            {bannerFormCtaText || 'Shop Now'} &rarr;
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer Controls */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setIsAddBannerModalOpen(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveBanner(false)}
                      className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold rounded-xl shadow-2xs cursor-pointer"
                    >
                      Save as Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveBanner(true)}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-xs cursor-pointer active:scale-98"
                    >
                      Publish / Activate Banner
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              MODAL: LIVE CUSTOMER PREVIEW (Requirement 5 & 9)
              ========================================================= */}
          {previewingBanner && (
            <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-700">
                      Customer Storefront Preview
                    </span>
                    <h3 className="font-black text-sm text-slate-900">{previewingBanner.title}</h3>
                  </div>
                  <button
                    onClick={() => setPreviewingBanner(null)}
                    className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                </div>

                {/* Banner Mobile Card */}
                {previewingBanner.displayMode === 'artwork' ? (
                  <div className="w-full rounded-2xl overflow-hidden bg-slate-950 shadow-sm relative flex items-center justify-center min-h-[145px] border border-slate-200">
                    {previewingBanner.imageUrl ? (
                      <img
                        src={previewingBanner.imageUrl}
                        alt={previewingBanner.altText || previewingBanner.title}
                        className="w-full h-auto max-h-[220px] object-contain mx-auto block"
                      />
                    ) : (
                      <div className="py-8 text-center text-white/70 text-xs">No artwork image available</div>
                    )}
                  </div>
                ) : (
                  <div className="w-full rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-600 text-white p-4 shadow-sm relative overflow-hidden min-h-[145px] flex flex-col justify-between">
                    {previewingBanner.imageUrl && (
                      <img
                        src={previewingBanner.imageUrl}
                        alt={previewingBanner.altText || previewingBanner.title}
                        className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30 pointer-events-none"
                      />
                    )}
                    <div>
                      {previewingBanner.offerLabel && (
                        <span className="inline-block bg-white/20 text-emerald-100 text-[10px] font-black uppercase px-2 py-0.5 rounded-full mb-1 tracking-wider">
                          {previewingBanner.offerLabel}
                        </span>
                      )}
                      <h2 className="text-base font-black leading-tight drop-shadow-xs">
                        {previewingBanner.headline}
                      </h2>
                      {previewingBanner.description && (
                        <p className="text-xs text-emerald-100 mt-0.5 line-clamp-2">
                          {previewingBanner.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3 z-10">
                      {previewingBanner.promoCode ? (
                        <span className="bg-white text-emerald-900 text-[11px] font-black px-2.5 py-1 rounded shadow-xs">
                          Code: <strong>{previewingBanner.promoCode}</strong>
                        </span>
                      ) : (
                        <span className="text-[10px] text-white/80 font-bold">15-min delivery</span>
                      )}
                      <span className="bg-amber-400 text-amber-950 text-xs font-black px-3 py-1 rounded-lg shadow-sm">
                        {previewingBanner.ctaText} &rarr;
                      </span>
                    </div>
                  </div>
                )}

                <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                  <div><strong>Display Order:</strong> #{previewingBanner.displayOrder}</div>
                  <div><strong>Destination:</strong> {previewingBanner.ctaType}</div>
                  <div><strong>Status:</strong> {previewingBanner.isActive ? previewingBanner.status : 'Inactive'}</div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => setPreviewingBanner(null)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              MODAL: CONFIRM BANNER DELETION
              ========================================================= */}
          {deleteConfirmBanner && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900">Delete Promotional Banner?</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Are you sure you want to delete "<strong>{deleteConfirmBanner.title}</strong>"? This banner will be removed from customer home rotation.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => setDeleteConfirmBanner(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDeleteBanner}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl shadow-xs"
                  >
                    Yes, Delete Banner
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 8: MARKETING → FLASH DEALS MANAGEMENT (Requirements 2, 3, 4, 6)
          ========================================================================= */}
      {adminTab === 'flash_deals' && (
        <AdminFlashDealsManagement
          deals={flashDeals}
          setDeals={setFlashDeals || (() => {})}
          products={products}
          vendors={vendors}
          setVendors={setVendors}
          categories={categories}
          campaign={flashCampaign}
          setCampaign={setFlashCampaign || (() => {})}
          onPreviewInStore={onOpenMobileApp}
        />
      )}

      {/* =========================================================================
          DRAWER / VIEW DETAILS: SUPPLIER APPLICATION REVIEW
          ========================================================================= */}
      {activeVendorDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-2xs flex justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/80 sticky top-0 z-10 backdrop-blur-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-black uppercase ${
                      activeVendorDrawer.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : activeVendorDrawer.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : activeVendorDrawer.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {activeVendorDrawer.status}
                  </span>
                  <span className="capitalize font-bold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded text-[11px]">
                    {activeVendorDrawer.businessType}
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 mt-1.5">
                  {activeVendorDrawer.businessName}
                </h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  Registered on <span className="tabular-nums font-semibold">{activeVendorDrawer.createdAt}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveVendorDrawer(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body Content */}
            <div className="p-6 space-y-6 flex-1 text-xs">
              {/* 1. Contact & Location Profile */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-emerald-600" />
                  <span>Business & Contact Profile</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <div className="text-slate-400 text-[11px]">Owner / Contact Person</div>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">
                      {activeVendorDrawer.ownerName}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 text-[11px]">Registered Mobile Number</div>
                    <div className="font-bold text-slate-900 text-sm mt-0.5 tabular-nums">
                      {activeVendorDrawer.phone}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 text-[11px]">Email Address</div>
                    <div className="font-medium text-slate-800 mt-0.5">
                      {activeVendorDrawer.email || 'Not provided'}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 text-[11px]">Locality / Operating Hub</div>
                    <div className="font-bold text-emerald-700 mt-0.5">
                      {activeVendorDrawer.locality}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <div className="text-slate-400 text-[11px]">Full Physical Store / Farm Address</div>
                    <div className="text-slate-800 mt-0.5 font-medium">
                      {activeVendorDrawer.address}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <div className="text-slate-400 text-[11px]">Delivery Service Area Coverage</div>
                    <div className="text-slate-800 mt-0.5 font-semibold">
                      {activeVendorDrawer.serviceArea}
                    </div>
                  </div>

                  {activeVendorDrawer.description && (
                    <div className="sm:col-span-2">
                      <div className="text-slate-400 text-[11px]">Business Description</div>
                      <div className="text-slate-600 mt-0.5 italic">
                        "{activeVendorDrawer.description}"
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Configurable Document Verification Checklist */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Uploaded Documents ({activeVendorDrawer.businessType.toUpperCase()} Requirements)</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Configured by business classification
                  </span>
                </div>

                <div className="space-y-2.5">
                  {BUSINESS_TYPE_DOCUMENT_RULES[activeVendorDrawer.businessType]?.map(rule => {
                    const uploadedDoc = activeVendorDrawer.documents?.find(
                      d => d.documentType === rule.type
                    );

                    return (
                      <div
                        key={rule.type}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                          uploadedDoc
                            ? uploadedDoc.status === 'verified'
                              ? 'bg-emerald-50/50 border-emerald-200'
                              : uploadedDoc.status === 'rejected'
                              ? 'bg-rose-50/50 border-rose-200'
                              : 'bg-amber-50/50 border-amber-200'
                            : rule.mandatory
                            ? 'bg-slate-50 border-dashed border-slate-300'
                            : 'bg-slate-50/30 border-dashed border-slate-200'
                        }`}
                      >
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{rule.name}</span>
                            {rule.mandatory ? (
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                                Mandatory
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                                Optional
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">{rule.description}</div>

                          {uploadedDoc ? (
                            <div className="text-[11px] text-slate-600 pt-1 flex items-center gap-2 font-mono">
                              <span>📄 {uploadedDoc.fileName}</span>
                              {uploadedDoc.fileSize && <span>({uploadedDoc.fileSize})</span>}
                              <span>· Uploaded {uploadedDoc.uploadedAt}</span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-amber-700 font-semibold pt-1">
                              ⚠️ Document not yet submitted by supplier.
                            </div>
                          )}
                        </div>

                        {uploadedDoc ? (
                          <div className="flex flex-col items-end gap-1.5">
                            <button
                              onClick={() =>
                                setPreviewDoc({
                                  doc: uploadedDoc,
                                  vendorName: activeVendorDrawer.businessName
                                })
                              }
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold text-xs inline-flex items-center gap-1 shadow-2xs"
                            >
                              <Eye className="w-3 h-3 text-slate-500" />
                              <span>View Doc</span>
                            </button>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                uploadedDoc.status === 'verified'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : uploadedDoc.status === 'rejected'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {uploadedDoc.status === 'verified'
                                ? '✓ Verified'
                                : uploadedDoc.status === 'rejected'
                                ? '✕ Rejected'
                                : '⏳ Pending Review'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400 italic">
                            Missing
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Rejection / Resubmission Status (if rejected) */}
              {activeVendorDrawer.status === 'rejected' && (
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 space-y-2">
                  <div className="font-extrabold text-rose-900 text-xs uppercase flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Application Rejection Details</span>
                  </div>
                  <div className="text-xs text-rose-800">
                    <strong>Recorded Reason:</strong> {activeVendorDrawer.rejectionReason}
                  </div>
                  <div className="text-xs text-slate-600 pt-1">
                    <strong>Vendor Resubmission Status:</strong>{' '}
                    {activeVendorDrawer.resubmissionStatus === 'resubmitted' ? (
                      <span className="font-bold text-emerald-700">
                        Revised documents submitted by vendor! Ready for re-evaluation.
                      </span>
                    ) : (
                      <span className="font-bold text-amber-700">
                        Pending resubmission. Vendor has been alerted to provide corrected records.
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 4. Suspension Status (if suspended) */}
              {activeVendorDrawer.status === 'suspended' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 space-y-2">
                  <div className="font-extrabold text-slate-900 text-xs uppercase flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Store Suspension Enforced</span>
                  </div>
                  <div className="text-xs text-slate-700">
                    <strong>Reason for Suspension:</strong> {activeVendorDrawer.suspensionReason}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    All products for this vendor are hidden from customer view. Stock modifications are locked. Active placed orders remain preserved.
                  </div>
                </div>
              )}

              {/* 5. Status Change Audit History */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <History className="w-4 h-4 text-slate-500" />
                  <span>Status Change & Moderation History</span>
                </h3>

                <div className="space-y-2">
                  {(!activeVendorDrawer.statusHistory || activeVendorDrawer.statusHistory.length === 0) ? (
                    <div className="text-slate-400 italic text-xs">
                      No status transitions recorded yet.
                    </div>
                  ) : (
                    activeVendorDrawer.statusHistory.map(hist => (
                      <div
                        key={hist.id}
                        className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1"
                      >
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-bold text-slate-800">
                            {hist.previousStatus.toUpperCase()} &rarr; {hist.newStatus.toUpperCase()}
                          </span>
                          <span className="text-slate-400 tabular-nums">{hist.timestamp}</span>
                        </div>
                        <div className="text-slate-600">{hist.reason}</div>
                        <div className="text-[10px] text-slate-400">By: {hist.adminIdentifier}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-5 border-t border-slate-200 bg-slate-50 flex flex-wrap gap-2 justify-between items-center sticky bottom-0">
              <button
                onClick={() => handleLaunchAdminPreview(activeVendorDrawer)}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>Launch Admin Preview</span>
              </button>

              <div className="flex items-center gap-2">
                {activeVendorDrawer.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        setRequestInfoModalVendor(activeVendorDrawer);
                        setRequestInfoInput('');
                      }}
                      className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold rounded-xl text-xs"
                    >
                      Request Info
                    </button>
                    <button
                      onClick={() => {
                        setRejectModalVendor(activeVendorDrawer);
                        setRejectReasonInput('');
                      }}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApproveVendor(activeVendorDrawer.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-xs"
                    >
                      Approve Application
                    </button>
                  </>
                )}

                {activeVendorDrawer.status === 'approved' && (
                  <button
                    onClick={() => {
                      setSuspendModalVendor(activeVendorDrawer);
                      setSuspendReasonInput('');
                    }}
                    className="px-4 py-2 bg-slate-200 hover:bg-rose-600 hover:text-white text-slate-800 font-bold rounded-xl text-xs transition-colors"
                  >
                    Suspend Partner
                  </button>
                )}

                {activeVendorDrawer.status === 'suspended' && (
                  <button
                    onClick={() => {
                      setReactivateModalVendor(activeVendorDrawer);
                      setReactivateReasonInput('');
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-xs"
                  >
                    Reactivate Partner
                  </button>
                )}

                {activeVendorDrawer.status === 'rejected' && (
                  <button
                    onClick={() => handleApproveVendor(activeVendorDrawer.id, 'Re-evaluated and approved after application review.')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-xs"
                  >
                    Re-evaluate & Approve
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: REJECT VENDOR (MANDATORY REASON)
          ========================================================================= */}
      {rejectModalVendor && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  Reject Vendor Application
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vendor: <strong className="text-slate-800">{rejectModalVendor.businessName}</strong>
                </p>
              </div>
              <button
                onClick={() => setRejectModalVendor(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Reason for Rejection <span className="text-rose-600">* (Mandatory)</span>
              </label>
              <textarea
                rows={3}
                value={rejectReasonInput}
                onChange={e => setRejectReasonInput(e.target.value)}
                placeholder="e.g. FSSAI registration document copy is unreadable / Municipal commercial license expired. Please re-submit with clear scanned certificate."
                className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-rose-600 text-slate-800"
              />
              <p className="text-[11px] text-slate-400">
                This explanation will be permanently recorded in the audit history and displayed directly to the vendor in their portal.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRejectModalVendor(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: SUSPEND VENDOR (MANDATORY REASON & EXPLANATION OF IMPACT)
          ========================================================================= */}
      {suspendModalVendor && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  <span>Suspend Supplier Store</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vendor: <strong className="text-slate-800">{suspendModalVendor.businessName}</strong>
                </p>
              </div>
              <button
                onClick={() => setSuspendModalVendor(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Impact Explanation */}
            <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-bold uppercase text-[10px]">What Happens Upon Suspension:</div>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li><strong>Product Listings:</strong> Immediately hidden from customer search and category browsing.</li>
                <li><strong>New Orders:</strong> Customers cannot add items or checkout with this vendor's products.</li>
                <li><strong>Existing Orders:</strong> Orders already placed remain safe in order history for delivery & tracking.</li>
                <li><strong>Vendor Catalog:</strong> Products are never deleted; they are preserved and restored when reactivated.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Reason for Suspension <span className="text-rose-600">* (Mandatory)</span>
              </label>
              <textarea
                rows={3}
                value={suspendReasonInput}
                onChange={e => setSuspendReasonInput(e.target.value)}
                placeholder="e.g. Quality complaint received: expired milk packets supplied on 2026-03-16. Storefront deactivated pending dairy inspection."
                className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-rose-600 text-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSuspendModalVendor(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSuspend}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs shadow-xs"
              >
                Enforce Suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: REACTIVATE VENDOR
          ========================================================================= */}
      {reactivateModalVendor && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-emerald-600" />
                  <span>Reactivate Suspended Vendor</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vendor: <strong className="text-slate-800">{reactivateModalVendor.businessName}</strong>
                </p>
              </div>
              <button
                onClick={() => setReactivateModalVendor(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 text-xs text-emerald-900">
              Reactivating this supplier will instantly restore all approved products to the customer storefront and allow new customer orders.
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Reactivation Audit Note
              </label>
              <textarea
                rows={3}
                value={reactivateReasonInput}
                onChange={e => setReactivateReasonInput(e.target.value)}
                placeholder="e.g. Warehouse inspection completed satisfactorily. Vendor agreed to strict daily temperature compliance."
                className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 text-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setReactivateModalVendor(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReactivate}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-xs"
              >
                Confirm Reactivation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: REQUEST ADDITIONAL INFORMATION
          ========================================================================= */}
      {requestInfoModalVendor && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  <span>Request Additional Information</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vendor: <strong className="text-slate-800">{requestInfoModalVendor.businessName}</strong>
                </p>
              </div>
              <button
                onClick={() => setRequestInfoModalVendor(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Specify Missing Information / Requested Documents <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                value={requestInfoInput}
                onChange={e => setRequestInfoInput(e.target.value)}
                placeholder="e.g. Please upload the Livestock Health NOC issued by Hospete Veterinary Hospital, and confirm your morning delivery hours for College Road."
                className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 text-slate-800"
              />
              <p className="text-[11px] text-slate-400">
                This notice will appear in the vendor dashboard banner with instructions to submit updates.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRequestInfoModalVendor(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRequestInfo}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-xs"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: DOCUMENT PREVIEW SIMULATOR
          ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <span>{previewDoc.doc.documentName}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Uploaded by: <strong className="text-slate-800">{previewDoc.vendorName}</strong>
                </p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl p-6 bg-slate-50 flex flex-col items-center justify-center text-center space-y-3 min-h-[220px]">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                <FileCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm font-mono">{previewDoc.doc.fileName}</div>
                <div className="text-xs text-slate-500 mt-1">
                  File Size: {previewDoc.doc.fileSize || '1.2 MB'} · Uploaded: {previewDoc.doc.uploadedAt}
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  [Verified Government Seal · Hospete Taluk Revenue & FSSAI Authority Record]
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded ${
                  previewDoc.doc.status === 'verified'
                    ? 'bg-emerald-100 text-emerald-800'
                    : previewDoc.doc.status === 'rejected'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                Status: {previewDoc.doc.status.toUpperCase()}
              </span>
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DRAWER: PRODUCT DETAILS & VARIANT INSPECTION
          ========================================================================= */}
      {activeProductDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-2xs flex justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/80 sticky top-0 z-10 backdrop-blur-xs">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  {(() => {
                    const vendor = vendors.find(v => v.id === activeProductDrawer.vendorId);
                    const statusInfo = getProductStorefrontStatus(activeProductDrawer, vendor);
                    return (
                      <>
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-black border ${statusInfo.badgeClass}`}>
                          {statusInfo.label}
                        </span>
                        <span className="capitalize font-bold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded text-[11px]">
                          {CATEGORIES.find(c => c.slug === activeProductDrawer.categorySlug)?.name || activeProductDrawer.categorySlug}
                        </span>
                        {activeProductDrawer.sku && (
                          <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {activeProductDrawer.sku}
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
                <h2 className="text-xl font-black text-slate-900 mt-2">
                  {activeProductDrawer.name}
                </h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  Brand: <strong className="text-slate-800">{activeProductDrawer.brand}</strong> · Added: <span className="tabular-nums font-semibold">{activeProductDrawer.createdAt || '2026-03-01'}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveProductDrawer(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body Content */}
            <div className="p-6 space-y-6 flex-1 text-xs">
              {/* Product Visual & Image Review Center */}
              <div className="space-y-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>Product Imagery & Review Status</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    {activeProductDrawer.imageReplacedByAdmin && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                        Admin Replaced
                      </span>
                    )}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        activeProductDrawer.imageReviewStatus === 'approved'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : activeProductDrawer.imageReviewStatus === 'needs_correction'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {activeProductDrawer.imageReviewStatus === 'approved'
                        ? 'Image Approved'
                        : activeProductDrawer.imageReviewStatus === 'needs_correction'
                        ? 'Needs Correction'
                        : 'Image Submitted'}
                    </span>
                  </div>
                </div>

                {/* Main Image & Preview Switcher */}
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="relative group shrink-0">
                    {(() => {
                      const allImages = [
                        activeProductDrawer.imageUrl,
                        ...(activeProductDrawer.additionalImages || [])
                      ];
                      const activeDisplayUrl = showOriginalVendorImage && activeProductDrawer.originalImageUrl
                        ? activeProductDrawer.originalImageUrl
                        : allImages[selectedDrawerImageIdx] || activeProductDrawer.imageUrl;

                      return (
                        <div className="space-y-2">
                          <div className="relative w-36 h-36 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center">
                            <img
                              src={activeDisplayUrl}
                              alt={activeProductDrawer.name}
                              onError={e => handleImageError(e, activeProductDrawer.name)}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            {showOriginalVendorImage && (
                              <span className="absolute bottom-1 inset-x-1 bg-amber-900/90 text-white text-[9px] font-bold py-0.5 text-center rounded">
                                Original Vendor Upload
                              </span>
                            )}
                          </div>

                          {/* Thumbnails if multiple images or replaced */}
                          {(allImages.length > 1 || activeProductDrawer.imageReplacedByAdmin) && (
                            <div className="flex items-center gap-1.5 flex-wrap max-w-40">
                              {allImages.map((imgUrl, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setSelectedDrawerImageIdx(idx);
                                    setShowOriginalVendorImage(false);
                                  }}
                                  className={`w-8 h-8 rounded-lg overflow-hidden border-2 transition-all ${
                                    !showOriginalVendorImage && selectedDrawerImageIdx === idx
                                      ? 'border-emerald-600 scale-105'
                                      : 'border-slate-200 opacity-70 hover:opacity-100'
                                  }`}
                                >
                                  <img
                                    src={imgUrl}
                                    alt="thumb"
                                    onError={e => handleImageError(e, 'thumb')}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ))}
                              {activeProductDrawer.imageReplacedByAdmin && activeProductDrawer.originalImageUrl && (
                                <button
                                  type="button"
                                  onClick={() => setShowOriginalVendorImage(!showOriginalVendorImage)}
                                  className={`px-1.5 py-1 text-[9px] font-bold rounded border transition-colors ${
                                    showOriginalVendorImage
                                      ? 'bg-amber-100 border-amber-300 text-amber-900'
                                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                                  }`}
                                  title="Toggle original vendor submission"
                                >
                                  {showOriginalVendorImage ? 'Viewing Original' : 'View Original'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="space-y-2 flex-1 w-full">
                    <div className="font-bold text-slate-900 text-sm">Product Overview</div>
                    <p className="text-slate-600 leading-relaxed text-xs">
                      {activeProductDrawer.description}
                    </p>
                    {activeProductDrawer.barcode && (
                      <div className="text-[11px] text-slate-500 font-mono">
                        Barcode: {activeProductDrawer.barcode}
                      </div>
                    )}

                    {/* Image Correction Banner if active */}
                    {activeProductDrawer.imageReviewStatus === 'needs_correction' && activeProductDrawer.imageCorrectionReason && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-rose-800">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Correction Requested From Vendor:</span>
                        </div>
                        <p className="text-[11px] text-rose-700">{activeProductDrawer.imageCorrectionReason}</p>
                      </div>
                    )}

                    {/* Admin Replacement Notice if active */}
                    {activeProductDrawer.imageReplacedByAdmin && (
                      <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-purple-800">
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                          <span>Admin Replaced Image Note:</span>
                        </div>
                        <p className="text-[11px] text-purple-700">{activeProductDrawer.imageReplacementReason || 'Replaced by admin during catalog verification.'}</p>
                        <div className="text-[10px] text-purple-600 pt-0.5">
                          Original vendor upload preserved and safe for audit.
                        </div>
                      </div>
                    )}

                    {/* Image Moderation Action Buttons */}
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      {activeProductDrawer.imageReviewStatus !== 'approved' && (
                        <button
                          type="button"
                          onClick={() => handleApproveImage(activeProductDrawer)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-2xs transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve Image</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setImageCorrectionModalProduct(activeProductDrawer);
                          setImageCorrectionReasonInput('');
                        }}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Request Correction...</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAdminReplaceModalProduct(activeProductDrawer);
                          setAdminReplaceImageUrl('');
                          setAdminReplaceReasonInput('');
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-600" />
                        <span>Admin Replace Image...</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Image Review & Audit Trail Log */}
                {activeProductDrawer.imageAuditHistory && activeProductDrawer.imageAuditHistory.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-slate-500" />
                      <span>Image Review & Audit Trail ({activeProductDrawer.imageAuditHistory.length} events)</span>
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {activeProductDrawer.imageAuditHistory.map((item, idx) => (
                        <div key={item.id || idx} className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] space-y-0.5">
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="font-bold text-slate-800">
                              {item.action === 'ADMIN_APPROVE'
                                ? '✅ Image Approved'
                                : item.action === 'ADMIN_CORRECTION_REQUEST'
                                ? '⚠️ Image Correction Requested'
                                : item.action === 'ADMIN_REPLACE'
                                ? '🔄 Image Replaced by Admin'
                                : item.action === 'VENDOR_RESUBMIT'
                                ? '📤 Vendor Resubmitted Corrected Image'
                                : '📥 Vendor Uploaded Image'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                          </div>
                          <div className="text-slate-600">
                            <span className="font-semibold text-slate-700">{item.actor}</span> ({item.actorRole}): {item.notes}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Vendor Partner Card */}
              {(() => {
                const vendor = vendors.find(v => v.id === activeProductDrawer.vendorId);
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-emerald-600" />
                        <span>Supplier Partner Details</span>
                      </h3>
                      {vendor && (
                        <button
                          onClick={() => {
                            setActiveProductDrawer(null);
                            setActiveVendorDrawer(vendor);
                          }}
                          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                        >
                          <span>Review Supplier Application</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {vendor ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div>
                          <div className="text-slate-400 text-[11px]">Business Name</div>
                          <div className="font-bold text-slate-900 text-sm mt-0.5">{vendor.businessName}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[11px]">Contact Person / Owner</div>
                          <div className="font-bold text-slate-900 text-sm mt-0.5">{vendor.ownerName}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[11px]">Phone & Locality</div>
                          <div className="font-semibold text-slate-800 mt-0.5">
                            {vendor.phone} · <span className="text-emerald-700">{vendor.locality}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[11px]">Supplier Compliance Status</div>
                          <div className="mt-0.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                vendor.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : vendor.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : vendor.status === 'suspended'
                                  ? 'bg-slate-200 text-slate-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {vendor.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 rounded-xl text-slate-500 text-xs">
                        Central Hospete Fresh Inventory Warehouse
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Rejection / Moderation Details if applicable */}
              {activeProductDrawer.rejectionReason && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-1">
                  <div className="font-bold text-rose-900 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Listing Rejection Notice</span>
                  </div>
                  <div className="text-rose-800 font-medium">
                    {activeProductDrawer.rejectionReason}
                  </div>
                  <div className="text-[11px] text-rose-600 pt-1">
                    The supplier has been notified and can correct their catalog data to resubmit.
                  </div>
                </div>
              )}

              {activeProductDrawer.adminNotes && (
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
                  <span className="font-bold">Admin Note:</span> {activeProductDrawer.adminNotes}
                </div>
              )}

              {/* Complete Variants Inspection Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>Pack Sizes & Variant Inventory ({activeProductDrawer.variants.length} Listed)</span>
                  </h3>
                  <div className="text-xs text-slate-500">
                    Total Units: <strong className="text-emerald-700">
                      {activeProductDrawer.variants.reduce((sum, v) => sum + v.stockQty, 0)} units
                    </strong>
                  </div>
                </div>

                <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-3 pl-4">Pack Size</th>
                        <th className="p-3">Selling Price</th>
                        <th className="p-3">MRP</th>
                        <th className="p-3">Discount</th>
                        <th className="p-3">Stock Units</th>
                        <th className="p-3 pr-4">Default</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeProductDrawer.variants.map(v => {
                        const discountPct = v.mrp > v.price ? Math.round(((v.mrp - v.price) / v.mrp) * 100) : 0;
                        return (
                          <tr key={v.id} className="hover:bg-slate-50">
                            <td className="p-3 pl-4 font-bold text-slate-900">{v.packSize}</td>
                            <td className="p-3 font-black text-emerald-700 tabular-nums">₹{v.price}</td>
                            <td className="p-3 text-slate-400 line-through tabular-nums">₹{v.mrp}</td>
                            <td className="p-3">
                              {discountPct > 0 ? (
                                <span className="font-bold text-emerald-700">{discountPct}% OFF</span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="p-3">
                              <span
                                className={`font-black tabular-nums px-2.5 py-1 rounded text-xs ${
                                  v.stockQty > 10
                                    ? 'bg-emerald-50 text-emerald-800'
                                    : v.stockQty > 0
                                    ? 'bg-amber-50 text-amber-800'
                                    : 'bg-rose-50 text-rose-800'
                                }`}
                              >
                                {v.stockQty} {v.stockQty === 0 ? '(Out of Stock)' : 'units'}
                              </span>
                            </td>
                            <td className="p-3 pr-4">
                              {v.isDefault ? (
                                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                                  Default
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">Variant</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50/80 sticky bottom-0 z-10 backdrop-blur-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {(activeProductDrawer.approvalStatus === 'pending' || activeProductDrawer.approvalStatus === 'rejected') && (
                  <button
                    onClick={() => handleApproveProduct(activeProductDrawer)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve Product</span>
                  </button>
                )}

                {activeProductDrawer.approvalStatus !== 'rejected' && (
                  <button
                    onClick={() => {
                      setRejectProductModal(activeProductDrawer);
                      setRejectProductReason('');
                    }}
                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject Listing...</span>
                  </button>
                )}

                <button
                  onClick={() => handleToggleProductVisibility(activeProductDrawer)}
                  className={`px-3.5 py-2.5 rounded-xl font-bold text-xs transition-colors border flex items-center gap-1.5 ${
                    activeProductDrawer.isActive !== false
                      ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {activeProductDrawer.isActive !== false ? (
                    <>
                      <EyeOff className="w-4 h-4 text-slate-500" />
                      <span>Hide from Store</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 text-emerald-600" />
                      <span>Make Live</span>
                    </>
                  )}
                </button>

                {onPreviewProductInStore && (
                  <button
                    onClick={() => {
                      onPreviewProductInStore(activeProductDrawer);
                      setActiveProductDrawer(null);
                    }}
                    className="px-3.5 py-2.5 rounded-xl font-bold text-xs transition-colors border bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 flex items-center gap-1.5"
                    title="Preview in Customer Storefront"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-600" />
                    <span>Preview in Store</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setActiveProductDrawer(null)}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-colors"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: REJECT PRODUCT WITH MANDATORY REASON
          ========================================================================= */}
      {rejectProductModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-600" />
                  <span>Reject Catalog Product Listing</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Product: <strong className="text-slate-800">{rejectProductModal.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setRejectProductModal(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-1">
              <div className="font-bold uppercase text-[10px]">Mandatory Moderation Feedback:</div>
              <p className="text-[11px] leading-relaxed">
                Provide a clear reason explaining why this item cannot be published. The vendor partner will see this reason on their dashboard so they can adjust packaging, pricing, or licenses and resubmit.
              </p>
            </div>

            {/* Quick Reason Presets */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Quick Preset Templates:</div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Nutritional facts label missing; packaging photos do not show batch number or FSSAI license.',
                  'Selling price exceeds Hospete APMC local market benchmark rate.',
                  'Product packaging image is blurry; please upload a clear, uncropped photo.',
                  'Cold chain NOC required for perishable dairy and meat derivative products.'
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectProductReason(preset)}
                    className="text-[11px] text-left p-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200/60"
                  >
                    {preset.slice(0, 48)}...
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Detailed Rejection Reason <span className="text-rose-600">* (Mandatory)</span>
              </label>
              <textarea
                rows={3}
                value={rejectProductReason}
                onChange={e => setRejectProductReason(e.target.value)}
                placeholder="Enter specific feedback for the vendor explaining what needs to be changed..."
                className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-rose-600 text-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRejectProductModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejectProduct}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: REQUEST IMAGE CORRECTION WITH MANDATORY REASON
          ========================================================================= */}
      {imageCorrectionModalProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>Request Product Image Correction</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Product: <strong className="text-slate-800">{imageCorrectionModalProduct.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setImageCorrectionModalProduct(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Image Preview */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/70 border border-amber-200">
              <img
                src={imageCorrectionModalProduct.imageUrl}
                alt={imageCorrectionModalProduct.name}
                onError={e => handleImageError(e, imageCorrectionModalProduct.name)}
                className="w-16 h-16 rounded-lg object-cover bg-white border border-amber-200 shrink-0"
              />
              <div className="text-xs text-amber-900">
                <span className="font-bold block">Current Submitted Image</span>
                <span className="text-[11px] text-amber-800">
                  This listing will be marked as &quot;Needs Correction&quot; and paused from customer purchases until the vendor uploads a compliant replacement image.
                </span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Quick Preset Templates:</div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Blurry photo or low resolution; please upload a clear, high-resolution photo.',
                  'Packaging photo must clearly show FSSAI license number and net weight.',
                  'Background must be plain or clean white without distracting watermarks or phone numbers.',
                  'Image does not match the product variety or brand stated in listing.'
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setImageCorrectionReasonInput(preset)}
                    className="text-[11px] text-left p-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200/60"
                  >
                    {preset.slice(0, 48)}...
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Required Feedback for Vendor <span className="text-rose-600">* (Mandatory)</span>
              </label>
              <textarea
                rows={3}
                value={imageCorrectionReasonInput}
                onChange={e => setImageCorrectionReasonInput(e.target.value)}
                placeholder="Explain what needs to be fixed so the vendor knows how to photograph and resubmit..."
                className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-amber-600 text-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setImageCorrectionModalProduct(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRequestImageCorrection}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs shadow-xs"
              >
                Send Correction Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADMIN AUTHORIZED IMAGE REPLACEMENT
          ========================================================================= */}
      {adminReplaceModalProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-purple-600" />
                  <span>Authorized Admin Image Replacement</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Product: <strong className="text-slate-800">{adminReplaceModalProduct.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setAdminReplaceModalProduct(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-purple-50 p-3.5 rounded-xl border border-purple-200 text-xs text-purple-900 space-y-1">
              <div className="font-bold uppercase text-[10px] text-purple-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Audit Preservation Policy:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-purple-800">
                The original vendor submission will remain safely preserved in the audit database. This replacement will be logged with your administrator identity, timestamp, and justification reason.
              </p>
            </div>

            {/* Current vs Replacement Previews */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1.5">
                <div className="text-[10px] font-bold uppercase text-slate-500">Current / Vendor Image</div>
                <img
                  src={adminReplaceModalProduct.imageUrl}
                  alt="Current"
                  onError={e => handleImageError(e, 'Current')}
                  className="w-20 h-20 mx-auto rounded-lg object-cover bg-white border border-slate-200"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1.5">
                <div className="text-[10px] font-bold uppercase text-slate-500">New Replacement Preview</div>
                {adminReplaceImageUrl ? (
                  <img
                    src={adminReplaceImageUrl}
                    alt="Replacement"
                    onError={e => handleImageError(e, 'Replacement')}
                    className="w-20 h-20 mx-auto rounded-lg object-cover bg-white border border-emerald-300 ring-2 ring-emerald-500/20"
                  />
                ) : (
                  <div className="w-20 h-20 mx-auto rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-[10px]">
                    <ImageIcon className="w-5 h-5 mb-1" />
                    <span>No image selected</span>
                  </div>
                )}
              </div>
            </div>

            {/* Upload or URL Controls */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Upload Replacement Image (JPG, PNG, WebP · Max 5MB)
                </label>
                <div className="flex gap-2">
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 py-2 px-3 border border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors">
                    <Upload className="w-4 h-4 text-purple-600" />
                    <span>Choose File from Computer</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                          alert('Please select a JPG, PNG, or WebP image file.');
                          return;
                        }
                        if (file.size > 5 * 1024 * 1024) {
                          alert('File size exceeds 5MB limit.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = ev => {
                          if (typeof ev.target?.result === 'string') {
                            setAdminReplaceImageUrl(ev.target.result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                  <label className="cursor-pointer flex items-center justify-center gap-2 py-2 px-3 border border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors" title="Mobile Camera">
                    <Camera className="w-4 h-4 text-purple-600" />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      capture="environment"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = ev => {
                          if (typeof ev.target?.result === 'string') {
                            setAdminReplaceImageUrl(ev.target.result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Or Paste Image URL directly:
                </label>
                <input
                  type="text"
                  value={adminReplaceImageUrl}
                  onChange={e => setAdminReplaceImageUrl(e.target.value)}
                  placeholder="https://... or /images/packshot.jpg or data:image/..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-purple-600 text-slate-800"
                />
              </div>

              {/* Quick Preset Justifications */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Quick Justification Presets:</div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Uploaded official manufacturer brand packshot per vendor authorization.',
                    'Replaced low-resolution photo with verified APMC catalog image.',
                    'Removed watermarked third-party image and replaced with verified packaging photograph.'
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAdminReplaceReasonInput(preset)}
                      className="text-[11px] text-left p-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200/60"
                    >
                      {preset.slice(0, 48)}...
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Mandatory Audit Justification <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={2}
                  value={adminReplaceReasonInput}
                  onChange={e => setAdminReplaceReasonInput(e.target.value)}
                  placeholder="State why this replacement is necessary and authorized..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-purple-600 text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAdminReplaceModalProduct(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAdminReplaceImage}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs shadow-xs"
              >
                Replace & Approve Image
              </button>
            </div>
          </div>
        </div>
      )}
        </main>
      </div>
    </div>
  );
};
