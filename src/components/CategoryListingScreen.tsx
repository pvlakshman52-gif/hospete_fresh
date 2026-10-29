import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  ShoppingBag,
  ChevronDown,
  Plus,
  Minus,
  Check,
  X,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';
import { Product, ProductVariant, CartItem, Vendor, Category } from '../types.ts';

interface CategoryListingScreenProps {
  categorySlug?: string;
  categoryTitle?: string;
  categories?: Category[];
  products: Product[];
  vendors: Vendor[];
  cart: Record<number, CartItem>;
  onBack: () => void;
  onAddToCart: (product: Product, variant: ProductVariant, qty?: number) => void;
  onUpdateQty: (variantId: number, newQty: number) => void;
  onOpenProduct: (product: Product) => void;
  onOpenCart: () => void;
  cartItemCount: number;
}

type SortOption = 'popularity' | 'price_asc' | 'price_desc' | 'discount' | 'rating';

interface SubcategoryPillConfig {
  id: string;
  label: string;
  keyword?: string;
}

interface CircularAvatarConfig {
  id: string;
  label: string;
  imgUrl: string;
  emoji: string;
  bgColor: string;
  keyword: string;
}

export function CategoryListingScreen({
  categorySlug = 'veggies',
  categoryTitle,
  categories = [],
  products,
  vendors,
  cart,
  onBack,
  onAddToCart,
  onUpdateQty,
  onOpenProduct,
  onOpenCart,
  cartItemCount,
}: CategoryListingScreenProps) {
  // Find current category object
  const currentCategory = useMemo(() => {
    return categories.find(c => c.slug === categorySlug);
  }, [categories, categorySlug]);

  // Dynamic Title
  const displayTitle = useMemo(() => {
    if (categoryTitle) return categoryTitle;
    if (currentCategory) {
      if (currentCategory.slug === 'veggies') return 'Vegetables & Fruits';
      return currentCategory.name;
    }
    if (categorySlug === 'veggies' || categorySlug === 'fruits') return 'Vegetables & Fruits';
    return categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1);
  }, [categoryTitle, currentCategory, categorySlug]);

  // Products belonging strictly or broadly to this category
  const baseCategoryProducts = useMemo(() => {
    return products.filter(p => {
      // Veggies & Fruits combined experience as shown in screenshot
      if (categorySlug === 'veggies' || categorySlug === 'fruits') {
        return p.categorySlug === 'veggies' || p.categorySlug === 'fruits';
      }
      return p.categorySlug === categorySlug;
    });
  }, [products, categorySlug]);

  // Dynamic Subcategory Pills based on category
  const subcategoryPills = useMemo<SubcategoryPillConfig[]>(() => {
    if (categorySlug === 'veggies' || categorySlug === 'fruits') {
      return [
        { id: 'all', label: 'All' },
        { id: 'vegetables', label: 'Fresh Vegetables', keyword: 'veggies' },
        { id: 'fruits', label: 'Fresh Fruits', keyword: 'fruits' },
        { id: 'organic', label: 'Organic & Hydroponic', keyword: 'organic' },
      ];
    }

    if (categorySlug === 'snacks') {
      return [
        { id: 'all', label: 'All' },
        { id: 'mixture', label: 'Hot Mixture', keyword: 'mixture' },
        { id: 'chips', label: 'Banana & Potato Chips', keyword: 'chips' },
        { id: 'sweets', label: 'Traditional Sweets', keyword: 'pak' },
        { id: 'namkeen', label: 'Namkeen & Savories', keyword: 'roasted' },
      ];
    }

    if (categorySlug === 'oils') {
      return [
        { id: 'all', label: 'All' },
        { id: 'edible_oils', label: 'Cooking & Refined Oils', keyword: 'oil' },
        { id: 'spices', label: 'Whole & Ground Spices', keyword: 'spice' },
        { id: 'ghee_oil', label: 'Pure Ghee & Oils', keyword: 'ghee' },
      ];
    }

    if (categorySlug === 'beverages') {
      return [
        { id: 'all', label: 'All' },
        { id: 'tea', label: 'Tea Leaves & CTC', keyword: 'tea' },
        { id: 'coffee', label: 'Filter Coffee', keyword: 'coffee' },
        { id: 'green_tea', label: 'Green & Herbal', keyword: 'gold' },
      ];
    }

    if (categorySlug === 'household') {
      return [
        { id: 'all', label: 'All' },
        { id: 'soaps', label: 'Bathing Soaps & Bars', keyword: 'sandal' },
        { id: 'cleaners', label: 'Cleaners & Care', keyword: 'clean' },
        { id: 'pooja', label: 'Pooja & Household', keyword: 'pooja' },
      ];
    }

    if (categorySlug === 'dairy') {
      return [
        { id: 'all', label: 'All' },
        { id: 'milk', label: 'Fresh Milk', keyword: 'milk' },
        { id: 'ghee', label: 'Pure Cow Ghee', keyword: 'ghee' },
        { id: 'paneer', label: 'Paneer & Curd', keyword: 'paneer' },
      ];
    }

    if (categorySlug === 'staples') {
      return [
        { id: 'all', label: 'All' },
        { id: 'rice', label: 'Sona Masoori Rice', keyword: 'rice' },
        { id: 'atta', label: 'Chakki Atta', keyword: 'atta' },
        { id: 'dals', label: 'Dals & Pulses', keyword: 'dal' },
      ];
    }

    // Dynamic fallback for any newly added category:
    // Extract unique brands or tags from the products in this category
    const brands = Array.from(new Set(baseCategoryProducts.map(p => p.brand).filter(Boolean)));
    const dynamicPills: SubcategoryPillConfig[] = [{ id: 'all', label: 'All' }];
    brands.slice(0, 4).forEach(b => {
      dynamicPills.push({ id: b.toLowerCase(), label: b, keyword: b });
    });
    return dynamicPills;
  }, [categorySlug, baseCategoryProducts]);

  // Dynamic Circular Avatars based on category
  const circularAvatars = useMemo<CircularAvatarConfig[]>(() => {
    if (categorySlug === 'veggies' || categorySlug === 'fruits') {
      return [
        {
          id: 'leafy_greens',
          label: 'Leafy Greens',
          imgUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=200&q=80',
          emoji: '🥬',
          bgColor: 'bg-emerald-50 border-emerald-200',
          keyword: 'leafy_greens',
        },
        {
          id: 'tomatoes',
          label: 'Tomatoes',
          imgUrl: '/images/tomatoes.jpg',
          emoji: '🍅',
          bgColor: 'bg-rose-50 border-rose-200',
          keyword: 'tomato',
        },
        {
          id: 'onions',
          label: 'Onions',
          imgUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=200&q=80',
          emoji: '🧅',
          bgColor: 'bg-purple-50 border-purple-200',
          keyword: 'onion',
        },
        {
          id: 'potatoes',
          label: 'Potatoes',
          imgUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=200&q=80',
          emoji: '🥔',
          bgColor: 'bg-amber-50 border-amber-200',
          keyword: 'potato',
        },
        {
          id: 'fruits',
          label: 'Bananas & Fruits',
          imgUrl: '/images/bananas.jpg',
          emoji: '🍌',
          bgColor: 'bg-yellow-50 border-yellow-200',
          keyword: 'fruits',
        },
      ];
    }

    if (categorySlug === 'snacks') {
      return [
        {
          id: 'mixture',
          label: 'Hot Mixture',
          imgUrl: '/images/mixture_snacks.jpg',
          emoji: '🍿',
          bgColor: 'bg-amber-50 border-amber-200',
          keyword: 'mixture',
        },
        {
          id: 'banana_chips',
          label: 'Banana Chips',
          imgUrl: '/images/banana_chips.jpg',
          emoji: '🍌',
          bgColor: 'bg-yellow-50 border-yellow-200',
          keyword: 'chips',
        },
        {
          id: 'mysore_pak',
          label: 'Mysore Pak',
          imgUrl: '/images/mixture_snacks.jpg',
          emoji: '🍯',
          bgColor: 'bg-orange-50 border-orange-200',
          keyword: 'mysore',
        },
        {
          id: 'roasted_gram',
          label: 'Roasted Gram',
          imgUrl: '/images/banana_chips.jpg',
          emoji: '🥜',
          bgColor: 'bg-rose-50 border-rose-200',
          keyword: 'roasted',
        },
        {
          id: 'savories',
          label: 'Namkeen',
          imgUrl: '/images/mixture_snacks.jpg',
          emoji: '🥨',
          bgColor: 'bg-red-50 border-red-200',
          keyword: 'namkeen',
        },
      ];
    }

    if (categorySlug === 'oils') {
      return [
        {
          id: 'sunflower',
          label: 'Sunflower Oil',
          imgUrl: '/images/sunflower_oil.jpg',
          emoji: '🌻',
          bgColor: 'bg-amber-50 border-amber-200',
          keyword: 'sunflower',
        },
        {
          id: 'groundnut',
          label: 'Groundnut Oil',
          imgUrl: '/images/sunflower_oil.jpg',
          emoji: '🥜',
          bgColor: 'bg-orange-50 border-orange-200',
          keyword: 'groundnut',
        },
        {
          id: 'chilli',
          label: 'Red Chilli',
          imgUrl: '/images/cat_oils.jpg',
          emoji: '🌶️',
          bgColor: 'bg-rose-50 border-rose-200',
          keyword: 'chilli',
        },
        {
          id: 'masalas',
          label: 'Masalas',
          imgUrl: '/images/cat_oils.jpg',
          emoji: '🧂',
          bgColor: 'bg-yellow-50 border-yellow-200',
          keyword: 'masala',
        },
      ];
    }

    if (categorySlug === 'beverages') {
      return [
        {
          id: 'tata_tea',
          label: 'Tata Tea Gold',
          imgUrl: '/images/tata_tea.jpg',
          emoji: '☕',
          bgColor: 'bg-amber-50 border-amber-200',
          keyword: 'tata',
        },
        {
          id: 'tea_gold',
          label: 'Gold Leaf Tea',
          imgUrl: '/images/tata_tea.jpg',
          emoji: '🫖',
          bgColor: 'bg-orange-50 border-orange-200',
          keyword: 'leaf',
        },
        {
          id: 'coffee',
          label: 'Filter Coffee',
          imgUrl: '/images/cat_beverages.jpg',
          emoji: '☕',
          bgColor: 'bg-purple-50 border-purple-200',
          keyword: 'coffee',
        },
        {
          id: 'green_tea',
          label: 'Green Tea',
          imgUrl: '/images/tata_tea.jpg',
          emoji: '🍵',
          bgColor: 'bg-emerald-50 border-emerald-200',
          keyword: 'green',
        },
      ];
    }

    if (categorySlug === 'household') {
      return [
        {
          id: 'mysore_sandal',
          label: 'Mysore Sandal',
          imgUrl: '/images/mysore_sandal.jpg',
          emoji: '🧼',
          bgColor: 'bg-amber-50 border-amber-200',
          keyword: 'sandal',
        },
        {
          id: 'soaps',
          label: 'Bathing Soaps',
          imgUrl: '/images/mysore_sandal.jpg',
          emoji: '🛁',
          bgColor: 'bg-sky-50 border-sky-200',
          keyword: 'soap',
        },
        {
          id: 'cleaners',
          label: 'Cleaners',
          imgUrl: '/images/cat_household.jpg',
          emoji: '🧴',
          bgColor: 'bg-emerald-50 border-emerald-200',
          keyword: 'clean',
        },
        {
          id: 'pooja',
          label: 'Pooja Care',
          imgUrl: '/images/cat_household.jpg',
          emoji: '🪔',
          bgColor: 'bg-indigo-50 border-indigo-200',
          keyword: 'pooja',
        },
      ];
    }

    if (categorySlug === 'dairy') {
      return [
        {
          id: 'nandini_milk',
          label: 'Nandini Milk',
          imgUrl: '/images/nandini_milk.jpg',
          emoji: '🥛',
          bgColor: 'bg-blue-50 border-blue-200',
          keyword: 'milk',
        },
        {
          id: 'nandini_ghee',
          label: 'Pure Cow Ghee',
          imgUrl: '/images/nandini_ghee.jpg',
          emoji: '🧈',
          bgColor: 'bg-amber-50 border-amber-200',
          keyword: 'ghee',
        },
        {
          id: 'paneer',
          label: 'Fresh Paneer',
          imgUrl: '/images/cat_dairy.jpg',
          emoji: '🧀',
          bgColor: 'bg-emerald-50 border-emerald-200',
          keyword: 'paneer',
        },
        {
          id: 'curd',
          label: 'Curd & Butter',
          imgUrl: '/images/cat_dairy.jpg',
          emoji: '🥣',
          bgColor: 'bg-rose-50 border-rose-200',
          keyword: 'curd',
        },
      ];
    }

    if (categorySlug === 'staples') {
      return [
        {
          id: 'sona_masoori',
          label: 'Sona Masoori',
          imgUrl: '/images/sona_masoori.jpg',
          emoji: '🌾',
          bgColor: 'bg-amber-50 border-amber-200',
          keyword: 'masoori',
        },
        {
          id: 'chakki_atta',
          label: 'Chakki Atta',
          imgUrl: '/images/aashirvaad_atta.jpg',
          emoji: '🥣',
          bgColor: 'bg-orange-50 border-orange-200',
          keyword: 'atta',
        },
        {
          id: 'toor_dal',
          label: 'Toor Dal',
          imgUrl: '/images/cat_staples.jpg',
          emoji: '🫘',
          bgColor: 'bg-yellow-50 border-yellow-200',
          keyword: 'dal',
        },
        {
          id: 'grains',
          label: 'Raw Rice',
          imgUrl: '/images/sona_masoori.jpg',
          emoji: '🍚',
          bgColor: 'bg-emerald-50 border-emerald-200',
          keyword: 'rice',
        },
      ];
    }

    // Dynamic fallback for any newly added custom category:
    // Generate circular avatar chips from distinct products in that category
    const sampleProds = baseCategoryProducts.slice(0, 5);
    if (sampleProds.length > 0) {
      return sampleProds.map((p, idx) => ({
        id: `dyn_${p.id}`,
        label: p.name.split(' ')[0] + ' ' + (p.name.split(' ')[1] || ''),
        imgUrl: p.imageUrl,
        emoji: ['🛍️', '📦', '✨', '🏷️', '⭐'][idx % 5],
        bgColor: ['bg-emerald-50 border-emerald-200', 'bg-amber-50 border-amber-200', 'bg-rose-50 border-rose-200', 'bg-blue-50 border-blue-200', 'bg-purple-50 border-purple-200'][idx % 5],
        keyword: p.name.split(' ')[0].toLowerCase(),
      }));
    }

    return [];
  }, [categorySlug, baseCategoryProducts]);

  // Filter & sort states
  const [activePill, setActivePill] = useState<string>('all');
  const [activeAvatar, setActiveAvatar] = useState<string>('all');
  const [searchInCat, setSearchInCat] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('popularity');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [priceFilter, setPriceFilter] = useState<'all' | 'under30' | '30to60' | 'above60'>('all');
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [discountOnly, setDiscountOnly] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Active filters count for the "Filter [2]" button badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (priceFilter !== 'all') count++;
    if (inStockOnly) count++;
    if (discountOnly) count++;
    if (activeAvatar !== 'all') count++;
    if (activePill !== 'all') count++;
    return count;
  }, [priceFilter, inStockOnly, discountOnly, activeAvatar, activePill]);

  // Fallback image helper
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, label: string) => {
    const target = e.currentTarget;
    target.onerror = null;
    target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="100%" height="100%" fill="%23f8fafc"/><rect x="20" y="20" width="260" height="260" rx="16" fill="%23ecfdf5" stroke="%23bbf7d0" stroke-width="2"/><text x="150" y="140" font-size="42" text-anchor="middle">🥗</text><text x="150" y="180" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle" fill="%23065f46">${encodeURIComponent(label)}</text><text x="150" y="202" font-family="sans-serif" font-size="11" text-anchor="middle" fill="%2316a34a">Hospete Fresh Verified</text></svg>`;
  };

  // Filter products for this Category Listing screen
  const displayedProducts = useMemo(() => {
    return products
      .filter(p => {
        // Category slug matching
        if (categorySlug === 'veggies' || categorySlug === 'fruits') {
          const isVegOrFruit = p.categorySlug === 'veggies' || p.categorySlug === 'fruits';
          if (!isVegOrFruit) return false;
        } else {
          if (p.categorySlug !== categorySlug) return false;
        }

        // Active storefront status
        if (p.isActive === false) return false;
        if (p.approvalStatus && p.approvalStatus !== 'approved') return false;
        if (p.imageReviewStatus === 'needs_correction') return false;

        // Check vendor status
        if (p.vendorId) {
          const v = vendors.find(vend => vend.id === p.vendorId);
          if (v && v.status !== 'approved') return false;
        }

        // Subcategory Pill filter
        if (activePill !== 'all') {
          if (categorySlug === 'veggies' || categorySlug === 'fruits') {
            if (activePill === 'vegetables' && p.categorySlug !== 'veggies') return false;
            if (activePill === 'fruits' && p.categorySlug !== 'fruits') return false;
            if (activePill === 'organic') {
              const isOrg = p.name.toLowerCase().includes('organic') || p.description.toLowerCase().includes('organic');
              if (!isOrg) return false;
            }
          } else {
            const pillConfig = subcategoryPills.find(pill => pill.id === activePill);
            const kw = (pillConfig?.keyword || activePill).toLowerCase();
            const matchesPill =
              p.name.toLowerCase().includes(kw) ||
              p.brand.toLowerCase().includes(kw) ||
              p.description.toLowerCase().includes(kw) ||
              (p.subCategorySlug && p.subCategorySlug.toLowerCase().includes(kw));
            if (!matchesPill) return false;
          }
        }

        // Visual Avatar circular filter
        if (activeAvatar !== 'all') {
          const avatarConfig = circularAvatars.find(a => a.id === activeAvatar);
          if (avatarConfig) {
            const kw = avatarConfig.keyword.toLowerCase();
            if (kw === 'leafy_greens') {
              const isLeafy =
                p.subCategorySlug === 'leafy_greens' ||
                p.name.toLowerCase().includes('coriander') ||
                p.name.toLowerCase().includes('palak') ||
                p.name.toLowerCase().includes('spinach') ||
                p.name.toLowerCase().includes('greens');
              if (!isLeafy) return false;
            } else if (kw === 'fruits') {
              if (p.categorySlug !== 'fruits') return false;
            } else {
              const matchesAvatar =
                p.name.toLowerCase().includes(kw) ||
                p.brand.toLowerCase().includes(kw) ||
                (p.subCategorySlug && p.subCategorySlug.toLowerCase().includes(kw)) ||
                p.description.toLowerCase().includes(kw);
              if (!matchesAvatar) return false;
            }
          }
        }

        // Search within category
        if (searchInCat.trim()) {
          const q = searchInCat.toLowerCase();
          const match =
            p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q);
          if (!match) return false;
        }

        const defVar = p.variants.find(v => v.isDefault) || p.variants[0];

        // In Stock filter
        if (inStockOnly && defVar.stockQty <= 0) return false;

        // Discount filter
        if (discountOnly && defVar.mrp <= defVar.price) return false;

        // Price range filter
        if (priceFilter === 'under30' && defVar.price >= 30) return false;
        if (priceFilter === '30to60' && (defVar.price < 30 || defVar.price > 60)) return false;
        if (priceFilter === 'above60' && defVar.price <= 60) return false;

        return true;
      })
      .sort((a, b) => {
        const aVar = a.variants.find(v => v.isDefault) || a.variants[0];
        const bVar = b.variants.find(v => v.isDefault) || b.variants[0];

        if (sortBy === 'price_asc') return aVar.price - bVar.price;
        if (sortBy === 'price_desc') return bVar.price - aVar.price;
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'discount') {
          const aDisc = (aVar.mrp - aVar.price) / aVar.mrp;
          const bDisc = (bVar.mrp - bVar.price) / bVar.mrp;
          return bDisc - aDisc;
        }
        // Popularity: prioritized bestsellers and deals
        if (a.isBestseller && !b.isBestseller) return -1;
        if (!a.isBestseller && b.isBestseller) return 1;
        return a.id - b.id;
      });
  }, [
    products,
    vendors,
    categorySlug,
    activePill,
    activeAvatar,
    searchInCat,
    sortBy,
    priceFilter,
    inStockOnly,
    discountOnly,
    subcategoryPills,
    circularAvatars,
  ]);

  return (
    <div className="bg-white min-h-full flex flex-col font-sans select-none">
      {/* 1. TOP HEADER (9:41 bar + Nav with Back, Title, Search, Cart Badge) */}
      <div className="sticky top-0 bg-white z-30 border-b border-slate-100 shadow-xs">
        {/* Mobile Device Status Bar */}
        <div className="px-5 pt-2 pb-1 flex items-center justify-between text-xs text-slate-800 font-semibold select-none">
          <span>9:41</span>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px]">📶</span>
            <span className="text-[11px]">⚡</span>
            <div className="w-5 h-2.5 border border-slate-700 rounded-xs p-0.5 flex items-center">
              <div className="w-3.5 h-1.5 bg-slate-800 rounded-2xs"></div>
            </div>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition-transform cursor-pointer"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Title */}
          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex-1 text-left truncate pl-1">
            {displayTitle}
          </h1>

          {/* Right Icons: Search & Cart */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSearchInput(!showSearchInput)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition-transform cursor-pointer"
              aria-label="Search category"
            >
              <Search className="w-5 h-5 stroke-[2.2]" />
            </button>

            <button
              onClick={onOpenCart}
              className="w-9 h-9 rounded-full relative flex items-center justify-center text-slate-800 hover:bg-slate-100 active:scale-95 transition-transform cursor-pointer"
              aria-label="View shopping basket"
            >
              <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
              {cartItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#ef4444] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Optional Search Bar Expand */}
        {showSearchInput && (
          <div className="px-3 pb-2 animate-in fade-in slide-in-from-top-1">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder={`Search in ${displayTitle}...`}
                value={searchInCat}
                onChange={e => setSearchInCat(e.target.value)}
                className="w-full h-8 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-7 text-xs text-slate-800 focus:outline-hidden focus:border-emerald-600 focus:bg-white"
              />
              {searchInCat && (
                <button
                  onClick={() => setSearchInCat('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* 2. SUBCATEGORY PILL FILTER BAR */}
        {subcategoryPills.length > 1 && (
          <div className="px-3 py-1.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {subcategoryPills.map(pill => (
              <button
                key={pill.id}
                onClick={() => {
                  setActivePill(pill.id);
                  if (pill.id === 'fruits') setActiveAvatar('fruits');
                  else if (pill.id === 'vegetables' && activeAvatar === 'fruits') setActiveAvatar('all');
                }}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activePill === pill.id
                    ? 'bg-[#16a34a] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        )}

        {/* 3. VISUAL SUBCATEGORY CIRCULAR AVATARS */}
        {circularAvatars.length > 0 && (
          <div className="px-3 py-2.5 border-t border-slate-100 flex items-center gap-4 overflow-x-auto no-scrollbar">
            {circularAvatars.map(avatar => {
              const isSelected = activeAvatar === avatar.id;
              return (
                <button
                  key={avatar.id}
                  onClick={() => {
                    setActiveAvatar(isSelected ? 'all' : avatar.id);
                  }}
                  className="flex flex-col items-center flex-shrink-0 group cursor-pointer"
                >
                  <div
                    className={`w-14 h-14 rounded-full p-0.5 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'ring-2 ring-[#16a34a] ring-offset-2 scale-105 shadow-sm'
                        : 'hover:scale-102 ring-1 ring-slate-200/80'
                    }`}
                  >
                    <div className={`w-full h-full rounded-full overflow-hidden ${avatar.bgColor} flex items-center justify-center relative`}>
                      <img
                        src={avatar.imgUrl}
                        alt={avatar.label}
                        onError={e => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          if (target.nextElementSibling) {
                            (target.nextElementSibling as HTMLElement).style.display = 'flex';
                          }
                        }}
                        className="w-full h-full object-cover"
                      />
                      <span className="hidden w-full h-full text-xl items-center justify-center">
                        {avatar.emoji}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-semibold mt-1.5 whitespace-nowrap tracking-tight ${
                      isSelected ? 'text-[#16a34a] font-bold' : 'text-slate-700'
                    }`}
                  >
                    {avatar.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* 4. FILTER & SORT TOOLBAR (Sort ▾, Price ▾, Filter [2]) */}
        <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2 text-xs">
          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSortDropdown(!showSortDropdown);
                setShowPriceDropdown(false);
              }}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-800 flex items-center gap-1.5 shadow-2xs active:scale-95 transition-transform cursor-pointer"
            >
              <span>
                {sortBy === 'popularity'
                  ? 'Sort'
                  : sortBy === 'price_asc'
                  ? 'Price: Low'
                  : sortBy === 'price_desc'
                  ? 'Price: High'
                  : sortBy === 'discount'
                  ? 'Discount'
                  : 'Rating'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {showSortDropdown && (
              <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-40 py-1 divide-y divide-slate-100 animate-in fade-in">
                {[
                  { id: 'popularity', label: 'Popularity & Deals' },
                  { id: 'price_asc', label: 'Price: Low to High' },
                  { id: 'price_desc', label: 'Price: High to Low' },
                  { id: 'discount', label: 'Biggest Discount' },
                  { id: 'rating', label: 'Highest Rated' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setSortBy(opt.id as SortOption);
                      setShowSortDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                      sortBy === opt.id ? 'font-bold text-[#16a34a] bg-emerald-50/50' : 'text-slate-700'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {sortBy === opt.id && <Check className="w-3.5 h-3.5 text-[#16a34a]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Price Range Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowPriceDropdown(!showPriceDropdown);
                setShowSortDropdown(false);
              }}
              className={`bg-white border rounded-lg px-3 py-1.5 font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-transform cursor-pointer ${
                priceFilter !== 'all' ? 'border-[#16a34a] text-[#16a34a]' : 'border-slate-200 text-slate-800 hover:border-slate-300'
              }`}
            >
              <span>
                {priceFilter === 'all'
                  ? 'Price'
                  : priceFilter === 'under30'
                  ? 'Under ₹30'
                  : priceFilter === '30to60'
                  ? '₹30 - ₹60'
                  : 'Above ₹60'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {showPriceDropdown && (
              <div className="absolute left-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-40 py-1 divide-y divide-slate-100 animate-in fade-in">
                {[
                  { id: 'all', label: 'All Prices' },
                  { id: 'under30', label: 'Under ₹30' },
                  { id: '30to60', label: '₹30 - ₹60' },
                  { id: 'above60', label: 'Above ₹60' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setPriceFilter(opt.id as any);
                      setShowPriceDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                      priceFilter === opt.id ? 'font-bold text-[#16a34a] bg-emerald-50/50' : 'text-slate-700'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {priceFilter === opt.id && <Check className="w-3.5 h-3.5 text-[#16a34a]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter [2] Button */}
          <button
            onClick={() => setShowFilterModal(true)}
            className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-800 flex items-center gap-1.5 shadow-2xs active:scale-95 transition-transform cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
            <span>Filter</span>
            {activeFiltersCount > 0 && (
              <span className="bg-[#16a34a] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 5. PRODUCT CARDS GRID (2 COLUMNS) */}
      <div className="p-3 flex-1 overflow-y-auto pb-28">
        {displayedProducts.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="text-4xl mb-3">🛍️</div>
            <h3 className="text-sm font-bold text-slate-800">No products found in this category</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Try clearing your active filters or selecting another subcategory to explore items.
            </p>
            <button
              onClick={() => {
                setActivePill('all');
                setActiveAvatar('all');
                setPriceFilter('all');
                setInStockOnly(false);
                setDiscountOnly(false);
                setSearchInCat('');
              }}
              className="mt-4 px-4 py-2 bg-[#16a34a] text-white font-bold text-xs rounded-lg hover:bg-emerald-700 shadow-xs cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {displayedProducts.map(prod => {
              const defVar = prod.variants.find(v => v.isDefault) || prod.variants[0];
              const discountPct = Math.round(((defVar.mrp - defVar.price) / defVar.mrp) * 100);
              const inCart = cart[defVar.id];
              const isOutOfStock = defVar.stockQty <= 0;
              const etaMinutes = prod.deliveryEtaMinutes || 20;

              return (
                <div
                  key={prod.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-2.5 flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-slate-300 transition-all group relative"
                >
                  <div>
                    {/* Top-Left Red Discount Badge */}
                    {discountPct > 0 && (
                      <div className="absolute top-2.5 left-2.5 z-10">
                        <span className="bg-[#ef4444] text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">
                          {discountPct}%
                        </span>
                      </div>
                    )}

                    {/* Centered Product Packshot Image */}
                    <div
                      onClick={() => onOpenProduct(prod)}
                      className="w-full aspect-square bg-slate-50/50 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer mb-1 relative p-1"
                    >
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        onError={e => handleImageError(e, prod.name)}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>

                    {/* Delivery ETA Chip: ⚡ 20 MINS */}
                    <div className="mb-1">
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200/70 text-[10px] font-black px-2 py-0.5 rounded-full">
                        <span className="text-amber-500 text-xs">⚡</span>
                        <span>{etaMinutes} MINS</span>
                      </span>
                    </div>

                    {/* Product Name */}
                    <h3
                      onClick={() => onOpenProduct(prod)}
                      className="text-xs sm:text-sm font-extrabold text-slate-900 line-clamp-2 leading-snug cursor-pointer hover:text-emerald-700 min-h-[34px]"
                    >
                      {prod.name}
                    </h3>

                    {/* Pack size */}
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {defVar.packSize}
                    </div>
                  </div>

                  {/* Price & Action Row */}
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                    {/* Pricing */}
                    <div className="flex flex-col">
                      <span className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                        ₹{defVar.price}
                      </span>
                      {defVar.mrp > defVar.price && (
                        <span className="text-[11px] text-slate-400 line-through leading-none">
                          ₹{defVar.mrp}
                        </span>
                      )}
                    </div>

                    {/* Action Button: Green Add / Stepper */}
                    {isOutOfStock ? (
                      <button
                        disabled
                        className="h-8 px-2 bg-slate-100 text-slate-400 font-bold text-[11px] rounded-lg border border-slate-200 cursor-not-allowed"
                      >
                        Out of Stock
                      </button>
                    ) : inCart ? (
                      <div className="flex items-center justify-between h-8 bg-[#16a34a] text-white rounded-lg px-1.5 shadow-xs min-w-[76px]">
                        <button
                          onClick={() => onUpdateQty(defVar.id, inCart.qty - 1)}
                          className="w-6 h-6 flex items-center justify-center font-bold text-sm hover:bg-emerald-700 rounded active:scale-95 cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                        <span className="text-xs font-black px-1">{inCart.qty}</span>
                        <button
                          onClick={() => onUpdateQty(defVar.id, inCart.qty + 1)}
                          className="w-6 h-6 flex items-center justify-center font-bold text-sm hover:bg-emerald-700 rounded active:scale-95 cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onAddToCart(prod, defVar, 1)}
                        className="h-8 px-3.5 bg-[#16a34a] hover:bg-[#15803d] active:scale-95 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center transition-colors cursor-pointer"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FILTER MODAL / DRAWER */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#16a34a]" />
                <h3 className="text-sm font-extrabold text-slate-900">Filters & Preferences</h3>
              </div>
              <button
                onClick={() => setShowFilterModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              {/* In stock toggle */}
              <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                <div>
                  <span className="font-bold text-slate-800 block">In Stock Products Only</span>
                  <span className="text-[11px] text-slate-500">Hide out of stock items</span>
                </div>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={e => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 accent-[#16a34a] rounded"
                />
              </label>

              {/* Discount only toggle */}
              <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                <div>
                  <span className="font-bold text-slate-800 block">Discounted Offers Only</span>
                  <span className="text-[11px] text-slate-500">Show products with marked down prices</span>
                </div>
                <input
                  type="checkbox"
                  checked={discountOnly}
                  onChange={e => setDiscountOnly(e.target.checked)}
                  className="w-4 h-4 accent-[#16a34a] rounded"
                />
              </label>

              {/* Price range selector */}
              <div className="p-2">
                <span className="font-bold text-slate-800 block mb-2">Price Range</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'all', label: 'All Prices' },
                    { id: 'under30', label: 'Under ₹30' },
                    { id: '30to60', label: '₹30 to ₹60' },
                    { id: 'above60', label: 'Above ₹60' },
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => setPriceFilter(p.id as any)}
                      className={`py-2 px-3 rounded-lg border font-bold text-center transition-all cursor-pointer ${
                        priceFilter === p.id
                          ? 'border-[#16a34a] bg-emerald-50 text-[#16a34a]'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  setPriceFilter('all');
                  setInStockOnly(false);
                  setDiscountOnly(false);
                  setActiveAvatar('all');
                  setActivePill('all');
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Clear Filters
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="px-5 py-2.5 bg-[#16a34a] hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Apply Filters ({displayedProducts.length} items)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
