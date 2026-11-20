import { useState, useMemo } from "react";
import { ArrowLeft, SlidersHorizontal, PackageOpen } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useStore } from "../../context/StoreContext";
import { PlantCard } from "./components/PlantCard";
import { Button } from "../../components/ui/Button";
import type { Plant, PlantStatus } from "../../types/store";

interface CategoryPlantsPageProps {
  categoryId: string;
  onBackToCategories: () => void;
  onGoHome: () => void;
}

export default function CategoryPlantsPage({
  categoryId,
  onBackToCategories,
  onGoHome,
}: CategoryPlantsPageProps) {
  const { tenantId, categories, getPlantsByCategory } = useStore();

  const [sortBy, setSortBy] = useState<"featured" | "price_asc" | "price_desc" | "rating">("featured");
  const [inStockOnly, setInStockOnly] = useState(false);

  // Find target category with robust matching
  const category = useMemo(() => {
    let match = categories.find((c) => c._id === categoryId || c.slug === categoryId);
    if (match) return match;

    const clean = categoryId.toLowerCase().replace(/^cat_/, "").replace(/-/g, "_");
    match = categories.find((c) => {
      const s = c.slug.toLowerCase().replace(/-/g, "_");
      const n = c.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
      return s.includes(clean) || clean.includes(s) || n.includes(clean);
    });
    if (match) return match;

    return categories[0];
  }, [categories, categoryId]);

  // Live Convex query for plants in this category (only when valid Convex IDs are present)
  const isRealConvexId = tenantId && !tenantId.startsWith("tenant_") && category && !category._id.startsWith("cat_");
  const liveCategoryPlants = useQuery(
    api.modules.catalog.index.listPlantsByCategory,
    isRealConvexId
      ? { tenantId: tenantId as Id<"tenants">, categoryId: category._id as Id<"categories"> }
      : "skip",
  );

  // Filter & Sort
  const processedPlants: Plant[] = useMemo(() => {
    let rawPlants: Plant[] = [];
    if (liveCategoryPlants) {
      rawPlants = liveCategoryPlants.map((p) => ({
        _id: p._id,
        tenantId: p.tenantId,
        categoryIds: p.categoryIds,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        description: p.description,
        careDetails: p.careDetails,
        careLevel: "Easy",
        light: "Bright indirect light",
        watering: "Weekly",
        price: p.price,
        mrp: p.mrp,
        stockQty: p.stockQty,
        imageUrls: p.imageUrls,
        rating: p.rating,
        reviewCount: p.reviewCount,
        isTrending: p.isTrending,
        status: p.status as PlantStatus,
      }));
    } else if (category) {
      rawPlants = getPlantsByCategory(category._id);
      if (rawPlants.length === 0 && categoryId !== category._id) {
        rawPlants = getPlantsByCategory(categoryId);
      }
    }

    let result = [...rawPlants];

    if (inStockOnly) {
      result = result.filter((p) => p.stockQty > 0);
    }

    if (sortBy === "price_asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [liveCategoryPlants, category, categoryId, getPlantsByCategory, sortBy, inStockOnly]);

  if (!category) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 space-y-4">
        <PackageOpen className="w-12 h-12 text-stone-300 mx-auto" />
        <h2 className="text-xl font-bold text-stone-900">Category not found</h2>
        <p className="text-sm text-stone-500">
          The requested category does not exist or has been removed.
        </p>
        <Button variant="primary" onClick={onBackToCategories}>
          Return to Categories
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
        <button onClick={onGoHome} className="hover:text-stone-900 transition cursor-pointer">
          Home
        </button>
        <span>/</span>
        <button
          onClick={onBackToCategories}
          className="hover:text-stone-900 transition cursor-pointer"
        >
          Categories
        </button>
        <span>/</span>
        <span className="text-emerald-800 font-bold">{category.name}</span>
      </div>

      {/* Category Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-stone-900 text-white min-h-[180px] sm:min-h-[220px] flex items-center p-6 sm:p-10 shadow-lg">
        <img
          src={category.imageUrl}
          alt={category.name}
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/60 to-transparent" />

        <div className="relative z-10 max-w-xl space-y-2">
          <button
            onClick={onBackToCategories}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 hover:text-white transition mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Categories</span>
          </button>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{category.name}</h1>
          {category.description && (
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-md">
              {category.description}
            </p>
          )}
          <span className="inline-block text-xs font-bold bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-emerald-200">
            {processedPlants.length} active botanical listings
          </span>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 flex flex-wrap items-center justify-between gap-4">
        {/* In-Stock Toggle */}
        <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
          />
          <span>In-Stock Only</span>
        </label>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 text-xs">
          <SlidersHorizontal className="w-3.5 h-3.5 text-stone-400" />
          <span className="font-semibold text-stone-500">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "featured" | "price_asc" | "price_desc" | "rating")}
            className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-800 focus:outline-none focus:border-emerald-600"
          >
            <option value="featured">Featured / Default</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Plant Grid */}
      {liveCategoryPlants === undefined ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-stone-600">Loading catalog plants...</p>
        </div>
      ) : processedPlants.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 space-y-4">
          <PackageOpen className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-lg font-bold text-stone-800">No plants match your criteria</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            There are currently no plants available in this category matching your selected filters.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setInStockOnly(false);
              setSortBy("featured");
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {processedPlants.map((plant) => (
            <PlantCard key={plant._id} plant={plant} />
          ))}
        </div>
      )}
    </div>
  );
}
