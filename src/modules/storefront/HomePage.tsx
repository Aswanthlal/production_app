import { HeroCarousel } from "./components/HeroCarousel";
import { CategoryStrip } from "./components/CategoryStrip";
import { TrendingGrid } from "./components/TrendingGrid";
import { PurposeCollections } from "./components/PurposeCollections";
import { ReviewSlider } from "./components/ReviewSlider";
import { RotateCcw, Sparkles } from "lucide-react";
import { useStore } from "../../context/StoreContext";

interface HomePageProps {
  onNavigate: (route: string, param?: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const { resetToDemoData } = useStore();

  return (
    <div className="space-y-14 sm:space-y-20 pb-16">
      {/* 1. Hero Promotional Carousel */}
      <HeroCarousel onNavigate={onNavigate} />
      {/* 2. Quick Access Circular Categories Strip (Capped at 6 + View All CTA) */}
      <CategoryStrip
        onSelectCategory={(catId) => onNavigate("categoryPlants", catId)}
        onViewAllCategories={() => onNavigate("categories")}
      />

      {/* 3. Trending / Best Sellers Grid (Capped at 6 + View All CTA) */}
      <TrendingGrid
        onViewAllTrending={() => onNavigate("trending")}
        onSelectCategory={(catId) => onNavigate("categoryPlants", catId)}
      />

      {/* 4. Curated Purpose Collections */}
      <PurposeCollections
        onSelectCategory={(catId) => onNavigate("categoryPlants", catId)}
      />

      {/* 5. Customer Reviews Carousel */}
      <ReviewSlider />

      {/* 6. Developer / Store Demo Helper Bar */}
      <div className="bg-stone-100 rounded-2xl p-4 border border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-600">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>
            {/* <strong>Verdant Interactive Store:</strong> All actions (Cart, Stock validation, Multi-Category Admin, Order Placement, Tracking) are fully functional. */}
          </span>
        </div>
        <button
          onClick={resetToDemoData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-700 shadow-2xs transition cursor-pointer shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
          <span>Reset Demo Catalog</span>
        </button>
      </div>
    </div>
  );
}
