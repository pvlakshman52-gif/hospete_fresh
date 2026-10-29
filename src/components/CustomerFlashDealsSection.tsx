import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Zap, AlertCircle } from 'lucide-react';
import { FlashDeal, FlashDealsCampaign, Product, ProductVariant, Vendor, CartItem } from '../types.ts';

interface CustomerFlashDealsSectionProps {
  deals: FlashDeal[];
  products: Product[];
  vendors: Vendor[];
  cart: Record<number, CartItem>;
  onAddToCart: (product: Product, variant: ProductVariant, qty: number, deal?: FlashDeal) => void;
  onUpdateQty: (variantId: number, qty: number) => void;
  onOpenProduct: (product: Product) => void;
  campaign?: FlashDealsCampaign | null;
}

export const CustomerFlashDealsSection: React.FC<CustomerFlashDealsSectionProps> = ({
  deals,
  products,
  vendors,
  cart,
  onAddToCart,
  onUpdateQty,
  onOpenProduct,
  campaign
}) => {
  const [now, setNow] = useState(Date.now());
  const [dealLimitNotice, setDealLimitNotice] = useState<string | null>(null);

  // Live timer tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter deals to only active, approved, in-stock products
  const activeDealsWithProducts = useMemo(() => {
    return deals
      .filter(deal => {
        if (!deal.isActive) return false;
        // Check date range
        if (deal.startDate) {
          const s = new Date(deal.startDate).getTime();
          if (!isNaN(s) && now < s) return false;
        }
        if (deal.endDate) {
          const e = new Date(deal.endDate).getTime();
          if (!isNaN(e) && now > e) return false;
        }
        if (deal.dealStockLimit && typeof deal.dealStockSold === 'number' && deal.dealStockSold >= deal.dealStockLimit) {
          return false;
        }
        return true;
      })
      .map(deal => {
        const product = products.find(p => p.id === deal.productId);
        if (!product) return null;
        // Verify product approval & visibility
        if (product.approvalStatus && product.approvalStatus !== 'approved') return null;
        if (product.isActive === false) return null;
        if (product.imageReviewStatus === 'needs_correction') return null;

        // Verify vendor status
        if (product.vendorId) {
          const vendor = vendors.find(v => v.id === product.vendorId);
          if (vendor && vendor.status !== 'approved') return null;
        }

        // Find specific variant for the deal
        const variant = product.variants.find(v => v.id === deal.variantId) || product.variants[0];
        if (!variant || variant.stockQty <= 0) return null;

        return { deal, product, variant };
      })
      .filter((item): item is { deal: FlashDeal; product: Product; variant: ProductVariant } => item !== null);
  }, [deals, products, vendors, now]);

  // If campaign is explicitly disabled or no active deals, cleanly hide
  if ((campaign && !campaign.isEnabled) || activeDealsWithProducts.length === 0) {
    return null;
  }

  // Calculate countdown label from campaign endDateTime or earliest deal end time
  const countdownText = (() => {
    let targetTime: number | null = null;

    if (campaign?.endDateTime) {
      const t = new Date(campaign.endDateTime).getTime();
      if (!isNaN(t)) targetTime = t;
    }

    if (!targetTime) {
      // Find earliest end date among active deals
      const endDates = deals
        .map(d => (d.endDate ? new Date(d.endDate).getTime() : null))
        .filter((t): t is number => t !== null && !isNaN(t) && t > now);
      if (endDates.length > 0) {
        targetTime = Math.min(...endDates);
      }
    }

    if (!targetTime) return null;

    const diffMs = targetTime - now;
    if (diffMs <= 0) return 'Ended';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `Ends in ${hours}h ${mins}m`;
    }
    return `Ends in ${mins}m ${secs}s`;
  })();

  const handleAddDealItem = (product: Product, variant: ProductVariant, deal: FlashDeal) => {
    const existingInCart = cart[variant.id];
    const currentQty = existingInCart ? existingInCart.qty : 0;

    // Validate per-customer limit
    if (deal.perCustomerLimit && currentQty >= deal.perCustomerLimit) {
      setDealLimitNotice(`Maximum deal limit of ${deal.perCustomerLimit} units per order reached for ${product.name}.`);
      setTimeout(() => setDealLimitNotice(null), 3500);
      return;
    }

    // Validate stock
    if (currentQty >= variant.stockQty) {
      setDealLimitNotice(`No more stock available for ${product.name}.`);
      setTimeout(() => setDealLimitNotice(null), 3500);
      return;
    }

    onAddToCart(product, variant, 1, deal);
  };

  const handleUpdateDealQty = (variantId: number, nextQty: number, deal: FlashDeal, product: Product, variant: ProductVariant) => {
    if (nextQty > (cart[variantId]?.qty || 0)) {
      if (deal.perCustomerLimit && nextQty > deal.perCustomerLimit) {
        setDealLimitNotice(`Maximum deal limit of ${deal.perCustomerLimit} reached for ${product.name}.`);
        setTimeout(() => setDealLimitNotice(null), 3500);
        return;
      }
      if (nextQty > variant.stockQty) {
        setDealLimitNotice(`Only ${variant.stockQty} items left in stock.`);
        setTimeout(() => setDealLimitNotice(null), 3500);
        return;
      }
    }
    onUpdateQty(variantId, nextQty);
  };

  return (
    <section id="flash-deals-section" className="px-3 py-2 scroll-mt-2" aria-label="Today's Flash Deals">
      {/* Notice popup if per-customer or stock limit reached */}
      {dealLimitNotice && (
        <div className="mb-2 p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="flex-1">{dealLimitNotice}</span>
          <button
            onClick={() => setDealLimitNotice(null)}
            className="text-amber-700 hover:text-amber-900 font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header with Lightning ⚡ Icon and Countdown */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center text-xs font-black shadow-2xs">
            <Zap className="w-3.5 h-3.5 fill-current" />
          </div>
          <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
            {campaign?.title || "Today's Flash Deals"}
          </h3>
        </div>

        {countdownText && (
          <span className="text-[10px] sm:text-xs font-extrabold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 tabular-nums shadow-2xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>{countdownText}</span>
          </span>
        )}
      </div>

      {/* Horizontally scrollable product cards on mobile, responsive flex on desktop */}
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
        {activeDealsWithProducts.map(({ deal, product, variant }) => {
          const inCart = cart[variant.id];
          const discountPct =
            deal.calculatedDiscountPercent ||
            Math.max(0, Math.round(((variant.mrp - deal.dealPrice) / variant.mrp) * 100));

          return (
            <div
              key={deal.id}
              className="min-w-[145px] max-w-[145px] sm:min-w-[160px] sm:max-w-[160px] bg-white border border-rose-100/90 rounded-2xl p-2.5 flex flex-col justify-between shadow-xs hover:border-emerald-300 hover:shadow-md transition-all duration-200 relative group"
            >
              {/* Product Card Top: Deal Badge & Image */}
              <div className="relative">
                {/* Deal Badge (e.g. "20% OFF", "BESTSELLER", "VALUE PACK") */}
                <span className="absolute top-0 left-0 bg-rose-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-br-lg rounded-tl-md z-10 shadow-xs tracking-wider">
                  {deal.badgeText || `${discountPct}% OFF`}
                </span>

                <div
                  onClick={() => onOpenProduct(product)}
                  className="w-full h-24 sm:h-28 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer mb-2 relative group-hover:bg-slate-100 transition-colors"
                >
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    onError={e => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>

                <div
                  onClick={() => onOpenProduct(product)}
                  className="text-[11px] sm:text-xs font-bold text-slate-900 line-clamp-2 h-7 sm:h-8 leading-tight cursor-pointer hover:text-emerald-700 transition-colors"
                  title={product.name}
                >
                  {product.name}
                </div>
              </div>

              {/* Product Card Bottom: Variant pack, prices, & +ADD button */}
              <div className="mt-2 pt-1 border-t border-slate-100">
                <div className="text-[10px] text-slate-500 font-medium">
                  {variant.packSize}
                </div>

                <div className="flex items-baseline gap-1.5 my-1.5">
                  <span className="text-xs sm:text-sm font-black text-slate-900 tabular-nums">
                    ₹{deal.dealPrice}
                  </span>
                  {variant.mrp > deal.dealPrice && (
                    <span className="text-[10px] sm:text-xs text-slate-400 line-through tabular-nums">
                      ₹{variant.mrp}
                    </span>
                  )}
                </div>

                {/* SOLID GROCERY GREEN ADD BUTTON OR QUANTITY STEPPER */}
                {inCart ? (
                  <div className="flex items-center justify-between h-8 bg-emerald-600 text-white rounded-xl px-1 shadow-xs">
                    <button
                      type="button"
                      onClick={() => handleUpdateDealQty(variant.id, inCart.qty - 1, deal, product, variant)}
                      className="w-6 h-6 flex items-center justify-center font-bold text-sm hover:bg-emerald-700 rounded-lg active:scale-95 cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="text-xs font-black tabular-nums">{inCart.qty}</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateDealQty(variant.id, inCart.qty + 1, deal, product, variant)}
                      className="w-6 h-6 flex items-center justify-center font-bold text-sm hover:bg-emerald-700 rounded-lg active:scale-95 cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAddDealItem(product, variant, deal)}
                    className="w-full h-8 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>ADD</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
