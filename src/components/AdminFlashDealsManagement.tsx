import React, { useState, useMemo } from 'react';
import {
  Zap,
  Plus,
  Search,
  Check,
  AlertCircle,
  Clock,
  Trash2,
  Edit3,
  Eye,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  PackageCheck,
  ShieldCheck,
  XCircle,
  HelpCircle
} from 'lucide-react';
import {
  FlashDeal,
  FlashDealsCampaign,
  Product,
  ProductVariant,
  Vendor,
  Category,
  FlashDealPricingType
} from '../types.ts';

interface AdminFlashDealsManagementProps {
  deals: FlashDeal[];
  setDeals: React.Dispatch<React.SetStateAction<FlashDeal[]>>;
  products: Product[];
  vendors: Vendor[];
  setVendors?: React.Dispatch<React.SetStateAction<Vendor[]>>;
  categories: Category[];
  campaign: FlashDealsCampaign;
  setCampaign: React.Dispatch<React.SetStateAction<FlashDealsCampaign>>;
  onPreviewInStore?: () => void;
}

export const AdminFlashDealsManagement: React.FC<AdminFlashDealsManagementProps> = ({
  deals,
  setDeals,
  products,
  vendors,
  setVendors,
  categories,
  campaign,
  setCampaign,
  onPreviewInStore
}) => {
  // Filters & Search
  const [dealSearch, setDealSearch] = useState('');
  const [dealStatusFilter, setDealStatusFilter] = useState<'all' | 'active' | 'scheduled' | 'paused' | 'expired'>('all');
  const [dealCategoryFilter, setDealCategoryFilter] = useState<string>('all');
  const [dealVendorFilter, setDealVendorFilter] = useState<string>('all');

  // Flash deal vendor approval action
  const handleApproveVendor = (vendorId: number) => {
    if (!setVendors) return;
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) return;

    setVendors(prev =>
      prev.map(v => {
        if (v.id === vendorId) {
          const historyEntry = {
            id: `hist-${Date.now()}`,
            adminIdentifier: 'superadmin@hospetegrocery.in',
            previousStatus: v.status,
            newStatus: 'approved' as const,
            reason: 'Approved via Flash Deals Management to enable deal participation.',
            timestamp: new Date().toLocaleString('en-IN')
          };
          const updatedDocs = v.documents?.map(d => ({ ...d, status: 'verified' as const }));
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

    setDeals(prev =>
      prev.map(d => {
        const prod = products.find(p => p.id === d.productId);
        if (prod && prod.vendorId === vendorId) {
          return {
            ...d,
            vendorApproved: true,
            ineligibleReason: undefined
          };
        }
        return d;
      })
    );
  };

  // Modals & Drawers
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<FlashDeal | null>(null);
  const [previewingDeal, setPreviewingDeal] = useState<FlashDeal | null>(null);
  const [deleteConfirmDeal, setDeleteConfirmDeal] = useState<FlashDeal | null>(null);

  // Form Fields
  const [selectedProductId, setSelectedProductId] = useState<number>(products[0]?.id || 1);
  const [selectedVariantId, setSelectedVariantId] = useState<number>(products[0]?.variants[0]?.id || 101);
  const [badgeText, setBadgeText] = useState('20% OFF');
  const [pricingType, setPricingType] = useState<FlashDealPricingType>('percentage_discount');
  const [discountValue, setDiscountValue] = useState<number>(20);
  const [dealStockLimit, setDealStockLimit] = useState<number | ''>(50);
  const [perCustomerLimit, setPerCustomerLimit] = useState<number | ''>(3);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Campaign end time state
  const [campaignHoursInput, setCampaignHoursInput] = useState<number>(3);
  const [campaignMinutesInput, setCampaignMinutesInput] = useState<number>(40);
  const [isCampaignEditing, setIsCampaignEditing] = useState(false);

  // Find currently selected product and variant for form calculations
  const currentFormProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || products[0];
  }, [products, selectedProductId]);

  const currentFormVariant = useMemo(() => {
    if (!currentFormProduct) return null;
    return (
      currentFormProduct.variants.find(v => v.id === selectedVariantId) ||
      currentFormProduct.variants[0]
    );
  }, [currentFormProduct, selectedVariantId]);

  // Calculated deal price for the form
  const calculatedFormPrice = useMemo(() => {
    if (!currentFormVariant) return 0;
    const orig = currentFormVariant.price;
    if (pricingType === 'fixed_price') {
      return Math.max(1, Math.round(discountValue || orig));
    }
    if (pricingType === 'percentage_discount') {
      const pct = Math.min(95, Math.max(1, discountValue || 0));
      return Math.max(1, Math.round(orig * (1 - pct / 100)));
    }
    if (pricingType === 'fixed_discount') {
      const disc = Math.max(0, discountValue || 0);
      return Math.max(1, Math.round(orig - disc));
    }
    return orig;
  }, [currentFormVariant, pricingType, discountValue]);

  const calculatedFormDiscountPercent = useMemo(() => {
    if (!currentFormVariant || currentFormVariant.mrp <= 0) return 0;
    return Math.max(0, Math.round(((currentFormVariant.mrp - calculatedFormPrice) / currentFormVariant.mrp) * 100));
  }, [currentFormVariant, calculatedFormPrice]);

  // Warning if badge discount conflicts with actual price reduction
  const badgeDiscountConflictWarning = useMemo(() => {
    const match = badgeText.match(/(\d+)%\s*OFF/i);
    if (match) {
      const statedPct = parseInt(match[1], 10);
      if (Math.abs(statedPct - calculatedFormDiscountPercent) > 5) {
        return `Badge states "${statedPct}% OFF" but calculated discount against MRP is ${calculatedFormDiscountPercent}%.`;
      }
    }
    return null;
  }, [badgeText, calculatedFormDiscountPercent]);

  // Summary Metrics
  const summaryCounts = useMemo(() => {
    let active = 0;
    let scheduled = 0;
    let paused = 0;
    let expired = 0;

    deals.forEach(d => {
      if (d.status === 'scheduled') scheduled++;
      else if (d.status === 'expired') expired++;
      else if (d.isActive && d.status === 'active') active++;
      else paused++;
    });

    return { total: deals.length, active, scheduled, paused, expired };
  }, [deals]);

  // Check product eligibility
  const checkProductEligibility = (product: Product, variant?: ProductVariant) => {
    if (product.approvalStatus && product.approvalStatus !== 'approved') {
      return { eligible: false, reason: 'Product listing awaiting admin approval' };
    }
    if (product.isActive === false) {
      return { eligible: false, reason: 'Product is currently hidden from storefront' };
    }
    if (product.imageReviewStatus === 'needs_correction') {
      return { eligible: false, reason: 'Product image requires vendor correction' };
    }
    if (product.vendorId) {
      const vendor = vendors.find(v => v.id === product.vendorId);
      if (!vendor || vendor.status !== 'approved') {
        return { eligible: false, reason: 'Vendor is not approved or is suspended' };
      }
    }
    const targetVar = variant || product.variants[0];
    if (!targetVar || targetVar.price <= 0) {
      return { eligible: false, reason: 'No valid variant selling price configured' };
    }
    if (targetVar.stockQty <= 0) {
      return { eligible: false, reason: 'Variant is out of stock' };
    }
    return { eligible: true, reason: 'Approved & Available' };
  };

  // Recommended candidates (bestsellers, high stock, variety)
  const recommendedCandidates = useMemo(() => {
    return products
      .filter(p => {
        const elig = checkProductEligibility(p);
        if (!elig.eligible) return false;
        // Don't recommend if already has an active deal
        const alreadyHasDeal = deals.some(d => d.productId === p.id && d.isActive);
        if (alreadyHasDeal) return false;
        return p.isBestseller || p.variants.some(v => v.stockQty >= 25);
      })
      .slice(0, 4);
  }, [products, deals, vendors]);

  // Filtered & Sorted Deals List
  const filteredDeals = useMemo(() => {
    return deals
      .filter(d => {
        if (dealStatusFilter === 'active') return d.isActive && d.status === 'active';
        if (dealStatusFilter === 'scheduled') return d.status === 'scheduled';
        if (dealStatusFilter === 'paused') return !d.isActive || d.status === 'paused';
        if (dealStatusFilter === 'expired') return d.status === 'expired';
        return true;
      })
      .filter(d => {
        const prod = products.find(p => p.id === d.productId);
        if (!prod) return true;

        if (dealCategoryFilter !== 'all' && prod.categorySlug !== dealCategoryFilter) return false;
        if (dealVendorFilter !== 'all' && String(prod.vendorId) !== dealVendorFilter) return false;

        if (dealSearch.trim()) {
          const q = dealSearch.toLowerCase().trim();
          const prodName = prod.name.toLowerCase();
          const badge = d.badgeText.toLowerCase();
          const vendorName = vendors.find(v => v.id === prod.vendorId)?.businessName.toLowerCase() || '';
          return prodName.includes(q) || badge.includes(q) || vendorName.includes(q);
        }
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [deals, dealStatusFilter, dealCategoryFilter, dealVendorFilter, dealSearch, products, vendors]);

  // Open modal for new deal
  const handleOpenAddDeal = (presetProduct?: Product) => {
    setEditingDeal(null);
    const prod = presetProduct || products[0];
    const vId = prod?.variants[0]?.id || 101;
    setSelectedProductId(prod?.id || 1);
    setSelectedVariantId(vId);
    setBadgeText('20% OFF');
    setPricingType('percentage_discount');
    setDiscountValue(20);
    setDealStockLimit(30);
    setPerCustomerLimit(3);
    setStartDate('');
    // Default end time 4 hours from now
    setEndDate(new Date(Date.now() + 4 * 3600 * 1000).toISOString().slice(0, 16));
    setIsActive(true);
    setFormError(null);
    setIsAddEditModalOpen(true);
  };

  // Open modal for editing deal
  const handleOpenEditDeal = (deal: FlashDeal) => {
    setEditingDeal(deal);
    setSelectedProductId(deal.productId);
    setSelectedVariantId(deal.variantId);
    setBadgeText(deal.badgeText);
    setPricingType(deal.pricingType);
    setDiscountValue(deal.discountValue);
    setDealStockLimit(deal.dealStockLimit || '');
    setPerCustomerLimit(deal.perCustomerLimit || '');
    setStartDate(deal.startDate ? deal.startDate.slice(0, 16) : '');
    setEndDate(deal.endDate ? deal.endDate.slice(0, 16) : '');
    setIsActive(deal.isActive);
    setFormError(null);
    setIsAddEditModalOpen(true);
  };

  // Save deal
  const handleSaveDeal = async () => {
    setFormError(null);

    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) {
      setFormError('Please select a valid product.');
      return;
    }
    const variant = prod.variants.find(v => v.id === selectedVariantId) || prod.variants[0];
    if (!variant) {
      setFormError('Please select a valid variant.');
      return;
    }

    // Eligibility check
    const elig = checkProductEligibility(prod, variant);
    if (!elig.eligible) {
      setFormError(`Product cannot be activated: ${elig.reason}.`);
      return;
    }

    if (!badgeText.trim()) {
      setFormError('Deal badge text is required (e.g. "20% OFF", "BESTSELLER").');
      return;
    }

    if (calculatedFormPrice >= variant.price) {
      setFormError(`Deal price (₹${calculatedFormPrice}) must be lower than the regular price (₹${variant.price}).`);
      return;
    }

    if (startDate && endDate) {
      if (new Date(startDate) >= new Date(endDate)) {
        setFormError('End date/time must be strictly after start date/time.');
        return;
      }
    }

    const nowIso = new Date().toISOString();
    let computedStatus: FlashDeal['status'] = isActive ? 'active' : 'paused';
    if (isActive && startDate) {
      const s = new Date(startDate).getTime();
      if (!isNaN(s) && Date.now() < s) computedStatus = 'scheduled';
    }
    if (isActive && endDate) {
      const e = new Date(endDate).getTime();
      if (!isNaN(e) && Date.now() > e) computedStatus = 'expired';
    }

    const dealPayload: FlashDeal = {
      id: editingDeal ? editingDeal.id : `deal-${prod.id}-${variant.id}-${Date.now().toString(36)}`,
      productId: prod.id,
      variantId: variant.id,
      badgeText: badgeText.trim(),
      pricingType,
      discountValue: Number(discountValue) || 10,
      dealPrice: calculatedFormPrice,
      originalPrice: variant.price,
      originalMrp: variant.mrp,
      calculatedDiscountPercent: calculatedFormDiscountPercent,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      dealStockLimit: dealStockLimit ? Number(dealStockLimit) : undefined,
      dealStockSold: editingDeal ? editingDeal.dealStockSold : 0,
      perCustomerLimit: perCustomerLimit ? Number(perCustomerLimit) : 3,
      isActive,
      status: computedStatus,
      createdAt: editingDeal ? editingDeal.createdAt : nowIso,
      updatedAt: nowIso
    };

    // Optimistic update
    if (editingDeal) {
      setDeals(prev => prev.map(d => (d.id === editingDeal.id ? dealPayload : d)));
    } else {
      setDeals(prev => [dealPayload, ...prev]);
    }

    setIsAddEditModalOpen(false);

    // Persist to REST API
    try {
      if (editingDeal) {
        await fetch(`/api/flash-deals/${editingDeal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dealPayload)
        });
      } else {
        await fetch('/api/flash-deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dealPayload)
        });
      }
    } catch {
      // Offline fallback is already handled
    }
  };

  // Toggle deal pause / activate
  const handleToggleDealActive = async (deal: FlashDeal) => {
    const nextActive = !deal.isActive;
    const nextStatus = nextActive ? 'active' : 'paused';

    setDeals(prev =>
      prev.map(d => (d.id === deal.id ? { ...d, isActive: nextActive, status: nextStatus } : d))
    );

    try {
      await fetch(`/api/flash-deals/${deal.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextActive })
      });
    } catch {
      // fallback
    }
  };

  // Confirm delete deal
  const handleConfirmDeleteDeal = async () => {
    if (!deleteConfirmDeal) return;
    const dealId = deleteConfirmDeal.id;

    setDeals(prev => prev.filter(d => d.id !== dealId));
    setDeleteConfirmDeal(null);

    try {
      await fetch(`/api/flash-deals/${dealId}`, {
        method: 'DELETE'
      });
    } catch {
      // fallback
    }
  };

  // Save updated campaign settings
  const handleSaveCampaignSettings = async () => {
    const targetDate = new Date(Date.now() + (campaignHoursInput * 3600 + campaignMinutesInput * 60) * 1000).toISOString();
    const nextCampaign: FlashDealsCampaign = {
      ...campaign,
      endDateTime: targetDate,
      isEnabled: campaign.isEnabled
    };

    setCampaign(nextCampaign);
    setIsCampaignEditing(false);

    try {
      await fetch('/api/flash-deals/campaign', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextCampaign)
      });
    } catch {
      // fallback
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3 fill-current text-amber-600" />
              <span>Promotional Pricing</span>
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-bold text-slate-500">Customer Home Storefront</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Flash Deals Management
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Create, schedule, and moderate limited-time promotional pricing on approved products. Configure deal badges, discount rules, quantity limits, and campaign countdowns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onPreviewInStore && (
            <button
              type="button"
              onClick={onPreviewInStore}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4 text-slate-600" />
              <span>Preview Customer View</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleOpenAddDeal()}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Add New Flash Deal</span>
          </button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
            Total Flash Deals
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
            {summaryCounts.total}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Configured promotional offers</span>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-200/80 p-4 shadow-2xs bg-emerald-50/20">
          <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">
            Active Deals
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1 tabular-nums">
            {summaryCounts.active}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">Live in customer home section</span>
        </div>

        <div className="bg-white rounded-2xl border border-blue-200/80 p-4 shadow-2xs bg-blue-50/20">
          <span className="text-[10px] font-black uppercase text-blue-800 tracking-wider block">
            Scheduled
          </span>
          <div className="text-2xl font-black text-blue-700 mt-1 tabular-nums">
            {summaryCounts.scheduled}
          </div>
          <span className="text-[11px] text-blue-600 font-semibold mt-0.5 block">Awaiting start datetime</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
            Paused / Expired
          </span>
          <div className="text-2xl font-black text-slate-600 mt-1 tabular-nums">
            {summaryCounts.paused + summaryCounts.expired}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Reverted to regular price</span>
        </div>
      </div>

      {/* Campaign Controls & Real-Time Countdown Settings (Requirement 5) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-black text-slate-900">
              Customer Storefront Section & Campaign Countdown
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Customer Section:</span>
            <button
              type="button"
              onClick={() => {
                const next = { ...campaign, isEnabled: !campaign.isEnabled };
                setCampaign(next);
                fetch('/api/flash-deals/campaign', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(next)
                }).catch(() => {});
              }}
              className={`px-3 py-1 text-xs font-black rounded-lg transition-colors cursor-pointer ${
                campaign.isEnabled
                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              {campaign.isEnabled ? 'Active on Home' : 'Section Hidden'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <span className="font-extrabold text-slate-800 block">Section Title in Storefront</span>
            <input
              type="text"
              value={campaign.title}
              onChange={e => setCampaign(prev => ({ ...prev, title: e.target.value }))}
              onBlur={() => {
                fetch('/api/flash-deals/campaign', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(campaign)
                }).catch(() => {});
              }}
              className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
            />
            <span className="text-[11px] text-slate-400">Displays next to the ⚡ icon</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <span className="font-extrabold text-slate-800 block">Campaign Countdown Timer</span>
            {isCampaignEditing ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={72}
                  value={campaignHoursInput}
                  onChange={e => setCampaignHoursInput(Number(e.target.value))}
                  className="w-14 h-8 px-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center"
                />
                <span className="text-slate-500 font-bold">h</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={campaignMinutesInput}
                  onChange={e => setCampaignMinutesInput(Number(e.target.value))}
                  className="w-14 h-8 px-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center"
                />
                <span className="text-slate-500 font-bold">m</span>
                <button
                  type="button"
                  onClick={handleSaveCampaignSettings}
                  className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-xs"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-rose-700 font-black bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-xs tabular-nums">
                  Ends at: {new Date(campaign.endDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button
                  type="button"
                  onClick={() => setIsCampaignEditing(true)}
                  className="text-blue-600 hover:text-blue-800 font-bold text-[11px] underline cursor-pointer"
                >
                  Adjust Duration
                </button>
              </div>
            )}
            <span className="text-[11px] text-slate-400">Matches reference screenshot "Ends in 3h 40m"</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <span className="font-extrabold text-slate-800 block">Cart Validation Safeguard</span>
            <div className="text-[11px] text-slate-600 leading-tight">
              ✅ Server enforces quantity limits, stock availability, and automatic reversion to regular price when a deal expires.
            </div>
          </div>
        </div>
      </div>

      {/* Advisory Deal Recommendations Section (Requirement 6) */}
      {recommendedCandidates.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <h3 className="text-xs sm:text-sm font-black text-amber-950 uppercase tracking-wide">
              Smart Deal Recommendations (Advisory)
            </h3>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-200/60 px-2 py-0.2 rounded-full">
              Bestsellers & High Stock
            </span>
          </div>
          <p className="text-[11px] text-amber-900/80">
            These approved products have high customer demand or surplus stock. Click "Create Deal" to pre-fill a promotional price.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
            {recommendedCandidates.map(prod => {
              const defVar = prod.variants[0];
              const vendor = vendors.find(v => v.id === prod.vendorId);
              return (
                <div
                  key={prod.id}
                  className="bg-white rounded-xl border border-amber-200/80 p-3 flex flex-col justify-between shadow-2xs"
                >
                  <div className="flex items-start gap-2.5">
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-12 h-12 rounded-lg object-cover bg-slate-50 border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-black text-xs text-slate-900 truncate">{prod.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{vendor?.businessName || 'Local Supplier'}</div>
                      <div className="text-[10px] font-bold text-emerald-700 mt-0.5">
                        ₹{defVar.price} <span className="line-through text-slate-400 font-normal">₹{defVar.mrp}</span> ({defVar.stockQty} in stock)
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenAddDeal(prod)}
                    className="mt-2 w-full py-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-[11px] rounded-lg shadow-2xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3 stroke-[3]" />
                    <span>Quick Create Deal</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={dealSearch}
              onChange={e => setDealSearch(e.target.value)}
              placeholder="Search by product name, badge, or vendor..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 focus:bg-white text-slate-900 font-medium placeholder:text-slate-400"
            />
          </div>

          {/* Category Filter */}
          <select
            value={dealCategoryFilter}
            onChange={e => setDealCategoryFilter(e.target.value)}
            className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.slug} value={c.slug}>
                {c.iconEmoji} {c.name}
              </option>
            ))}
          </select>

          {/* Vendor Filter */}
          <select
            value={dealVendorFilter}
            onChange={e => setDealVendorFilter(e.target.value)}
            className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="all">All Vendors</option>
            {vendors.map(v => (
              <option key={v.id} value={String(v.id)}>
                {v.businessName}
              </option>
            ))}
          </select>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            {[
              { id: 'all', label: 'All', count: summaryCounts.total },
              { id: 'active', label: 'Active', count: summaryCounts.active },
              { id: 'scheduled', label: 'Scheduled', count: summaryCounts.scheduled },
              { id: 'paused', label: 'Paused', count: summaryCounts.paused }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDealStatusFilter(tab.id as any)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  dealStatusFilter === tab.id
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-black bg-slate-200 text-slate-700">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="p-3.5 pl-5">Product & Variant</th>
              <th className="p-3.5">Category & Vendor</th>
              <th className="p-3.5">Deal Badge</th>
              <th className="p-3.5">Pricing & Savings</th>
              <th className="p-3.5">Stock & Limits</th>
              <th className="p-3.5">Schedule</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right pr-5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDeals.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-10 text-center text-slate-400">
                  <Zap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">No Flash Deals Found</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {dealSearch ? 'Try clearing your search query' : 'Click "+ Add New Flash Deal" to create an offer.'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredDeals.map(deal => {
                const prod = products.find(p => p.id === deal.productId);
                const variant = prod?.variants.find(v => v.id === deal.variantId) || prod?.variants[0];
                const vendor = vendors.find(v => v.id === prod?.vendorId);
                const elig = prod ? checkProductEligibility(prod, variant) : { eligible: false, reason: 'Product removed' };

                return (
                  <tr key={deal.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Product & Variant */}
                    <td className="p-3.5 pl-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {prod?.imageUrl ? (
                            <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">🛍️</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate max-w-[180px]">{prod?.name || 'Unknown Product'}</div>
                          <div className="text-[11px] text-slate-500 font-medium">Pack: {variant?.packSize}</div>
                          {!elig.eligible && (
                            <div className="flex flex-col gap-1 mt-1">
                              <span className="inline-block px-1.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold rounded">
                                ⚠️ {elig.reason}
                              </span>
                              {prod?.vendorId && vendor && vendor.status !== 'approved' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApproveVendor(vendor.id);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[10px] font-black rounded shadow-2xs cursor-pointer transition-all w-fit"
                                  title={`Approve ${vendor.businessName} to make this deal eligible`}
                                >
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>Approve Vendor ({vendor.businessName})</span>
                                </button>
                              )}
                            </div>
                          )}
                          {elig.eligible && deal.vendorApproved && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 font-bold mt-0.5">
                              <Check className="w-3 h-3" /> Vendor Opted-In
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category & Vendor */}
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800 capitalize">{prod?.categorySlug}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[140px]">{vendor?.businessName}</div>
                    </td>

                    {/* Badge */}
                    <td className="p-3.5">
                      <span className="inline-block px-2.5 py-1 bg-rose-600 text-white font-black text-[10px] rounded-lg uppercase shadow-2xs">
                        {deal.badgeText}
                      </span>
                    </td>

                    {/* Pricing & Savings */}
                    <td className="p-3.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-black text-slate-900 text-sm">₹{deal.dealPrice}</span>
                        <span className="line-through text-slate-400 text-xs">₹{deal.originalPrice}</span>
                        {deal.originalMrp > deal.originalPrice && (
                          <span className="text-[10px] text-slate-400">MRP ₹{deal.originalMrp}</span>
                        )}
                      </div>
                      <div className="text-[10px] font-bold text-emerald-700 mt-0.5">
                        Save ₹{deal.originalPrice - deal.dealPrice} ({deal.calculatedDiscountPercent}% off)
                      </div>
                    </td>

                    {/* Stock & Limits */}
                    <td className="p-3.5">
                      <div className="text-[11px] text-slate-700">
                        In Stock: <strong>{variant?.stockQty || 0}</strong>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Deal Limit: {deal.dealStockLimit ? `${deal.dealStockSold || 0}/${deal.dealStockLimit}` : 'Unlimited'}
                      </div>
                      {deal.perCustomerLimit && (
                        <div className="text-[10px] text-slate-500">Max {deal.perCustomerLimit}/order</div>
                      )}
                    </td>

                    {/* Schedule */}
                    <td className="p-3.5 text-[11px]">
                      {deal.startDate || deal.endDate ? (
                        <div className="space-y-0.5 text-slate-600">
                          {deal.startDate && <div>From: {deal.startDate.slice(0, 16).replace('T', ' ')}</div>}
                          {deal.endDate && <div>To: {deal.endDate.slice(0, 16).replace('T', ' ')}</div>}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-medium">Until Paused</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          deal.status === 'active' && deal.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : deal.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-800'
                            : deal.status === 'expired'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {deal.isActive ? deal.status : 'Paused'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewingDeal(deal)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
                          title="Preview Product Card"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditDeal(deal)}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg cursor-pointer"
                          title="Edit Deal"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleDealActive(deal)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                            deal.isActive
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {deal.isActive ? 'Pause' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmDeal(deal)}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg cursor-pointer"
                          title="Delete Deal"
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

      {/* Mobile Stacked Card View */}
      <div className="md:hidden space-y-3">
        {filteredDeals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
            <Zap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">No Flash Deals Found</p>
          </div>
        ) : (
          filteredDeals.map(deal => {
            const prod = products.find(p => p.id === deal.productId);
            const variant = prod?.variants.find(v => v.id === deal.variantId) || prod?.variants[0];

            return (
              <div key={deal.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                    <img src={prod?.imageUrl} alt={prod?.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-xs text-slate-900 truncate">{prod?.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">{variant?.packSize}</div>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="font-black text-sm text-slate-900">₹{deal.dealPrice}</span>
                      <span className="line-through text-slate-400 text-xs">₹{deal.originalPrice}</span>
                      <span className="text-emerald-700 font-bold text-[10px]">({deal.calculatedDiscountPercent}% off)</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded">
                        {deal.badgeText}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          deal.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {deal.isActive ? deal.status : 'Paused'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <div className="text-[11px] text-slate-500">
                    Stock: {variant?.stockQty} | Limit: {deal.dealStockLimit || '∞'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewingDeal(deal)}
                      className="p-1.5 bg-slate-100 text-slate-700 rounded-lg"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditDeal(deal)}
                      className="p-1.5 bg-blue-50 text-blue-700 rounded-lg"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleDealActive(deal)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border ${
                        deal.isActive
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {deal.isActive ? 'Pause' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmDeal(deal)}
                      className="p-1.5 bg-rose-50 text-rose-700 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* =========================================================================
          MODAL: ADD / EDIT FLASH DEAL
          ========================================================================= */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500 fill-current" />
                  <span>{editingDeal ? 'Edit Flash Deal' : 'Configure New Flash Deal'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set promotional pricing, discount badge, purchase limits, and scheduling.
                </p>
              </div>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-800 flex-1">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. PRODUCT SELECTION */}
              <div>
                <label className="block font-black text-slate-700 uppercase text-[10px] mb-1">
                  Select Product *
                </label>
                <select
                  value={selectedProductId}
                  disabled={Boolean(editingDeal)}
                  onChange={e => {
                    const pId = Number(e.target.value);
                    setSelectedProductId(pId);
                    const prod = products.find(p => p.id === pId);
                    if (prod && prod.variants.length > 0) {
                      setSelectedVariantId(prod.variants[0].id);
                    }
                  }}
                  className="w-full h-10 px-3 font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none cursor-pointer"
                >
                  {products.map(p => {
                    const elig = checkProductEligibility(p);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.categorySlug}) - {elig.eligible ? '✅ Eligible' : `⚠️ ${elig.reason}`}
                      </option>
                    );
                  })}
                </select>

                {currentFormProduct && !checkProductEligibility(currentFormProduct).eligible && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-amber-900 font-semibold">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{checkProductEligibility(currentFormProduct).reason}</span>
                    </div>
                    {currentFormProduct.vendorId && (() => {
                      const v = vendors.find(x => x.id === currentFormProduct.vendorId);
                      if (!v || v.status === 'approved') return null;
                      return (
                        <button
                          type="button"
                          onClick={() => handleApproveVendor(v.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs shrink-0 cursor-pointer flex items-center gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Approve {v.businessName}</span>
                        </button>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* 2. VARIANT SELECTION */}
              {currentFormProduct && (
                <div>
                  <label className="block font-black text-slate-700 uppercase text-[10px] mb-1">
                    Select Pack Size / Variant *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {currentFormProduct.variants.map(v => {
                      const isSelected = v.id === selectedVariantId;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVariantId(v.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs ring-2 ring-emerald-300'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                          }`}
                        >
                          <div className="font-bold text-slate-900 text-xs">{v.packSize}</div>
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            Regular: <strong>₹{v.price}</strong> | MRP: ₹{v.mrp}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Stock: {v.stockQty} units
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. PRICING CONFIGURATION (Requirement 4) */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="font-black text-slate-800 uppercase text-[10px] block">
                  Promotional Deal Pricing Rule *
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'percentage_discount', label: 'Discount Percentage (%)' },
                    { id: 'fixed_discount', label: 'Fixed Discount (₹ Off)' },
                    { id: 'fixed_price', label: 'Direct Flash Price (₹)' }
                  ].map(method => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPricingType(method.id as any)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                        pricingType === method.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      {pricingType === 'percentage_discount'
                        ? 'Discount Percentage (%)'
                        : pricingType === 'fixed_discount'
                        ? 'Discount Amount (₹)'
                        : 'Exact Flash Deal Price (₹)'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={pricingType === 'percentage_discount' ? 95 : 10000}
                      value={discountValue}
                      onChange={e => setDiscountValue(Number(e.target.value))}
                      className="w-full h-10 px-3 font-black text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-black">Calculated Storefront Price:</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-emerald-700">₹{calculatedFormPrice}</span>
                      <span className="text-xs line-through text-slate-400">₹{currentFormVariant?.price}</span>
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                        {calculatedFormDiscountPercent}% OFF MRP
                      </span>
                    </div>
                  </div>
                </div>

                {badgeDiscountConflictWarning && (
                  <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{badgeDiscountConflictWarning}</span>
                  </div>
                )}
              </div>

              {/* 4. DEAL BADGE TEXT */}
              <div>
                <label className="block font-black text-slate-700 uppercase text-[10px] mb-1">
                  Deal Badge Text *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={badgeText}
                    onChange={e => setBadgeText(e.target.value)}
                    placeholder="e.g. 20% OFF or BESTSELLER"
                    className="flex-1 h-10 px-3 font-black uppercase text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                  />
                  {/* Preset Buttons */}
                  <div className="flex gap-1">
                    {['20% OFF', 'BESTSELLER', 'VALUE PACK', 'DAILY DEAL'].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setBadgeText(preset)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px]"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5. LIMITS & SCHEDULING */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-black text-slate-700 uppercase text-[10px] mb-1">
                    Max Deal Stock Limit (Optional)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={dealStockLimit}
                    onChange={e => setDealStockLimit(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 50 units"
                    className="w-full h-10 px-3 font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Reverts to regular price when reached</span>
                </div>

                <div>
                  <label className="block font-black text-slate-700 uppercase text-[10px] mb-1">
                    Per-Customer Purchase Limit (Optional)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={perCustomerLimit}
                    onChange={e => setPerCustomerLimit(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 3 items per customer"
                    className="w-full h-10 px-3 font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Prevents hoarding on extreme discounts</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-black text-slate-700 uppercase text-[10px] mb-1">
                    Start Datetime (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full h-10 px-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-700 uppercase text-[10px] mb-1">
                    End Datetime (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full h-10 px-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* 6. LIVE CUSTOMER CARD PREVIEW */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="font-black text-slate-700 uppercase text-[10px]">
                  Live Customer Card Preview
                </span>
                <div className="w-[160px] bg-white border border-rose-100 rounded-2xl p-2.5 shadow-xs">
                  <div className="relative">
                    <span className="absolute top-0 left-0 bg-rose-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-br-lg rounded-tl-md z-10">
                      {badgeText || `${calculatedFormDiscountPercent}% OFF`}
                    </span>
                    <div className="w-full h-24 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center mb-2">
                      <img
                        src={currentFormProduct?.imageUrl}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-[11px] font-bold text-slate-900 line-clamp-2 h-7 leading-tight">
                      {currentFormProduct?.name}
                    </div>
                  </div>
                  <div className="mt-2 pt-1 border-t border-slate-100">
                    <div className="text-[10px] text-slate-500">{currentFormVariant?.packSize}</div>
                    <div className="flex items-baseline gap-1.5 my-1">
                      <span className="text-xs font-black text-slate-900">₹{calculatedFormPrice}</span>
                      <span className="text-[10px] text-slate-400 line-through">₹{currentFormVariant?.mrp}</span>
                    </div>
                    <div className="w-full h-7 bg-emerald-600 text-white font-black text-[11px] rounded-xl flex items-center justify-center gap-1">
                      <Plus className="w-3 h-3 stroke-[3]" />
                      <span>ADD</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsAddEditModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveDeal}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-xs cursor-pointer active:scale-98"
                >
                  {editingDeal ? 'Update Flash Deal' : 'Publish / Activate Flash Deal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: PREVIEW DEAL
          ========================================================================= */}
      {previewingDeal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-black text-sm text-slate-900">Storefront Product Card Preview</h3>
              <button
                onClick={() => setPreviewingDeal(null)}
                className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            {(() => {
              const prod = products.find(p => p.id === previewingDeal.productId);
              const variant = prod?.variants.find(v => v.id === previewingDeal.variantId) || prod?.variants[0];

              return (
                <div className="w-[180px] mx-auto bg-white border border-rose-100 rounded-2xl p-3 shadow-md">
                  <div className="relative">
                    <span className="absolute top-0 left-0 bg-rose-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-br-lg rounded-tl-md z-10">
                      {previewingDeal.badgeText}
                    </span>
                    <div className="w-full h-28 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center mb-2">
                      <img src={prod?.imageUrl} alt={prod?.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-xs font-bold text-slate-900 line-clamp-2 h-8 leading-tight">
                      {prod?.name}
                    </div>
                  </div>
                  <div className="mt-2 pt-1 border-t border-slate-100">
                    <div className="text-[10px] text-slate-500">{variant?.packSize}</div>
                    <div className="flex items-baseline gap-1.5 my-1">
                      <span className="text-sm font-black text-slate-900">₹{previewingDeal.dealPrice}</span>
                      <span className="text-xs text-slate-400 line-through">₹{previewingDeal.originalMrp}</span>
                    </div>
                    <div className="w-full h-8 bg-emerald-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1 shadow-xs">
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>ADD</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setPreviewingDeal(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CONFIRM DELETE DEAL
          ========================================================================= */}
      {deleteConfirmDeal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900">Delete Flash Deal?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to remove this Flash Deal? The product will immediately revert to its regular price in the customer storefront.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                onClick={() => setDeleteConfirmDeal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteDeal}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl shadow-xs"
              >
                Yes, Delete Deal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
