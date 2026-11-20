import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from "lucide-react";
import { useStore } from "../../../context/StoreContext";
import { Button } from "../../../components/ui/Button";

interface HeroCarouselProps {
  onNavigate: (route: string, param?: string) => void;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ onNavigate }) => {
  const { banners } = useStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const activeBanners = banners.filter((b) => b.status === "active").sort((a, b) => a.sortOrder - b.sortOrder);

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeBanners.length, isPaused]);

  if (activeBanners.length === 0) return null;

  const currentBanner = activeBanners[currentIndex] || activeBanners[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden bg-stone-900 shadow-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Banner Image with Gradient Overlay */}
      <div className="relative min-h-[380px] sm:min-h-[440px] lg:min-h-[500px] w-full flex items-center">
        <img
          src={currentBanner.imageUrl}
          alt={currentBanner.title}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/60 to-transparent" />

        {/* Content Container */}
        <div className="relative z-10 max-w-xl px-6 sm:px-12 py-10 text-white space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-emerald-700/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-emerald-100 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Seasonal Botanical Spotlight</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            {currentBanner.title}
          </h1>

          {currentBanner.subtitle && (
            <p className="text-sm sm:text-base text-stone-200 leading-relaxed max-w-md">
              {currentBanner.subtitle}
            </p>
          )}

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => onNavigate(currentBanner.ctaLink || "trending")}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {currentBanner.ctaText || "Shop Now"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-md"
              onClick={() => onNavigate("categories")}
            >
              All Categories
            </Button>
          </div>
        </div>

        {/* Prev / Next Controls */}
        {activeBanners.length > 1 && (
          <div className="absolute right-6 bottom-6 z-20 flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md flex items-center justify-center transition cursor-pointer"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md flex items-center justify-center transition cursor-pointer"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Slide Indicator Dots */}
        {activeBanners.length > 1 && (
          <div className="absolute left-6 sm:left-12 bottom-6 z-20 flex items-center gap-2">
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentIndex === idx
                    ? "w-8 bg-emerald-400"
                    : "w-2 bg-white/40 hover:bg-white/70"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
