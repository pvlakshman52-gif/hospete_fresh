/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
  Plus,
  Minus,
  Check,
  Heart,
  ArrowLeft,
  ShieldCheck,
  Truck,
  RotateCcw,
  CreditCard,
  Download,
  Terminal,
  Store,
  Bike,
  LayoutDashboard,
  Smartphone,
  Maximize2,
  Minimize2,
  PackageCheck,
  AlertCircle,
  ChevronDown,
  Navigation
} from 'lucide-react';
import { CATEGORIES, INITIAL_PRODUCTS, INITIAL_VENDORS, LOCALITIES, INITIAL_CATALOG_AUDIT_LOGS, INITIAL_DELIVERY_PARTNERS, DEFAULT_CAROUSEL_SETTINGS, INITIAL_HOME_BANNERS, INITIAL_FLASH_DEALS, INITIAL_FLASH_CAMPAIGN } from './data.ts';
import { Category, CartItem, Order, Product, ProductVariant, Vendor, AdminPreviewLog, CatalogAuditLog, DeliveryPartner, sortCategoriesByOrder, HomeBanner, BannerCarouselSettings, FlashDeal, FlashDealsCampaign, parseWeightInKg, getQualifyingBulkVariants } from './types.ts';
import { VendorPortal } from './components/VendorPortal.tsx';
import { AdminPortal } from './components/AdminPortal.tsx';
import { CategoryListingScreen } from './components/CategoryListingScreen.tsx';
import { CustomerOrderTrackingScreen } from './components/CustomerOrderTrackingScreen.tsx';
import { DeliveryLocationTrackingScreen } from './components/DeliveryLocationTrackingScreen.tsx';
import { DeliveryPortal } from './components/DeliveryPortal.tsx';
import { CustomerHomeBannerCarousel } from './components/CustomerHomeBannerCarousel.tsx';
import { CustomerFlashDealsSection } from './components/CustomerFlashDealsSection.tsx';
import { getSystemConfig, calculateDeliveryFee, SYSTEM_CONFIG_EVENT, SystemConfig } from './utils/systemConfig.ts';

type AppTab = 'home' | 'categories' | 'category-listing' | 'search' | 'orders' | 'tracking' | 'account';
type RoleView = 'customer' | 'admin' | 'vendor' | 'delivery' | 'deliverables';

export default function App() {
  const [roleView, setRoleView] = useState<RoleView>('customer');
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [isMobileFrame, setIsMobileFrame] = useState(true);

  // Data states
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [vendors, setVendors] = useState<Vendor[]>(INITIAL_VENDORS);
  const [currentVendor, setCurrentVendor] = useState<Vendor | null>(() => {
    try {
      const isLoggedOut = localStorage.getItem('hf_vendor_logged_out') === 'true';
      if (isLoggedOut) return null;
      const raw = localStorage.getItem('hf_vendor_session');
      if (raw) {
        const sess = JSON.parse(raw);
        if (sess && sess.vendorId) {
          if (!sess.expiresAt || new Date(sess.expiresAt).getTime() > Date.now()) {
            const v = INITIAL_VENDORS.find(item => item.id === sess.vendorId);
            if (v) return v;
          }
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_VENDORS[0];
  });

  useEffect(() => {
    try {
      if (currentVendor) {
        localStorage.removeItem('hf_vendor_logged_out');
        localStorage.setItem(
          'hf_vendor_session',
          JSON.stringify({
            vendorId: currentVendor.id,
            token: `v_tok_${currentVendor.id}_${Date.now()}`,
            loginAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
          })
        );
      }
    } catch {
      // ignore
    }
  }, [currentVendor]);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>(() => {
    try {
      const saved = localStorage.getItem('hf_delivery_partners');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_DELIVERY_PARTNERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('hf_delivery_partners', JSON.stringify(deliveryPartners));
    } catch {
      // ignore
    }
  }, [deliveryPartners]);
  const [selectedLocality, setSelectedLocality] = useState(LOCALITIES[1]); // Patel Nagar
  const [searchQuery, setSearchQuery] = useState('');
  const [activeShortcut, setActiveShortcut] = useState<'all' | 'offers' | 'bestsellers' | 'flash' | 'bulk'>('all');
  const [cardSelectedVariants, setCardSelectedVariants] = useState<Record<number, number>>({});
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [vendorNotice, setVendorNotice] = useState<{ text: string; type: 'warning' | 'success' } | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('🛍️');
  const [newCatBannerColor, setNewCatBannerColor] = useState('#fef3c7');
  const [trackingOrderId, setTrackingOrderId] = useState<number | null>(83921);
  const [activeDeliveryTrackingOrder, setActiveDeliveryTrackingOrder] = useState<Order | null>(null);

  // Promotional Home Banners & Carousel Settings State
  const [banners, setBanners] = useState<HomeBanner[]>(() => {
    try {
      const saved = localStorage.getItem('hf_home_banners');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_HOME_BANNERS;
  });

  const [bannerSettings, setBannerSettings] = useState<BannerCarouselSettings>(() => {
    try {
      const saved = localStorage.getItem('hf_banner_settings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return DEFAULT_CAROUSEL_SETTINGS;
  });

  // Fetch initial banners & carousel settings from REST API
  useEffect(() => {
    fetch('/api/banners')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.banners || []);
        if (Array.isArray(list) && list.length > 0) {
          setBanners(list);
          try {
            localStorage.setItem('hf_home_banners', JSON.stringify(list));
          } catch {}
        }
      })
      .catch(() => {});

    fetch('/api/banners/settings')
      .then(res => res.json())
      .then(data => {
        const settings = data?.settings || data;
        if (settings && typeof settings.autoRotateIntervalSeconds === 'number') {
          setBannerSettings(settings);
          try {
            localStorage.setItem('hf_banner_settings', JSON.stringify(settings));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  // Sync state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('hf_home_banners', JSON.stringify(banners));
    } catch {}
  }, [banners]);

  useEffect(() => {
    try {
      localStorage.setItem('hf_banner_settings', JSON.stringify(bannerSettings));
    } catch {}
  }, [bannerSettings]);

  // Flash Deals State & Campaign Settings
  const [flashDeals, setFlashDeals] = useState<FlashDeal[]>(() => {
    try {
      const saved = localStorage.getItem('hf_flash_deals');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_FLASH_DEALS;
  });

  const [flashCampaign, setFlashCampaign] = useState<FlashDealsCampaign>(() => {
    try {
      const saved = localStorage.getItem('hf_flash_campaign');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.title) return parsed;
      }
    } catch {}
    return INITIAL_FLASH_CAMPAIGN;
  });

  // Fetch initial Flash Deals & Campaign from REST API
  useEffect(() => {
    fetch('/api/flash-deals')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.deals || []);
        if (Array.isArray(list) && list.length > 0) {
          setFlashDeals(list);
          try {
            localStorage.setItem('hf_flash_deals', JSON.stringify(list));
          } catch {}
        }
      })
      .catch(() => {});

    fetch('/api/flash-deals/campaign')
      .then(res => res.json())
      .then(data => {
        const camp = data?.campaign || data;
        if (camp && camp.title) {
          setFlashCampaign(camp);
          try {
            localStorage.setItem('hf_flash_campaign', JSON.stringify(camp));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  // Sync Flash Deals to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('hf_flash_deals', JSON.stringify(flashDeals));
    } catch {}
  }, [flashDeals]);

  useEffect(() => {
    try {
      localStorage.setItem('hf_flash_campaign', JSON.stringify(flashCampaign));
    } catch {}
  }, [flashCampaign]);

  // Live Server Orders & Multi-Vendor Combined Inventory Synchronization
  const refreshOrders = () => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.orders) && data.orders.length > 0) {
          setOrders(data.orders);
        }
      })
      .catch(() => {});
  };

  const refreshCombinedInventory = () => {
    fetch('/api/inventory/combined-products')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.combinedInventory) {
          const map = data.combinedInventory;
          setProducts(prev =>
            prev.map(p => {
              const updatedVariants = p.variants.map(v => {
                const key = `${p.id}_${v.id}`;
                if (map[key]) {
                  return {
                    ...v,
                    stockQty: map[key].availableStock,
                    price: map[key].minPrice > 0 ? map[key].minPrice : v.price
                  };
                }
                return v;
              });
              return { ...p, variants: updatedVariants };
            })
          );
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    refreshOrders();
    refreshCombinedInventory();
  }, []);

  // Active and scheduled eligible banners for Customer Home
  const eligibleCustomerBanners = useMemo<HomeBanner[]>(() => {
    const now = new Date();
    return banners
      .filter(b => {
        if (!b.isActive) return false;
        if (b.startDate) {
          const start = new Date(b.startDate);
          if (!isNaN(start.getTime()) && now < start) return false;
        }
        if (b.endDate) {
          const end = new Date(b.endDate);
          if (!isNaN(end.getTime()) && now > end) return false;
        }
        return Boolean(b.imageUrl);
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [banners]);

  // Deep-link CTA navigation handler for customer home carousel
  const handleBannerCtaNavigate = (banner: HomeBanner) => {
    switch (banner.ctaType) {
      case 'offers':
      case 'flash_deals':
        setActiveShortcut('offers');
        setSelectedCategorySlug(null);
        setActiveTab('home');
        break;
      case 'category':
        if (banner.ctaTargetId) {
          setSelectedCategorySlug(banner.ctaTargetId);
          setActiveTab('category-listing');
        } else {
          setSelectedCategorySlug('veggies');
          setActiveTab('category-listing');
        }
        break;
      case 'product':
        if (banner.ctaTargetId) {
          const matchedProd = products.find(p => String(p.id) === String(banner.ctaTargetId));
          if (matchedProd) {
            setSearchQuery(matchedProd.name);
            setSelectedCategorySlug(null);
            setActiveTab('home');
          }
        }
        break;
      case 'custom':
        if (banner.ctaUrl && banner.ctaUrl.includes('category')) {
          setActiveTab('categories');
        } else {
          setActiveShortcut('offers');
          setActiveTab('home');
        }
        break;
      default:
        setActiveShortcut('offers');
        setActiveTab('home');
    }
  };

  // Automatic Dynamic Categories Synchronization:
  // If products contain a new category or if admin adds a category, merge automatically
  const allCategories = useMemo<Category[]>(() => {
    const existingSlugs = new Set(categories.map(c => c.slug));
    const merged = [...categories];
    products.forEach(p => {
      if (p.categorySlug && !existingSlugs.has(p.categorySlug)) {
        existingSlugs.add(p.categorySlug);
        merged.push({
          id: merged.length + 10,
          name: p.categorySlug.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          slug: p.categorySlug,
          iconEmoji: '🛍️',
          bannerColor: '#f1f5f9',
          imageUrl: p.imageUrl || '/images/cat_veggies.jpg',
          displayOrder: 99,
          order: 99
        });
      }
    });
    return sortCategoriesByOrder(merged);
  }, [categories, products]);

  // Active storefront categories (hidden if deactivated in Category Master)
  const storefrontCategories = useMemo<Category[]>(() => {
    return allCategories.filter(c => c.isActive !== false);
  }, [allCategories]);

  // Categories shown on customer home page
  const homeStorefrontCategories = useMemo<Category[]>(() => {
    return storefrontCategories.filter(c => c.showOnHome !== false);
  }, [storefrontCategories]);

  const handleAddNewCategory = (name: string, emoji: string, color: string) => {
    if (!name.trim()) return;
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const newCategory: Category = {
      id: Date.now(),
      name: name.trim(),
      slug: slug || `cat-${Date.now()}`,
      iconEmoji: emoji || '🛍️',
      bannerColor: color || '#f1f5f9',
      imageUrl: '/images/cat_veggies.jpg'
    };
    setCategories(prev => [...prev, newCategory]);
    // Automatically redirect to the new category listing!
    setSelectedCategorySlug(newCategory.slug);
    setActiveTab('category-listing');
    setIsAddCategoryOpen(false);
    setNewCatName('');
  };

  // Admin Preview State & Audit Logs
  const [adminPreviewState, setAdminPreviewState] = useState<{
    isPreview: boolean;
    vendorId: number | null;
    safeMode: boolean;
  }>({
    isPreview: false,
    vendorId: null,
    safeMode: true
  });

  const [adminPreviewLogs, setAdminPreviewLogs] = useState<AdminPreviewLog[]>([
    {
      id: 'log-init-1',
      adminIdentifier: 'superadmin@hospetegrocery.in',
      vendorId: 1,
      vendorName: 'Tungabhadra Agro & Organics',
      action: 'ENTER_PREVIEW',
      notes: 'Initial operational audit inspection of inventory variants.',
      timestamp: '2026-03-16 10:15'
    }
  ]);

  const [catalogAuditLogs, setCatalogAuditLogs] = useState<CatalogAuditLog[]>(INITIAL_CATALOG_AUDIT_LOGS);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Cart state: keyed by variantId
  const [cart, setCart] = useState<Record<number, CartItem>>({});

  // Product details modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [pdpQty, setPdpQty] = useState(1);
  const [pdpImageIdx, setPdpImageIdx] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Checkout modal / screen
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState('Ramesh Rao');
  const [customerPhone, setCustomerPhone] = useState('9845012345');
  const [customerAddress, setCustomerAddress] = useState('#42, 3rd Main, Patel Nagar');
  const [paymentMethod, setPaymentMethod] = useState('UPI / PhonePe / GPay');

  // Orders state (Initialized to match Reference Panels and 14-Screen Delivery Storyboard)
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 83921,
      orderNumber: 'HF-83921',
      customerName: 'Ramesh Rao',
      phone: '9845012345',
      address: '#42, 3rd Cross, Gandhi Nagar',
      locality: 'Patel Nagar',
      totalAmount: 76,
      paymentMethod: 'UPI / PhonePe',
      status: 'Assigned',
      createdAt: '12 Oct 2026, 10:15 AM',
      orderedAt: '10:15 AM',
      orderAcceptedAt: '10:17 AM',
      preparedAt: '10:20 AM',
      readyForPickupAt: '10:22 AM',
      assignedAt: '10:24 AM',
      estimatedDeliveryTime: '10:45 AM',
      estimatedMinutes: 20,
      totalTimeTaken: '~20 mins SLA',
      deliveryMinutes: 20,
      vendorName: 'Sri Lakshmi Store',
      vendorLocality: 'Kampli Road',
      vendorAddress: 'Kampli Road, Hospet - 583201 Near Bus Stand, Opp. City Mart',
      vendorPhone: '+91 98451 00223',
      pickupInstructions: 'Collect items from counter 2. Mention Hospete Fresh order reference.',
      deliveryOtp: '2846',
      deliveryInstructions: 'Call before delivery. House is on left side, blue gate.',
      deliveryPayout: 45,
      distanceKm: 5.2,
      assignedDeliveryBoy: 'Ravi Kumar (DLV-001)',
      assignedDeliveryBoyId: 'DLV-001',
      assignedDeliveryBoyPhone: '+91 98450 12345',
      items: [
        { productName: 'Fresh Red Tomatoes', packSize: '1 kg', unitPrice: 32, quantity: 2, subtotal: 64, imageUrl: '/images/tomatoes.jpg', packed: true, checked: true },
        { productName: 'Fresh Coriander', packSize: '1 Bunch (100 g)', unitPrice: 12, quantity: 1, subtotal: 12, imageUrl: '/images/cat_veggies.jpg', packed: true, checked: true }
      ]
    },
    {
      id: 83920,
      orderNumber: 'HF-83920',
      customerName: 'Smt. Shanti Devi',
      phone: '9845198765',
      address: '#18, Station Road near KSRTC',
      locality: 'Station Road',
      totalAmount: 315,
      paymentMethod: 'Cash on Delivery',
      status: 'Accepted',
      createdAt: '12 Oct 2026, 09:45 AM',
      orderedAt: '09:45 AM',
      orderAcceptedAt: '09:47 AM',
      estimatedDeliveryTime: '10:05 AM',
      estimatedMinutes: 20,
      totalTimeTaken: '~20 mins SLA',
      deliveryMinutes: 20,
      vendorName: 'Nandini Milk Parlour',
      vendorLocality: 'Station Road',
      vendorAddress: '#12, Station Road, Opp. KSRTC Depot',
      vendorPhone: '+91 98452 44556',
      deliveryOtp: '8912',
      deliveryPayout: 40,
      distanceKm: 2.8,
      items: [
        { productName: 'Nandini Pure Cow Ghee', packSize: '500 ml Pouch', unitPrice: 315, quantity: 1, subtotal: 315, imageUrl: '/images/cat_dairy.jpg' }
      ]
    },
    {
      id: 83919,
      orderNumber: 'HF-83919',
      customerName: 'Kiran Kumar',
      phone: '9900112233',
      address: '#89, Main Bazaar, Dam Road',
      locality: 'Station Road',
      totalAmount: 98,
      paymentMethod: 'UPI / GPay',
      status: 'Preparing',
      createdAt: '12 Oct 2026, 09:10 AM',
      orderedAt: '09:10 AM',
      orderAcceptedAt: '09:12 AM',
      preparedAt: '09:15 AM',
      estimatedDeliveryTime: '09:30 AM',
      estimatedMinutes: 15,
      totalTimeTaken: '~15 mins SLA',
      deliveryMinutes: 15,
      vendorName: 'Tungabhadra Agro & Organics',
      vendorLocality: 'Station Road',
      vendorAddress: '#14, Station Road, Near Railway Underpass, Hospet',
      vendorPhone: '+91 98452 33445',
      deliveryOtp: '3391',
      deliveryPayout: 42,
      distanceKm: 3.4,
      items: [
        { productName: 'Farm Fresh Red Tomatoes', packSize: '1 kg', unitPrice: 32, quantity: 1, subtotal: 32, imageUrl: '/images/tomatoes.jpg' },
        { productName: 'Fresh Palak (Spinach)', packSize: '250 g Bunch', unitPrice: 18, quantity: 1, subtotal: 18, imageUrl: '/images/cat_veggies.jpg' },
        { productName: 'Sambar Onions', packSize: '1 kg', unitPrice: 48, quantity: 1, subtotal: 48, imageUrl: '/images/cat_veggies.jpg' }
      ]
    },
    {
      id: 83918,
      orderNumber: 'HF-83918',
      customerName: 'Manjunath K',
      phone: '9845033333',
      address: '#55, Old Town, Kampli Cross',
      locality: 'Kampli Road',
      totalAmount: 18,
      paymentMethod: 'Cash on Delivery',
      status: 'Ready for Pickup',
      createdAt: '12 Oct 2026, 08:30 AM',
      orderedAt: '08:30 AM',
      orderAcceptedAt: '08:32 AM',
      preparedAt: '08:35 AM',
      readyForPickupAt: '08:40 AM',
      estimatedDeliveryTime: '09:00 AM',
      estimatedMinutes: 20,
      totalTimeTaken: '~20 mins SLA',
      deliveryMinutes: 20,
      vendorName: 'Tungabhadra Agro & Organics',
      vendorLocality: 'Station Road',
      vendorAddress: '#14, Station Road, Near Railway Underpass, Hospet',
      vendorPhone: '+91 98452 33445',
      pickupInstructions: 'Pickup from front shelf.',
      deliveryOtp: '5192',
      deliveryInstructions: 'Leave with security if not reachable.',
      deliveryPayout: 40,
      distanceKm: 3.8,
      items: [
        { productName: 'Fresh Palak (Spinach)', packSize: '250 g Bunch', unitPrice: 18, quantity: 1, subtotal: 18, imageUrl: '/images/cat_veggies.jpg', packed: true, checked: true }
      ]
    },
    {
      id: 83917,
      orderNumber: 'HF-83917',
      customerName: 'Deepa Hegde',
      phone: '9845055555',
      address: '#23, Vidyanagar 2nd Cross',
      locality: 'Vidyanagar',
      totalAmount: 285,
      paymentMethod: 'UPI / PhonePe',
      status: 'New',
      createdAt: '12 Oct 2026, 08:15 AM',
      orderedAt: '08:15 AM',
      estimatedDeliveryTime: '08:40 AM',
      estimatedMinutes: 25,
      totalTimeTaken: '~25 mins SLA',
      deliveryMinutes: 25,
      vendorName: 'Sri Lakshmi Store',
      vendorLocality: 'Kampli Road',
      vendorAddress: 'Kampli Road, Hospet - 583201',
      vendorPhone: '+91 98451 00223',
      deliveryOtp: '6721',
      deliveryPayout: 50,
      distanceKm: 4.8,
      items: [
        { productName: 'Nandini Toned Fresh Milk', packSize: '500 ml', unitPrice: 27, quantity: 2, subtotal: 54, imageUrl: '/images/cat_dairy.jpg' },
        { productName: 'Banana Robusta', packSize: '1 kg', unitPrice: 48, quantity: 1, subtotal: 48, imageUrl: '/images/cat_fruits.jpg' },
        { productName: 'Sambar Onions', packSize: '1 kg', unitPrice: 48, quantity: 1, subtotal: 48, imageUrl: '/images/cat_veggies.jpg' },
        { productName: 'Tata Tea Gold', packSize: '250 g', unitPrice: 135, quantity: 1, subtotal: 135, imageUrl: '/images/cat_beverages.jpg' }
      ]
    },
    {
      id: 83916,
      orderNumber: 'HF-83916',
      customerName: 'Anand Kumar',
      phone: '9845099887',
      address: '#78, Temple Circle, Amaravathi',
      locality: 'Amaravathi',
      totalAmount: 445,
      paymentMethod: 'PhonePe',
      status: 'Accepted',
      createdAt: '12 Oct 2026, 08:00 AM',
      orderedAt: '08:00 AM',
      orderAcceptedAt: '08:02 AM',
      estimatedDeliveryTime: '08:25 AM',
      estimatedMinutes: 25,
      totalTimeTaken: '~25 mins SLA',
      deliveryMinutes: 25,
      vendorName: 'Hampi Super Bazaar',
      vendorLocality: 'Amaravathi',
      vendorAddress: '#78, Temple Circle, Amaravathi, Hospet',
      vendorPhone: '+91 98453 66778',
      deliveryOtp: '4091',
      deliveryPayout: 48,
      distanceKm: 3.9,
      items: [
        { productName: 'Sona Masoori Raw Rice', packSize: '5 kg Bag', unitPrice: 295, quantity: 1, subtotal: 295, imageUrl: '/images/cat_staples.jpg' },
        { productName: 'Toor Dal Organic', packSize: '1 kg', unitPrice: 150, quantity: 1, subtotal: 150, imageUrl: '/images/cat_staples.jpg' }
      ]
    },
    {
      id: 83915,
      orderNumber: 'HF-83915',
      customerName: 'Girish Bellary',
      phone: '9845088776',
      address: '#34, College Road Extension',
      locality: 'College Road',
      totalAmount: 65,
      paymentMethod: 'Cash on Delivery',
      status: 'Preparing',
      createdAt: '12 Oct 2026, 07:45 AM',
      orderedAt: '07:45 AM',
      orderAcceptedAt: '07:47 AM',
      preparedAt: '07:50 AM',
      estimatedDeliveryTime: '08:05 AM',
      estimatedMinutes: 15,
      totalTimeTaken: '~15 mins SLA',
      deliveryMinutes: 15,
      vendorName: 'Sri Lakshmi Store',
      vendorLocality: 'Kampli Road',
      vendorAddress: 'Kampli Road, Hospet',
      vendorPhone: '+91 98451 00223',
      deliveryOtp: '7723',
      deliveryPayout: 40,
      distanceKm: 2.5,
      items: [
        { productName: 'Farm Fresh Carrots', packSize: '500 g', unitPrice: 35, quantity: 1, subtotal: 35, imageUrl: '/images/cat_veggies.jpg' },
        { productName: 'Capsicum Green', packSize: '500 g', unitPrice: 30, quantity: 1, subtotal: 30, imageUrl: '/images/cat_veggies.jpg' }
      ]
    },
    {
      id: 83913,
      orderNumber: 'HF-83913',
      customerName: 'Lakshmi Bai',
      phone: '9845077665',
      address: '#12, Tungabhadra Dam Quarters',
      locality: 'Dam Road',
      totalAmount: 255,
      paymentMethod: 'UPI / GPay',
      status: 'Ready for Pickup',
      createdAt: '12 Oct 2026, 07:30 AM',
      orderedAt: '07:30 AM',
      orderAcceptedAt: '07:32 AM',
      preparedAt: '07:38 AM',
      readyForPickupAt: '07:42 AM',
      estimatedDeliveryTime: '08:00 AM',
      estimatedMinutes: 20,
      totalTimeTaken: '~20 mins SLA',
      deliveryMinutes: 20,
      vendorName: 'Hampi Super Bazaar',
      vendorLocality: 'Dam Road',
      vendorAddress: '#88, Main Bazaar, Dam Road, Hospet',
      vendorPhone: '+91 98453 66778',
      pickupInstructions: 'Bags are pre-packed in cool storage.',
      deliveryOtp: '9341',
      deliveryPayout: 50,
      distanceKm: 6.5,
      items: [
        { productName: 'Tata Tea Gold', packSize: '500 g Pack', unitPrice: 209, quantity: 1, subtotal: 209, imageUrl: '/images/cat_beverages.jpg', packed: true, checked: true },
        { productName: 'Sugar Refined', packSize: '1 kg', unitPrice: 46, quantity: 1, subtotal: 46, imageUrl: '/images/cat_staples.jpg', packed: true, checked: true }
      ]
    },
    {
      id: 83912,
      orderNumber: 'HF-83912',
      customerName: 'Raghavendra Rao',
      phone: '9845066554',
      address: '#05, Near Hampi Police Outpost',
      locality: 'Hampi Road',
      totalAmount: 140,
      paymentMethod: 'Cash on Delivery',
      status: 'Ready for Pickup',
      createdAt: '12 Oct 2026, 07:15 AM',
      orderedAt: '07:15 AM',
      orderAcceptedAt: '07:17 AM',
      preparedAt: '07:22 AM',
      readyForPickupAt: '07:28 AM',
      estimatedDeliveryTime: '07:45 AM',
      estimatedMinutes: 20,
      totalTimeTaken: '~20 mins SLA',
      deliveryMinutes: 20,
      vendorName: 'Sri Lakshmi Store',
      vendorLocality: 'Kampli Road',
      vendorAddress: 'Kampli Road, Hospet - 583201 Near Bus Stand',
      vendorPhone: '+91 98451 00223',
      pickupInstructions: 'Fruit crates on left side counter.',
      deliveryOtp: '7218',
      deliveryPayout: 45,
      distanceKm: 4.1,
      items: [
        { productName: 'Fresh Pomegranate', packSize: '1 kg', unitPrice: 140, quantity: 1, subtotal: 140, imageUrl: '/images/cat_fruits.jpg', packed: true, checked: true }
      ]
    },
    {
      id: 83911,
      orderNumber: 'HF-83911',
      customerName: 'Anitha S',
      phone: '9845011223',
      address: '#19, 4th Cross, Patel Nagar',
      locality: 'Patel Nagar',
      totalAmount: 145,
      paymentMethod: 'UPI / PhonePe',
      status: 'Picked Up',
      createdAt: '12 Oct 2026, 06:45 AM',
      orderedAt: '06:45 AM',
      orderAcceptedAt: '06:48 AM',
      preparedAt: '06:55 AM',
      readyForPickupAt: '07:00 AM',
      assignedAt: '07:05 AM',
      pickedUpAt: '07:12 AM',
      estimatedDeliveryTime: '07:30 AM',
      estimatedMinutes: 18,
      totalTimeTaken: '~18 mins SLA',
      deliveryMinutes: 18,
      vendorName: 'Sri Lakshmi Store',
      vendorLocality: 'Kampli Road',
      vendorAddress: 'Kampli Road, Hospet - 583201 Near Bus Stand',
      vendorPhone: '+91 98451 00223',
      deliveryOtp: '4421',
      deliveryInstructions: 'Ring bell twice.',
      deliveryPayout: 45,
      distanceKm: 4.5,
      assignedDeliveryBoy: 'Ravi Kumar (DLV-001)',
      assignedDeliveryBoyId: 'DLV-001',
      assignedDeliveryBoyPhone: '+91 98450 12345',
      items: [
        { productName: 'Fresh Red Tomatoes', packSize: '1 kg', unitPrice: 32, quantity: 2, subtotal: 64, imageUrl: '/images/tomatoes.jpg', packed: true, checked: true },
        { productName: 'Farm Fresh Carrots', packSize: '500 g', unitPrice: 35, quantity: 1, subtotal: 35, imageUrl: '/images/cat_veggies.jpg', packed: true, checked: true }
      ]
    },
    {
      id: 83910,
      orderNumber: 'HF-83910',
      customerName: 'Prashanth Patil',
      phone: '9845044556',
      address: '#8, College Road, Hospet',
      locality: 'College Road',
      totalAmount: 210,
      paymentMethod: 'Cash on Delivery',
      status: 'Delivered',
      createdAt: '12 Oct 2026, 06:00 AM',
      orderedAt: '06:00 AM',
      orderAcceptedAt: '06:05 AM',
      preparedAt: '06:12 AM',
      readyForPickupAt: '06:18 AM',
      assignedAt: '06:20 AM',
      pickedUpAt: '06:28 AM',
      deliveredAt: '06:45 AM',
      estimatedDeliveryTime: '06:45 AM',
      estimatedMinutes: 25,
      totalTimeTaken: '25 mins SLA',
      deliveryMinutes: 25,
      vendorName: 'Sri Lakshmi Store',
      vendorLocality: 'Kampli Road',
      vendorAddress: 'Kampli Road, Hospet - 583201 Near Bus Stand',
      vendorPhone: '+91 98451 00223',
      deliveryOtp: '1183',
      deliveryPayout: 45,
      distanceKm: 3.2,
      assignedDeliveryBoy: 'Ravi Kumar (DLV-001)',
      assignedDeliveryBoyId: 'DLV-001',
      assignedDeliveryBoyPhone: '+91 98450 12345',
      items: [
        { productName: 'Nandini Pure Cow Ghee', packSize: '500 ml Pouch', unitPrice: 315, quantity: 1, subtotal: 315, imageUrl: '/images/cat_dairy.jpg', packed: true, checked: true }
      ]
    }
  ]);

  // Delivery rider product checklist and variant expansion state
  const [checkedDeliveryItems, setCheckedDeliveryItems] = useState<Record<string, boolean>>({});
  const [expandedDeliveryVariants, setExpandedDeliveryVariants] = useState<Record<number, boolean>>({});

  const toggleDeliveryItem = (orderId: number, itemIdx: number) => {
    const key = `${orderId}-${itemIdx}`;
    setCheckedDeliveryItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleDeliveryVariantsExpanded = (orderId: number) => {
    setExpandedDeliveryVariants(prev => {
      const currentlyExpanded = prev[orderId] !== undefined ? prev[orderId] : true;
      return {
        ...prev,
        [orderId]: !currentlyExpanded
      };
    });
  };

  const handleCheckAllOrderItems = (orderId: number, totalCount: number, shouldCheck: boolean) => {
    setCheckedDeliveryItems(prev => {
      const next = { ...prev };
      for (let i = 0; i < totalCount; i++) {
        next[`${orderId}-${i}`] = shouldCheck;
      }
      return next;
    });
  };

  const [sysConfig, setSysConfig] = useState<SystemConfig>(() => getSystemConfig());

  useEffect(() => {
    const handleConfigUpdate = (e: any) => {
      setSysConfig(e.detail || getSystemConfig());
    };
    window.addEventListener(SYSTEM_CONFIG_EVENT, handleConfigUpdate);
    return () => window.removeEventListener(SYSTEM_CONFIG_EVENT, handleConfigUpdate);
  }, []);

  // Cart calculations with Dynamic Distance Delivery Pricing
  const cartItemList = useMemo(() => Object.values(cart), [cart]);
  const cartItemCount = useMemo(() => cartItemList.reduce((acc, it) => acc + it.qty, 0), [cartItemList]);
  const cartSubtotal = useMemo(() => cartItemList.reduce((acc, it) => acc + it.price * it.qty, 0), [cartItemList]);
  const cartMrpTotal = useMemo(() => cartItemList.reduce((acc, it) => acc + it.mrp * it.qty, 0), [cartItemList]);
  const cartSavings = Math.max(0, cartMrpTotal - cartSubtotal);

  // Dynamic distance delivery calculation
  const deliveryCalc = useMemo(() => {
    const dist = (selectedLocality as any)?.distanceKm ?? 2.2;
    return calculateDeliveryFee(cartSubtotal, dist, sysConfig);
  }, [cartSubtotal, selectedLocality, sysConfig]);

  const deliveryFee = deliveryCalc.totalDeliveryFee;
  const grandTotal = cartSubtotal + deliveryFee;

  // Cart actions with Flash Deals integration (Requirements 1, 7, 8)
  const handleAddToCart = (product: Product, variant: ProductVariant, qtyToAdd = 1, deal?: FlashDeal) => {
    if (variant.stockQty <= 0) return;
    if (product.approvalStatus && product.approvalStatus !== 'approved') return;
    if (product.imageReviewStatus === 'needs_correction') return;
    if (product.isActive === false) return;
    if (product.vendorId) {
      const v = vendors.find(vend => vend.id === product.vendorId);
      if (v && v.status !== 'approved') return;
    }

    // Check if an active Flash Deal applies to this product and variant
    const activeDeal =
      deal ||
      flashDeals.find(d => {
        if (!d.isActive || d.status !== 'active') return false;
        if (d.productId !== product.id || d.variantId !== variant.id) return false;
        const nowMs = Date.now();
        if (d.startDate && new Date(d.startDate).getTime() > nowMs) return false;
        if (d.endDate && new Date(d.endDate).getTime() < nowMs) return false;
        return true;
      });

    setCart(prev => {
      const existing = prev[variant.id];
      const newQty = existing ? existing.qty + qtyToAdd : qtyToAdd;

      // Validate per-customer purchase limit if deal
      if (activeDeal && activeDeal.perCustomerLimit && newQty > activeDeal.perCustomerLimit) {
        setVendorNotice({
          text: `Maximum purchase limit of ${activeDeal.perCustomerLimit} units for "${product.name}" at deal price.`,
          type: 'warning'
        });
        setTimeout(() => setVendorNotice(null), 4000);
        return prev;
      }

      const itemPrice = activeDeal ? activeDeal.dealPrice : variant.price;

      return {
        ...prev,
        [variant.id]: {
          variantId: variant.id,
          productId: product.id,
          vendorId: product.vendorId,
          name: product.name,
          packSize: variant.packSize,
          price: itemPrice,
          originalPrice: variant.price,
          mrp: variant.mrp,
          imageUrl: product.imageUrl,
          qty: newQty,
          isFlashDeal: Boolean(activeDeal),
          flashDealId: activeDeal?.id,
          dealBadge: activeDeal?.badgeText
        }
      };
    });
  };

  const handleUpdateQty = (variantId: number, newQty: number) => {
    setCart(prev => {
      const next = { ...prev };
      if (newQty <= 0) {
        delete next[variantId];
        return next;
      }

      const item = next[variantId];
      if (item && item.isFlashDeal) {
        const deal = flashDeals.find(d => d.id === item.flashDealId);
        if (deal && deal.perCustomerLimit && newQty > deal.perCustomerLimit) {
          setVendorNotice({
            text: `Maximum deal limit of ${deal.perCustomerLimit} reached for ${item.name}.`,
            type: 'warning'
          });
          setTimeout(() => setVendorNotice(null), 3500);
          return prev;
        }
      }

      if (next[variantId]) {
        next[variantId] = { ...next[variantId], qty: newQty };
      }
      return next;
    });
  };

  // Open Product Details
  const handleOpenProduct = (product: Product) => {
    setSelectedProduct(product);
    const defVar = product.variants.find(v => v.isDefault) || product.variants[0];
    setSelectedVariant(defVar);
    setPdpQty(1);
    setPdpImageIdx(0);
    setIsWishlisted(false);
  };

  // Authoritative Multi-Vendor Checkout via Backend Allocation Engine
  const handlePlaceOrder = async () => {
    if (cartItemList.length === 0) return;
    setCheckoutError(null);

    // Revalidate Flash Deal status and limits
    for (const item of cartItemList) {
      if (item.isFlashDeal) {
        const deal = flashDeals.find(d => d.id === item.flashDealId);
        if (!deal || !deal.isActive || deal.status !== 'active') {
          setCheckoutError(`Flash deal for "${item.name}" has ended or is paused. Please review your cart with updated pricing.`);
          return;
        }
        if (deal.endDate && new Date(deal.endDate).getTime() < Date.now()) {
          setCheckoutError(`Flash deal for "${item.name}" has expired.`);
          return;
        }
        if (deal.perCustomerLimit && item.qty > deal.perCustomerLimit) {
          setCheckoutError(`Order exceeds maximum deal limit of ${deal.perCustomerLimit} units for "${item.name}".`);
          return;
        }
      }
    }

    try {
      const resp = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          phone: customerPhone,
          address: customerAddress,
          locality: selectedLocality.name,
          distanceKm: (selectedLocality as any)?.distanceKm ?? 2.2,
          deliveryFee,
          paymentMethod,
          items: cartItemList.map(it => ({
            productId: it.productId,
            variantId: it.variantId,
            productName: it.name,
            packSize: it.packSize,
            quantity: it.qty,
            unitPrice: it.price,
            imageUrl: it.imageUrl
          })),
          commissionRate: sysConfig.commissionRatePercent || 10.0
        })
      });

      const data = await resp.json();
      if (!resp.ok || !data.success) {
        setCheckoutError(data.error || 'Checkout allocation failed. Please verify stock availability.');
        return;
      }

      const placedOrder: Order = data.order;
      setOrders(prev => [placedOrder, ...prev]);
      setCart({});
      setIsCheckoutOpen(false);
      setTrackingOrderId(placedOrder.id);
      setActiveTab('tracking');
      refreshCombinedInventory();
    } catch (err: any) {
      setCheckoutError(err?.message || 'Network error while allocating order.');
    }
  };

  // Filter products for Customer Home (Only approved products from approved vendors!)
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Check product approval status
      if (p.approvalStatus && p.approvalStatus !== 'approved') return false;

      // Check product image review status
      if (p.imageReviewStatus === 'needs_correction') return false;

      // Check product active / storefront visibility toggle
      if (p.isActive === false) return false;

      // Check vendor status if assigned
      if (p.vendorId) {
        const v = vendors.find(vend => vend.id === p.vendorId);
        if (v && v.status !== 'approved') return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.categorySlug.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (selectedCategorySlug && p.categorySlug !== selectedCategorySlug) {
        return false;
      }
      if (activeShortcut === 'offers') {
        const def = p.variants.find(v => v.isDefault) || p.variants[0];
        return p.isDeal || def.mrp > def.price;
      }
      if (activeShortcut === 'bestsellers') return p.isBestseller;
      if (activeShortcut === 'bulk') {
        const bulkVariants = getQualifyingBulkVariants(p);
        return bulkVariants.some(v => v.stockQty > 0);
      }
      return true;
    });
  }, [products, vendors, searchQuery, selectedCategorySlug, activeShortcut]);

  // Category product counts for Customer Home category chips (Image 6 reference)
  const storefrontCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      if (p.approvalStatus && p.approvalStatus !== 'approved') return;
      if (p.imageReviewStatus === 'needs_correction') return;
      if (p.isActive === false) return;
      if (p.vendorId) {
        const v = vendors.find(vend => vend.id === p.vendorId);
        if (v && v.status !== 'approved') return;
      }
      if (p.categorySlug) {
        counts[p.categorySlug] = (counts[p.categorySlug] || 0) + 1;
      }
    });
    return counts;
  }, [products, vendors]);

  const totalStorefrontProductsCount = useMemo(() => {
    return Object.values(storefrontCategoryCounts).reduce((acc, c) => acc + c, 0);
  }, [storefrontCategoryCounts]);

  // Flash deals
  const deals = useMemo(() => filteredProducts.filter(p => p.isDeal), [filteredProducts]);

  // Fallback image helper
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, label: string) => {
    const target = e.currentTarget;
    target.onerror = null;
    target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="100%" height="100%" fill="%23f8fafc"/><rect x="20" y="20" width="260" height="260" rx="16" fill="%23ecfdf5" stroke="%23bbf7d0" stroke-width="2"/><text x="150" y="140" font-size="42" text-anchor="middle">🥗</text><text x="150" y="180" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle" fill="%23065f46">${encodeURIComponent(label)}</text><text x="150" y="202" font-family="sans-serif" font-size="11" text-anchor="middle" fill="%2316a34a">Hospete Fresh Verified</text></svg>`;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* TOP CONTROL NAVIGATION BAR: Switch roles & toggle preview */}
      <header className="bg-slate-900 text-white px-4 py-2.5 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Role Tag */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-black px-2.5 py-1 rounded tracking-tight">
                HOSPETE FRESH
              </span>
              <span className="text-xs font-medium text-slate-300 hidden sm:inline">
                Grocery-Commerce UI Engine
              </span>
            </div>

            {/* Quick role tabs */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg text-xs font-medium border border-slate-700">
              <button
                onClick={() => setRoleView('customer')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                  roleView === 'customer'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Customer App</span>
              </button>
              <button
                onClick={() => setRoleView('admin')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                  roleView === 'admin'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Admin Portal</span>
              </button>
              <button
                onClick={() => setRoleView('vendor')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                  roleView === 'vendor'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Vendor</span>
              </button>
              <button
                onClick={() => setRoleView('delivery')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                  roleView === 'delivery'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Delivery</span>
              </button>
              <button
                onClick={() => setRoleView('deliverables')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                  roleView === 'deliverables'
                    ? 'bg-amber-500 text-slate-900 font-bold shadow-sm'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download ZIP</span>
              </button>
            </div>
          </div>

          {/* Right controls: frame toggle & quick download */}
          <div className="flex items-center gap-3">
            {roleView === 'customer' && (
              <button
                onClick={() => setIsMobileFrame(!isMobileFrame)}
                className="hidden lg:flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-md border border-slate-700 transition-colors"
                title="Toggle mobile device shell on desktop"
              >
                {isMobileFrame ? (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Expand View</span>
                  </>
                ) : (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>Mobile Frame (410px)</span>
                  </>
                )}
              </button>
            )}

            <a
              href="/hospete_fresh_updated.zip"
              download="hospete_fresh_updated.zip"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Get ZIP</span>
            </a>
          </div>
        </div>
      </header>

      {/* =========================================================================
          VIEW 1: CUSTOMER MOBILE VIEW (Centered 390-430px wide preview on desktop)
          ========================================================================= */}
      {roleView === 'customer' && (
        <div
          className={`flex-1 w-full flex flex-col items-center min-h-screen ${
            isMobileFrame
              ? 'py-4 px-2 sm:px-4 bg-slate-900 overflow-y-auto'
              : 'p-0 bg-white'
          }`}
        >
          {/* Centered Mobile App Shell (Matching Delivery screen visual style & height) */}
          <div
            className={`w-full bg-white flex flex-col relative transition-all ${
              isMobileFrame
                ? 'max-w-[410px] h-[780px] min-h-[740px] max-h-[820px] rounded-[32px] shadow-2xl border-[6px] border-slate-800 overflow-hidden'
                : 'max-w-4xl min-h-screen'
            }`}
          >
            {/* Device Status Bar matching Delivery Screen */}
            {isMobileFrame && (
              <div className="bg-slate-900 text-white px-5 pt-2 pb-1.5 flex justify-between items-center text-[11px] font-bold tracking-tight shrink-0 select-none">
                <span>9:41</span>
                <div className="w-16 h-4 bg-slate-800 rounded-full mx-auto" />
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span>5G</span>
                  <span>100%</span>
                </div>
              </div>
            )}

            {/* 1. APP HEADER AND DELIVERY LOCATION */}
            {activeTab !== 'category-listing' && activeTab !== 'tracking' && (
              <header className="p-3 bg-white border-b border-slate-100 sticky top-0 z-30 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-600 text-white text-xs font-black px-2 py-0.5 rounded tracking-tight">
                    HOSPETE FRESH
                  </div>
                  <div className="flex flex-col">
                    <div className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      <span>⚡ {selectedLocality.etaMinutes} MINS</span>
                    </div>
                    {/* Locality Dropdown */}
                    <div className="relative inline-flex items-center">
                      <MapPin className="w-3 h-3 text-emerald-600 mr-1" />
                      <select
                        value={selectedLocality.name}
                        onChange={e => {
                          const found = LOCALITIES.find(l => l.name === e.target.value);
                          if (found) setSelectedLocality(found);
                        }}
                        className="text-xs font-bold text-slate-800 bg-transparent pr-4 cursor-pointer focus:outline-hidden"
                      >
                        {LOCALITIES.map(loc => (
                          <option key={loc.name} value={loc.name}>
                            {loc.name}, 583201
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('account')}
                    className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 hover:bg-slate-200"
                  >
                    👤
                  </button>
                  <button
                    onClick={() => setActiveTab('home')}
                    className="w-8 h-8 rounded-full bg-slate-100 relative flex items-center justify-center text-slate-700 hover:bg-slate-200"
                  >
                    <ShoppingBag className="w-4 h-4 text-emerald-600" />
                    {cartItemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                        {cartItemCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* 2. SEARCH BAR */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search rice, fresh tomatoes, Nandini milk, snacks..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Chips Filter Strip (Replaced Image 2 with Image 1 Category Chips) */}
              <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar pb-0.5">
                <button
                  onClick={() => {
                    setSelectedCategorySlug(null);
                    setActiveShortcut('all');
                    setSearchQuery('');
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    !selectedCategorySlug && activeShortcut === 'all'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                  }`}
                >
                  <span>All</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      !selectedCategorySlug && activeShortcut === 'all'
                        ? 'bg-emerald-800 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {totalStorefrontProductsCount}
                  </span>
                </button>

                {storefrontCategories.map(cat => {
                  const count = storefrontCategoryCounts[cat.slug] || 0;
                  const isSelected = selectedCategorySlug === cat.slug;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategorySlug(isSelected ? null : cat.slug);
                        setActiveShortcut('all');
                        setSearchQuery('');
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                      }`}
                    >
                      <span>{cat.iconEmoji}</span>
                      <span>{cat.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                          isSelected
                            ? 'bg-emerald-800 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </header>
            )}

            {/* SCROLLABLE MOBILE CONTENT */}
            <div className={`flex-1 min-h-0 ${activeTab === 'category-listing' || activeTab === 'tracking' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto pb-24'}`}>
              {activeTab === 'home' && (
                <>
                  {/* 3. PROMOTIONAL GROCERY BANNER CAROUSEL (Requirement 1, 5) */}
                  <CustomerHomeBannerCarousel
                    banners={eligibleCustomerBanners}
                    settings={bannerSettings}
                    onNavigateCta={handleBannerCtaNavigate}
                  />

                  {/* 4. FOUR SHORTCUTS: Offers, Best Sellers, Flash Deals, Bulk Packs */}
                  <div className="grid grid-cols-4 gap-2 px-3 pb-2">
                    {[
                      { key: 'offers', label: 'Offers', icon: '🏷️', color: 'hover:bg-rose-50' },
                      { key: 'bestsellers', label: 'Best Sellers', icon: '⭐', color: 'hover:bg-amber-50' },
                      { key: 'flash', label: 'Flash Deals', icon: '⚡', color: 'hover:bg-amber-50' },
                      { key: 'bulk', label: 'Bulk Packs', icon: '📦', color: 'hover:bg-blue-50' },
                    ].map(shortcut => (
                      <button
                        key={shortcut.key}
                        onClick={() => {
                          if (shortcut.key === 'flash') {
                            setSelectedCategorySlug(null);
                            setActiveTab('home');
                            if (activeShortcut !== 'all' && activeShortcut !== 'offers') {
                              setActiveShortcut('all');
                            }
                            // Smoothly scroll to the TODAY'S FLASH DEALS section
                            setTimeout(() => {
                              const el = document.getElementById('flash-deals-section') || document.getElementById('todays-flash-deals');
                              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }, 50);
                            return;
                          }
                          setActiveShortcut(activeShortcut === shortcut.key ? 'all' : (shortcut.key as any));
                          setSelectedCategorySlug(null);
                        }}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          activeShortcut === shortcut.key
                            ? 'bg-emerald-50 border-emerald-500 shadow-xs scale-102'
                            : `bg-slate-50 border-slate-200/70 ${shortcut.color}`
                        }`}
                      >
                        <span className="text-xl mb-1">{shortcut.icon}</span>
                        <span className="text-[11px] font-bold text-slate-800 leading-tight">
                          {shortcut.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* 5 & 6. SHOP BY CATEGORY WITH "SEE ALL" & FOUR-COLUMN CATEGORY TILE GRID */}
                  <section className="px-3 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                        Shop by Category
                      </h3>
                      <button
                        onClick={() => setActiveTab('categories')}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center cursor-pointer"
                      >
                        See All &rarr;
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {homeStorefrontCategories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setSelectedCategorySlug(cat.slug);
                            setActiveTab('category-listing');
                          }}
                          className={`flex flex-col items-center text-center p-1.5 rounded-xl transition-all cursor-pointer ${
                            selectedCategorySlug === cat.slug
                              ? 'bg-emerald-50 ring-2 ring-emerald-500'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-xs mb-1.5 border border-black/5 overflow-hidden"
                            style={{ backgroundColor: cat.bannerColor || '#ecfdf5' }}
                          >
                            {cat.imageUrl ? (
                              <img
                                src={cat.imageUrl}
                                alt={cat.name}
                                onError={e => {
                                  (e.target as HTMLElement).style.display = 'none';
                                  const parent = (e.target as HTMLElement).parentElement;
                                  if (parent) {
                                    const fallback = parent.querySelector('.cat-emoji');
                                    if (fallback) (fallback as HTMLElement).style.display = 'block';
                                  }
                                }}
                                className="w-full h-full object-cover"
                              />
                            ) : null}
                            <span className="cat-emoji" style={{ display: cat.imageUrl ? 'none' : 'block' }}>
                              {cat.iconEmoji}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-800 leading-tight line-clamp-2">
                            {cat.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* 7. TODAY'S FLASH DEALS (Requirements 1, 5, 8) */}
                  {!selectedCategorySlug && (activeShortcut === 'all' || activeShortcut === 'offers' || activeShortcut === 'flash') && (
                    <div id="todays-flash-deals">
                      <CustomerFlashDealsSection
                        deals={flashDeals}
                        products={products}
                        vendors={vendors}
                        cart={cart}
                        onAddToCart={handleAddToCart}
                        onUpdateQty={handleUpdateQty}
                        onOpenProduct={handleOpenProduct}
                        campaign={flashCampaign}
                      />
                    </div>
                  )}


                  {/* 8. COMPACT GROCERY PRODUCT CARDS (2-Column Grid) */}
                  <section className="px-3 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                          {selectedCategorySlug
                            ? `${CATEGORIES.find(c => c.slug === selectedCategorySlug)?.name}`
                            : activeShortcut === 'bulk'
                            ? 'Bulk Packs (> 10 kg)'
                            : activeShortcut === 'offers'
                            ? 'Offers & Deals'
                            : activeShortcut === 'bestsellers'
                            ? 'Best Sellers'
                            : 'Daily Grocery Essentials'}
                        </h3>
                        <span className="text-[11px] text-slate-500 font-semibold">
                          ({filteredProducts.length})
                        </span>
                      </div>
                      {(selectedCategorySlug || activeShortcut !== 'all' || searchQuery) && (
                        <button
                          onClick={() => {
                            setSelectedCategorySlug(null);
                            setActiveShortcut('all');
                            setSearchQuery('');
                          }}
                          className="text-[11px] text-emerald-600 font-bold hover:underline"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>

                    {filteredProducts.length === 0 ? (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center my-4">
                        <div className="text-3xl mb-2">🔍</div>
                        <h4 className="text-xs font-bold text-slate-800">No products found</h4>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Try searching for tomatoes, milk, mixture snacks, or rice.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2.5">
                        {filteredProducts.map(prod => {
                          const qualifyingBulkVariants = getQualifyingBulkVariants(prod);
                          const currentCardVarId = cardSelectedVariants[prod.id];
                          const activeVar = currentCardVarId
                            ? (prod.variants.find(v => v.id === currentCardVarId) || prod.variants[0])
                            : (activeShortcut === 'bulk' && qualifyingBulkVariants.length > 0)
                            ? qualifyingBulkVariants[0]
                            : (prod.variants.find(v => v.isDefault) || prod.variants[0]);

                          const discountPct = Math.round(((activeVar.mrp - activeVar.price) / activeVar.mrp) * 100);
                          const inCart = cart[activeVar.id];
                          const isOutOfStock = activeVar.stockQty <= 0;

                          return (
                            <div
                              key={prod.id}
                              className="bg-white border border-slate-200/90 rounded-xl p-2.5 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all group"
                            >
                              <div className="relative">
                                {/* Discount badge */}
                                {discountPct > 0 && (
                                  <span className="absolute top-0 left-0 bg-emerald-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded z-10 shadow-xs">
                                    {discountPct}% OFF
                                  </span>
                                )}

                                {/* Product Image */}
                                <div
                                  onClick={() => handleOpenProduct(prod)}
                                  className="w-full aspect-square bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer mb-2"
                                >
                                  <img
                                    src={prod.imageUrl}
                                    alt={prod.name}
                                    onError={e => handleImageError(e, prod.name)}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                </div>

                                <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">
                                  {prod.brand}
                                </div>
                                <h4
                                  onClick={() => handleOpenProduct(prod)}
                                  className="text-xs font-bold text-slate-900 line-clamp-2 h-8 leading-snug cursor-pointer hover:text-emerald-700"
                                >
                                  {prod.name}
                                </h4>
                              </div>

                              <div className="mt-2 pt-1 border-t border-slate-100">
                                {prod.variants.length > 1 ? (
                                  <div className="flex flex-wrap gap-1 mb-1.5">
                                    {(activeShortcut === 'bulk' && qualifyingBulkVariants.length > 0
                                      ? qualifyingBulkVariants
                                      : prod.variants
                                    ).map(v => (
                                      <button
                                        key={v.id}
                                        type="button"
                                        onClick={e => {
                                          e.stopPropagation();
                                          setCardSelectedVariants(prev => ({ ...prev, [prod.id]: v.id }));
                                        }}
                                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold border transition-all cursor-pointer ${
                                          activeVar.id === v.id
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-400'
                                        }`}
                                      >
                                        {v.packSize}
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-slate-500 font-medium mb-1">
                                    {activeVar.packSize}
                                  </div>
                                )}
                                <div className="flex items-baseline gap-1.5 my-1.5">
                                  <span className="text-sm font-black text-slate-900">
                                    ₹{activeVar.price}
                                  </span>
                                  {activeVar.mrp > activeVar.price && (
                                    <span className="text-[11px] text-slate-400 line-through">
                                      ₹{activeVar.mrp}
                                    </span>
                                  )}
                                </div>

                                {/* CRITICAL REQUIREMENT 3:
                                    The Add button must be green background with white text and plus icon,
                                    with disabled visibly grey state only when out of stock. */}
                                {isOutOfStock ? (
                                  <button
                                    disabled
                                    className="w-full h-8 bg-slate-100 text-slate-400 font-bold text-xs rounded-md border border-slate-200 cursor-not-allowed"
                                  >
                                    Out of Stock
                                  </button>
                                ) : inCart ? (
                                  <div className="flex items-center justify-between h-8 bg-emerald-600 text-white rounded-md px-1 shadow-xs">
                                    <button
                                      onClick={() => handleUpdateQty(activeVar.id, inCart.qty - 1)}
                                      className="w-6 h-6 flex items-center justify-center font-bold text-sm hover:bg-emerald-700 rounded active:scale-95 cursor-pointer"
                                    >
                                      -
                                    </button>
                                    <span className="text-xs font-bold">{inCart.qty}</span>
                                    <button
                                      onClick={() => handleUpdateQty(activeVar.id, inCart.qty + 1)}
                                      className="w-6 h-6 flex items-center justify-center font-bold text-sm hover:bg-emerald-700 rounded active:scale-95 cursor-pointer"
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleAddToCart(prod, activeVar, 1)}
                                    className="w-full h-8 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs rounded-md flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>ADD</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </>
              )}

              {/* DEDICATED CATEGORY LISTING SCREEN (DYNAMIC FOR EVERY CATEGORY) */}
              {activeTab === 'category-listing' && (
                <CategoryListingScreen
                  categorySlug={selectedCategorySlug || 'veggies'}
                  categoryTitle={
                    allCategories.find(c => c.slug === selectedCategorySlug)?.name ||
                    (selectedCategorySlug === 'veggies' ? 'Vegetables & Fruits' : undefined)
                  }
                  categories={allCategories}
                  products={products}
                  vendors={vendors}
                  cart={cart}
                  onBack={() => {
                    setActiveTab('home');
                    setSelectedCategorySlug(null);
                  }}
                  onAddToCart={handleAddToCart}
                  onUpdateQty={handleUpdateQty}
                  onOpenProduct={handleOpenProduct}
                  onOpenCart={() => setIsCheckoutOpen(true)}
                  cartItemCount={cartItemCount}
                />
              )}

              {/* TAB 2: CATEGORIES */}
              {activeTab === 'categories' && (
                <div className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-extrabold text-slate-900">All Grocery Categories</h2>
                  </div>
                  <div className="space-y-3">
                    {storefrontCategories.map(cat => {
                      const catProds = products.filter(p => p.categorySlug === cat.slug);
                      return (
                        <div key={cat.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                          <div className="flex items-center justify-between mb-2">
                            <div
                              onClick={() => {
                                setSelectedCategorySlug(cat.slug);
                                setActiveTab('category-listing');
                              }}
                              className="flex items-center gap-2 cursor-pointer group"
                            >
                              <span className="text-xl group-hover:scale-110 transition-transform">{cat.iconEmoji}</span>
                              <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">{cat.name}</span>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedCategorySlug(cat.slug);
                                setActiveTab('category-listing');
                              }}
                              className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
                            >
                              View All ({catProds.length}) &rarr;
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {catProds.slice(0, 2).map(p => {
                              const def = p.variants[0];
                              return (
                                <div
                                  key={p.id}
                                  onClick={() => handleOpenProduct(p)}
                                  className="border border-slate-100 rounded-lg p-2 bg-slate-50 flex items-center gap-2 cursor-pointer hover:bg-emerald-50/50"
                                >
                                  <img
                                    src={p.imageUrl}
                                    alt={p.name}
                                    onError={e => handleImageError(e, p.name)}
                                    className="w-10 h-10 object-cover rounded"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="text-[11px] font-bold text-slate-800 truncate">
                                      {p.name}
                                    </div>
                                    <div className="text-[11px] font-black text-emerald-700">
                                      ₹{def.price}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: SEARCH */}
              {activeTab === 'search' && (
                <div className="p-3">
                  <h2 className="text-sm font-extrabold text-slate-900 mb-2">Instant Grocery Search</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {filteredProducts.map(prod => {
                      const def = prod.variants[0];
                      return (
                        <div
                          key={prod.id}
                          onClick={() => handleOpenProduct(prod)}
                          className="bg-white border border-slate-200 rounded-xl p-2.5 cursor-pointer hover:border-emerald-500"
                        >
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            onError={e => handleImageError(e, prod.name)}
                            className="w-full aspect-square object-cover rounded-lg mb-2"
                          />
                          <div className="text-xs font-bold text-slate-900 truncate">{prod.name}</div>
                          <div className="text-xs font-black text-emerald-700 mt-1">₹{def.price}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: ORDERS */}
              {activeTab === 'orders' && (
                <div className="p-3">
                  <h2 className="text-sm font-extrabold text-slate-900 mb-3">Your Orders & Deliveries</h2>
                  <div className="space-y-3">
                    {orders.map(ord => (
                      <div key={ord.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <div>
                            <span className="text-xs font-black text-slate-900">{ord.orderNumber}</span>
                            <div className="text-[10px] text-slate-400">{ord.createdAt}</div>
                          </div>
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                            {ord.status}
                          </span>
                        </div>

                        {/* PROMINENT ESTIMATED DELIVERY TIME FOR CUSTOMER */}
                        <div className="my-2 p-2.5 bg-emerald-50/80 border border-emerald-200/90 rounded-xl flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                              <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                            </div>
                            <div>
                              <div className="text-[9px] font-black uppercase tracking-wider text-emerald-800">
                                Estimated Delivery Time
                              </div>
                              <div className="text-xs font-black text-slate-900">
                                {ord.status === 'Delivered' ? (
                                  <span className="text-emerald-700 font-bold">Delivered at {ord.deliveredAt || ord.estimatedDeliveryTime || 'Completed'}</span>
                                ) : (
                                  <span>Expected by <strong className="text-emerald-800 font-black">{ord.estimatedDeliveryTime || '10:35 AM'}</strong> (~{ord.estimatedMinutes || 15} mins)</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${ord.status === 'Delivered' ? 'bg-emerald-200 text-emerald-900' : 'bg-emerald-600 text-white'}`}>
                            {ord.status === 'Delivered' ? 'Delivered' : `⚡ ${ord.estimatedMinutes || 15}m ETA`}
                          </span>
                        </div>

                        <div className="py-1.5 space-y-1">
                          {ord.items.map((itm, idx) => (
                            <div key={idx} className="flex justify-between text-xs text-slate-600">
                              <span>
                                {itm.quantity}x {itm.productName} ({itm.packSize})
                              </span>
                              <span className="font-semibold text-slate-900">₹{itm.subtotal}</span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2.5 border-t border-dashed border-slate-200 flex justify-between items-center text-xs">
                          <div>
                            <span className="text-slate-500 block text-[11px]">Delivered to {ord.locality}</span>
                            <span className="font-black text-emerald-700 text-sm">₹{ord.totalAmount}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setTrackingOrderId(ord.id);
                              setActiveTab('tracking');
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                          >
                            <Bike className="w-3.5 h-3.5" />
                            <span>Track Live 🛵</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4B: LIVE ORDER TRACKING (Matching Image fe971704.png) */}
              {activeTab === 'tracking' && (
                (() => {
                  const trackingOrder = orders.find(o => o.id === trackingOrderId) || orders[0];
                  return (
                    <div className="flex-1 min-h-0 flex flex-col pb-14 overflow-hidden">
                      <CustomerOrderTrackingScreen
                        order={trackingOrder}
                        onBack={() => setActiveTab('orders')}
                      />
                    </div>
                  );
                })()
              )}

              {/* TAB 5: ACCOUNT */}
              {activeTab === 'account' && (
                <div className="p-3 space-y-3">
                  <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xl mx-auto mb-2 font-black">
                      👤
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900">Ramesh Rao</h3>
                    <p className="text-xs text-slate-500">+91 98450 12345 • Hospete</p>
                    <span className="inline-block mt-2 text-[10px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
                      ★ Hospete Fresh Club Member
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="w-full p-3 flex justify-between items-center hover:bg-slate-50 text-left font-semibold text-slate-800"
                    >
                      <span>📦 Order History & Reorder</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                    <div className="p-3 flex justify-between items-center text-slate-800 font-semibold">
                      <span>📍 Default Address: Patel Nagar, Hospete</span>
                      <span className="text-emerald-600 text-[11px]">Active</span>
                    </div>
                    <div className="p-3 flex justify-between items-center text-slate-800 font-semibold">
                      <span>⚡ 24x7 Hospete Fresh Helpline</span>
                      <span className="text-emerald-700 font-bold">08394-220100</span>
                    </div>
                  </div>

                  {/* Switch to ops portals */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                    <div className="font-bold text-slate-700 mb-2 uppercase text-[10px] tracking-wider">
                      Operations & Management Portals (Desktop Views)
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => setRoleView('admin')}
                        className="text-left text-emerald-700 font-bold hover:underline flex items-center gap-1"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        <span>Admin Management Console &rarr;</span>
                      </button>
                      <button
                        onClick={() => setRoleView('vendor')}
                        className="text-left text-emerald-700 font-bold hover:underline flex items-center gap-1"
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>Vendor Inventory & Stock Manager &rarr;</span>
                      </button>
                      <button
                        onClick={() => setRoleView('delivery')}
                        className="text-left text-emerald-700 font-bold hover:underline flex items-center gap-1"
                      >
                        <Bike className="w-3.5 h-3.5" />
                        <span>Delivery Fleet Partner Dispatch &rarr;</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 10. FLOATING BASKET SUMMARY (Above bottom nav bar) */}
            {cartItemCount > 0 && !isCheckoutOpen && (
              <div className="absolute bottom-16 left-3 right-3 bg-emerald-700 text-white rounded-xl px-3.5 py-2.5 shadow-lg flex items-center justify-between z-30 animate-in fade-in slide-in-from-bottom-2">
                <div>
                  <div className="text-xs font-black">
                    {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} • ₹{cartSubtotal}
                  </div>
                  <div className="text-[10px] text-emerald-200">
                    {deliveryCalc.isFreeDelivery
                      ? '⚡ Free Delivery unlocked'
                      : deliveryCalc.remainingForFreeDelivery > 0
                      ? `Add ₹${deliveryCalc.remainingForFreeDelivery} for Free Base Delivery`
                      : `Delivery fee: ₹${deliveryCalc.totalDeliveryFee}`}
                  </div>
                </div>
                <button
                  onClick={() => setIsCheckoutOpen(true)}
                  className="bg-white text-emerald-900 font-extrabold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs hover:bg-emerald-50 active:scale-95 transition-transform"
                >
                  <span>View Basket</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 9. FIXED BOTTOM NAVIGATION (5 items: Home, Categories, Search, Orders, Account) */}
            <nav className="absolute bottom-0 left-0 right-0 h-14 bg-white border-t border-slate-200 grid grid-cols-5 items-center z-40">
              {[
                { tab: 'home', label: 'Home', icon: '🏠' },
                { tab: 'categories', label: 'Categories', icon: '📁' },
                { tab: 'search', label: 'Search', icon: '🔍' },
                { tab: 'orders', label: 'Orders', icon: '📦' },
                { tab: 'account', label: 'Account', icon: '👤' },
              ].map(item => (
                <button
                  key={item.tab}
                  onClick={() => {
                    setActiveTab(item.tab as AppTab);
                    if (item.tab === 'home') {
                      setSelectedCategorySlug(null);
                      setActiveShortcut('all');
                      setSearchQuery('');
                    }
                  }}
                  className={`flex flex-col items-center justify-center text-[10px] font-bold transition-colors ${
                    activeTab === item.tab ||
                    (activeTab === 'category-listing' && item.tab === 'categories') ||
                    (activeTab === 'tracking' && item.tab === 'orders')
                      ? 'text-emerald-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span className="text-base leading-none mb-1">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. PRODUCT DETAILS MODAL / PAGE
          Match the supplied product-details screenshot:
          - Large, sharp product image, properly contained and not distorted
          - Back, wishlist, and cart icons
          - Product name, brand/category, rating/review details
          - Pack-size options displayed as selectable cards
          - Selected pack’s price, MRP, discount, and stock
          - Quantity stepper and prominent green Add to Cart button
          - Benefits row (100% Fresh, 20-min delivery, easy returns, secure UPI/COD)
          ========================================================================= */}
      {selectedProduct && selectedVariant && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-[420px] max-h-[92vh] rounded-3xl overflow-y-auto flex flex-col shadow-2xl relative">
            {/* Top Bar */}
            <div className="p-3 flex items-center justify-between border-b border-slate-100 sticky top-0 bg-white z-10">
              <button
                onClick={() => setSelectedProduct(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {selectedProduct.brand}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-600'
                    }`}
                  />
                </button>
                <button
                  onClick={() => {
                    setSelectedProduct(null);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 relative"
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Product Image Stage (Sharp, properly contained with gallery switcher) */}
            {(() => {
              const galleryImages = [
                selectedProduct.imageUrl,
                ...(selectedProduct.additionalImages || [])
              ];
              const activeDisplayUrl = galleryImages[pdpImageIdx] || selectedProduct.imageUrl;

              return (
                <div className="flex flex-col border-b border-slate-100 bg-slate-50">
                  <div className="w-full aspect-[4/3] flex items-center justify-center p-6">
                    <img
                      src={activeDisplayUrl}
                      alt={selectedProduct.name}
                      onError={e => handleImageError(e, selectedProduct.name)}
                      className="max-h-full max-w-full object-contain drop-shadow-sm transition-all duration-150"
                    />
                  </div>
                  {galleryImages.length > 1 && (
                    <div className="flex items-center justify-center gap-2 pb-3 px-4">
                      {galleryImages.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPdpImageIdx(idx)}
                          className={`w-11 h-11 rounded-xl overflow-hidden border-2 transition-all ${
                            pdpImageIdx === idx
                              ? 'border-emerald-600 scale-105 shadow-xs ring-2 ring-emerald-500/20'
                              : 'border-slate-200 opacity-60 hover:opacity-100 bg-white'
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt="thumbnail"
                            onError={e => handleImageError(e, 'thumb')}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Product Body */}
            <div className="p-4 flex-1">
              <div className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">
                {selectedProduct.categorySlug.toUpperCase()}
              </div>
              <h2 className="text-base font-extrabold text-slate-900 mt-0.5 leading-snug">
                {selectedProduct.name}
              </h2>

              {/* Rating & Stock */}
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                <span className="bg-emerald-600 text-white font-black text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  ★ {selectedProduct.rating}
                </span>
                <span>({selectedProduct.reviewCount} verified reviews)</span>
                <span>•</span>
                <span className="text-emerald-700 font-bold">
                  {selectedVariant.stockQty > 0
                    ? `In Stock (${selectedVariant.stockQty} left)`
                    : 'Out of Stock'}
                </span>
              </div>

              {/* Pack-size options displayed as selectable cards */}
              <div className="mt-4">
                <div className="text-xs font-bold text-slate-800 mb-2">Select Pack Size:</div>
                <div className="grid grid-cols-3 gap-2">
                  {selectedProduct.variants.map(v => {
                    const isSelected = selectedVariant.id === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        className={`p-2 rounded-xl text-center border-2 transition-all ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="text-[11px] font-bold text-slate-800">{v.packSize}</div>
                        <div className="text-xs font-black text-emerald-700 mt-0.5">₹{v.price}</div>
                        {v.mrp > v.price && (
                          <div className="text-[10px] text-slate-400 line-through">₹{v.mrp}</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price & Savings Display */}
              <div className="flex items-baseline gap-2 mt-4 pt-3 border-t border-slate-100">
                <span className="text-2xl font-black text-slate-900">₹{selectedVariant.price}</span>
                {selectedVariant.mrp > selectedVariant.price && (
                  <span className="text-sm text-slate-400 line-through">
                    ₹{selectedVariant.mrp}
                  </span>
                )}
                {selectedVariant.mrp > selectedVariant.price && (
                  <span className="bg-emerald-100 text-emerald-800 font-extrabold text-xs px-2 py-0.5 rounded">
                    Save ₹{selectedVariant.mrp - selectedVariant.price} (
                    {Math.round(((selectedVariant.mrp - selectedVariant.price) / selectedVariant.mrp) * 100)}
                    % OFF)
                  </span>
                )}
              </div>

              {/* Stepper and Prominent Green Add to Cart Button */}
              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center border-2 border-slate-200 rounded-xl overflow-hidden h-11 w-28 bg-slate-50">
                  <button
                    onClick={() => pdpQty > 1 && setPdpQty(pdpQty - 1)}
                    className="flex-1 h-full flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-black text-slate-900">{pdpQty}</span>
                  <button
                    onClick={() => pdpQty < 10 && setPdpQty(pdpQty + 1)}
                    className="flex-1 h-full flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200"
                  >
                    +
                  </button>
                </div>

                <button
                  disabled={selectedVariant.stockQty <= 0}
                  onClick={() => {
                    handleAddToCart(selectedProduct, selectedVariant, pdpQty);
                    setSelectedProduct(null);
                  }}
                  className={`flex-1 h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 ${
                    selectedVariant.stockQty <= 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {selectedVariant.stockQty <= 0 ? 'Out of Stock' : `Add to Cart • ₹${selectedVariant.price * pdpQty}`}
                  </span>
                </button>
              </div>

              {/* Highlights */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 mb-1">Product Description</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{selectedProduct.description}</p>
              </div>

              {/* Benefits Row */}
              <div className="grid grid-cols-4 gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl p-3 mt-4 text-center">
                <div className="flex flex-col items-center">
                  <span className="text-lg mb-1">🌿</span>
                  <span className="text-[9px] font-bold text-slate-700 leading-tight">100% Fresh Guarantee</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-lg mb-1">⚡</span>
                  <span className="text-[9px] font-bold text-slate-700 leading-tight">20-Min Delivery</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-lg mb-1">🛡️</span>
                  <span className="text-[9px] font-bold text-slate-700 leading-tight">Easy Returns</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-lg mb-1">💳</span>
                  <span className="text-[9px] font-bold text-slate-700 leading-tight">UPI & COD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CHECKOUT & BASKET MODAL
          ========================================================================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-[420px] max-h-[92vh] rounded-3xl overflow-y-auto flex flex-col shadow-2xl">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="text-sm font-extrabold text-slate-900">Your Basket & Checkout</h3>
              </div>
              <span className="text-xs font-bold text-emerald-600">
                {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div className="p-4 space-y-4 flex-1">
              {/* Cart items list */}
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {cartItemList.map(item => (
                  <div key={item.variantId} className="p-3 flex items-center justify-between gap-3">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      onError={e => handleImageError(e, item.name)}
                      className="w-12 h-12 object-cover rounded-lg border border-slate-100"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-500">{item.packSize}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-black text-emerald-700">₹{item.price}</span>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className="text-[10px] text-slate-400 line-through">₹{item.originalPrice}</span>
                        )}
                        {item.isFlashDeal && (
                          <span className="text-[9px] font-black uppercase bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded">
                            ⚡ {item.dealBadge || 'Flash Deal'}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Stepper */}
                    <div className="flex items-center bg-emerald-50 border border-emerald-200 rounded-lg overflow-hidden h-7">
                      <button
                        onClick={() => handleUpdateQty(item.variantId, item.qty - 1)}
                        className="w-6 h-full flex items-center justify-center font-bold text-emerald-800 hover:bg-emerald-100"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-xs font-black text-emerald-900">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(item.variantId, item.qty + 1)}
                        className="w-6 h-full flex items-center justify-center font-bold text-emerald-800 hover:bg-emerald-100"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Details */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Deliver To (Hospete)
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Customer Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full h-8 text-xs bg-white border border-slate-200 rounded px-2.5 mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Mobile Number</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full h-8 text-xs bg-white border border-slate-200 rounded px-2.5 mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Locality</label>
                  <select
                    value={selectedLocality.name}
                    onChange={e => {
                      const found = LOCALITIES.find(l => l.name === e.target.value);
                      if (found) setSelectedLocality(found);
                    }}
                    className="w-full h-8 text-xs bg-white border border-slate-200 rounded px-2 mt-0.5"
                  >
                    {LOCALITIES.map(loc => (
                      <option key={loc.name} value={loc.name}>
                        {loc.name} ({loc.distanceKm || 2.2} km • {loc.etaMinutes} mins{loc.distanceKm && loc.distanceKm > 5 ? ' • >5km Distance Surcharge' : ''})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Street Address</label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={e => setCustomerAddress(e.target.value)}
                    className="w-full h-8 text-xs bg-white border border-slate-200 rounded px-2.5 mt-0.5"
                  />
                </div>
              </div>

              {/* Payment selector */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                  Payment Mode
                </div>
                <div className="space-y-1.5">
                  {['UPI / PhonePe / GPay', 'Cash on Delivery (COD)'].map(mode => (
                    <label key={mode} className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === mode}
                        onChange={() => setPaymentMethod(mode)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{mode}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Bill Details */}
              <div className="border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs bg-white">
                <div className="flex justify-between text-slate-600">
                  <span>Items Subtotal</span>
                  <span>₹{cartSubtotal}</span>
                </div>
                {cartSavings > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount Savings</span>
                    <span>- ₹{cartSavings}</span>
                  </div>
                )}
                <div className="flex justify-between items-start text-slate-600">
                  <div>
                    <span>Delivery Fee</span>
                    {selectedLocality?.distanceKm && (
                      <span className="text-[10px] text-slate-400 block">
                        📍 {selectedLocality.name} ({selectedLocality.distanceKm} km from store)
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div>
                      {deliveryCalc.totalDeliveryFee === 0 ? (
                        <span className="text-emerald-700 font-bold">FREE</span>
                      ) : (
                        <span className="font-bold text-slate-900">₹{deliveryCalc.totalDeliveryFee}</span>
                      )}
                    </div>
                    {deliveryCalc.isBeyondBaseRadius && (
                      <div className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-0.5 inline-block">
                        +₹{deliveryCalc.distanceSurcharge} distance fee ({deliveryCalc.extraKm} km &gt; 5 km @ ₹{sysConfig.perKmSurchargeBeyond5Km}/km)
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between font-black text-slate-900 pt-2 border-t border-dashed border-slate-200 text-sm">
                  <span>Total Payable</span>
                  <span className="text-emerald-700 text-base">₹{grandTotal}</span>
                </div>
              </div>

              {checkoutError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{checkoutError}</span>
                </div>
              )}

              <button
                onClick={handlePlaceOrder}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <span>Place Order • ₹{grandTotal}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: ADMIN MANAGEMENT PORTAL (Full wide desktop layout)
          ========================================================================= */}
      {roleView === 'admin' && (
        <AdminPortal
          vendors={vendors}
          setVendors={setVendors}
          products={products}
          setProducts={setProducts}
          orders={orders}
          setOrders={setOrders}
          categories={allCategories}
          setCategories={setCategories}
          deliveryPartners={deliveryPartners}
          setDeliveryPartners={setDeliveryPartners}
          onOpenMobileApp={() => setRoleView('customer')}
          onOpenDeliverables={() => setRoleView('deliverables')}
          adminPreviewLogs={adminPreviewLogs}
          setAdminPreviewLogs={setAdminPreviewLogs}
          catalogAuditLogs={catalogAuditLogs}
          setCatalogAuditLogs={setCatalogAuditLogs}
          banners={banners}
          setBanners={setBanners}
          bannerSettings={bannerSettings}
          setBannerSettings={setBannerSettings}
          flashDeals={flashDeals}
          setFlashDeals={setFlashDeals}
          flashCampaign={flashCampaign}
          setFlashCampaign={setFlashCampaign}
          onPreviewProductInStore={(p) => {
            setSearchQuery(p.name);
            setRoleView('customer');
            setActiveTab('home');
          }}
          onSelectVendorToTest={(v, options) => {
            setAdminPreviewState({
              isPreview: true,
              vendorId: v.id,
              safeMode: options?.safeMode ?? true
            });
            setCurrentVendor(v);
            setRoleView('vendor');
          }}
        />
      )}

      {/* =========================================================================
          VIEW 3: VENDOR INVENTORY & ONBOARDING PORTAL (Full wide desktop layout)
          ========================================================================= */}
      {roleView === 'vendor' && (
        <VendorPortal
          vendors={vendors}
          setVendors={setVendors}
          products={products}
          setProducts={setProducts}
          orders={orders}
          setOrders={setOrders}
          currentVendor={currentVendor}
          setCurrentVendor={setCurrentVendor}
          flashDeals={flashDeals}
          setFlashDeals={setFlashDeals}
          flashCampaign={flashCampaign}
          onTestInMobileStore={() => setRoleView('customer')}
          categories={CATEGORIES}
          localities={LOCALITIES}
          isAdminPreview={adminPreviewState.isPreview}
          adminSafeMode={adminPreviewState.safeMode}
          onExitAdminPreview={() => {
            setAdminPreviewState({ isPreview: false, vendorId: null, safeMode: true });
            setRoleView('admin');
          }}
          onToggleAdminSafeMode={() => {
            setAdminPreviewState(prev => ({ ...prev, safeMode: !prev.safeMode }));
          }}
        />
      )}

      {/* =========================================================================
          VIEW 4: DELIVERY FLEET PARTNER CONSOLE (Full wide desktop layout)
          ========================================================================= */}
      {roleView === 'delivery' && activeDeliveryTrackingOrder ? (
        <DeliveryLocationTrackingScreen
          order={activeDeliveryTrackingOrder}
          onBack={() => setActiveDeliveryTrackingOrder(null)}
          onUpdateStatus={(newStatus) => {
            setOrders(prev =>
              prev.map(o => (o.id === activeDeliveryTrackingOrder.id ? { ...o, status: newStatus } : o))
            );
            setActiveDeliveryTrackingOrder(prev => (prev ? { ...prev, status: newStatus } : null));
          }}
        />
      ) : roleView === 'delivery' && (
        <DeliveryPortal
          orders={orders}
          setOrders={setOrders}
          deliveryPartners={deliveryPartners}
          setDeliveryPartners={setDeliveryPartners}
          onOpenNavigation={(ord) => setActiveDeliveryTrackingOrder(ord)}
          onBackToCustomer={() => setRoleView('customer')}
        />
      )}

      {/* =========================================================================
          VIEW 5: DELIVERABLES & DOWNLOAD CENTER
          ========================================================================= */}
      {roleView === 'deliverables' && (
        <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
          <div className="bg-gradient-to-r from-emerald-800 to-teal-700 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="max-w-2xl">
              <span className="inline-block bg-white/20 text-emerald-100 text-xs font-bold px-3 py-1 rounded-full mb-2">
                🎉 Project Deliverables Ready
              </span>
              <h1 className="text-2xl sm:text-3xl font-black leading-tight">
                Hospete Fresh - Updated Project Package
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100 mt-2">
                All HTML, CSS, JavaScript, SQLite database, and Python Flask route fixes have been implemented, tested, and bundled into a standalone ZIP file.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href="/hospete_fresh_updated.zip"
                  download="hospete_fresh_updated.zip"
                  className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-sm px-5 py-3 rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-98"
                >
                  <Download className="w-5 h-5" />
                  <span>Download hospete_fresh_updated.zip</span>
                </a>
                <button
                  onClick={() => setRoleView('customer')}
                  className="bg-white/20 hover:bg-white/30 text-white font-bold text-sm px-4 py-3 rounded-xl transition-colors"
                >
                  Preview Customer UI &rarr;
                </button>
              </div>
            </div>
          </div>

          {/* Key Fixes Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-emerald-600" />
              <span>Summary of Key Fixes Implemented</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 space-y-1.5">
                <div className="font-extrabold text-emerald-800 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>1. Product-Card ADD Button Root Cause Fixed</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Diagnosed conflicting rules where generic button classes forced white backgrounds with green text. Implemented high-specificity <code>.btn-add</code> with solid grocery green (<code>#16a34a</code>) background, white text/plus icon, rounded corners, active feedback, and disabled grey styling when stock is exhausted.
                </p>
              </div>

              <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 space-y-1.5">
                <div className="font-extrabold text-emerald-800 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>2. Customer Home Screen Reference Sequence</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Sequenced exact 10 steps: Delivery header with Hospete localities, search bar, HD promotional banner with coupon code HOSPETE30, 4 shortcuts (Offers, Best Sellers, Fresh Farm, Bulk Packs), Shop by Category, 4-col category tile grid, Today's Flash Deals, 2-col compact cards, fixed bottom nav, and floating basket summary.
                </p>
              </div>

              <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 space-y-1.5">
                <div className="font-extrabold text-emerald-800 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>3. Centered Mobile Shell vs Full Portals</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Customer view is framed in a 410px mobile preview on desktop monitors, adapting to 100% on actual mobile devices. Admin, Vendor, and Delivery partner screens use full-width desktop dashboard layouts without mobile constraints.
                </p>
              </div>

              <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 space-y-1.5">
                <div className="font-extrabold text-emerald-800 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>4. Product Details Dynamic Pack-Sizes & Zero Broken Images</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Pack sizes rendered as selectable cards that dynamically update selling price, MRP, discount badge, and stock. Fixed "Mixture Snacks" with authentic verified imagery and inline SVG data fallback so no broken image icons ever show.
                </p>
              </div>
            </div>
          </div>

          {/* PowerShell Commands */}
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-md space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400 font-sans border-b border-slate-800 pb-2">
              <span className="flex items-center gap-2 font-bold text-slate-200">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Windows PowerShell Commands to Run
              </span>
              <span className="text-[11px]">Python 3.10+ / Flask</span>
            </div>
            <pre className="text-emerald-400 overflow-x-auto p-2 bg-slate-950/60 rounded-lg">
{`# 1. Extract the downloaded hospete_fresh_updated.zip and open PowerShell in that folder:
cd hospete_fresh_flask

# 2. (Recommended) Create and activate a Python virtual environment:
python -m venv venv
.\\venv\\Scripts\\Activate.ps1

# 3. Install requirements (Flask):
pip install -r requirements.txt

# 4. Initialize the SQLite database with full Hospete catalog:
python init_db.py

# 5. Start the application:
python app.py`}
            </pre>
            <p className="text-slate-400 font-sans text-xs">
              Open <strong>http://127.0.0.1:5000/</strong> in your browser to experience the updated customer store, or visit <strong>/admin</strong> for the operations dashboard.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
