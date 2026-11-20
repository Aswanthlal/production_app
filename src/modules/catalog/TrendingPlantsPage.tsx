import { useState, useEffect, useRef, useMemo } from "react";
import { ArrowLeft, Flame, SlidersHorizontal, CheckCircle2 } from "lucide-react";
import { usePaginatedQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useStore } from "../../context/StoreContext";
import { PlantCard } from "./components/PlantCard";
import type { Plant, PlantStatus } from "../../types/store";

interface TrendingPlantsPageProps {
  onBack: () => void;
  onSelectCategory?: (categoryId: string) => void;
}

export default function TrendingPlantsPage({
  onBack,
  onSelectCategory,
}: TrendingPlantsPageProps) {
  const { tenantId, trendingPlants: fallbackTrendingPlants } = useStore();

  const [sortBy, setSortBy] = useState<"featured" | "price_asc" | "price_desc" | "rating">("featured");

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Real-time Convex cursor pagination using paginationOptsValidator
  const isRealTenant = Boolean(tenantId && !tenantId.startsWith("tenant_"));
  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    api.modules.catalog.index.listTrendingPlantsPaginated,
    isRealTenant ? { tenantId: tenantId as Id<"tenants"> } : "skip",
    { initialNumItems: 6 },
  );

  // Map Convex products or fallback to StoreContext
  const trendingList: Plant[] = useMemo(() => {
    if (results && results.length > 0) {
      return results.map((p) => ({
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
    }
    return fallbackTrendingPlants;
  }, [results, fallbackTrendingPlants]);

  // Sorted items
  const sortedPlants = useMemo(() => {
    const list = [...trendingList];
    if (sortBy === "price_asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    return list;
  }, [trendingList, sortBy]);

  // IntersectionObserver for Convex cursor-based infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && status === "CanLoadMore" && !isLoading) {
          loadMore(6);
        }
      },
      { threshold: 0.1 },
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [status, isLoading, loadMore]);

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
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-600 mb-1">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>Customer Favorites</span>
            </div>
            <h1 className="text-3xl font-black text-stone-900 tracking-tight">
              Trending & Best Seller Plants
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              The highest-rated, most cherished botanicals chosen by our green-thumb community ({sortedPlants.length} trending items)
            </p>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-stone-400" />
            <span className="font-semibold text-stone-500">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "featured" | "price_asc" | "price_desc" | "rating")}
              className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 focus:outline-none focus:border-emerald-600"
            >
              <option value="featured">Most Popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Plants Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {sortedPlants.map((plant) => (
          <PlantCard
            key={plant._id}
            plant={plant}
            onSelectCategory={onSelectCategory}
          />
        ))}
      </div>

      {/* Infinite Scroll Sentinel / Loading State */}
      <div ref={sentinelRef} className="pt-8 text-center">
        {status === "LoadingMore" || (isLoading && results.length === 0) ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-stone-200 shadow-sm text-xs font-bold text-stone-700">
            <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading more plants...</span>
          </div>
        ) : status === "Exhausted" ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 rounded-full text-xs font-semibold text-stone-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>All plants loaded ({sortedPlants.length} total)</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
