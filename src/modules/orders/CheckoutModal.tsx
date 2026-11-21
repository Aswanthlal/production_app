import React, { useState } from "react";
import { Modal } from "../../components/ui/Modal";
import { useStore } from "../../context/StoreContext";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import {
  CreditCard,
  Banknote,
  Smartphone,
  ShieldCheck,
  Truck,
  Sparkles,
  AlertCircle,
} from "lucide-react";

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    closeCheckout,
    cart,
    subtotal,
    discount,
    shippingFee,
    estimatedTotal,
    placeOrder,
  } = useStore();

  const [formData, setFormData] = useState({
    customerName: "Aarav Sharma",
    phone: "9876543210",
    address: "Flat 402, Green Valley Apartments, Indiranagar",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560038",
    paymentMethod: "upi" as "upi" | "card" | "cod" | "netbanking",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const freeShippingThreshold = 499;
  const isFreeShipping = subtotal >= freeShippingThreshold || shippingFee === 0;

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.customerName.trim() || formData.customerName.trim().length < 2) {
      errors.customerName = "Name must be at least 2 characters.";
    }
    const cleanPhone = formData.phone.trim().replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.phone = "Enter a valid 10-digit mobile number.";
    }
    if (!formData.address.trim() || formData.address.trim().length < 5) {
      errors.address = "Street address must be at least 5 characters.";
    }
    if (!formData.city.trim() || formData.city.trim().length < 2) {
      errors.city = "City is required.";
    }
    if (!formData.state.trim() || formData.state.trim().length < 2) {
      errors.state = "State is required.";
    }
    const cleanPin = formData.pincode.trim().replace(/\D/g, "");
    if (!/^\d{6}$/.test(cleanPin)) {
      errors.pincode = "Enter a valid 6-digit PIN code.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    if (cart.length === 0) {
      setSubmitError("Your cart is empty. Add items before checking out.");
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await placeOrder({
        ...formData,
        phone: formData.phone.trim().replace(/\D/g, ""),
        pincode: formData.pincode.trim().replace(/\D/g, ""),
      });

      if (!order) {
        setSubmitError("Failed to place order. Please review your cart items and stock.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isCheckoutOpen} onClose={closeCheckout} maxWidth="2xl">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure Botanical Checkout</span>
          </div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">
            Delivery & Payment Details
          </h2>
        </div>

        {submitError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Checkout Alert</p>
              <p>{submitError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Order Summary Strip */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-700" />
                <span>
                  {isFreeShipping
                    ? "✓ FREE Doorstep Delivery Unlocked"
                    : `Add ₹${freeShippingThreshold - subtotal} for FREE Delivery`}
                </span>
              </span>
              <span>
                {cart.length} {cart.length === 1 ? "Plant" : "Plants"} (₹{subtotal.toLocaleString("en-IN")})
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-1 text-xs">
              <span className="text-stone-600">Total Payable at Checkout:</span>
              <span className="text-base font-black text-emerald-950">
                ₹{estimatedTotal.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* 2. Shipping Address */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              1. Delivery Address
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Input
                  label="Full Recipient Name"
                  required
                  value={formData.customerName}
                  onChange={(e) => {
                    setFormData({ ...formData, customerName: e.target.value });
                    if (formErrors.customerName) setFormErrors({ ...formErrors, customerName: "" });
                  }}
                  error={formErrors.customerName}
                />
              </div>
              <div>
                <Input
                  label="10-digit Phone Number"
                  required
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (formErrors.phone) setFormErrors({ ...formErrors, phone: "" });
                  }}
                  error={formErrors.phone}
                />
              </div>
            </div>

            <div>
              <Input
                label="Street Address / Building / Area"
                required
                value={formData.address}
                onChange={(e) => {
                  setFormData({ ...formData, address: e.target.value });
                  if (formErrors.address) setFormErrors({ ...formErrors, address: "" });
                }}
                error={formErrors.address}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Input
                  label="City"
                  required
                  value={formData.city}
                  onChange={(e) => {
                    setFormData({ ...formData, city: e.target.value });
                    if (formErrors.city) setFormErrors({ ...formErrors, city: "" });
                  }}
                  error={formErrors.city}
                />
              </div>
              <div>
                <Input
                  label="State"
                  required
                  value={formData.state}
                  onChange={(e) => {
                    setFormData({ ...formData, state: e.target.value });
                    if (formErrors.state) setFormErrors({ ...formErrors, state: "" });
                  }}
                  error={formErrors.state}
                />
              </div>
              <div>
                <Input
                  label="PIN Code"
                  required
                  placeholder="6 digits"
                  value={formData.pincode}
                  onChange={(e) => {
                    setFormData({ ...formData, pincode: e.target.value });
                    if (formErrors.pincode) setFormErrors({ ...formErrors, pincode: "" });
                  }}
                  error={formErrors.pincode}
                />
              </div>
            </div>
          </div>

          {/* 3. Payment Method Selector */}
          <div className="space-y-3 pt-3 border-t border-stone-200">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              2. Payment Method
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <label
                className={`p-3 rounded-2xl border text-center cursor-pointer transition flex flex-col items-center gap-1.5 ${
                  formData.paymentMethod === "upi"
                    ? "bg-emerald-50 border-emerald-600 text-emerald-900 font-bold shadow-xs"
                    : "border-stone-200 hover:bg-stone-50 text-stone-700"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="upi"
                  checked={formData.paymentMethod === "upi"}
                  onChange={() => setFormData({ ...formData, paymentMethod: "upi" })}
                  className="sr-only"
                />
                <Smartphone className="w-5 h-5 text-emerald-700" />
                <span className="text-xs">UPI / QR</span>
              </label>

              <label
                className={`p-3 rounded-2xl border text-center cursor-pointer transition flex flex-col items-center gap-1.5 ${
                  formData.paymentMethod === "card"
                    ? "bg-emerald-50 border-emerald-600 text-emerald-900 font-bold shadow-xs"
                    : "border-stone-200 hover:bg-stone-50 text-stone-700"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={formData.paymentMethod === "card"}
                  onChange={() => setFormData({ ...formData, paymentMethod: "card" })}
                  className="sr-only"
                />
                <CreditCard className="w-5 h-5 text-emerald-700" />
                <span className="text-xs">Card</span>
              </label>

              <label
                className={`p-3 rounded-2xl border text-center cursor-pointer transition flex flex-col items-center gap-1.5 ${
                  formData.paymentMethod === "netbanking"
                    ? "bg-emerald-50 border-emerald-600 text-emerald-900 font-bold shadow-xs"
                    : "border-stone-200 hover:bg-stone-50 text-stone-700"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="netbanking"
                  checked={formData.paymentMethod === "netbanking"}
                  onChange={() => setFormData({ ...formData, paymentMethod: "netbanking" })}
                  className="sr-only"
                />
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <span className="text-xs">Net Banking</span>
              </label>

              <label
                className={`p-3 rounded-2xl border text-center cursor-pointer transition flex flex-col items-center gap-1.5 ${
                  formData.paymentMethod === "cod"
                    ? "bg-emerald-50 border-emerald-600 text-emerald-900 font-bold shadow-xs"
                    : "border-stone-200 hover:bg-stone-50 text-stone-700"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={formData.paymentMethod === "cod"}
                  onChange={() => setFormData({ ...formData, paymentMethod: "cod" })}
                  className="sr-only"
                />
                <Banknote className="w-5 h-5 text-emerald-700" />
                <span className="text-xs">Cash on Delivery</span>
              </label>
            </div>
          </div>

          {/* 4. Financial Review Summary */}
          <div className="pt-3 border-t border-stone-200 bg-stone-50 p-4 rounded-2xl space-y-2">
            <div className="flex justify-between text-xs text-stone-600">
              <span>Items Total ({cart.length})</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-xs text-emerald-700 font-bold">
                <span>Applied Discount</span>
                <span>-₹{discount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-stone-600">
              <span>Doorstep Delivery</span>
              <span>{shippingFee === 0 ? "FREE" : `₹${shippingFee}`}</span>
            </div>
            <div className="pt-2 border-t border-stone-200 flex justify-between font-black text-stone-900">
              <span>Final Total</span>
              <span className="text-xl text-emerald-900">
                ₹{estimatedTotal.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* 5. Submit CTA Buttons */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={closeCheckout}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="flex-1"
              isLoading={isSubmitting}
            >
              Place Order (₹{estimatedTotal.toLocaleString("en-IN")})
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
