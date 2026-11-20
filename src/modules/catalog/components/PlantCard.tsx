import React from "react";
import { Star, Heart, ShoppingBag, Eye, AlertTriangle } from "lucide-react";
import type { Plant } from "../../../types/store";
import { useStore } from "../../../context/StoreContext";

interface PlantCardProps {
  plant: Plant;
  onSelectCategory?: (categoryId: string) => void;
}

export const PlantCard: React.FC<PlantCardProps> = ({ plant, onSelectCategory }) => {
  const {
    addToCart,
    openQuickView,
    toggleWishlist,
    isInWishlist,
    categories,
  } = useStore();

  const isFavorited = isInWishlist(plant._id);
  const discountPercent =
    plant.mrp && plant.mrp > plant.price
      ? Math.round(((plant.mrp - plant.price) / plant.mrp) * 100)
      : null;

  const primaryCategory = categories.find((c) => plant.categoryIds.includes(c._id));

  const isOutOfStock = plant.stockQty <= 0 || plant.status === "out-of-stock";
  const isLowStock = !isOutOfStock && plant.stockQty <= 5;

  return (
    <div className="group relative bg-white rounded-3xl p-3 sm:p-4 border border-stone-200/80 hover:border-emerald-300 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
      {/* Top Image Container */}
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-stone-100 mb-3.5">
        <img
          src={plant.imageUrls[0]}
          alt={plant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Floating Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
          {discountPercent && discountPercent > 0 && (
            <span className="bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
              {discountPercent}% OFF
            </span>
          )}
          {plant.isTrending && (
            <span className="bg-amber-500 text-stone-900 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
              ★ Popular
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(plant._id);
          }}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition cursor-pointer ${
            isFavorited
              ? "bg-rose-500 text-white shadow-md shadow-rose-500/30"
              : "bg-white/80 hover:bg-white text-stone-600 hover:text-rose-500"
          }`}
          aria-label="Wishlist"
        >
          <Heart className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`} />
        </button>

        {/* Quick View Hover Trigger */}
        <div className="absolute inset-x-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:flex">
          <button
            onClick={() => openQuickView(plant)}
            className="w-full bg-white/95 backdrop-blur-md hover:bg-white text-stone-800 text-xs font-bold py-2 rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </button>
        </div>
      </div>

      {/* Details Container */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Category Pill */}
          {primaryCategory && (
            <button
              onClick={() => onSelectCategory && onSelectCategory(primaryCategory._id)}
              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-900 uppercase tracking-wider mb-1 block text-left"
            >
              {primaryCategory.name}
            </button>
          )}

          {/* Plant Title */}
          <h3
            onClick={() => openQuickView(plant)}
            className="font-bold text-sm sm:text-base text-stone-900 group-hover:text-emerald-800 transition line-clamp-1 cursor-pointer"
            title={plant.name}
          >
            {plant.name}
          </h3>

          {/* Plant Care Summary */}
          <p className="mt-1 text-xs text-stone-500 line-clamp-1">
            {plant.light || "Bright indirect light"} • {plant.careLevel || "Easy Care"}
          </p>

          {/* Ratings */}
          <div className="mt-2 flex items-center gap-1.5 text-xs text-stone-600">
            <div className="flex items-center gap-0.5 text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-bold text-stone-800 ml-0.5">
                {plant.rating?.toFixed(1) || "4.8"}
              </span>
            </div>
            <span className="text-stone-300">•</span>
            <span className="text-[11px] text-stone-400">
              ({plant.reviewCount || 42} reviews)
            </span>
          </div>
        </div>

        {/* Price & Action */}
        <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-black text-stone-900">
                ₹{plant.price.toLocaleString("en-IN")}
              </span>
              {plant.mrp && plant.mrp > plant.price && (
                <span className="text-xs text-stone-400 line-through">
                  ₹{plant.mrp.toLocaleString("en-IN")}
                </span>
              )}
            </div>
            {isOutOfStock ? (
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
                Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="text-[10px] font-bold text-amber-700 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" /> Only {plant.stockQty} left!
              </span>
            ) : (
              <span className="text-[10px] font-medium text-emerald-700 block">
                In Stock ({plant.stockQty})
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={() => addToCart(plant._id, 1)}
            disabled={isOutOfStock}
            className={`p-2.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              isOutOfStock
                ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                : "bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs hover:shadow active:scale-95"
            }`}
            title="Add to cart"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};
