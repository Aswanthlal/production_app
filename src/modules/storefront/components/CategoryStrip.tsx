import React from "react";
import { ArrowRight } from "lucide-react";
import { useStore } from "../../../context/StoreContext";

interface CategoryStripProps {
  onSelectCategory: (categoryId: string) => void;
  onViewAllCategories: () => void;
}

export const CategoryStrip: React.FC<CategoryStripProps> = ({
  onSelectCategory,
  onViewAllCategories,
}) => {
  const { featuredCategories } = useStore();

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
            Curated Collections
          </span>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">
            Explore by Category
          </h2>
        </div>
        <button
          onClick={onViewAllCategories}
          className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 group cursor-pointer"
        >
          <span>View All Categories</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Responsive Horizontal Strip of Circular Categories (Capped at 6 + CTA) */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-4">
        {featuredCategories.map((cat) => (
          <button
            key={cat._id}
            onClick={() => onSelectCategory(cat._id)}
            className="flex flex-col items-center group text-center cursor-pointer p-2 rounded-2xl hover:bg-white hover:shadow-md transition-all"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden p-1 border-2 border-stone-200 group-hover:border-emerald-600 transition-colors shadow-xs">
              <img
                src={cat.imageUrl}
                alt={cat.name}
                className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <span className="mt-2 text-xs font-bold text-stone-800 group-hover:text-emerald-800 transition line-clamp-1">
              {cat.name}
            </span>
            <span className="text-[10px] text-stone-400">
              {cat.assignedPlantCount ?? 0} plants
            </span>
          </button>
        ))}

        {/* View All Tile */}
        <button
          onClick={onViewAllCategories}
          className="flex flex-col items-center group text-center cursor-pointer p-2 rounded-2xl hover:bg-white hover:shadow-md transition-all"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-50 border-2 border-dashed border-emerald-300 group-hover:border-emerald-600 flex items-center justify-center text-emerald-800 group-hover:scale-105 transition">
            <ArrowRight className="w-6 h-6" />
          </div>
          <span className="mt-2 text-xs font-bold text-emerald-800">
            View All
          </span>
          <span className="text-[10px] text-stone-400">
            Categories
          </span>
        </button>
      </div>
    </section>
  );
};
