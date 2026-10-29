import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, Sparkles } from 'lucide-react';
import { HomeBanner, BannerCarouselSettings } from '../types.ts';

interface CustomerHomeBannerCarouselProps {
  banners: HomeBanner[];
  settings: BannerCarouselSettings;
  onNavigateCta: (banner: HomeBanner) => void;
}

export const CustomerHomeBannerCarousel: React.FC<CustomerHomeBannerCarouselProps> = ({
  banners,
  settings,
  onNavigateCta,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Reset current index if it goes out of bounds when banners change
  useEffect(() => {
    if (currentIndex >= banners.length && banners.length > 0) {
      setCurrentIndex(0);
    }
  }, [banners.length, currentIndex]);

  const totalBanners = banners.length;

  const handleNext = useCallback(() => {
    if (totalBanners <= 1) return;
    setCurrentIndex(prev => (prev + 1) % totalBanners);
  }, [totalBanners]);

  const handlePrev = useCallback(() => {
    if (totalBanners <= 1) return;
    setCurrentIndex(prev => (prev - 1 + totalBanners) % totalBanners);
  }, [totalBanners]);

  // Check user prefers-reduced-motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Determine if autoplay should run
  const shouldAutoPlay =
    settings.isAutoRotateEnabled &&
    totalBanners > 1 &&
    !isManuallyPaused &&
    !prefersReducedMotion &&
    !(settings.pauseOnHover && isHovered) &&
    !(settings.pauseOnInteraction && isUserInteracting);

  // Interval timer in milliseconds: support 1s, 2s, 3s, 4s, 5s, 7s, 10s
  const intervalMs = Math.max(1000, (settings.autoRotateIntervalSeconds || 5) * 1000);

  useEffect(() => {
    if (!shouldAutoPlay) return;

    const timer = setInterval(() => {
      handleNext();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [shouldAutoPlay, intervalMs, handleNext]);

  // Touch Swipe Handlers for mobile touch devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (settings.pauseOnInteraction) {
      setIsUserInteracting(true);
    }
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    // Minimum swipe threshold (40px)
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext(); // swipe left -> next
      } else {
        handlePrev(); // swipe right -> prev
      }
    }

    setTouchStartX(null);
    if (settings.pauseOnInteraction) {
      // Resume autoplay shortly after interaction stops
      setTimeout(() => setIsUserInteracting(false), 2500);
    }
  };

  if (totalBanners === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex] || banners[0];
  const hasMultiple = totalBanners > 1;
  const isImageFailed = imageErrors[currentBanner.id];

  return (
    <div
      className="p-3"
      onMouseEnter={() => {
        if (settings.pauseOnHover) setIsHovered(true);
      }}
      onMouseLeave={() => {
        if (settings.pauseOnHover) setIsHovered(false);
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-roledescription="carousel"
      aria-label="Promotional Banners"
    >
      <div className="relative w-full rounded-2xl overflow-hidden shadow-sm transition-all duration-300">
        {/* Banner Slide Container */}
        {currentBanner.displayMode === 'artwork' ? (
          /* MODE A: IMAGE ARTWORK BANNER (No text overlays, preserves aspect ratio) */
          <div
            onClick={() => onNavigateCta(currentBanner)}
            className="w-full relative overflow-hidden rounded-2xl cursor-pointer group bg-slate-950 flex items-center justify-center min-h-[140px] sm:min-h-[180px] shadow-sm select-none"
            role="button"
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onNavigateCta(currentBanner);
              }
            }}
          >
            {currentBanner.imageUrl && !isImageFailed ? (
              <img
                src={currentBanner.imageUrl}
                alt={currentBanner.altText || currentBanner.title || 'Promotional Banner Artwork'}
                onError={() => {
                  setImageErrors(prev => ({ ...prev, [currentBanner.id]: true }));
                }}
                className="w-full h-auto max-h-[220px] sm:max-h-[260px] object-contain sm:object-cover mx-auto transition-transform duration-300 group-hover:scale-[1.01]"
                loading="eager"
              />
            ) : (
              <div className="py-12 px-4 text-center text-white/90">
                <p className="font-black text-sm sm:text-base">{currentBanner.title}</p>
                <p className="text-xs text-emerald-300 mt-1">Tap to explore special deals &rarr;</p>
              </div>
            )}

            {/* Accessible Pause/Play Button */}
            {hasMultiple && (
              <div className="absolute top-2.5 right-2.5 z-20">
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    setIsManuallyPaused(prev => !prev);
                  }}
                  className="w-6 h-6 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs backdrop-blur-xs"
                  title={isManuallyPaused ? 'Resume auto-rotation' : 'Pause auto-rotation'}
                  aria-label={isManuallyPaused ? 'Resume auto-rotation' : 'Pause auto-rotation'}
                >
                  {isManuallyPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
                </button>
              </div>
            )}

            {/* Previous / Next Arrow Controls */}
            {hasMultiple && settings.showArrows && (
              <>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all opacity-80 hover:opacity-100 cursor-pointer z-20 backdrop-blur-xs"
                  aria-label="Previous Banner"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[3]" />
                </button>

                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all opacity-80 hover:opacity-100 cursor-pointer z-20 backdrop-blur-xs"
                  aria-label="Next Banner"
                >
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>
              </>
            )}
          </div>
        ) : (
          /* MODE B: HTML / TEXT BANNER (Structured card layout with styled overlays) */
          <div className="w-full bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-600 text-white p-4 sm:p-5 relative min-h-[155px] sm:min-h-[170px] flex flex-col justify-between overflow-hidden">
            {/* Background Decorative Blur & Elements */}
            <div className="absolute right-0 top-0 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

            {/* Banner Background Graphic Image (with fallback gradient & blend) */}
            {currentBanner.imageUrl && !isImageFailed && (
              <img
                src={currentBanner.imageUrl}
                alt={currentBanner.altText || currentBanner.title || 'Promotional Banner'}
                onError={() => {
                  setImageErrors(prev => ({ ...prev, [currentBanner.id]: true }));
                }}
                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30 select-none pointer-events-none transition-opacity duration-300"
                loading="eager"
              />
            )}

            {/* Top Row: Offer Badge & Motion Pause Control */}
            <div className="flex items-start justify-between gap-2 z-10">
              <div className="flex flex-wrap items-center gap-1.5">
                {currentBanner.offerLabel ? (
                  <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-xs text-emerald-100 text-[10px] sm:text-xs font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-2xs">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>{currentBanner.offerLabel}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-white/15 text-emerald-100 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                    <span>Hospete Fresh Deal</span>
                  </span>
                )}

                {/* Display order indicator on multi-banner */}
                {hasMultiple && (
                  <span className="text-[10px] text-white/70 font-mono font-bold bg-black/20 px-1.5 py-0.5 rounded">
                    {currentIndex + 1}/{totalBanners}
                  </span>
                )}
              </div>

              {/* Accessible Pause/Play Button */}
              {hasMultiple && (
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    setIsManuallyPaused(prev => !prev);
                  }}
                  className="w-6 h-6 rounded-full bg-black/25 hover:bg-black/40 text-white/90 flex items-center justify-center transition-colors cursor-pointer"
                  title={isManuallyPaused ? 'Resume auto-rotation' : 'Pause auto-rotation'}
                  aria-label={isManuallyPaused ? 'Resume auto-rotation' : 'Pause auto-rotation'}
                >
                  {isManuallyPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
                </button>
              )}
            </div>

            {/* Center Copy: Customer-Facing Headline & Description */}
            <div className="my-2 z-10">
              <h2 className="text-base sm:text-xl font-black leading-tight drop-shadow-xs max-w-[340px]">
                {currentBanner.headline}
              </h2>
              {currentBanner.description && (
                <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-[320px] line-clamp-2 leading-relaxed">
                  {currentBanner.description}
                </p>
              )}
            </div>

            {/* Bottom Bar: Promo Code & Action CTA Button */}
            <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/15 z-10">
              <div>
                {currentBanner.promoCode ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-emerald-200 uppercase font-bold hidden sm:inline">Use code:</span>
                    <span className="bg-white text-emerald-950 text-[11px] sm:text-xs font-black font-mono px-2.5 py-0.5 rounded shadow-xs select-all">
                      {currentBanner.promoCode}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-emerald-200 font-medium">
                    ⚡ 15-min doorstep delivery in Hospete
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => onNavigateCta(currentBanner)}
                className="bg-amber-400 hover:bg-amber-300 active:scale-95 text-amber-950 text-xs sm:text-sm font-black px-3.5 py-1.5 rounded-xl shadow-xs transition-transform cursor-pointer flex items-center gap-1"
              >
                <span>{currentBanner.ctaText || 'Claim Offer'}</span>
                <span className="text-sm">&rarr;</span>
              </button>
            </div>

            {/* Previous / Next Arrow Controls (Desktop / Tablet or when enabled) */}
            {hasMultiple && settings.showArrows && (
              <>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all opacity-80 hover:opacity-100 cursor-pointer z-20"
                  aria-label="Previous Banner"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[3]" />
                </button>

                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all opacity-80 hover:opacity-100 cursor-pointer z-20"
                  aria-label="Next Banner"
                >
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>
              </>
            )}
          </div>
        )}

        {/* Slide Indicator Dots */}
        {hasMultiple && settings.showIndicators && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 pointer-events-auto">
            {banners.map((b, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={b.id || idx}
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={`transition-all rounded-full cursor-pointer ${
                    isActive
                      ? 'w-5 h-1.5 bg-amber-400 shadow-xs'
                      : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                  }`}
                  aria-label={`Go to slide ${idx + 1}: ${b.title}`}
                  aria-current={isActive ? 'true' : 'false'}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
