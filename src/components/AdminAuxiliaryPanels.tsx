import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  ShoppingBag,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Package,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Tag,
  Percent,
  Plus,
  CreditCard,
  DollarSign,
  BarChart3,
  Download,
  Star,
  Bell,
  Shield,
  UserCheck,
  Settings,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Info,
  Eye,
  Printer,
  X,
  FileText,
  Check,
  Navigation,
  Compass,
  SlidersHorizontal
} from 'lucide-react';
import { Product, Vendor, Order, DeliveryPartner } from '../types.ts';
import {
  getSystemConfig,
  saveSystemConfig,
  calculateDeliveryFee,
  calculateCommission,
  DEFAULT_SYSTEM_CONFIG,
  SystemConfig,
  SYSTEM_CONFIG_EVENT
} from '../utils/systemConfig.ts';

interface AuxiliaryPanelProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  vendors: Vendor[];
  orders: Order[];
  deliveryPartners: DeliveryPartner[];
  onNavigateTab: (tab: string) => void;
}

// 1. CUSTOMERS MANAGEMENT PANEL
export const AdminCustomersPanel: React.FC<AuxiliaryPanelProps> = ({ orders, onNavigateTab }) => {
  const [custSearch, setCustSearch] = useState('');
  const [filterLocality, setFilterLocality] = useState('all');

  const customers = [
    { id: 'CUST-001', name: 'Ramesh Rao', phone: '+91 98450 11223', email: 'ramesh.rao@gmail.com', locality: 'College Road', address: '#42, College Road, Near Govt College, Hospete', ordersCount: 14, spent: 4890, registered: '12 Oct 2026', status: 'Active', initials: 'RR', color: 'bg-emerald-500' },
    { id: 'CUST-002', name: 'Rahul Sharma', phone: '+91 98450 19876', email: 'rahul.s@outlook.com', locality: 'Patel Nagar', address: '#18, Patel Nagar 2nd Cross, Hospete', ordersCount: 8, spent: 3200, registered: '27 Oct 2026', status: 'New', initials: 'RS', color: 'bg-amber-500' },
    { id: 'CUST-003', name: 'Pooja Mishra', phone: '+91 98450 23456', email: 'pooja.m@gmail.com', locality: 'Station Road', address: '#77, Station Road, Hospete', ordersCount: 5, spent: 2150, registered: '27 Oct 2026', status: 'New', initials: 'PM', color: 'bg-yellow-500' },
    { id: 'CUST-004', name: 'Anil Kumar', phone: '+91 98450 34567', email: 'anil.k@gmail.com', locality: 'Amaravathi', address: '#102, Near Bus Stand, Amaravathi', ordersCount: 11, spent: 5400, registered: '26 Oct 2026', status: 'VIP', initials: 'AK', color: 'bg-teal-500' },
    { id: 'CUST-005', name: 'Sneha Shetty', phone: '+91 98450 45678', email: 'sneha.s@gmail.com', locality: 'Hampi Road', address: '#5, Hampi Main Road, Hospete', ordersCount: 9, spent: 4100, registered: '26 Oct 2026', status: 'Active', initials: 'SS', color: 'bg-cyan-500' },
    { id: 'CUST-006', name: 'Vinod R', phone: '+91 98450 56789', email: 'vinod.r@gmail.com', locality: 'Dam Road', address: '#33, TB Dam Colony, Hospete', ordersCount: 3, spent: 1250, registered: '25 Oct 2026', status: 'Active', initials: 'VR', color: 'bg-orange-500' },
    { id: 'CUST-007', name: 'Shanti Devi', phone: '+91 98450 12345', email: 'shanti.d@gmail.com', locality: 'College Road', address: '#18, Station Road near KSRTC, Station Road', ordersCount: 16, spent: 6780, registered: '24 Oct 2026', status: 'VIP', initials: 'SD', color: 'bg-purple-500' },
    { id: 'CUST-008', name: 'Kiran Kumar', phone: '+91 98450 88888', email: 'kiran.k@gmail.com', locality: 'Patel Nagar', address: '#89, 4th Main, Patel Nagar, Hospete', ordersCount: 7, spent: 2950, registered: '23 Oct 2026', status: 'Active', initials: 'KK', color: 'bg-rose-500' }
  ];

  const filtered = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(custSearch.toLowerCase()) || c.phone.includes(custSearch) || c.email.toLowerCase().includes(custSearch.toLowerCase());
    const matchesLoc = filterLocality === 'all' || c.locality === filterLocality;
    return matchesSearch && matchesLoc;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900">Customer Directory & Accounts</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage 428 registered grocery shoppers across Hospete municipal localities</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer name, phone, email..."
              value={custSearch}
              onChange={e => setCustSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium w-64 outline-none focus:bg-white focus:border-emerald-500"
            />
          </div>
          <select
            value={filterLocality}
            onChange={e => setFilterLocality(e.target.value)}
            className="text-xs font-bold p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
          >
            <option value="all">All Localities</option>
            <option value="College Road">College Road</option>
            <option value="Patel Nagar">Patel Nagar</option>
            <option value="Station Road">Station Road</option>
            <option value="Amaravathi">Amaravathi</option>
            <option value="Dam Road">Dam Road</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4">Phone & Locality</th>
                <th className="p-4">Orders</th>
                <th className="p-4">Total Spent</th>
                <th className="p-4">Registered Date</th>
                <th className="p-4">Tier</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ${c.color} text-white font-bold text-xs flex items-center justify-center shrink-0`}>
                        {c.initials}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-[10px] text-slate-400">{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-700">{c.phone}</div>
                    <div className="text-[10px] text-slate-400">📍 {c.locality}</div>
                  </td>
                  <td className="p-4 font-bold text-slate-900">{c.ordersCount} orders</td>
                  <td className="p-4 font-black text-emerald-700">₹{c.spent.toLocaleString()}</td>
                  <td className="p-4 text-slate-500">{c.registered}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      c.status === 'VIP' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                      c.status === 'New' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => onNavigateTab('orders')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-600 hover:text-white rounded-lg text-[11px] font-bold text-slate-700 transition-colors cursor-pointer"
                    >
                      View Orders &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 2. INVENTORY & STOCK MANAGEMENT PANEL
export const AdminInventoryPanel: React.FC<AuxiliaryPanelProps> = ({ products, setProducts, onNavigateTab }) => {
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'out_of_stock' | 'low_stock' | 'in_stock'>('all');

  const allVariants = products.flatMap(p =>
    (p.variants || []).map(v => ({
      ...v,
      productName: p.name,
      productId: p.id,
      categorySlug: p.categorySlug,
      sku: p.sku || `SKU-${v.id}`,
      brand: p.brand
    }))
  );

  const outOfStockCount = allVariants.filter(v => v.stockQty <= 0).length;
  const lowStockCount = allVariants.filter(v => v.stockQty > 0 && v.stockQty <= 5).length;
  const inStockCount = allVariants.filter(v => v.stockQty > 5).length;

  const filtered = allVariants.filter(v => {
    if (stockStatusFilter === 'out_of_stock') return v.stockQty <= 0;
    if (stockStatusFilter === 'low_stock') return v.stockQty > 0 && v.stockQty <= 5;
    if (stockStatusFilter === 'in_stock') return v.stockQty > 5;
    return true;
  });

  const handleRestock = (productId: number, variantId: number) => {
    fetch('/api/inventory/restock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendorId: 1, productId, variantId, quantity: 50 })
    }).catch(() => {});

    setProducts(prev =>
      prev.map(p =>
        p.id === productId
          ? {
              ...p,
              variants: p.variants.map(v => (v.id === variantId ? { ...v, stockQty: (v.stockQty || 0) + 50 } : v))
            }
          : p
      )
    );
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setStockStatusFilter('out_of_stock')}
          className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs cursor-pointer hover:bg-rose-50/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Out of Stock</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-700 mt-2">{outOfStockCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Critical items requiring immediate vendor restocking</p>
        </div>

        <div
          onClick={() => setStockStatusFilter('low_stock')}
          className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs cursor-pointer hover:bg-amber-50/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Low Stock (≤ 5 units)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">{lowStockCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Produce running low across Hospete vendors</p>
        </div>

        <div
          onClick={() => setStockStatusFilter('in_stock')}
          className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs cursor-pointer hover:bg-emerald-50/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Healthy Stock (&gt; 5)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">{inStockCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Available variants ready for instant delivery</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-black text-sm text-slate-900">Live Variant Stock Level Registry</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setStockStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold ${stockStatusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              All ({allVariants.length})
            </button>
            <button
              onClick={() => setStockStatusFilter('out_of_stock')}
              className={`px-3 py-1 rounded-lg text-xs font-bold ${stockStatusFilter === 'out_of_stock' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              Out of Stock ({outOfStockCount})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-4">SKU / Item</th>
                <th className="p-4">Pack Size</th>
                <th className="p-4">Price</th>
                <th className="p-4">Current Stock</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Quick Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(v => (
                <tr key={`${v.productId}-${v.id}`} className="hover:bg-slate-50/70">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{v.productName}</div>
                    <div className="text-[10px] text-slate-400">{v.sku} • {v.brand}</div>
                  </td>
                  <td className="p-4 font-semibold text-slate-700">{v.packSize}</td>
                  <td className="p-4 font-black text-emerald-700">₹{v.price}</td>
                  <td className="p-4 font-bold text-slate-900">{v.stockQty} units</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      v.stockQty <= 0
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : v.stockQty <= 5
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}>
                      {v.stockQty <= 0 ? 'Out of Stock' : v.stockQty <= 5 ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleRestock(v.productId, v.id)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                    >
                      Restock +50
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 3. PAYMENTS & SETTLEMENTS PANEL
export const AdminPaymentsPanel: React.FC<AuxiliaryPanelProps> = ({ orders, vendors }) => {
  const [selectedVendorFilter, setSelectedVendorFilter] = useState('all');
  const sysConfig = getSystemConfig();
  const commPercent = sysConfig.commissionRatePercent;

  const grossSales = 371950;
  const platformCommission = Math.round(grossSales * (commPercent / 100));
  const deliveryFeesCollected = 14250;
  const vendorNetPayable = grossSales - platformCommission;

  interface VendorSettlementItem {
    id: string;
    vendorName: string;
    locality: string;
    orders: number;
    gross: number;
    commission: number;
    payable: number;
    status: 'Paid' | 'Pending';
    date: string;
    utr?: string;
  }

  const vendorSettlements: VendorSettlementItem[] = [
    { id: 'SET-001', vendorName: 'Tungabhadra Agro & Organics', locality: 'Kampli Road', orders: 184, gross: 128450, commission: 6422, payable: 122028, status: 'Paid', date: '26 Oct 2026', utr: 'KARBN26299104821' },
    { id: 'SET-002', vendorName: 'Hampi Super Bazaar', locality: 'Amaravathi', orders: 122, gross: 82600, commission: 4130, payable: 78470, status: 'Pending', date: '27 Oct 2026', utr: 'ESCROW-CLEARING-492' },
    { id: 'SET-003', vendorName: 'Sri Lakshmi Store', locality: 'Kampli Road', orders: 95, gross: 48320, commission: 2416, payable: 45904, status: 'Paid', date: '25 Oct 2026', utr: 'KARBN25299403810' },
    { id: 'SET-004', vendorName: 'Bellary Organic Dairy', locality: 'Dam Road', orders: 68, gross: 36900, commission: 1845, payable: 35055, status: 'Pending', date: '27 Oct 2026', utr: 'ESCROW-CLEARING-511' },
    { id: 'SET-005', vendorName: 'Hospete Sweets & Namkeen', locality: 'Station Road', orders: 42, gross: 24850, commission: 1242, payable: 23608, status: 'Paid', date: '24 Oct 2026', utr: 'KARBN24299882901' }
  ];

  // Active receipt state for viewing / post-download preview
  const [activeReceipt, setActiveReceipt] = useState<{
    settlement: VendorSettlementItem;
    downloaded: boolean;
  } | null>(null);

  // Helper to generate full printable HTML receipt document
  const generateSettlementReceiptHtml = (s: VendorSettlementItem) => {
    const utr = s.utr || (s.status === 'Paid' ? `KARBN26299104${s.id.slice(-3)}` : 'ESCROW-CLEARING-PENDING');
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Settlement Receipt - ${s.id} - ${s.vendorName}</title>
  <style>
    @media print {
      body { margin: 0; padding: 15px; background: #fff !important; }
      .no-print { display: none !important; }
      .receipt-box { box-shadow: none !important; border: 1px solid #000 !important; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      margin: 0;
      padding: 30px 15px;
    }
    .receipt-box {
      max-width: 680px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
    }
    .brand-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #059669;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .brand-name {
      font-size: 22px;
      font-weight: 900;
      color: #047857;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      font-size: 11px;
      color: #64748b;
      margin-top: 3px;
    }
    .badge-voucher {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #6ee7b7;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 800;
      text-align: right;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
      font-size: 12px;
    }
    .meta-card {
      background: #f8fafc;
      padding: 12px 14px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .meta-title {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 800;
      color: #64748b;
      margin-bottom: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin: 20px 0;
    }
    th {
      background: #f1f5f9;
      padding: 10px 12px;
      font-weight: 700;
      text-align: left;
      border-bottom: 1px solid #cbd5e1;
      color: #334155;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .num-col {
      text-align: right;
      font-family: monospace;
      font-weight: 700;
    }
    .payout-total {
      background: #ecfdf5;
      font-size: 14px;
      font-weight: 900;
      color: #065f46;
    }
    .seal-wrap {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #64748b;
    }
    .seal-stamp {
      display: inline-block;
      padding: 6px 12px;
      border: 2px dashed ${s.status === 'Paid' ? '#059669' : '#d97706'};
      color: ${s.status === 'Paid' ? '#059669' : '#d97706'};
      font-weight: 900;
      border-radius: 6px;
      text-transform: uppercase;
    }
    .actions-bar {
      margin-top: 20px;
      text-align: center;
    }
    .btn {
      background: #059669;
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 13px;
      font-weight: 700;
      border-radius: 6px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="receipt-box">
    <div class="brand-bar">
      <div>
        <div class="brand-name">Hospete Fresh Supermarket</div>
        <div class="brand-sub">Direct Farm-to-Consumer & Vendor Marketplace</div>
        <div class="brand-sub">Main Market, Patel Nagar, Hospete, Karnataka - 583201 | GSTIN: 29AABCH7829K1ZX</div>
      </div>
      <div class="badge-voucher">
        <div>SETTLEMENT ADVICE</div>
        <div style="font-size: 11px; font-weight: normal; color: #047857;">Batch #${s.id}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-card">
        <div class="meta-title">Beneficiary Vendor Partner</div>
        <div style="font-weight: 800; font-size: 14px; color: #0f172a;">${s.vendorName}</div>
        <div style="color: #64748b; margin-top: 2px;">📍 Locality: ${s.locality}, Hospete</div>
        <div style="color: #64748b; margin-top: 2px;">Bank: Karnataka Bank Escrow Account Verified</div>
      </div>
      <div class="meta-card">
        <div class="meta-title">Disbursement & Settlement</div>
        <div><strong>Date:</strong> ${s.date}</div>
        <div><strong>Status:</strong> <span style="font-weight: 800; color: ${s.status === 'Paid' ? '#059669' : '#d97706'};">${s.status.toUpperCase()}</span></div>
        <div style="margin-top: 2px;"><strong>Bank UTR / Ref:</strong> <code>${utr}</code></div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Breakdown Description</th>
          <th>Metric</th>
          <th class="num-col">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Gross Fulfilled Sales (GMV)</strong><br>
            <span style="font-size: 10px; color: #64748b;">Customer orders dispatched and fulfilled in Hospete</span>
          </td>
          <td>${s.orders} Orders</td>
          <td class="num-col">₹${s.gross.toLocaleString('en-IN')}.00</td>
        </tr>
        <tr>
          <td>
            <strong>Platform Marketplace Fee (5%)</strong><br>
            <span style="font-size: 10px; color: #64748b;">Includes catalog hosting, payment collection, & logistics support</span>
          </td>
          <td>5.0% Rate</td>
          <td class="num-col" style="color: #dc2626;">- ₹${s.commission.toLocaleString('en-IN')}.00</td>
        </tr>
        <tr>
          <td>
            <strong>Escrow Processing & TDS Fee</strong><br>
            <span style="font-size: 10px; color: #64748b;">Hospete Local Merchant Promotion Waiver</span>
          </td>
          <td>Waiver</td>
          <td class="num-col" style="color: #059669;">₹0.00</td>
        </tr>
        <tr class="payout-total">
          <td colspan="2">Net Disbursed Payout to Vendor</td>
          <td class="num-col">₹${s.payable.toLocaleString('en-IN')}.00</td>
        </tr>
      </tbody>
    </table>

    <div class="seal-wrap">
      <div>
        <strong>Karnataka Bank Ltd — Escrow Disbursement Division</strong><br>
        Electronic advice slip. For queries: accounts@hospetefresh.in | +91 8394-220011
      </div>
      <div class="seal-stamp">
        ${s.status === 'Paid' ? '✓ ESCROW PAID & VERIFIED' : '⏳ PENDING SETTLEMENT CLEARANCE'}
      </div>
    </div>
  </div>

  <div class="actions-bar no-print">
    <button class="btn" onclick="window.print()">🖨️ Print Receipt / Save as PDF</button>
  </div>
</body>
</html>`;
  };

  // 1. Download handler that saves the file AND opens the view modal
  const handleDownloadReceipt = (s: VendorSettlementItem) => {
    try {
      const htmlContent = generateSettlementReceiptHtml(s);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `HospeteFresh_Settlement_${s.id}_${s.vendorName.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      // Open in-app receipt preview immediately after download
      setActiveReceipt({ settlement: s, downloaded: true });
    } catch (err) {
      console.error('Failed to download receipt:', err);
      // Fallback: still show the in-app view modal
      setActiveReceipt({ settlement: s, downloaded: false });
    }
  };

  // 2. View receipt directly without re-triggering file download
  const handleViewReceipt = (s: VendorSettlementItem) => {
    setActiveReceipt({ settlement: s, downloaded: false });
  };

  // 3. Print receipt helper
  const handlePrintReceipt = (s: VendorSettlementItem) => {
    const htmlContent = generateSettlementReceiptHtml(s);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gross Order Value (GMV)</div>
          <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">₹{grossSales.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">↑ 14% vs last cycle</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Platform Commission ({commPercent}%)</div>
          <div className="text-2xl font-black text-emerald-600 mt-1 tabular-nums">₹{platformCommission.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">Supermarket marketplace revenue</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Delivery Fees Collected</div>
          <div className="text-2xl font-black text-blue-600 mt-1 tabular-nums">₹{deliveryFeesCollected.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">Allocated to delivery partners</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Vendor Net Payable</div>
          <div className="text-2xl font-black text-amber-600 mt-1 tabular-nums">₹{vendorNetPayable.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">Next payout cycle: Wednesday</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-black text-sm text-slate-900">Vendor Weekly Settlement Batches</h3>
            <p className="text-xs text-slate-500 mt-0.5">Karnataka Bank Escrow Transfer Mode • Click "Download Receipt" to save and view official tax voucher</p>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Escrow Sync Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-4">Batch ID</th>
                <th className="p-4">Vendor Partner</th>
                <th className="p-4">Fulfilled Orders</th>
                <th className="p-4">Gross Sales</th>
                <th className="p-4">Commission (5%)</th>
                <th className="p-4">Net Payout</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Settlement Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vendorSettlements.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4 font-mono font-bold text-slate-800">{s.id}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{s.vendorName}</div>
                    <div className="text-[10px] text-slate-400">📍 {s.locality} • {s.date}</div>
                  </td>
                  <td className="p-4 font-bold text-slate-700">{s.orders}</td>
                  <td className="p-4 font-semibold text-slate-900">₹{s.gross.toLocaleString()}</td>
                  <td className="p-4 text-emerald-700 font-bold">- ₹{s.commission.toLocaleString()}</td>
                  <td className="p-4 font-black text-slate-900">₹{s.payable.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                      s.status === 'Paid' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {s.status === 'Paid' ? <Check className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                      {s.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleViewReceipt(s)}
                        title="View receipt on screen"
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => handleDownloadReceipt(s)}
                        title="Download receipt document and view voucher"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Receipt</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: VIEW RECEIPT (POST-DOWNLOAD & DIRECT VIEW) */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm text-white">Vendor Settlement Receipt & Tax Voucher</h3>
                  <p className="text-[11px] text-slate-300">Batch #{activeReceipt.settlement.id} • {activeReceipt.settlement.vendorName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintReceipt(activeReceipt.settlement)}
                  title="Print official receipt"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setActiveReceipt(null)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Download Alert + Full Official Receipt Card */}
            <div className="p-5 overflow-y-auto space-y-4 bg-slate-50 flex-1">
              {/* Green notification banner if downloaded */}
              {activeReceipt.downloaded && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 shadow-2xs animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold">Receipt downloaded successfully!</span> File saved as{' '}
                      <span className="font-mono font-semibold text-emerald-800">
                        HospeteFresh_Settlement_{activeReceipt.settlement.id}.html
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-200/60 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                    Saved
                  </span>
                </div>
              )}

              {/* Official Voucher Paper Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-5">
                {/* Brand Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 border-b-2 border-emerald-600 pb-4">
                  <div>
                    <div className="text-xl font-black text-emerald-800 tracking-tight">HOSPETE FRESH SUPERMARKET</div>
                    <div className="text-xs text-slate-500 font-medium">Quick Commerce & Multi-Vendor Supermarket Platform</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Main Market, Patel Nagar, Hospete, Karnataka 583201 | GSTIN: 29AABCH7829K1ZX</div>
                  </div>
                  <div className="text-left sm:text-right bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg shrink-0">
                    <div className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Settlement Advice</div>
                    <div className="font-mono font-bold text-slate-900 text-sm">Batch #{activeReceipt.settlement.id}</div>
                  </div>
                </div>

                {/* Meta details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-[10px] font-bold uppercase text-slate-400">Beneficiary Vendor</div>
                    <div className="font-black text-slate-900 text-sm">{activeReceipt.settlement.vendorName}</div>
                    <div className="text-slate-500 text-[11px]">📍 Premise: {activeReceipt.settlement.locality}, Hospete</div>
                    <div className="text-emerald-700 font-semibold text-[11px]">✓ Karnataka Bank Escrow Verified</div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-[10px] font-bold uppercase text-slate-400">Payment & Transaction Details</div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cycle Date:</span>
                      <span className="font-bold text-slate-800">{activeReceipt.settlement.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status:</span>
                      <span className={`font-black ${activeReceipt.settlement.status === 'Paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {activeReceipt.settlement.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-0.5">
                      <span className="text-slate-500">Escrow UTR:</span>
                      <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded font-bold text-slate-800">
                        {activeReceipt.settlement.utr || 'KARBN26299104821'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Table Breakdown */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3 text-left">Description</th>
                        <th className="p-3 text-left">Calculation / Notes</th>
                        <th className="p-3 text-right">Amount (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">Gross Sales Volume (GMV)</div>
                          <div className="text-[10px] text-slate-400">Fulfilled customer orders in Hospete</div>
                        </td>
                        <td className="p-3 text-slate-600 font-medium">{activeReceipt.settlement.orders} orders</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">₹{activeReceipt.settlement.gross.toLocaleString()}.00</td>
                      </tr>
                      <tr>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">Platform Commission (5%)</div>
                          <div className="text-[10px] text-slate-400">Platform tech, marketing & logistics fees</div>
                        </td>
                        <td className="p-3 text-slate-600 font-medium">5.0% agreed rate</td>
                        <td className="p-3 text-right font-mono font-bold text-rose-600">- ₹{activeReceipt.settlement.commission.toLocaleString()}.00</td>
                      </tr>
                      <tr>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">Escrow Settlement & Payment Gateway</div>
                          <div className="text-[10px] text-slate-400">Direct Karnataka Bank IMPS/NEFT</div>
                        </td>
                        <td className="p-3 text-emerald-700 font-bold">100% Waived</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-700">₹0.00</td>
                      </tr>
                      <tr className="bg-emerald-50/80 font-black text-emerald-950 border-t-2 border-emerald-300">
                        <td className="p-3 text-sm" colSpan={2}>
                          Total Net Payout to Vendor Partner
                        </td>
                        <td className="p-3 text-right text-base font-mono font-black text-emerald-800">
                          ₹{activeReceipt.settlement.payable.toLocaleString()}.00
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Footer notes & verification seal */}
                <div className="pt-3 border-t border-dashed border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
                  <div>
                    <div className="font-bold text-slate-700">Karnataka Bank Escrow Direct Transfer</div>
                    <div>Computer generated settlement advice. Certified by Hospete Fresh Accounts Division.</div>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg border-2 border-dashed font-black text-xs uppercase tracking-wider ${
                    activeReceipt.settlement.status === 'Paid'
                      ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
                      : 'border-amber-600 text-amber-700 bg-amber-50'
                  }`}>
                    {activeReceipt.settlement.status === 'Paid' ? '✓ ESCROW PAID & VERIFIED' : '⏳ PENDING ESCROW CLEARANCE'}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-500 font-medium">
                Voucher #{activeReceipt.settlement.id} • Ready for audit compliance
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadReceipt(activeReceipt.settlement)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File Again</span>
                </button>
                <button
                  onClick={() => handlePrintReceipt(activeReceipt.settlement)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setActiveReceipt(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 4. COUPONS & PROMO CAMPAIGNS PANEL
export const AdminCouponsPanel: React.FC<AuxiliaryPanelProps> = () => {
  const coupons = [
    { code: 'WELCOME50', discount: '₹50 OFF', minOrder: '₹299', usage: '342 used', status: 'Active', validTill: '31 Dec 2026' },
    { code: 'FARM20', discount: '20% OFF', minOrder: '₹499', usage: '189 used', status: 'Active', validTill: '15 Nov 2026' },
    { code: 'FLASH100', discount: '₹100 OFF', minOrder: '₹999', usage: '94 used', status: 'Active', validTill: '30 Oct 2026' },
    { code: 'FREEDEL', discount: 'Free Delivery', minOrder: '₹149', usage: '512 used', status: 'Active', validTill: '31 Dec 2026' }
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900">Coupons & Promotional Vouchers</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage customer cart discounts, minimum order conditions, and redemption limits</p>
        </div>
        <button className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer">
          <Plus className="w-3.5 h-3.5" />
          <span>Create New Coupon</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {coupons.map(c => (
          <div key={c.code} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="font-mono font-black text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                {c.code}
              </span>
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                {c.status}
              </span>
            </div>
            <div>
              <div className="text-lg font-black text-slate-900">{c.discount}</div>
              <div className="text-xs text-slate-500">Min. order amount: {c.minOrder}</div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-400 font-medium">
              <span>{c.usage}</span>
              <span>Expires {c.validTill}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 5. SUPERMARKET SETTINGS PANEL
export const AdminSettingsPanel: React.FC<AuxiliaryPanelProps> = () => {
  const [config, setConfig] = useState<SystemConfig>(() => getSystemConfig());
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // Live simulation test states (in the same screen)
  const [testDistanceKm, setTestDistanceKm] = useState<number>(6.5);
  const [testSubtotal, setTestSubtotal] = useState<number>(150);

  // Calculate live simulated fee using the current configured settings
  const simulatedCalc = useMemo(() => {
    return calculateDeliveryFee(testSubtotal, testDistanceKm, config);
  }, [testSubtotal, testDistanceKm, config]);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      saveSystemConfig(config);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }

    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      const now = new Date();
      setLastSavedAt(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setTimeout(() => setSaveSuccess(false), 5000);
    }, 500);
  };

  const handleReset = () => {
    setConfig(DEFAULT_SYSTEM_CONFIG);
    saveSystemConfig(DEFAULT_SYSTEM_CONFIG);
    setSaveSuccess(true);
    setLastSavedAt('Reset to defaults');
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Helper to parse numeric string safely
  const handleNumChange = (field: keyof SystemConfig, text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    setConfig(prev => ({
      ...prev,
      [field]: isNaN(num) ? 0 : num
    }));
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 max-w-4xl animate-in fade-in duration-200">
      {/* Top Header matching reference screenshot */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Platform & Supermarket Configuration</h2>
          <p className="text-xs text-slate-500 mt-0.5">Control Hospete dispatch radius, SLAs, store hours, and automated assignment thresholds</p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Save Success Alert Banner */}
      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 shadow-2xs animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold">System configurations saved successfully!</span>
              <span className="text-emerald-700 ml-1.5 hidden sm:inline">Settings applied to Hospete delivery routing and checkout.</span>
            </div>
          </div>
          {lastSavedAt && (
            <span className="text-[11px] font-mono bg-emerald-100/70 text-emerald-800 px-2 py-0.5 rounded-md font-semibold">
              {lastSavedAt}
            </span>
          )}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* 6 Core Parameters exactly matching the screenshot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* 1. Supermarket Operational Hours */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Supermarket Operational Hours</label>
            <input
              type="text"
              value={config.operationalHours}
              onChange={(e) => setConfig({ ...config, operationalHours: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-hidden rounded-xl transition-colors font-medium text-slate-800"
              placeholder="6:00 AM - 11:00 PM IST"
            />
            <p className="text-[10px] text-slate-400 mt-1">Store open & customer dispatch time window</p>
          </div>

          {/* 2. Delivery Geofence Radius */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Delivery Geofence Radius</label>
            <div className="relative">
              <input
                type="text"
                value={`${config.geofenceRadiusKm} km from Hospete Town Center`}
                onChange={(e) => handleNumChange('geofenceRadiusKm', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-hidden rounded-xl transition-colors font-medium text-slate-800"
                placeholder="15 km from Hospete Town Center"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Maximum delivery coverage area for instant delivery</p>
          </div>

          {/* 3. Free Delivery Cart Threshold */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Free Delivery Cart Threshold</label>
            <div className="relative">
              <input
                type="text"
                value={`₹${config.freeDeliveryThreshold}`}
                onChange={(e) => handleNumChange('freeDeliveryThreshold', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-hidden rounded-xl transition-colors font-medium text-slate-800"
                placeholder="₹199"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Orders above this qualify for ₹0 delivery charges</p>
          </div>

          {/* 4. Standard Delivery Fee */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Standard Delivery Fee</label>
            <div className="relative">
              <input
                type="text"
                value={`₹${config.standardDeliveryFee}`}
                onChange={(e) => handleNumChange('standardDeliveryFee', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-hidden rounded-xl transition-colors font-medium text-slate-800"
                placeholder="₹25"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Standard fee applied below threshold</p>
          </div>

          {/* 5. Marketplace Commission Rate */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Marketplace Commission Rate</label>
            <div className="relative">
              <input
                type="text"
                value={`${config.commissionRatePercent}% flat`}
                onChange={(e) => handleNumChange('commissionRatePercent', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-hidden rounded-xl transition-colors font-medium text-slate-800"
                placeholder="10.0% flat"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Default platform revenue cut on vendor sales</p>
          </div>

          {/* 6. Auto-Dispatch Readiness Time */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Auto-Dispatch Readiness Time</label>
            <div className="relative">
              <input
                type="text"
                value={`${config.dispatchReadinessMins} mins prior to packing completion`}
                onChange={(e) => handleNumChange('dispatchReadinessMins', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-hidden rounded-xl transition-colors font-medium text-slate-800"
                placeholder="10 mins prior to packing completion"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Lead time before assigning nearest delivery partner</p>
          </div>
        </div>

        {/* =========================================================================
            DYNAMIC DISTANCE SURCHARGE (> 5 KM) CONFIGURATION & SIMULATOR
            ========================================================================= */}
        <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-50/60 to-slate-50 border border-emerald-200 rounded-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-2xs">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Distance-Based Delivery Pricing Rule (&gt; 5 km)</h3>
                <p className="text-[11px] text-slate-500">
                  Deliveries beyond the standard 5 km radius automatically increase based on your configured per-kilometer rate.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
              Active Distance Rule
            </span>
          </div>

          {/* Distance configuration fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
              <label className="font-bold text-slate-700 block text-[11px]">Base Free Distance Included</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.5"
                  value={config.baseDeliveryRadiusKm}
                  onChange={(e) => setConfig({ ...config, baseDeliveryRadiusKm: parseFloat(e.target.value) || 5 })}
                  className="w-20 p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 text-center"
                />
                <span className="font-bold text-slate-600">km from center</span>
              </div>
              <p className="text-[10px] text-slate-400">Covered by standard delivery fee (₹{config.standardDeliveryFee})</p>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
              <label className="font-bold text-slate-700 block text-[11px]">Surcharge Beyond 5 km</label>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600">+₹</span>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="1"
                  value={config.perKmSurchargeBeyond5Km}
                  onChange={(e) => setConfig({ ...config, perKmSurchargeBeyond5Km: parseFloat(e.target.value) || 0 })}
                  className="w-20 p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-emerald-700 text-center text-sm"
                />
                <span className="font-bold text-slate-600">per extra km</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                {[5, 10, 15, 20].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setConfig({ ...config, perKmSurchargeBeyond5Km: amt })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                      config.perKmSurchargeBeyond5Km === amt
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    +₹{amt}/km
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
              <label className="font-bold text-slate-700 block text-[11px]">Maximum Geofence Limit</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="5"
                  max="30"
                  step="1"
                  value={config.geofenceRadiusKm}
                  onChange={(e) => setConfig({ ...config, geofenceRadiusKm: parseFloat(e.target.value) || 15 })}
                  className="w-20 p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 text-center"
                />
                <span className="font-bold text-slate-600">km total reach</span>
              </div>
              <p className="text-[10px] text-slate-400">Addresses further than this are out of delivery zone</p>
            </div>
          </div>

          {/* Interactive Live Distance Simulator on the Same Screen */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-800 text-xs">Live Distance & Delivery Fee Simulator</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Test Cart:</span>
                <button
                  type="button"
                  onClick={() => setTestSubtotal(150)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${testSubtotal < config.freeDeliveryThreshold ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  ₹150 (Under ₹{config.freeDeliveryThreshold})
                </button>
                <button
                  type="button"
                  onClick={() => setTestSubtotal(250)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${testSubtotal >= config.freeDeliveryThreshold ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  ₹250 (Free Base SLA)
                </button>
              </div>
            </div>

            {/* Slider & Quick Locality Presets */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Test Delivery Distance:</span>
                <span className="font-black text-slate-900 text-sm">{testDistanceKm.toFixed(1)} km</span>
              </div>
              <input
                type="range"
                min="1.0"
                max={Math.max(15, config.geofenceRadiusKm)}
                step="0.1"
                value={testDistanceKm}
                onChange={(e) => setTestDistanceKm(parseFloat(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />

              {/* Quick locality chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { name: 'Station Rd', km: 1.2 },
                  { name: 'Patel Nagar', km: 2.2 },
                  { name: 'Dam Road', km: 4.8 },
                  { name: 'Amaravathi (>5km)', km: 6.5 },
                  { name: 'Hampi Road (>5km)', km: 8.4 },
                  { name: 'Munirabad (>5km)', km: 12.5 }
                ].map(loc => (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => setTestDistanceKm(loc.km)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      Math.abs(testDistanceKm - loc.km) < 0.1
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {loc.name} ({loc.km} km)
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Result Card */}
            <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              simulatedCalc.isOutOfDeliveryZone
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : simulatedCalc.isBeyondBaseRadius
                ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            }`}>
              <div className="space-y-0.5">
                <div className="font-extrabold text-xs flex items-center gap-1.5">
                  {simulatedCalc.isOutOfDeliveryZone ? (
                    <>
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>Beyond Geofence Limit ({config.geofenceRadiusKm} km) - Out of Delivery Zone</span>
                    </>
                  ) : simulatedCalc.isBeyondBaseRadius ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-amber-600" />
                      <span>Distance Surcharge Active ({simulatedCalc.distanceKm} km is {simulatedCalc.extraKm} km beyond 5 km)</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Within Standard 5 km Radius (Standard Hospete Town SLA)</span>
                    </>
                  )}
                </div>
                <div className="text-[11px] text-slate-600">
                  Base Fee: {simulatedCalc.baseFee === 0 ? <strong className="text-emerald-700">₹0 (Free SLA)</strong> : `₹${simulatedCalc.baseFee}`}
                  {simulatedCalc.isBeyondBaseRadius && (
                    <span className="text-amber-800 font-semibold ml-2">
                      + Distance Fee: ₹{simulatedCalc.distanceSurcharge} ({Math.ceil(simulatedCalc.extraKm)} km × ₹{config.perKmSurchargeBeyond5Km}/km)
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[10px] uppercase font-bold text-slate-400">Total Delivery Fee</div>
                <div className="text-xl font-black text-slate-900 font-mono">
                  {simulatedCalc.isOutOfDeliveryZone ? 'Unserviceable' : simulatedCalc.totalDeliveryFee === 0 ? 'FREE' : `₹${simulatedCalc.totalDeliveryFee}`}
                </div>
              </div>
            </div>

            {/* Distance Tier Matrix Summary */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-[11px] text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Distance Radius</th>
                    <th className="p-2.5">Applicable Formula</th>
                    <th className="p-2.5">Order &lt; ₹{config.freeDeliveryThreshold}</th>
                    <th className="p-2.5">Order ≥ ₹{config.freeDeliveryThreshold}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-bold text-slate-800">0.0 to 5.0 km (Base)</td>
                    <td className="p-2.5 text-slate-500">Standard Town SLA</td>
                    <td className="p-2.5 font-bold text-slate-700">₹{config.standardDeliveryFee}</td>
                    <td className="p-2.5 font-bold text-emerald-700">FREE (₹0)</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-bold text-slate-800">5.1 to 7.0 km (+2 km)</td>
                    <td className="p-2.5 text-slate-500">Base + (2 km × ₹{config.perKmSurchargeBeyond5Km})</td>
                    <td className="p-2.5 font-bold text-slate-700">₹{config.standardDeliveryFee + (2 * config.perKmSurchargeBeyond5Km)}</td>
                    <td className="p-2.5 font-bold text-amber-700">₹{2 * config.perKmSurchargeBeyond5Km}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-bold text-slate-800">7.1 to 10.0 km (+5 km)</td>
                    <td className="p-2.5 text-slate-500">Base + (5 km × ₹{config.perKmSurchargeBeyond5Km})</td>
                    <td className="p-2.5 font-bold text-slate-700">₹{config.standardDeliveryFee + (5 * config.perKmSurchargeBeyond5Km)}</td>
                    <td className="p-2.5 font-bold text-amber-700">₹{5 * config.perKmSurchargeBeyond5Km}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-bold text-slate-800">10.1 to {config.geofenceRadiusKm} km</td>
                    <td className="p-2.5 text-slate-500">Base + (Extra km × ₹{config.perKmSurchargeBeyond5Km})</td>
                    <td className="p-2.5 font-bold text-slate-700">Dynamic</td>
                    <td className="p-2.5 font-bold text-amber-700">Dynamic</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Smart Operations Toggles */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
            <input
              type="checkbox"
              checked={config.autoAssignRiders}
              onChange={(e) => setConfig({ ...config, autoAssignRiders: e.target.checked })}
              className="accent-emerald-600 rounded w-4 h-4"
            />
            <span className="font-bold text-slate-700 text-[11px]">Auto-assign delivery partners</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
            <input
              type="checkbox"
              checked={config.smsAlerts}
              onChange={(e) => setConfig({ ...config, smsAlerts: e.target.checked })}
              className="accent-emerald-600 rounded w-4 h-4"
            />
            <span className="font-bold text-slate-700 text-[11px]">SMS order dispatch updates</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
            <input
              type="checkbox"
              checked={config.whatsappUpdates}
              onChange={(e) => setConfig({ ...config, whatsappUpdates: e.target.checked })}
              className="accent-emerald-600 rounded w-4 h-4"
            />
            <span className="font-bold text-slate-700 text-[11px]">WhatsApp live tracking link</span>
          </label>
        </div>

        {/* Save button matching reference */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400">
            Changes take effect immediately for customer checkout delivery fees and platform commission calculations.
          </span>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving Configurations...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved Successfully!</span>
              </>
            ) : (
              <span>Save System Configurations</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
