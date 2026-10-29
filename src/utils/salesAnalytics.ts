/**
 * Sales Analytics & Date Range Calculation Utility for Hospete Fresh Vendor Portal
 */
import { Order, OrderItem } from '../types.ts';

export type SalesDateRange =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'this_month'
  | 'last_month'
  | 'custom';

export interface DaySalesBucket {
  dateKey: string; // YYYY-MM-DD
  dateObj: Date;
  dayLabel: string; // e.g. "Mon 6", "12 Oct"
  displayDate: string; // e.g. "12 Oct 2026"
  fullDateLabel: string; // e.g. "Monday, 12 Oct 2026"
  grossSales: number;
  commission: number;
  netEarnings: number;
  ordersCount: number;
  itemsSold: number;
  isToday: boolean;
  contributingOrders: Array<{
    order: Order;
    vendorItems: OrderItem[];
    vendorSubtotal: number;
    itemsCount: number;
  }>;
}

export interface VendorAnalyticsSummary {
  rangeType: SalesDateRange;
  rangeLabel: string;
  startDate: Date;
  endDate: Date;
  prevStartDate: Date;
  prevEndDate: Date;
  daysCount: number;
  totalGrossSales: number;
  totalCommission: number;
  totalNetEarnings: number;
  totalOrdersCount: number;
  totalItemsSold: number;
  avgOrderValue: number;
  prevTotalGrossSales: number;
  percentageChange: number | null;
  percentageChangeFormatted: string;
  percentageDirection: 'up' | 'down' | 'neutral';
  dailyBuckets: DaySalesBucket[];
  maxDailyGrossSales: number;
}

// Month names lookup
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Format Date to YYYY-MM-DD in local time
 */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format Date to readable string e.g. "12 Oct 2026"
 */
export function formatDisplayDate(date: Date): string {
  const d = date.getDate();
  const m = MONTH_NAMES[date.getMonth()];
  const y = date.getFullYear();
  return `${d} ${m} ${y}`;
}

/**
 * Determine anchor "Today" date.
 * If current runtime date is in 2026, use the current date or October 12, 2026 (the standard Hospete Fresh anchor).
 */
export function getAnchorDate(): Date {
  const now = new Date();
  // If system date is Oct 2026 or later, use the actual day in Oct 2026 or fallback to Oct 12, 2026
  if (now.getFullYear() === 2026 && now.getMonth() === 9) {
    return new Date(2026, 9, now.getDate(), 23, 59, 59, 999);
  }
  // Default anchor aligned with Hospete Fresh mock database
  return new Date(2026, 9, 12, 23, 59, 59, 999);
}

/**
 * Parses an order's createdAt/orderedAt date string into a Date object and YYYY-MM-DD key
 */
export function parseOrderDate(order: Order, anchorDate: Date = getAnchorDate()): {
  dateKey: string;
  dateObj: Date;
  displayDate: string;
  timeStr: string;
} {
  const raw = (order.createdAt || order.orderedAt || '').trim();

  // 1. "Just now" or relative
  if (!raw || raw.toLowerCase().includes('just now') || raw.toLowerCase().includes('today')) {
    const d = new Date(anchorDate);
    return {
      dateKey: formatDateKey(d),
      dateObj: d,
      displayDate: formatDisplayDate(d),
      timeStr: order.orderedAt || '10:00 AM'
    };
  }

  // 2. ISO timestamp format: e.g. 2026-10-12T... or 2026-10-12
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    const parsed = new Date(y, m, d, 12, 0, 0);
    return {
      dateKey: formatDateKey(parsed),
      dateObj: parsed,
      displayDate: formatDisplayDate(parsed),
      timeStr: raw.includes('T') ? raw.split('T')[1].slice(0, 5) : '10:00 AM'
    };
  }

  // 3. Hospete format: e.g. "12 Oct 2026, 10:15 AM" or "12 Oct 2026"
  const regex = /(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})(?:,\s*(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?))?/;
  const match = raw.match(regex);
  if (match) {
    const day = parseInt(match[1], 10);
    const monthStr = match[2];
    const year = parseInt(match[3], 10);
    const timeStr = match[4] || order.orderedAt || '10:00 AM';
    const monthIdx = MONTH_NAMES.findIndex(m => m.toLowerCase() === monthStr.toLowerCase());
    if (monthIdx !== -1) {
      const parsed = new Date(year, monthIdx, day, 12, 0, 0);
      return {
        dateKey: formatDateKey(parsed),
        dateObj: parsed,
        displayDate: formatDisplayDate(parsed),
        timeStr
      };
    }
  }

  // Fallback: standard Date parsing
  const fallbackDate = new Date(raw);
  if (!isNaN(fallbackDate.getTime())) {
    return {
      dateKey: formatDateKey(fallbackDate),
      dateObj: fallbackDate,
      displayDate: formatDisplayDate(fallbackDate),
      timeStr: fallbackDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  // Safe fallback to anchor
  return {
    dateKey: formatDateKey(anchorDate),
    dateObj: anchorDate,
    displayDate: formatDisplayDate(anchorDate),
    timeStr: '10:00 AM'
  };
}

/**
 * Calculates start and end dates for the selected date range, along with the previous comparison period.
 */
export function getDateRangeBoundaries(
  rangeType: SalesDateRange,
  customStart?: string,
  customEnd?: string,
  anchor: Date = getAnchorDate()
): {
  startDate: Date;
  endDate: Date;
  prevStartDate: Date;
  prevEndDate: Date;
  label: string;
  daysCount: number;
} {
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

  const anchorEnd = endOfDay(anchor);

  if (rangeType === 'today') {
    const start = startOfDay(anchor);
    const end = anchorEnd;
    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - 1);
    const prevEnd = endOfDay(prevStart);
    return {
      startDate: start,
      endDate: end,
      prevStartDate: prevStart,
      prevEndDate: prevEnd,
      label: `Today (${formatDisplayDate(start)})`,
      daysCount: 1
    };
  }

  if (rangeType === 'yesterday') {
    const yesterday = new Date(anchor);
    yesterday.setDate(yesterday.getDate() - 1);
    const start = startOfDay(yesterday);
    const end = endOfDay(yesterday);
    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - 1);
    const prevEnd = endOfDay(prevStart);
    return {
      startDate: start,
      endDate: end,
      prevStartDate: prevStart,
      prevEndDate: prevEnd,
      label: `Yesterday (${formatDisplayDate(start)})`,
      daysCount: 1
    };
  }

  if (rangeType === 'last7') {
    const start = new Date(anchor);
    start.setDate(start.getDate() - 6);
    const startClamped = startOfDay(start);
    const end = anchorEnd;

    const prevEnd = new Date(startClamped);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - 6);

    return {
      startDate: startClamped,
      endDate: end,
      prevStartDate: startOfDay(prevStart),
      prevEndDate: endOfDay(prevEnd),
      label: `Last 7 Days (${formatDisplayDate(startClamped)} – ${formatDisplayDate(end)})`,
      daysCount: 7
    };
  }

  if (rangeType === 'last30') {
    const start = new Date(anchor);
    start.setDate(start.getDate() - 29);
    const startClamped = startOfDay(start);
    const end = anchorEnd;

    const prevEnd = new Date(startClamped);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - 29);

    return {
      startDate: startClamped,
      endDate: end,
      prevStartDate: startOfDay(prevStart),
      prevEndDate: endOfDay(prevEnd),
      label: `Last 30 Days (${formatDisplayDate(startClamped)} – ${formatDisplayDate(end)})`,
      daysCount: 30
    };
  }

  if (rangeType === 'this_month') {
    const year = anchor.getFullYear();
    const month = anchor.getMonth();
    const start = new Date(year, month, 1, 0, 0, 0, 0);
    const end = anchorEnd;
    const daysElapsed = anchor.getDate();

    // Previous period of equal length right before the 1st of this month
    const prevEnd = new Date(year, month, 0, 23, 59, 59, 999);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - daysElapsed + 1);

    return {
      startDate: start,
      endDate: end,
      prevStartDate: startOfDay(prevStart),
      prevEndDate: endOfDay(prevEnd),
      label: `This Month (${formatDisplayDate(start)} – ${formatDisplayDate(end)})`,
      daysCount: daysElapsed
    };
  }

  if (rangeType === 'last_month') {
    const year = anchor.getFullYear();
    const month = anchor.getMonth();
    // 1st day of last month
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    // Last day of last month
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    const daysInLastMonth = end.getDate();

    // Previous period: month before last month
    const prevEnd = new Date(year, month - 1, 0, 23, 59, 59, 999);
    const prevStart = new Date(year, month - 2, 1, 0, 0, 0, 0);

    return {
      startDate: start,
      endDate: end,
      prevStartDate: start,
      prevEndDate: prevEnd,
      label: `Last Month (${formatDisplayDate(start)} – ${formatDisplayDate(end)})`,
      daysCount: daysInLastMonth
    };
  }

  // Custom date range
  const parsedStart = customStart ? new Date(customStart) : new Date(anchor.getTime() - 6 * 86400000);
  const parsedEnd = customEnd ? new Date(customEnd) : anchor;
  const start = startOfDay(isNaN(parsedStart.getTime()) ? anchor : parsedStart);
  const end = endOfDay(isNaN(parsedEnd.getTime()) ? anchor : parsedEnd);

  const msDiff = Math.max(0, end.getTime() - start.getTime());
  const days = Math.max(1, Math.round(msDiff / 86400000) + 1);

  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - days + 1);

  return {
    startDate: start,
    endDate: end,
    prevStartDate: startOfDay(prevStart),
    prevEndDate: endOfDay(prevEnd),
    label: `Custom Range (${formatDisplayDate(start)} – ${formatDisplayDate(end)})`,
    daysCount: days
  };
}

/**
 * Core computation: Aggregates real sales, commissions, orders, and items sold
 * strictly for the logged-in vendor, excluding cancelled orders.
 */
export function calculateVendorSalesForPeriod(
  orders: Order[],
  vendorId: number,
  rangeType: SalesDateRange,
  customStart?: string,
  customEnd?: string,
  commissionRate = 0.05
): VendorAnalyticsSummary {
  const anchor = getAnchorDate();
  const boundaries = getDateRangeBoundaries(rangeType, customStart, customEnd, anchor);
  const anchorKey = formatDateKey(anchor);

  // Build a list of all consecutive dates in the range
  const dateList: Date[] = [];
  const cur = new Date(boundaries.startDate);
  while (cur <= boundaries.endDate) {
    dateList.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }

  // Group contributing orders by dateKey
  const ordersByDateKey: Record<
    string,
    Array<{ order: Order; vendorItems: OrderItem[]; vendorSubtotal: number; itemsCount: number }>
  > = {};

  // Previous period tracking
  let prevTotalGrossSales = 0;

  // Filter and process all orders
  orders.forEach(order => {
    // 1. Exclude cancelled orders
    if (order.status.toLowerCase() === 'cancelled') {
      return;
    }

    // 2. Extract items attributable to this vendor
    const vendorItems = order.items.filter(
      it => it.vendorId === vendorId || (!it.vendorId && vendorId === 1)
    );

    if (vendorItems.length === 0) {
      return;
    }

    const vendorSubtotal = vendorItems.reduce(
      (sum, it) => sum + (it.subtotal || it.unitPrice * it.quantity),
      0
    );
    const itemsCount = vendorItems.reduce((sum, it) => sum + it.quantity, 0);

    const { dateKey, dateObj } = parseOrderDate(order, anchor);

    // Check if order falls in current period
    if (dateObj >= boundaries.startDate && dateObj <= boundaries.endDate) {
      if (!ordersByDateKey[dateKey]) {
        ordersByDateKey[dateKey] = [];
      }
      ordersByDateKey[dateKey].push({
        order,
        vendorItems,
        vendorSubtotal,
        itemsCount
      });
    }

    // Check if order falls in preceding comparison period
    if (dateObj >= boundaries.prevStartDate && dateObj <= boundaries.prevEndDate) {
      prevTotalGrossSales += vendorSubtotal;
    }
  });

  // Assemble daily buckets for each day in range
  const dailyBuckets: DaySalesBucket[] = dateList.map(dateObj => {
    const dateKey = formatDateKey(dateObj);
    const dayIndex = dateObj.getDay();
    const dayLabel = `${DAY_NAMES[dayIndex]} ${dateObj.getDate()}`;
    const displayDate = formatDisplayDate(dateObj);
    const fullDateLabel = `${dateObj.toLocaleDateString('en-IN', { weekday: 'long' })}, ${displayDate}`;
    const isToday = dateKey === anchorKey;

    const contributingOrders = ordersByDateKey[dateKey] || [];
    const grossSales = contributingOrders.reduce((sum, o) => sum + o.vendorSubtotal, 0);
    const commission = Math.round(grossSales * commissionRate);
    const netEarnings = grossSales - commission;
    const ordersCount = contributingOrders.length;
    const itemsSold = contributingOrders.reduce((sum, o) => sum + o.itemsCount, 0);

    return {
      dateKey,
      dateObj,
      dayLabel,
      displayDate,
      fullDateLabel,
      grossSales,
      commission,
      netEarnings,
      ordersCount,
      itemsSold,
      isToday,
      contributingOrders
    };
  });

  // Calculate totals
  const totalGrossSales = dailyBuckets.reduce((sum, b) => sum + b.grossSales, 0);
  const totalCommission = dailyBuckets.reduce((sum, b) => sum + b.commission, 0);
  const totalNetEarnings = dailyBuckets.reduce((sum, b) => sum + b.netEarnings, 0);
  const totalOrdersCount = dailyBuckets.reduce((sum, b) => sum + b.ordersCount, 0);
  const totalItemsSold = dailyBuckets.reduce((sum, b) => sum + b.itemsSold, 0);
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalGrossSales / totalOrdersCount) : 0;
  const maxDailyGrossSales = Math.max(...dailyBuckets.map(b => b.grossSales), 1);

  // Compute comparison percentage with graceful zero division handling
  let percentageChange: number | null = null;
  let percentageChangeFormatted = '0%';
  let percentageDirection: 'up' | 'down' | 'neutral' = 'neutral';

  if (prevTotalGrossSales === 0) {
    if (totalGrossSales > 0) {
      percentageChange = 100;
      percentageChangeFormatted = '+100% (New sales)';
      percentageDirection = 'up';
    } else {
      percentageChange = 0;
      percentageChangeFormatted = '0% (No change)';
      percentageDirection = 'neutral';
    }
  } else {
    const rawPct = ((totalGrossSales - prevTotalGrossSales) / prevTotalGrossSales) * 100;
    const rounded = Math.round(rawPct);
    percentageChange = rounded;
    if (rounded > 0) {
      percentageChangeFormatted = `+${rounded}%`;
      percentageDirection = 'up';
    } else if (rounded < 0) {
      percentageChangeFormatted = `${rounded}%`;
      percentageDirection = 'down';
    } else {
      percentageChangeFormatted = '0%';
      percentageDirection = 'neutral';
    }
  }

  return {
    rangeType,
    rangeLabel: boundaries.label,
    startDate: boundaries.startDate,
    endDate: boundaries.endDate,
    prevStartDate: boundaries.prevStartDate,
    prevEndDate: boundaries.prevEndDate,
    daysCount: boundaries.daysCount,
    totalGrossSales,
    totalCommission,
    totalNetEarnings,
    totalOrdersCount,
    totalItemsSold,
    avgOrderValue,
    prevTotalGrossSales,
    percentageChange,
    percentageChangeFormatted,
    percentageDirection,
    dailyBuckets,
    maxDailyGrossSales
  };
}
