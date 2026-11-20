import React, { useState } from "react";
import { Modal } from "../../components/ui/Modal";
import { useStore } from "../../context/StoreContext";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { ShieldCheck, CreditCard, Banknote, Smartphone } from "lucide-react";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      placeOrder({
        ...formData,
        phone: formData.phone.trim().replace(/\D/g, ""),
        pincode: formData.pincode.trim().replace(/\D/g, ""),
      });
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <Modal isOpen={isCheckoutOpen} onClose={closeCheckout} maxWidth="2xl">
      <div className="space-y-6">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            Secure Checkout
          </span>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">
            Delivery & Payment Details
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Shipping Address */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              1. Delivery Address
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Input
                  label="Full Name"
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
                  label="Phone Number"
                  required
                  type="tel"
                  placeholder="10-digit number"
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
                label="Street Address / Flat / Landmark"
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

          {/* Payment Method Selector */}
          <div className="space-y-3 pt-3 border-t border-stone-200">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              2. Payment Method
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <label
                className={`p-3 rounded-2xl border text-center cursor-pointer transition flex flex-col items-center gap-1.5 ${
                  formData.paymentMethod === "upi"
                    ? "bg-emerald-50 border-emerald-600 text-emerald-900 font-bold"
                    : "border-stone-200 hover:bg-stone-50 text-stone-700"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={formData.paymentMethod === "upi"}
                  onChange={() => setFormData({ ...formData, paymentMethod: "upi" })}
                  className="sr-only"
                />
                <Smartphone className="w-5 h-5 text-emerald-700" />
                <span className="text-xs">UPI / GPay</span>
              </label>

              <label
                className={`p-3 rounded-2xl border text-center cursor-pointer transition flex flex-col items-center gap-1.5 ${
                  formData.paymentMethod === "card"
                    ? "bg-emerald-50 border-emerald-600 text-emerald-900 font-bold"
                    : "border-stone-200 hover:bg-stone-50 text-stone-700"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={formData.paymentMethod === "card"}
                  onChange={() => setFormData({ ...formData, paymentMethod: "card" })}
                  className="sr-only"
                />
                <CreditCard className="w-5 h-5 text-emerald-700" />
                <span className="text-xs">Credit/Debit</span>
              </label>

              <label
                className={`p-3 rounded-2xl border text-center cursor-pointer transition flex flex-col items-center gap-1.5 ${
                  formData.paymentMethod === "cod"
                    ? "bg-emerald-50 border-emerald-600 text-emerald-900 font-bold"
                    : "border-stone-200 hover:bg-stone-50 text-stone-700"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={formData.paymentMethod === "cod"}
                  onChange={() => setFormData({ ...formData, paymentMethod: "cod" })}
                  className="sr-only"
                />
                <Banknote className="w-5 h-5 text-emerald-700" />
                <span className="text-xs">Cash on Delivery</span>
              </label>

              <label
                className={`p-3 rounded-2xl border text-center cursor-pointer transition flex flex-col items-center gap-1.5 ${
                  formData.paymentMethod === "netbanking"
                    ? "bg-emerald-50 border-emerald-600 text-emerald-900 font-bold"
                    : "border-stone-200 hover:bg-stone-50 text-stone-700"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={formData.paymentMethod === "netbanking"}
                  onChange={() => setFormData({ ...formData, paymentMethod: "netbanking" })}
                  className="sr-only"
                />
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <span className="text-xs">Net Banking</span>
              </label>
            </div>
          </div>

          {/* Order Summary & Submit */}
          <div className="pt-3 border-t border-stone-200 bg-stone-50 p-4 rounded-2xl space-y-2">
            <div className="flex justify-between text-xs text-stone-600">
              <span>Items ({cart.length})</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-xs text-emerald-700 font-bold">
                <span>Discount</span>
                <span>-₹{discount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-stone-600">
              <span>Delivery</span>
              <span>{shippingFee === 0 ? "FREE" : `₹${shippingFee}`}</span>
            </div>
            <div className="pt-2 border-t border-stone-200 flex justify-between font-black text-stone-900">
              <span>Total Payable</span>
              <span className="text-lg">₹{estimatedTotal.toLocaleString("en-IN")}</span>
            </div>
          </div>

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
              Confirm Order (₹{estimatedTotal.toLocaleString("en-IN")})
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
