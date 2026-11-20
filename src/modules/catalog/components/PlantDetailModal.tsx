import React, { useState } from "react";
import {
  Star,
  Heart,
  ShoppingBag,
  Sun,
  Droplets,
  Shield,
  Truck,
} from "lucide-react";
import { Modal } from "../../../components/ui/Modal";
import { useStore } from "../../../context/StoreContext";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";

export const PlantDetailModal: React.FC = () => {
  const {
    quickViewPlant: plant,
    closeQuickView,
    addToCart,
    toggleWishlist,
    isInWishlist,
    categories,
  } = useStore();

  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!plant) return null;

  const isFavorited = isInWishlist(plant._id);
  const isOutOfStock = plant.stockQty <= 0 || plant.status === "out-of-stock";
  const plantCategories = categories.filter((c) => plant.categoryIds.includes(c._id));

  const discountPercent =
    plant.mrp && plant.mrp > plant.price
      ? Math.round(((plant.mrp - plant.price) / plant.mrp) * 100)
      : null;

  const handleAddToCart = () => {
    addToCart(plant._id, quantity);
    closeQuickView();
  };

  return (
    <Modal isOpen={!!plant} onClose={closeQuickView} maxWidth="3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
            <img
              src={plant.imageUrls[activeImageIndex] || plant.imageUrls[0]}
              alt={plant.name}
              className="w-full h-full object-cover"
            />
            {discountPercent && discountPercent > 0 && (
              <span className="absolute top-3 left-3 bg-emerald-700 text-white text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {plant.imageUrls.length > 1 && (
            <div className="flex gap-2">
              {plant.imageUrls.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition ${
                    activeImageIndex === idx
                      ? "border-emerald-600 ring-2 ring-emerald-200"
                      : "border-stone-200 hover:border-stone-300 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Information */}
        <div className="space-y-5">
          {/* Header Badges */}
          <div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {plantCategories.map((c) => (
                <Badge key={c._id} variant="brand" size="sm">
                  {c.name}
                </Badge>
              ))}
              {plant.sku && (
                <span className="text-[11px] font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">
                  {plant.sku}
                </span>
              )}
            </div>

            <h2 className="text-2xl font-black text-stone-900 leading-tight">
              {plant.name}
            </h2>

            {/* Ratings */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-black text-stone-800">
                  {plant.rating?.toFixed(1) || "4.8"}
                </span>
              </div>
              <span className="text-stone-300">•</span>
              <span className="text-xs text-stone-500">
                {plant.reviewCount || 42} verified customer reviews
              </span>
            </div>
          </div>

          {/* Pricing */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-stone-900">
                ₹{plant.price.toLocaleString("en-IN")}
              </span>
              {plant.mrp && plant.mrp > plant.price && (
                <span className="text-sm text-stone-400 line-through">
                  ₹{plant.mrp.toLocaleString("en-IN")}
                </span>
              )}
            </div>

            <div>
              {isOutOfStock ? (
                <Badge variant="danger">Out of Stock</Badge>
              ) : plant.stockQty <= 5 ? (
                <Badge variant="warning">Only {plant.stockQty} remaining</Badge>
              ) : (
                <Badge variant="success">In Stock ({plant.stockQty})</Badge>
              )}
            </div>
          </div>

          {/* Care Essentials Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 bg-white rounded-xl border border-stone-200 flex items-center gap-2.5">
              <Sun className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 block">
                  Sunlight
                </span>
                <span className="text-xs font-semibold text-stone-800">
                  {plant.light || "Bright indirect"}
                </span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-stone-200 flex items-center gap-2.5">
              <Droplets className="w-5 h-5 text-sky-500 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 block">
                  Watering
                </span>
                <span className="text-xs font-semibold text-stone-800">
                  {plant.watering || "Once a week"}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Plant Overview
            </h4>
            <p className="text-sm text-stone-600 leading-relaxed">
              {plant.description}
            </p>
            {plant.careDetails && (
              <p className="mt-2 text-xs text-stone-500 italic bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                💡 Care Tip: {plant.careDetails}
              </p>
            )}
          </div>

          {/* Quantity and Actions */}
          <div className="pt-3 border-t border-stone-200 space-y-3">
            <div className="flex items-center gap-3">
              {/* Stepper */}
              <div className="flex items-center border border-stone-300 rounded-xl bg-white p-1">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="w-8 h-8 flex items-center justify-center font-bold text-stone-600 hover:bg-stone-100 rounded-lg disabled:opacity-40"
                >
                  -
                </button>
                <span className="w-10 text-center font-bold text-sm text-stone-900">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(plant.stockQty, q + 1))}
                  disabled={quantity >= plant.stockQty || isOutOfStock}
                  className="w-8 h-8 flex items-center justify-center font-bold text-stone-600 hover:bg-stone-100 rounded-lg disabled:opacity-40"
                >
                  +
                </button>
              </div>

              {/* Add to Cart */}
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                leftIcon={<ShoppingBag className="w-4 h-4" />}
              >
                {isOutOfStock ? "Out of Stock" : `Add to Cart (₹${(plant.price * quantity).toLocaleString("en-IN")})`}
              </Button>

              {/* Wishlist toggle */}
              <button
                onClick={() => toggleWishlist(plant._id)}
                className={`p-3 rounded-xl border transition ${
                  isFavorited
                    ? "bg-rose-50 border-rose-200 text-rose-600"
                    : "border-stone-300 text-stone-600 hover:bg-stone-50"
                }`}
                title="Wishlist"
              >
                <Heart className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`} />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-emerald-600" /> Free delivery over ₹499
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-600" /> 100% Live Arrival Guarantee
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
