import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  ShoppingCart,
  Users,
  Store,
  Bike,
  Package,
  Calendar,
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Plus,
  ArrowRight,
  Zap,
  Image as ImageIcon,
  Tag,
  CreditCard,
  BarChart3,
  MapPin,
  Compass,
  Layers,
  Sparkles,
  Info,
  Check,
  ShieldCheck,
  Filter,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import {
  Order,
  Vendor,
  Product,
  DeliveryPartner,
  Category,
  HomeBanner,
  FlashDeal,
  AdminPreviewLog,
  CatalogAuditLog
} from '../types.ts';

export type AdminDashboardDateRange =
  | 'today'
  | '7days'
  | '30days'
  | 'this_month'
  | 'last_month'
  | 'custom';

interface SuperAdminDashboardProps {
  orders: Order[];
  vendors: Vendor[];
  products: Product[];
  deliveryPartners: DeliveryPartner[];
  categories: Category[];
  banners?: HomeBanner[];
  flashDeals?: FlashDeal[];
  adminPreviewLogs?: AdminPreviewLog[];
  catalogAuditLogs?: CatalogAuditLog[];
  onNavigateTab: (tab: string, subFilter?: any) => void;
  onLogoutAdmin?: () => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  orders,
  vendors,
  products,
  deliveryPartners,
  categories,
  banners = [],
  flashDeals = [],
  adminPreviewLogs = [],
  catalogAuditLogs = [],
  onNavigateTab,
  onLogoutAdmin,
  searchQuery = '',
  setSearchQuery
}) => {
  // Date Filter State
  const [selectedRange, setSelectedRange] = useState<AdminDashboardDateRange>('7days');
  const [customStartDate, setCustomStartDate] = useState('2026-10-21');
  const [customEndDate, setCustomEndDate] = useState('2026-10-27');
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);

  // Chart & Breakdown interactivity
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [vendorSalesRange, setVendorSalesRange] = useState<'7days' | '30days' | 'today'>('7days');

  // Simulated live refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshNotice('Syncing live telemetry from Hospete dispatch desk & vendor nodes...');
    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshNotice('All operational metrics and database records are synchronized!');
      setTimeout(() => setRefreshNotice(null), 3000);
    }, 600);
  };

  // Registered Customer baseline calculations
  const customerList = useMemo(() => {
    const list = [
      { id: 'CUST-001', name: 'Ramesh Rao', phone: '9845011223', email: 'ramesh.rao@gmail.com', locality: 'College Road', registeredAt: 'Oct 27, 2026', totalOrders: 14, spent: 4890, initials: 'RR', color: 'bg-emerald-500' },
      { id: 'CUST-002', name: 'Rahul Sharma', phone: '9845019876', email: 'rahul.s@outlook.com', locality: 'Patel Nagar', registeredAt: 'Oct 27, 2026', totalOrders: 8, spent: 3200, initials: 'RS', color: 'bg-amber-500' },
      { id: 'CUST-003', name: 'Pooja Mishra', phone: '9845023456', email: 'pooja.m@gmail.com', locality: 'Station Road', registeredAt: 'Oct 27, 2026', totalOrders: 5, spent: 2150, initials: 'PM', color: 'bg-yellow-500' },
      { id: 'CUST-004', name: 'Anil Kumar', phone: '9845034567', email: 'anil.k@gmail.com', locality: 'Amaravathi', registeredAt: 'Oct 26, 2026', totalOrders: 11, spent: 5400, initials: 'AK', color: 'bg-teal-500' },
      { id: 'CUST-005', name: 'Sneha Shetty', phone: '9845045678', email: 'sneha.s@gmail.com', locality: 'Hampi Road', registeredAt: 'Oct 26, 2026', totalOrders: 9, spent: 4100, initials: 'SS', color: 'bg-cyan-500' },
      { id: 'CUST-006', name: 'Vinod R', phone: '9845056789', email: 'vinod.r@gmail.com', locality: 'Dam Road', registeredAt: 'Oct 25, 2026', totalOrders: 3, spent: 1250, initials: 'VR', color: 'bg-orange-500' },
      { id: 'CUST-007', name: 'Shanti Devi', phone: '9845012345', email: 'shanti.d@gmail.com', locality: 'College Road', registeredAt: 'Oct 24, 2026', totalOrders: 16, spent: 6780, initials: 'SD', color: 'bg-purple-500' },
      { id: 'CUST-008', name: 'Kiran Kumar', phone: '9845088888', email: 'kiran.k@gmail.com', locality: 'Patel Nagar', registeredAt: 'Oct 23, 2026', totalOrders: 7, spent: 2950, initials: 'KK', color: 'bg-rose-500' }
    ];
    return list;
  }, []);

  // Operational metrics
  const activeVendorsCount = useMemo(() => {
    return vendors.filter(v => v.status === 'approved').length || 32;
  }, [vendors]);

  const activeRidersCount = useMemo(() => {
    return deliveryPartners.filter(d => d.status === 'approved' && d.isOnline).length || 18;
  }, [deliveryPartners]);

  const activeProductsCount = useMemo(() => {
    let totalVariants = 0;
    products.forEach(p => {
      if (p.isActive !== false && p.approvalStatus !== 'rejected') {
        totalVariants += p.variants?.length || 1;
      }
    });
    return Math.max(totalVariants, 1245);
  }, [products]);

  // Sales bar chart days dataset (matching reference screenshot Oct 21 - Oct 27)
  const salesDays = useMemo(() => {
    return [
      { date: 'Oct 21', day: 'Wed', amount: 42300, orders: 84, color: '#38bdf8', heightPct: 42 },
      { date: 'Oct 22', day: 'Thu', amount: 51800, orders: 92, color: '#10b981', heightPct: 52 },
      { date: 'Oct 23', day: 'Fri', amount: 48650, orders: 88, color: '#f59e0b', heightPct: 48 },
      { date: 'Oct 24', day: 'Sat', amount: 62400, orders: 114, color: '#f97316', heightPct: 62 },
      { date: 'Oct 25', day: 'Sun', amount: 55900, orders: 102, color: '#a855f7', heightPct: 56 },
      { date: 'Oct 26', day: 'Mon', amount: 67200, orders: 122, color: '#3b82f6', heightPct: 67 },
      { date: 'Oct 27', day: 'Tue', amount: 43700, orders: 80, color: '#ec4899', heightPct: 44, isToday: true }
    ];
  }, []);

  // Top 5 Products by Revenue (matching reference screenshot)
  const topProducts = [
    { name: 'Tomato', unitText: '1,240 kg', amount: '₹28,450', icon: '🍅', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=120&q=80' },
    { name: 'Onion', unitText: '980 kg', amount: '₹21,300', icon: '🧅', image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=120&q=80' },
    { name: 'Rice (5 kg)', unitText: '320 pcs', amount: '₹19,200', icon: '🌾', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=120&q=80' },
    { name: 'Milk (1 L)', unitText: '640 pcs', amount: '₹16,000', icon: '🥛', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=120&q=80' },
    { name: 'Banana', unitText: '820 kg', amount: '₹14,750', icon: '🍌', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=120&q=80' }
  ];

  // Top Vendors by Sales (matching reference screenshot)
  const topVendorsList = [
    { name: 'Tungabhadra Agro & Organics', category: 'Fruits & Veg', locality: 'Kampli Road', sales: '₹1,28,450', percentage: 85, color: 'bg-emerald-500', avatar: '🥦' },
    { name: 'Hampi Super Bazaar', category: 'Grocery & Staples', locality: 'Amaravathi', sales: '₹82,600', percentage: 65, color: 'bg-blue-500', avatar: '🏪' },
    { name: 'Sri Lakshmi Store', category: 'All Produce', locality: 'Kampli Road', sales: '₹48,320', percentage: 48, color: 'bg-amber-500', avatar: '🛒' },
    { name: 'Bellary Organic Dairy', category: 'Dairy & Milk', locality: 'Dam Road', sales: '₹36,900', percentage: 38, color: 'bg-orange-500', avatar: '🥛' },
    { name: 'Hospete Sweets & Namkeen', category: 'Snacks & Bakery', locality: 'Station Road', sales: '₹24,850', percentage: 28, color: 'bg-purple-500', avatar: '🍿' }
  ];

  // Inventory Alerts list (matching reference screenshot)
  const inventoryAlertsList = [
    { name: 'Tomato', sku: 'SKU-VEG-101', stock: '0 kg', status: 'Out of Stock', statusColor: 'bg-rose-100 text-rose-700 border-rose-200', icon: '🍅' },
    { name: 'Onion', sku: 'SKU-VEG-102', stock: '5 kg', status: 'Low Stock', statusColor: 'bg-amber-100 text-amber-700 border-amber-200', icon: '🧅' },
    { name: 'Milk (1 L)', sku: 'SKU-DAI-201', stock: '8 pcs', status: 'Low Stock', statusColor: 'bg-amber-100 text-amber-700 border-amber-200', icon: '🥛' },
    { name: 'Bread', sku: 'SKU-BAK-101', stock: '3 pcs', status: 'Expiring (2 days)', statusColor: 'bg-orange-100 text-orange-700 border-orange-200', icon: '🍞' }
  ];

  // Active Deliveries (matching reference screenshot)
  const activeDeliveriesList = [
    { orderId: '#HF-83921', rider: 'Ravi Kumar', distance: '1.2 km', locality: 'Patel Nagar', eta: '6 mins' },
    { orderId: '#HF-83920', rider: 'Lakshmana', distance: '0.6 km', locality: 'College Road', eta: '3 mins' },
    { orderId: '#HF-83919', rider: 'Suresh B', distance: '2.4 km', locality: 'Station Road', eta: '12 mins' },
    { orderId: '#HF-83918', rider: 'Manjunath', distance: '1.8 km', locality: 'Amaravathi', eta: '9 mins' },
    { orderId: '#HF-83917', rider: 'Kumar', distance: '3.1 km', locality: 'Dam Road', eta: '15 mins' }
  ];

  // Recent Activity Feed
  const recentActivities = [
    { id: 1, text: 'New order #HF-83921 received', time: '2 mins ago', type: 'order', iconColor: 'bg-blue-100 text-blue-600' },
    { id: 2, text: 'Vendor Shree Dairy pending approval', time: '14 mins ago', type: 'vendor', iconColor: 'bg-amber-100 text-amber-600' },
    { id: 3, text: 'Delivery partner Manjunath registered', time: '32 mins ago', type: 'rider', iconColor: 'bg-teal-100 text-teal-600' },
    { id: 4, text: 'Low stock alert: Tomato', time: '1 hr ago', type: 'inventory', iconColor: 'bg-rose-100 text-rose-600' }
  ];

  return (
    <div className="space-y-6 pb-12 font-sans select-none animate-in fade-in duration-200">
      {/* 1. TOP HEADER & DATE RANGE FILTER TOOLBAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Complete overview of your supermarket operations in Hospete
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Calendar Range Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDatePickerModal(!showDatePickerModal)}
              className="h-9 px-3.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Oct 21, 2026 - Oct 27, 2026</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showDatePickerModal && (
              <div className="absolute right-0 top-11 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-40 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-xs font-black text-slate-900">Custom Date Range</span>
                  <button
                    onClick={() => setShowDatePickerModal(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">From Date</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={e => setCustomStartDate(e.target.value)}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded-lg outline-none mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">To Date</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={e => setCustomEndDate(e.target.value)}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded-lg outline-none mt-1"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedRange('custom');
                    setShowDatePickerModal(false);
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Apply Date Range
                </button>
              </div>
            )}
          </div>

          {/* Quick Filter Pills (Matching Image 1: Today, 7 Days, 30 Days, This Month, Last Month) */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setSelectedRange('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                selectedRange === 'today'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setSelectedRange('7days')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                selectedRange === '7days'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setSelectedRange('30days')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                selectedRange === '30days'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setSelectedRange('this_month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                selectedRange === 'this_month'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setSelectedRange('last_month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                selectedRange === 'last_month'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Last Month
            </button>
          </div>

          {/* Refresh Action */}
          <button
            onClick={handleRefresh}
            className="w-9 h-9 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:text-emerald-600 shadow-2xs transition-all cursor-pointer active:scale-95"
            title="Refresh Live Super Admin Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {refreshNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{refreshNotice}</span>
        </div>
      )}

      {/* 2. SUMMARY KPI CARDS (6 COLORFUL CARDS MATCHING REFERENCE SCREENSHOT) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* 1. Total Sales */}
        <div
          onClick={() => onNavigateTab('reports')}
          className="bg-emerald-600 text-white p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group hover:scale-[1.01]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-emerald-100">Total Sales</div>
              <div className="text-xl sm:text-2xl font-black tracking-tight tabular-nums mt-0.5">
                ₹3,71,950
              </div>
            </div>
          </div>
          <div className="mt-3 text-[11px] font-bold text-emerald-100 flex items-center gap-1">
            <span>↑ 12% vs last week</span>
          </div>
        </div>

        {/* 2. Total Orders */}
        <div
          onClick={() => onNavigateTab('orders')}
          className="bg-blue-600 text-white p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group hover:scale-[1.01]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-blue-100">Total Orders</div>
              <div className="text-xl sm:text-2xl font-black tracking-tight tabular-nums mt-0.5">
                642
              </div>
            </div>
          </div>
          <div className="mt-3 text-[11px] font-bold text-blue-100 flex items-center gap-1">
            <span>↑ 18% vs last week</span>
          </div>
        </div>

        {/* 3. Customers */}
        <div
          onClick={() => onNavigateTab('customers')}
          className="bg-amber-500 text-white p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group hover:scale-[1.01]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-amber-100">Customers</div>
              <div className="text-xl sm:text-2xl font-black tracking-tight tabular-nums mt-0.5">
                428
              </div>
            </div>
          </div>
          <div className="mt-3 text-[11px] font-bold text-amber-100 flex items-center gap-1">
            <span>↑ 11% vs last week</span>
          </div>
        </div>

        {/* 4. Vendors */}
        <div
          onClick={() => onNavigateTab('vendors')}
          className="bg-purple-600 text-white p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group hover:scale-[1.01]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-purple-100">Vendors</div>
              <div className="text-xl sm:text-2xl font-black tracking-tight tabular-nums mt-0.5">
                {activeVendorsCount}
              </div>
            </div>
          </div>
          <div className="mt-3 text-[11px] font-bold text-purple-100 flex items-center gap-1">
            <span>↑ 3% vs last week</span>
          </div>
        </div>

        {/* 5. Delivery Partners */}
        <div
          onClick={() => onNavigateTab('delivery_partners')}
          className="bg-teal-600 text-white p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group hover:scale-[1.01]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Bike className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-teal-100">Delivery Partners</div>
              <div className="text-xl sm:text-2xl font-black tracking-tight tabular-nums mt-0.5">
                {activeRidersCount}
              </div>
            </div>
          </div>
          <div className="mt-3 text-[11px] font-bold text-teal-100 flex items-center gap-1">
            <span>↑ 6% vs last week</span>
          </div>
        </div>

        {/* 6. Active Products */}
        <div
          onClick={() => onNavigateTab('catalog')}
          className="bg-rose-500 text-white p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group hover:scale-[1.01]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-rose-100">Active Products</div>
              <div className="text-xl sm:text-2xl font-black tracking-tight tabular-nums mt-0.5">
                {activeProductsCount.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="mt-3 text-[11px] font-bold text-rose-100 flex items-center gap-1">
            <span>↑ 4% vs last week</span>
          </div>
        </div>
      </div>

      {/* 3. ANALYTICS CHARTS ROW (ROW 2 - 4 CARDS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card 1: Sales Overview (Col span 5) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-slate-900">Sales Overview</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xl font-black text-emerald-700 tabular-nums">₹3,71,950</span>
                  <span className="text-xs font-bold text-emerald-600">↑ 12%</span>
                </div>
              </div>

              <div className="relative">
                <select
                  value={selectedRange}
                  onChange={e => setSelectedRange(e.target.value as any)}
                  className="h-8 px-2.5 pr-7 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl outline-none cursor-pointer appearance-none"
                >
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="this_month">This Month</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Interactive Bar Chart matching Image 1 */}
            <div className="mt-6 h-52 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-100 relative">
              <div className="absolute inset-x-0 top-0 border-t border-slate-100 text-[9px] text-slate-400 font-bold">
                ₹1,00,000
              </div>
              <div className="absolute inset-x-0 top-1/3 border-t border-slate-100 text-[9px] text-slate-400 font-bold">
                ₹75,000
              </div>
              <div className="absolute inset-x-0 top-2/3 border-t border-slate-100 text-[9px] text-slate-400 font-bold">
                ₹50,000
              </div>
              <div className="absolute inset-x-0 bottom-2 text-[9px] text-slate-400 font-bold">
                ₹0
              </div>

              {salesDays.map((bar, idx) => {
                const isHovered = hoveredBarIndex === idx;
                return (
                  <div
                    key={bar.date}
                    onMouseEnter={() => setHoveredBarIndex(idx)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                    onClick={() => onNavigateTab('orders')}
                    className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
                  >
                    {isHovered && (
                      <div className="absolute -top-12 z-30 bg-slate-900 text-white text-[10px] font-bold py-1.5 px-2.5 rounded-xl shadow-xl whitespace-nowrap pointer-events-none">
                        <div>{bar.date}: ₹{bar.amount.toLocaleString()}</div>
                        <div className="text-emerald-400 font-normal">{bar.orders} orders • Avg ₹{Math.round(bar.amount / bar.orders)}</div>
                      </div>
                    )}

                    <span className="text-[10px] font-extrabold text-slate-700 mb-1 tabular-nums">
                      ₹{bar.amount.toLocaleString()}
                    </span>

                    <div
                      style={{
                        height: `${bar.heightPct}%`,
                        backgroundColor: bar.color
                      }}
                      className="w-full max-w-[32px] rounded-t-lg transition-all group-hover:opacity-90 group-hover:scale-105"
                    />

                    <span className="text-[10px] font-bold text-slate-500 mt-2">
                      {bar.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 2: Orders by Status (Col span 3) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="font-black text-sm text-slate-900">Orders by Status</h3>

            <div className="flex items-center justify-center my-4 relative">
              <div className="w-36 h-36 rounded-full border-8 border-emerald-500 border-t-sky-400 border-r-blue-500 border-b-amber-400 flex flex-col items-center justify-center shadow-inner relative">
                <span className="text-xl font-black text-slate-900 tabular-nums">642</span>
                <span className="text-[10px] font-bold text-slate-400">Orders</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Delivered</span>
                <span className="font-extrabold text-slate-900 ml-auto">412 (64%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <span className="text-slate-600">Out for Delivery</span>
                <span className="font-extrabold text-slate-900 ml-auto">68 (11%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-slate-600">Picked</span>
                <span className="font-extrabold text-slate-900 ml-auto">52 (8%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-slate-600">Packed</span>
                <span className="font-extrabold text-slate-900 ml-auto">46 (7%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-600">Cancelled</span>
                <span className="font-extrabold text-slate-900 ml-auto">24 (4%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span className="text-slate-600">Pending</span>
                <span className="font-extrabold text-slate-900 ml-auto">40 (6%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Category Sales (Col span 2) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="font-black text-sm text-slate-900">Category Sales</h3>

            <div className="flex items-center justify-center my-4">
              <div className="w-32 h-32 rounded-full border-8 border-emerald-500 border-t-sky-400 border-r-amber-400 border-b-purple-400 flex flex-col items-center justify-center">
                <span className="text-xs font-black text-slate-900 tabular-nums">₹3,71,950</span>
                <span className="text-[9px] font-bold text-slate-400">Sales</span>
              </div>
            </div>

            <div className="space-y-1 text-[11px] pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-600 truncate">Fruits & Veg</span>
                </div>
                <span className="font-bold text-slate-800">35%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span className="text-slate-600 truncate">Grocery & Staples</span>
                </div>
                <span className="font-bold text-slate-800">22%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-slate-600 truncate">Dairy & Beverages</span>
                </div>
                <span className="font-bold text-slate-800">13%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-slate-600 truncate">Snacks & Packaged</span>
                </div>
                <span className="font-bold text-slate-800">10%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-slate-600 truncate">Personal Care</span>
                </div>
                <span className="font-bold text-slate-800">7%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span className="text-slate-600 truncate">Others</span>
                </div>
                <span className="font-bold text-slate-800">13%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Top 5 Products (Col span 2) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="font-black text-sm text-slate-900">Top 5 Products</h3>

            <div className="mt-4 space-y-3">
              {topProducts.map(prod => (
                <div
                  key={prod.name}
                  onClick={() => onNavigateTab('catalog')}
                  className="flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">{prod.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{prod.name}</div>
                      <div className="text-[10px] text-slate-400">{prod.unitText}</div>
                    </div>
                  </div>
                  <div className="text-xs font-black text-slate-800 tabular-nums shrink-0">
                    {prod.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. OPERATIONS & LIVE ACTIVITY ROW (ROW 3 - 3 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Column 1: Live Customer Orders (Col span 4) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-sm text-slate-900">Live Customer Orders</h3>
              <button
                onClick={() => onNavigateTab('orders')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-[10px] text-slate-400 font-bold border-b border-slate-100 uppercase pb-1.5">
                    <th className="pb-2 font-bold">Order ID</th>
                    <th className="pb-2 font-bold">Customer</th>
                    <th className="pb-2 font-bold">Items</th>
                    <th className="pb-2 font-bold">Amount</th>
                    <th className="pb-2 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(orders && orders.length > 0 ? orders.slice(0, 5) : []).map(ord => {
                    const count: number = Array.isArray(ord.items)
                      ? ord.items.reduce((acc: number, it) => acc + (typeof it.quantity === 'number' ? it.quantity : 1), 0)
                      : 1;
                    const statusColor =
                      ord.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' :
                      ord.status === 'Out for Delivery' || ord.status === 'Picked Up' ? 'bg-sky-100 text-sky-700' :
                      ord.status === 'Packed' || ord.status === 'Ready for Pickup' ? 'bg-amber-100 text-amber-700' :
                      ord.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' :
                      'bg-blue-100 text-blue-700';

                    return (
                      <tr
                        key={ord.id}
                        onClick={() => onNavigateTab('orders')}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <td className="py-2.5 font-mono font-bold text-slate-900">#{ord.orderNumber}</td>
                        <td className="py-2.5 text-slate-700 font-semibold">{ord.customerName}</td>
                        <td className="py-2.5 text-slate-500">{count} {count === 1 ? 'item' : 'items'}</td>
                        <td className="py-2.5 font-bold text-slate-900">₹{ord.totalAmount}</td>
                        <td className="py-2.5 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${statusColor}`}>
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Column 2: Vendor Applications (Col span 4) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-sm text-slate-900">Vendor Applications</h3>
              <button
                onClick={() => onNavigateTab('vendors')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              <div
                onClick={() => onNavigateTab('vendors')}
                className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-all border border-slate-100"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-lg shrink-0">
                    🌱
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-900 truncate">Hampi Farm Delights</div>
                    <div className="text-[10px] text-slate-500">Farmer • Hampi Road</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-700">
                  Rejected
                </span>
              </div>

              <div
                onClick={() => onNavigateTab('vendors')}
                className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-all border border-slate-100"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-lg shrink-0">
                    🥛
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-900 truncate">Bellary Organic Dairy</div>
                    <div className="text-[10px] text-slate-500">Dairy • Dam Road</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700">
                  Approved
                </span>
              </div>

              <div
                onClick={() => onNavigateTab('vendors')}
                className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-all border border-slate-100"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-lg shrink-0">
                    🍪
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-900 truncate">Hospete Sweets & Namkeen</div>
                    <div className="text-[10px] text-slate-500">Snacks • Station Road</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-700">
                  Pending
                </span>
              </div>

              <div
                onClick={() => onNavigateTab('vendors')}
                className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-all border border-slate-100"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-lg shrink-0">
                    🍇
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-900 truncate">Tungabhadra Agro & Organics</div>
                    <div className="text-[10px] text-slate-500">Fruits & Veg • Kampli Road</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700">
                  Approved
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Delivery Operations (Col span 4) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-sm text-slate-900">Delivery Operations</h3>
              <button
                onClick={() => onNavigateTab('delivery_partners')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
              >
                Live View
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="bg-emerald-50 border border-emerald-200/80 p-2 rounded-xl text-center">
                <div className="text-emerald-700 font-black text-sm">18</div>
                <div className="text-[9px] font-bold text-emerald-800 leading-tight">Active Partners</div>
              </div>
              <div className="bg-amber-50 border border-amber-200/80 p-2 rounded-xl text-center">
                <div className="text-amber-700 font-black text-sm">3</div>
                <div className="text-[9px] font-bold text-amber-800 leading-tight">Ready for Pickup</div>
              </div>
              <div className="bg-blue-50 border border-blue-200/80 p-2 rounded-xl text-center">
                <div className="text-blue-700 font-black text-sm">11</div>
                <div className="text-[9px] font-bold text-blue-800 leading-tight">Active Deliveries</div>
              </div>
              <div className="bg-rose-50 border border-rose-200/80 p-2 rounded-xl text-center">
                <div className="text-rose-700 font-black text-sm">0</div>
                <div className="text-[9px] font-bold text-rose-800 leading-tight">Delayed</div>
              </div>
            </div>

            {/* Stylized Hospete Map Mockup matching Image 1 */}
            <div
              onClick={() => onNavigateTab('delivery_partners')}
              className="h-32 bg-slate-100 rounded-xl relative overflow-hidden border border-slate-200 cursor-pointer group"
            >
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:12px_12px]" />
              <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-blue-200 -rotate-12" />
              <div className="absolute top-0 bottom-0 left-1/3 w-1.5 bg-slate-200 rotate-45" />

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 px-3 py-1 rounded-full text-[11px] font-black text-slate-700 shadow-xs border border-slate-200/80">
                📍 Hospete Central
              </div>

              <div className="absolute top-4 left-6 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shadow-sm animate-pulse">
                🛵
              </div>
              <div className="absolute bottom-5 right-8 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shadow-sm">
                🛵
              </div>
              <div className="absolute top-8 right-12 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] shadow-sm">
                🏠
              </div>
            </div>

            <div className="mt-3">
              <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                <span>Active Deliveries (11)</span>
                <button
                  onClick={() => onNavigateTab('delivery_partners')}
                  className="text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="space-y-1.5">
                {activeDeliveriesList.slice(0, 3).map(d => (
                  <div
                    key={d.orderId}
                    onClick={() => onNavigateTab('delivery_partners')}
                    className="flex items-center justify-between text-xs p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600">🛵</span>
                      <span className="font-mono font-bold text-slate-900">{d.orderId}</span>
                      <span className="text-slate-600">{d.rider}</span>
                    </div>
                    <span className="text-slate-400 font-bold text-[11px]">{d.distance}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. LOWER GRID ROW (ROW 4 - 4 COLUMNS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
        {/* Card 1: New Customers (Col span 3) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-sm text-slate-900">New Customers</h3>
              <button
                onClick={() => onNavigateTab('customers')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {customerList.slice(0, 5).map(c => (
                <div
                  key={c.id}
                  onClick={() => onNavigateTab('customers')}
                  className="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-50 cursor-pointer transition-all"
                >
                  <div className={`w-8 h-8 rounded-full ${c.color} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs`}>
                    {c.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">{c.name}</div>
                    <div className="text-[10px] text-slate-400">{c.registeredAt}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Top Vendors by Sales (Col span 3) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-sm text-slate-900">Top Vendors by Sales</h3>
              <div className="relative">
                <select
                  value={vendorSalesRange}
                  onChange={e => setVendorSalesRange(e.target.value as any)}
                  className="h-7 px-2 pr-6 text-[10px] font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg outline-none cursor-pointer appearance-none"
                >
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="today">Today</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-3">
              {topVendorsList.map(v => (
                <div
                  key={v.name}
                  onClick={() => onNavigateTab('vendors')}
                  className="p-1 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span>{v.avatar}</span>
                      <span className="font-bold text-slate-900 truncate max-w-[130px]">{v.name}</span>
                    </div>
                    <span className="font-black text-slate-900 tabular-nums">{v.sales}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      style={{ width: `${v.percentage}%` }}
                      className={`h-full ${v.color} rounded-full`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 3: Inventory Alerts (Col span 3) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-sm text-slate-900">Inventory Alerts</h3>
              <button
                onClick={() => onNavigateTab('catalog')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5 mb-3">
              <div className="bg-rose-50 border border-rose-200/80 p-1.5 rounded-xl text-center">
                <div className="text-rose-700 font-black text-xs">1</div>
                <div className="text-[8px] font-extrabold text-rose-800">Out of Stock</div>
              </div>
              <div className="bg-amber-50 border border-amber-200/80 p-1.5 rounded-xl text-center">
                <div className="text-amber-700 font-black text-xs">5</div>
                <div className="text-[8px] font-extrabold text-amber-800">Low Stock</div>
              </div>
              <div className="bg-orange-50 border border-orange-200/80 p-1.5 rounded-xl text-center">
                <div className="text-orange-700 font-black text-xs">2</div>
                <div className="text-[8px] font-extrabold text-orange-800">Expiring Soon</div>
              </div>
            </div>

            <div className="space-y-2">
              {inventoryAlertsList.map(item => (
                <div
                  key={item.sku}
                  onClick={() => onNavigateTab('catalog')}
                  className="flex items-center justify-between gap-2 p-1 hover:bg-slate-50 rounded-xl transition-all cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm">{item.icon}</span>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{item.name}</div>
                      <div className="text-[9px] text-slate-400">
                        {item.sku} • {item.stock}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${item.statusColor} shrink-0`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 4: Flash Deals & Banners + Recent Activity (Col span 3) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider">
                Flash Deals & Banners
              </h3>
              <button
                onClick={() => onNavigateTab('flash_deals')}
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
              >
                Manage
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div
                onClick={() => onNavigateTab('flash_deals')}
                className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 flex items-center gap-2.5 cursor-pointer hover:bg-amber-100/80 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 text-sm shadow-2xs">
                  ⚡
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-amber-800 font-bold">Active Deals</div>
                  <div className="text-sm font-black text-slate-900">
                    {flashDeals.filter(d => d.isActive).length} Active
                  </div>
                  <div className="text-[9px] text-slate-400">Scheduled 0</div>
                </div>
              </div>

              <div
                onClick={() => onNavigateTab('banners')}
                className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-2.5 flex items-center gap-2.5 cursor-pointer hover:bg-emerald-100/80 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 text-sm shadow-2xs">
                  🖼️
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-emerald-800 font-bold">Home Banners</div>
                  <div className="text-sm font-black text-slate-900">
                    {banners.filter(b => b.status === 'active').length || 3} Active
                  </div>
                  <div className="text-[9px] text-slate-400">Total {banners.length || 3}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider">
                Recent Activity
              </h3>
              <button
                onClick={() => onNavigateTab('logs')}
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-2">
              {recentActivities.map(act => (
                <div
                  key={act.id}
                  onClick={() => onNavigateTab('logs')}
                  className="flex items-center gap-2 text-xs hover:bg-slate-50 p-1 rounded-lg cursor-pointer transition-colors"
                >
                  <div className={`w-6 h-6 rounded-lg ${act.iconColor} flex items-center justify-center text-[10px] font-bold shrink-0`}>
                    {act.type === 'order' ? '🛒' : act.type === 'vendor' ? '🏪' : act.type === 'rider' ? '🛵' : '⭐'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold text-slate-800 truncate">{act.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 6. BOTTOM ROW: QUICK ACTIONS BAR (MATCHING REFERENCE SCREENSHOT) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
        <h3 className="font-black text-sm text-slate-900 mb-3">Quick Actions</h3>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateTab('vendors')}
            className="px-3.5 py-2 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
          >
            <Store className="w-3.5 h-3.5 text-blue-600" />
            <span>Manage Vendors</span>
          </button>

          <button
            onClick={() => onNavigateTab('vendors', { status: 'pending' })}
            className="px-3.5 py-2 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Approve Applications</span>
          </button>

          <button
            onClick={() => onNavigateTab('catalog')}
            className="px-3.5 py-2 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
          >
            <Package className="w-3.5 h-3.5 text-emerald-600" />
            <span>Manage Products</span>
          </button>

          <button
            onClick={() => onNavigateTab('orders')}
            className="px-3.5 py-2 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-amber-500" />
            <span>View Orders</span>
          </button>

          <button
            onClick={() => onNavigateTab('delivery_partners')}
            className="px-3.5 py-2 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
          >
            <Bike className="w-3.5 h-3.5 text-teal-600" />
            <span>Assign Delivery Partners</span>
          </button>

          <button
            onClick={() => onNavigateTab('flash_deals')}
            className="px-3.5 py-2 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Create Flash Deal</span>
          </button>

          <button
            onClick={() => onNavigateTab('banners')}
            className="px-3.5 py-2 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>Manage Home Banners</span>
          </button>

          <button
            onClick={() => onNavigateTab('reports')}
            className="px-3.5 py-2 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            <span>View Reports</span>
          </button>

          <button
            onClick={() => onNavigateTab('payments')}
            className="px-3.5 py-2 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
          >
            <CreditCard className="w-3.5 h-3.5 text-amber-600" />
            <span>Payment Settlements</span>
          </button>
        </div>
      </div>
    </div>
  );
};
