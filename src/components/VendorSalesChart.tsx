import React, { useState } from 'react';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ShoppingBag,
  Package,
  Wallet,
  ArrowUpRight,
  Info,
  X,
  ArrowRight,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Order, Vendor } from '../types.ts';
import {
  SalesDateRange,
  calculateVendorSalesForPeriod,
  DaySalesBucket
} from '../utils/salesAnalytics.ts';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface VendorSalesChartProps {
  orders: Order[];
  currentVendor: Vendor;
  onNavigateToOrder?: (orderId: number) => void;
}

export const VendorSalesChart: React.FC<VendorSalesChartProps> = ({
  orders,
  currentVendor,
  onNavigateToOrder
}) => {
  const [selectedRange, setSelectedRange] = useState<SalesDateRange>('last7');
  const [customStart, setCustomStart] = useState<string>('2026-10-06');
  const [customEnd, setCustomEnd] = useState<string>('2026-10-12');
  const [hoveredBucket, setHoveredBucket] = useState<DaySalesBucket | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<DaySalesBucket | null>(null);
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState<boolean>(false);

  // Compute analytics using real orders data
  const analytics = calculateVendorSalesForPeriod(
    orders,
    currentVendor.id,
    selectedRange,
    customStart,
    customEnd,
    0.05 // 5% marketplace commission
  );

  const rangeOptions: Array<{ id: SalesDateRange; label: string; shortLabel: string }> = [
    { id: 'today', label: 'Today', shortLabel: 'Today' },
    { id: 'yesterday', label: 'Yesterday', shortLabel: 'Yest' },
    { id: 'last7', label: 'Last 7 Days', shortLabel: '7D' },
    { id: 'last30', label: 'Last 30 Days', shortLabel: '30D' },
    { id: 'this_month', label: 'This Month', shortLabel: 'Month' },
    { id: 'last_month', label: 'Last Month', shortLabel: 'Last Mo' },
    { id: 'custom', label: 'Custom Range', shortLabel: 'Custom' }
  ];

  const handleBarClick = (bucket: DaySalesBucket) => {
    setSelectedBucket(bucket);
    setIsBreakdownModalOpen(true);
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
      {/* 1. Header with Title & Date Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Sales Analytics &amp; Revenue
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {analytics.rangeLabel} &bull; Attributable to {currentVendor.businessName}
          </p>
        </div>

        {/* Date-range segmented buttons / dropdown */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
          {rangeOptions.map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelectedRange(opt.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRange === opt.id
                  ? 'bg-white text-emerald-700 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <span className="hidden md:inline">{opt.label}</span>
              <span className="md:hidden">{opt.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range Picker Inputs */}
      {selectedRange === 'custom' && (
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Select Date Window:</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-slate-500 font-semibold">From:</label>
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-slate-500 font-semibold">To:</label>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
            />
          </div>
          <span className="text-[11px] text-slate-400">
            ({analytics.daysCount} days selected)
          </span>
        </div>
      )}

      {/* 2. Key Metrics Row for Selected Period */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Total Gross Sales */}
        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Sales (Period)
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
            ₹{analytics.totalGrossSales.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-bold">
            {analytics.percentageDirection === 'up' ? (
              <span className="text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{analytics.percentageChangeFormatted}</span>
              </span>
            ) : analytics.percentageDirection === 'down' ? (
              <span className="text-rose-600 flex items-center gap-0.5">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>{analytics.percentageChangeFormatted}</span>
              </span>
            ) : (
              <span className="text-slate-500 font-medium">
                {analytics.percentageChangeFormatted}
              </span>
            )}
            <span className="text-[10px] text-slate-400 font-normal">vs prev period</span>
          </div>
        </div>

        {/* Metric 2: Net Vendor Payout (after commission) */}
        <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/70">
          <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
            <span>Net Earnings</span>
            <span className="text-[10px] text-emerald-600 font-semibold">95% Payout</span>
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-1 tracking-tight">
            ₹{analytics.totalNetEarnings.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-emerald-700 mt-1 font-medium">
            ₹{analytics.totalCommission} commission (5%)
          </div>
        </div>

        {/* Metric 3: Orders Count */}
        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Customer Orders
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
            {analytics.totalOrdersCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">
            Avg value: ₹{analytics.avgOrderValue}
          </div>
        </div>

        {/* Metric 4: Items Sold */}
        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Units / Items Sold
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
            {analytics.totalItemsSold}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">
            Across active listings
          </div>
        </div>
      </div>

      {/* 3. Interactive Bar Chart Canvas */}
      <div className="relative pt-6 pb-2">
        {/* Floating Tooltip positioned near top */}
        {hoveredBucket && (
          <div className="absolute top-0 inset-x-0 mx-auto max-w-sm z-20 pointer-events-none animate-in fade-in duration-150">
            <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700 mx-auto">
              <div className="flex justify-between items-center font-bold border-b border-slate-800 pb-1">
                <span>{hoveredBucket.fullDateLabel}</span>
                {hoveredBucket.isToday && (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded uppercase font-black">
                    Today
                  </span>
                )}
              </div>
              <div className="flex justify-between text-slate-300 pt-0.5">
                <span>Sales: <strong className="text-white">₹{hoveredBucket.grossSales.toLocaleString('en-IN')}</strong></span>
                <span>Net: <strong className="text-emerald-400">₹{hoveredBucket.netEarnings.toLocaleString('en-IN')}</strong></span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Orders: <strong className="text-white">{hoveredBucket.ordersCount}</strong></span>
                <span>Items Sold: <strong className="text-white">{hoveredBucket.itemsSold}</strong></span>
              </div>
              <div className="text-[10px] text-emerald-300 text-center pt-0.5">
                💡 Click bar to view order breakdown &rarr;
              </div>
            </div>
          </div>
        )}

        {/* The Bars Display Container */}
        <div className="h-44 sm:h-48 w-full flex items-end justify-between gap-1 sm:gap-2 px-1 pt-6 border-b border-slate-200">
          {analytics.dailyBuckets.map((bucket, idx) => {
            const heightPercent =
              analytics.maxDailyGrossSales > 0
                ? Math.max(5, Math.round((bucket.grossSales / analytics.maxDailyGrossSales) * 100))
                : 5;
            const hasSales = bucket.grossSales > 0;
            const isHovered = hoveredBucket?.dateKey === bucket.dateKey;

            return (
              <div
                key={bucket.dateKey}
                onClick={() => handleBarClick(bucket)}
                onMouseEnter={() => setHoveredBucket(bucket)}
                onMouseLeave={() => setHoveredBucket(null)}
                onTouchStart={() => setHoveredBucket(bucket)}
                className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative"
              >
                {/* Bar Value Indicator (shown for prominent bars or on hover) */}
                {hasSales && (
                  <span
                    className={`text-[9px] sm:text-[10px] font-bold mb-1 transition-opacity truncate max-w-full ${
                      bucket.isToday
                        ? 'text-emerald-700 font-black'
                        : isHovered
                        ? 'text-slate-900'
                        : 'text-slate-400 hidden sm:block'
                    }`}
                  >
                    ₹{bucket.grossSales >= 1000 ? `${(bucket.grossSales / 1000).toFixed(1)}k` : bucket.grossSales}
                  </span>
                )}

                {/* Vertical Bar Graphic */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t-lg transition-all duration-200 ${
                    bucket.isToday
                      ? 'bg-emerald-600 shadow-sm ring-2 ring-emerald-400/40'
                      : hasSales
                      ? 'bg-emerald-400 group-hover:bg-emerald-500'
                      : 'bg-slate-100 group-hover:bg-slate-200'
                  } ${isHovered ? 'brightness-110 scale-y-105 origin-bottom' : ''}`}
                />

                {/* X-Axis Date Label */}
                <div className="mt-2 text-center w-full">
                  <span
                    className={`block text-[9px] sm:text-[10px] font-bold truncate ${
                      bucket.isToday
                        ? 'text-emerald-700 font-black'
                        : isHovered
                        ? 'text-slate-900'
                        : 'text-slate-500'
                    }`}
                  >
                    {analytics.dailyBuckets.length <= 7
                      ? bucket.dayLabel
                      : analytics.dailyBuckets.length <= 15
                      ? `${bucket.dateObj.getDate()} ${MONTH_NAMES[bucket.dateObj.getMonth()]}`
                      : idx % 4 === 0 || bucket.isToday
                      ? `${bucket.dateObj.getDate()} ${MONTH_NAMES[bucket.dateObj.getMonth()]}`
                      : '·'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend & Instructions */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 pt-3 px-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-600 inline-block" />
              <span className="font-bold text-slate-700">Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-400 inline-block" />
              <span>Days with Sales</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-slate-200 inline-block" />
              <span>Zero Sales</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 italic">
            👆 Tap/click any bar to inspect specific contributing customer orders
          </div>
        </div>
      </div>

      {/* 4. Click-Through Order Breakdown Modal */}
      {isBreakdownModalOpen && selectedBucket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 mb-1">
                  <Calendar className="w-3 h-3" />
                  <span>{selectedBucket.fullDateLabel}</span>
                  {selectedBucket.isToday && <span>&bull; Today</span>}
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  Orders Breakdown &amp; Item Sales
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBreakdownModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Subtotal Summary Banner */}
            <div className="grid grid-cols-3 gap-2 p-4 bg-emerald-950 text-white text-center">
              <div>
                <div className="text-[10px] text-emerald-300 font-bold uppercase">Gross Sales</div>
                <div className="text-lg font-black text-white">
                  ₹{selectedBucket.grossSales.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="border-x border-emerald-800">
                <div className="text-[10px] text-emerald-300 font-bold uppercase">Net Payout</div>
                <div className="text-lg font-black text-emerald-400">
                  ₹{selectedBucket.netEarnings.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-emerald-300 font-bold uppercase">Orders / Items</div>
                <div className="text-lg font-black text-white">
                  {selectedBucket.ordersCount} / {selectedBucket.itemsSold}
                </div>
              </div>
            </div>

            {/* Modal Orders List Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedBucket.contributingOrders.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
                    📦
                  </div>
                  <h4 className="font-black text-sm text-slate-800">
                    No Eligible Sales on This Date
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    No customer orders containing your products were placed on {selectedBucket.displayDate}. Orders placed by customers will automatically appear here.
                  </p>
                </div>
              ) : (
                selectedBucket.contributingOrders.map(({ order, vendorItems, vendorSubtotal, itemsCount }) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition-all shadow-2xs space-y-3"
                  >
                    {/* Order Header */}
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-slate-900">
                            #{order.orderNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              order.status === 'Delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.status === 'Cancelled'
                                ? 'bg-rose-100 text-rose-800'
                                : order.status === 'Picked Up' || order.status === 'Out for Delivery'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span>👤 {order.customerName}</span>
                          <span>&bull;</span>
                          <span>🕒 {order.orderedAt || order.createdAt}</span>
                          <span>&bull;</span>
                          <span>📍 {order.locality}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black text-emerald-700">
                          ₹{vendorSubtotal}
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold">
                          {itemsCount} item{itemsCount > 1 ? 's' : ''} attributable
                        </div>
                      </div>
                    </div>

                    {/* Contributing Items Table / List */}
                    <div className="bg-slate-50 rounded-xl p-2.5 space-y-1.5 text-xs">
                      {vendorItems.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex justify-between items-center text-[11px]">
                          <span className="font-medium text-slate-800">
                            {item.productName} <span className="text-slate-400">({item.packSize})</span> &times; {item.quantity}
                          </span>
                          <span className="font-bold text-slate-900">
                            ₹{item.subtotal || item.unitPrice * item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Action to switch to full Order details */}
                    {onNavigateToOrder && (
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setIsBreakdownModalOpen(false);
                            onNavigateToOrder(order.id);
                          }}
                          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <span>Open Full Order Fulfillment Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsBreakdownModalOpen(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
