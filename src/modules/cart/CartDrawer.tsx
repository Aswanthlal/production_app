import React, { useState } from "react";
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  Sparkles,
  Tag,
  Truck,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { Drawer } from "../../components/ui/Drawer";
import { useStore } from "../../context/StoreContext";
import { Button } from "../../components/ui/Button";

interface CartDrawerProps {
  onShopNow: () => void;
}

export default function CartDrawer({ onShopNow }: CartDrawerProps) {
  const {
    cart,
    cartCount,
    subtotal,
    discount,
    shippingFee,
    estimatedTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    updateCartQuantity,
    removeFromCart,
    isCartOpen,
    closeCart,
    openCheckout,
    activePlants,
    addToCart,
  } = useStore();

  const [inputCoupon, setInputCoupon] = useState("");

  // Recommendations: active plants not currently in cart
  const cartProductIds = new Set(cart.map((i) => i.productId));
  const recommendations = activePlants
    .filter((p) => !cartProductIds.has(p._id) && p.stockQty > 0)
    .slice(0, 3);

  const freeShippingThreshold = 499;
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    applyCoupon(inputCoupon);
    setInputCoupon("");
  };

  return (
    <Drawer
      isOpen={isCartOpen}
      onClose={closeCart}
      width="lg"
      title={
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-emerald-700" />
          <span className="font-extrabold text-stone-900">Your Cart</span>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">
            {cartCount} {cartCount === 1 ? "item" : "items"}
          </span>
        </div>
      }
    >
      {cart.length === 0 ? (
        /* ================= STATE A: EMPTY CART ================= */
        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-5 my-auto">
          <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shadow-inner">
            <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl font-black text-stone-900">Nothing in your cart</h3>
            <p className="text-xs text-stone-500 max-w-xs leading-relaxed">
              Explore our lush collections and bring fresh botanicals into your sanctuary today.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              closeCart();
              onShopNow();
            }}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Shop Now
          </Button>

          {/* Quick recommendations even when empty */}
          {recommendations.length > 0 && (
            <div className="w-full pt-8 text-left border-t border-stone-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-3">
                Trending to start with
              </span>
              <div className="space-y-2.5">
                {recommendations.slice(0, 2).map((prod) => (
                  <div
                    key={prod._id}
                    className="flex items-center justify-between p-2.5 bg-stone-50 rounded-2xl border border-stone-200/80"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={prod.imageUrls[0]}
                        alt={prod.name}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                      <div>
                        <h5 className="text-xs font-bold text-stone-900 line-clamp-1">
                          {prod.name}
                        </h5>
                        <span className="text-xs font-black text-emerald-800">
                          ₹{prod.price}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => addToCart(prod._id, 1)}
                      className="px-3 py-1.5 bg-white hover:bg-emerald-50 border border-stone-200 text-emerald-800 text-xs font-bold rounded-xl transition"
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ================= STATE B: POPULATED CART ================= */
        <div className="space-y-6">
          {/* Welcome Greeting & Free Shipping Meter */}
          <div className="bg-emerald-50/80 border border-emerald-200/70 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-700" />
                {amountNeededForFreeShipping === 0
                  ? "You unlocked FREE Doorstep Shipping!"
                  : `Add ₹${amountNeededForFreeShipping} more for FREE Shipping!`}
              </span>
              <span className="font-extrabold text-emerald-800">
                {freeShippingPercent}%
              </span>
            </div>
            <div className="w-full bg-emerald-200/60 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${freeShippingPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="space-y-3 divide-y divide-stone-100">
            {cart.map((item) => {
              const maxStock = item.product?.stockQty ?? 99;
              const isAtMaxStock = item.quantity >= maxStock;

              return (
                <div key={item._id} className="pt-3 first:pt-0 flex gap-3.5 items-start">
                  <img
                    src={item.product?.imageUrls[0]}
                    alt={item.product?.name}
                    className="w-18 h-18 rounded-2xl object-cover shrink-0 border border-stone-200 bg-stone-100"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-stone-900 line-clamp-1">
                        {item.product?.name ?? "Plant"}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="text-stone-400 hover:text-rose-600 p-1 transition"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-0.5 text-xs text-stone-500">
                      ₹{item.product?.price ?? item.unitPriceSnapshot} each
                    </div>

                    {isAtMaxStock && (
                      <span className="mt-1 text-[10px] font-bold text-amber-700 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Max available stock ({maxStock})
                      </span>
                    )}

                    {/* Quantity Stepper & Subtotal */}
                    <div className="mt-2.5 flex items-center justify-between">
                      <div className="flex items-center border border-stone-200 rounded-xl bg-white p-0.5">
                        <button
                          onClick={() => updateCartQuantity(item._id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center font-bold text-stone-600 hover:bg-stone-100 rounded-lg text-xs"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-stone-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item._id, item.quantity + 1)}
                          disabled={isAtMaxStock}
                          className="w-6 h-6 flex items-center justify-center font-bold text-stone-600 hover:bg-stone-100 rounded-lg text-xs disabled:opacity-30 disabled:hover:bg-transparent"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-sm font-black text-stone-900">
                        ₹{((item.product?.price ?? item.unitPriceSnapshot) * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* "You May Also Like" Strip */}
          {recommendations.length > 0 && (
            <div className="pt-4 border-t border-stone-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> You May Also Like
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {recommendations.map((rec) => (
                  <div
                    key={rec._id}
                    className="p-2 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col justify-between"
                  >
                    <img
                      src={rec.imageUrls[0]}
                      alt={rec.name}
                      className="w-full aspect-square object-cover rounded-xl mb-1.5"
                    />
                    <h5 className="text-[11px] font-bold text-stone-900 line-clamp-1">
                      {rec.name}
                    </h5>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-800">
                        ₹{rec.price}
                      </span>
                      <button
                        onClick={() => addToCart(rec._id, 1)}
                        className="w-6 h-6 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center transition"
                        title="Add to cart"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coupon Code Section */}
          <div className="pt-3 border-t border-stone-200">
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <Tag className="w-4 h-4" />
                  <span>Coupon &quot;{appliedCoupon}&quot; applied</span>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-stone-400 hover:text-stone-600 font-bold underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Promo code (e.g. GREEN10)"
                  value={inputCoupon}
                  onChange={(e) => setInputCoupon(e.target.value.toUpperCase())}
                  className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 placeholder:text-stone-400 uppercase tracking-wider focus:outline-none focus:border-emerald-600"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Apply
                </button>
              </form>
            )}
          </div>

          {/* Price Breakdown & Checkout Action */}
          <div className="pt-4 border-t border-stone-200 space-y-2.5">
            <div className="flex justify-between text-xs text-stone-600">
              <span>Subtotal</span>
              <span className="font-bold text-stone-900">
                ₹{subtotal.toLocaleString("en-IN")}
              </span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-xs text-emerald-700 font-bold">
                <span>Coupon Discount</span>
                <span>-₹{discount.toLocaleString("en-IN")}</span>
              </div>
            )}

            <div className="flex justify-between text-xs text-stone-600">
              <span>Estimated Delivery</span>
              <span>
                {shippingFee === 0 ? (
                  <span className="font-bold text-emerald-700 uppercase">FREE</span>
                ) : (
                  `₹${shippingFee}`
                )}
              </span>
            </div>

            <div className="pt-2 border-t border-stone-100 flex justify-between items-baseline">
              <span className="text-sm font-extrabold text-stone-900">Estimated Total</span>
              <span className="text-xl font-black text-stone-900">
                ₹{estimatedTotal.toLocaleString("en-IN")}
              </span>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full mt-2"
              onClick={openCheckout}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Proceed to Checkout (₹{estimatedTotal.toLocaleString("en-IN")})
            </Button>
          </div>
        </div>
      )}
    </Drawer>
  );
}
