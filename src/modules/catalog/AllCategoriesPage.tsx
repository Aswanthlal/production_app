import { useState } from "react";
import { ArrowLeft, Search, ArrowRight, FolderKanban } from "lucide-react";
import { useStore } from "../../context/StoreContext";

interface AllCategoriesPageProps {
  onBack: () => void;
  onSelectCategory: (categoryId: string) => void;
}

export default function AllCategoriesPage({
  onBack,
  onSelectCategory,
}: AllCategoriesPageProps) {
  const { activeCategories } = useStore();
  const [filterQuery, setFilterQuery] = useState("");

  const filteredCategories = activeCategories.filter(
    (c) =>
      c.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(filterQuery.toLowerCase()),
  );

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Header & Breadcrumb */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-stone-500 hover:text-stone-900 transition mb-3 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Storefront</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-stone-900 tracking-tight">
              All Plant Categories
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Browse our complete catalog of hand-cultivated botanicals ({activeCategories.length} categories)
            </p>
          </div>

          {/* Search within categories */}
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search categories..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-full pl-9 pr-4 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 space-y-3">
          <FolderKanban className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-lg font-bold text-stone-800">No categories found</h3>
          <p className="text-xs text-stone-500">
            No active categories match &quot;{filterQuery}&quot;.
          </p>
          <button
            onClick={() => setFilterQuery("")}
            className="text-xs font-bold text-emerald-700 underline"
          >
            Clear category search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredCategories.map((category) => (
            <div
              key={category._id}
              onClick={() => onSelectCategory(category._id)}
              className="group bg-white rounded-3xl border border-stone-200 overflow-hidden hover:border-emerald-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
            >
              <div className="relative aspect-4/3 w-full overflow-hidden bg-stone-100">
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {category.isFeatured && (
                  <span className="absolute top-3 left-3 bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
                    Featured
                  </span>
                )}
                <span className="absolute bottom-3 right-3 bg-stone-950/80 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                  {category.assignedPlantCount ?? 0} plants
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-stone-900 group-hover:text-emerald-800 transition">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="mt-1 text-xs text-stone-500 line-clamp-2 leading-relaxed">
                      {category.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-emerald-800 group-hover:text-emerald-950">
                  <span>Explore Collection</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
