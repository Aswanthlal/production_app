import React from "react";
import { ArrowRight, Flame } from "lucide-react";
import { useStore } from "../../../context/StoreContext";
import { PlantCard } from "../../catalog/components/PlantCard";

interface TrendingGridProps {
  onViewAllTrending: () => void;
  onSelectCategory?: (categoryId: string) => void;
}

export const TrendingGrid: React.FC<TrendingGridProps> = ({
  onViewAllTrending,
  onSelectCategory,
}) => {
  const { trendingPlants } = useStore();

  // Capped at 6 items per specification
  const displayPlants = trendingPlants.slice(0, 6);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-600">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span>Best Sellers & Most Loved</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mt-0.5">
            Trending Plants
          </h2>
        </div>
        <button
          onClick={onViewAllTrending}
          className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 group cursor-pointer"
        >
          <span>View All ({trendingPlants.length})</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Grid of 6 Trending Plants */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {displayPlants.map((plant) => (
          <PlantCard
            key={plant._id}
            plant={plant}
            onSelectCategory={onSelectCategory}
          />
        ))}
      </div>
    </section>
  );
};
