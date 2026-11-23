import React, { useState, useEffect } from "react";
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
  QrCode,
  Building2,
  Lock,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RefreshCw,
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

  const [step, setStep] = useState<"details" | "payment">("details");

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
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Online Payment Details State
  const [upiId, setUpiId] = useState("aarav@okhdfcbank");
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvv, setCardCvv] = useState("123");
  const [cardHolder, setCardHolder] = useState("Aarav Sharma");
  const [selectedBank, setSelectedBank] = useState("HDFC");

  const freeShippingThreshold = 499;
  const isFreeShipping = subtotal >= freeShippingThreshold || shippingFee === 0;

  // Reset steps and errors when modal opens or closes
  useEffect(() => {
    if (isCheckoutOpen) {
      setStep("details");
      setPaymentError(null);
      setSubmitError(null);
      setCardHolder(formData.customerName || "Aarav Sharma");
    }
  }, [isCheckoutOpen]);

  const handleClose = () => {
    setStep("details");
    setPaymentError(null);
    setSubmitError(null);
    closeCheckout();
  };

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

  // Direct COD submit flow
  const handleCODSubmit = async () => {
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
        paymentStatus: "unpaid",
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

  // Primary submit on Details step
  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    if (cart.length === 0) {
      setSubmitError("Your cart is empty. Add items before checking out.");
      return;
    }

    if (formData.paymentMethod === "cod") {
      handleCODSubmit();
    } else {
      setPaymentError(null);
      setStep("payment");
    }
  };

  // Confirm payment in Payment Gateway step
  const handleConfirmPayment = async () => {
    setPaymentError(null);

    if (cart.length === 0) {
      setPaymentError("Your cart is empty. Add items before checking out.");
      return;
    }

    if (formData.paymentMethod === "upi") {
      const cleanUpi = upiId.trim();
      if (!cleanUpi || !cleanUpi.includes("@") || cleanUpi.length < 5) {
        setPaymentError("Please enter a valid UPI ID (e.g. name@upi or yourname@okhdfcbank).");
        return;
      }
    } else if (formData.paymentMethod === "card") {
      const cleanCard = cardNumber.replace(/\s+/g, "");
      if (cleanCard.length < 12) {
        setPaymentError("Please enter a valid card number (e.g. 4242 4242 4242 4242).");
        return;
      }
      if (!cardExpiry.trim() || !cardExpiry.includes("/")) {
        setPaymentError("Please enter card expiry in MM/YY format (e.g. 12/28).");
        return;
      }
      if (!cardCvv.trim() || cardCvv.length < 3) {
        setPaymentError("Please enter a valid 3 or 4-digit CVV.");
        return;
      }
    } else if (formData.paymentMethod === "netbanking") {
      if (!selectedBank) {
        setPaymentError("Please select a bank to proceed with Net Banking.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const order = await placeOrder({
        ...formData,
        phone: formData.phone.trim().replace(/\D/g, ""),
        pincode: formData.pincode.trim().replace(/\D/g, ""),
        paymentStatus: "paid",
      });

      if (!order) {
        setPaymentError("Payment verification failed. Please review your cart items and stock.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Payment processing failed. Please try again.";
      setPaymentError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simulate payment failure
  const handleSimulateFailure = () => {
    setPaymentError(
      "Payment Failed: Simulated decline by the issuing bank / authorization was cancelled. No amount was deducted and your order was not placed."
    );
  };

  return (
    <Modal isOpen={isCheckoutOpen} onClose={handleClose} maxWidth="2xl">
      <div className="space-y-6">
        {/* Header Strip */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
              {step === "details" ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Secure Botanical Checkout</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Interactive Payment Gateway</span>
                </>
              )}
            </div>
            <h2 className="text-2xl font-black text-stone-900 tracking-tight">
              {step === "details" ? "Delivery & Payment Details" : "Complete Online Payment"}
            </h2>
          </div>
          {step === "payment" && (
            <button
              type="button"
              onClick={() => {
                setStep("details");
                setPaymentError(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Edit Delivery</span>
            </button>
          )}
        </div>

        {/* Global Errors */}
        {step === "details" && submitError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Checkout Alert</p>
              <p>{submitError}</p>
            </div>
          </div>
        )}

        {/* ================= STEP 1: DETAILS & METHOD SELECTION ================= */}
        {step === "details" && (
          <form onSubmit={handleDetailsSubmit} className="space-y-5">
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
                  {cart.length} {cart.length === 1 ? "Plant" : "Plants"} (₹
                  {subtotal.toLocaleString("en-IN")})
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-1 text-xs">
                <span className="text-stone-600">Total Payable:</span>
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
                      if (formErrors.customerName)
                        setFormErrors({ ...formErrors, customerName: "" });
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
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  2. Choose Payment Method
                </h4>
                {formData.paymentMethod !== "cod" && (
                  <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Sandbox Step
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <label
                  className={`p-3 rounded-2xl border text-center cursor-pointer transition flex flex-col items-center gap-1.5 ${
                    formData.paymentMethod === "upi"
                      ? "bg-emerald-50 border-emerald-600 text-emerald-900 font-bold shadow-xs ring-1 ring-emerald-500"
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
                      ? "bg-emerald-50 border-emerald-600 text-emerald-900 font-bold shadow-xs ring-1 ring-emerald-500"
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
                  <span className="text-xs">Debit / Card</span>
                </label>

                <label
                  className={`p-3 rounded-2xl border text-center cursor-pointer transition flex flex-col items-center gap-1.5 ${
                    formData.paymentMethod === "netbanking"
                      ? "bg-emerald-50 border-emerald-600 text-emerald-900 font-bold shadow-xs ring-1 ring-emerald-500"
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
                  <Building2 className="w-5 h-5 text-emerald-700" />
                  <span className="text-xs">Net Banking</span>
                </label>

                <label
                  className={`p-3 rounded-2xl border text-center cursor-pointer transition flex flex-col items-center gap-1.5 ${
                    formData.paymentMethod === "cod"
                      ? "bg-emerald-50 border-emerald-600 text-emerald-900 font-bold shadow-xs ring-1 ring-emerald-500"
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
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              {formData.paymentMethod === "cod" ? (
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  isLoading={isSubmitting}
                >
                  Place Order (Cash on Delivery) • ₹{estimatedTotal.toLocaleString("en-IN")}
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  isLoading={isSubmitting}
                >
                  Proceed to Pay ₹{estimatedTotal.toLocaleString("en-IN")}
                </Button>
              )}
            </div>
          </form>
        )}

        {/* ================= STEP 2: PAYMENT GATEWAY STEP ================= */}
        {step === "payment" && (
          <div className="space-y-5">
            {/* Payment Summary Header */}
            <div className="bg-stone-900 text-white rounded-2xl p-4.5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-300 font-medium">Merchant: Verdant Nursery</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-700/50">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  256-Bit Test Sandbox
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1 border-t border-stone-800">
                <div>
                  <p className="text-xs text-stone-400">Total Amount Payable</p>
                  <p className="text-2xl font-black text-white">
                    ₹{estimatedTotal.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="text-right text-xs text-stone-300">
                  <p className="font-semibold text-white">{formData.customerName}</p>
                  <p className="text-stone-400 text-[11px]">
                    {formData.city}, {formData.pincode}
                  </p>
                </div>
              </div>
            </div>

            {/* Inline Payment Failed Alert */}
            {paymentError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-800 animate-fadeIn">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="font-bold text-rose-900 text-sm">Payment Failed / Cancelled</p>
                  <p className="leading-relaxed">{paymentError}</p>
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentError(null)}
                      className="font-bold text-rose-700 hover:text-rose-900 underline cursor-pointer"
                    >
                      Dismiss & Retry Payment
                    </button>
                    <span className="text-rose-300">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("details");
                        setPaymentError(null);
                      }}
                      className="font-bold text-rose-700 hover:text-rose-900 underline cursor-pointer"
                    >
                      Change Payment Method
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Method Tabs inside Payment Gateway */}
            <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, paymentMethod: "upi" });
                  setPaymentError(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  formData.paymentMethod === "upi"
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, paymentMethod: "card" });
                  setPaymentError(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  formData.paymentMethod === "card"
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, paymentMethod: "netbanking" });
                  setPaymentError(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  formData.paymentMethod === "netbanking"
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Net Banking</span>
              </button>
            </div>

            {/* 1. UPI Payment Gateway View */}
            {formData.paymentMethod === "upi" && (
              <div className="space-y-4">
                {/* Demo UPI QR Card */}
                <div className="p-4 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 flex flex-col sm:flex-row items-center gap-5">
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-emerald-100 flex flex-col items-center text-center shrink-0">
                    {/* Visual QR Code Pattern */}
                    <div className="w-32 h-32 bg-stone-900 rounded-xl p-2 flex items-center justify-center relative overflow-hidden">
                      <svg
                        className="w-full h-full text-white"
                        viewBox="0 0 100 100"
                        fill="currentColor"
                      >
                        {/* Corner Finder Patterns */}
                        <rect x="5" y="5" width="25" height="25" rx="3" fill="white" />
                        <rect x="10" y="10" width="15" height="15" rx="1" fill="#1c1917" />
                        <rect x="13" y="13" width="9" height="9" fill="#10b981" />

                        <rect x="70" y="5" width="25" height="25" rx="3" fill="white" />
                        <rect x="75" y="10" width="15" height="15" rx="1" fill="#1c1917" />
                        <rect x="78" y="13" width="9" height="9" fill="#10b981" />

                        <rect x="5" y="70" width="25" height="25" rx="3" fill="white" />
                        <rect x="10" y="75" width="15" height="15" rx="1" fill="#1c1917" />
                        <rect x="13" y="78" width="9" height="9" fill="#10b981" />

                        {/* Random QR matrix dots */}
                        <circle cx="45" cy="15" r="3" fill="white" />
                        <circle cx="55" cy="15" r="3" fill="white" />
                        <circle cx="40" cy="25" r="3" fill="white" />
                        <circle cx="50" cy="25" r="3" fill="#10b981" />
                        <circle cx="60" cy="25" r="3" fill="white" />

                        <rect x="35" y="38" width="30" height="24" rx="4" fill="#047857" />
                        <text
                          x="50"
                          y="54"
                          fontSize="11"
                          fontWeight="bold"
                          fill="white"
                          textAnchor="middle"
                        >
                          UPI
                        </text>

                        <circle cx="15" cy="45" r="3" fill="white" />
                        <circle cx="25" cy="45" r="3" fill="white" />
                        <circle cx="15" cy="55" r="3" fill="white" />
                        <circle cx="25" cy="55" r="3" fill="white" />

                        <circle cx="75" cy="45" r="3" fill="white" />
                        <circle cx="85" cy="45" r="3" fill="white" />
                        <circle cx="75" cy="55" r="3" fill="white" />
                        <circle cx="85" cy="55" r="3" fill="white" />

                        <circle cx="40" cy="75" r="3" fill="white" />
                        <circle cx="50" cy="75" r="3" fill="white" />
                        <circle cx="60" cy="75" r="3" fill="white" />
                        <circle cx="70" cy="75" r="3" fill="white" />
                        <circle cx="80" cy="75" r="3" fill="white" />
                        <circle cx="45" cy="85" r="3" fill="white" />
                        <circle cx="65" cy="85" r="3" fill="white" />
                        <circle cx="85" cy="85" r="3" fill="white" />
                      </svg>
                    </div>
                    <span className="mt-1.5 text-[10px] font-bold text-stone-600 tracking-wide uppercase">
                      Scan with any UPI App
                    </span>
                  </div>

                  <div className="space-y-2 text-stone-700 text-xs">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[11px]">
                      <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Instant Dynamic UPI QR</span>
                    </div>
                    <p className="font-medium text-stone-600">
                      Open Google Pay, PhonePe, Paytm, or BHIM on your smartphone to scan and pay
                      directly.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-bold text-stone-600">
                      <span className="px-2 py-0.5 bg-white rounded-md border border-stone-200">
                        GPay
                      </span>
                      <span className="px-2 py-0.5 bg-white rounded-md border border-stone-200">
                        PhonePe
                      </span>
                      <span className="px-2 py-0.5 bg-white rounded-md border border-stone-200">
                        Paytm
                      </span>
                      <span className="px-2 py-0.5 bg-white rounded-md border border-stone-200">
                        BHIM
                      </span>
                    </div>
                  </div>
                </div>

                {/* UPI ID input */}
                <div className="space-y-2">
                  <div className="relative flex items-center justify-center">
                    <div className="border-t border-stone-200 w-full" />
                    <span className="bg-white px-3 text-[11px] font-bold text-stone-400 uppercase tracking-wider shrink-0">
                      Or Pay Using UPI ID
                    </span>
                    <div className="border-t border-stone-200 w-full" />
                  </div>

                  <Input
                    label="Enter UPI ID / VPA"
                    placeholder="name@upi (e.g. yourname@okhdfcbank)"
                    value={upiId}
                    onChange={(e) => {
                      setUpiId(e.target.value);
                      if (paymentError) setPaymentError(null);
                    }}
                    leftIcon={<Smartphone className="w-4 h-4 text-stone-400" />}
                    helperText="A payment request will be simulated to this UPI handle."
                  />
                </div>

                {/* Method-specific primary button */}
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isSubmitting}
                  onClick={handleConfirmPayment}
                >
                  Verify & Pay ₹{estimatedTotal.toLocaleString("en-IN")}
                </Button>
              </div>
            )}

            {/* 2. Card Payment Gateway View */}
            {formData.paymentMethod === "card" && (
              <div className="space-y-4">
                {/* Visual Card Preview */}
                <div className="bg-gradient-to-tr from-emerald-900 via-emerald-800 to-teal-800 rounded-2xl p-4.5 text-white shadow-md space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black tracking-widest text-emerald-200">TEST BOTANICAL CARD</span>
                    <CreditCard className="w-6 h-6 text-emerald-300" />
                  </div>
                  <div className="space-y-1">
                    <div className="w-9 h-6 bg-amber-400/80 rounded-sm mb-2" />
                    <p className="font-mono text-base tracking-widest text-white drop-shadow-xs">
                      {cardNumber || "•••• •••• •••• ••••"}
                    </p>
                  </div>
                  <div className="flex justify-between items-baseline text-xs pt-1 border-t border-emerald-700/60 font-mono">
                    <div>
                      <p className="text-[10px] text-emerald-300 uppercase">Cardholder</p>
                      <p className="font-semibold text-white truncate max-w-[160px]">
                        {cardHolder || formData.customerName || "CARD HOLDER"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-emerald-300 uppercase">Expires</p>
                      <p className="font-semibold text-white">{cardExpiry || "MM/YY"}</p>
                    </div>
                  </div>
                </div>

                {/* Card Inputs */}
                <div className="space-y-3">
                  <Input
                    label="Test Card Number"
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={(e) => {
                      setCardNumber(e.target.value);
                      if (paymentError) setPaymentError(null);
                    }}
                    leftIcon={<CreditCard className="w-4 h-4" />}
                  />

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <Input
                        label="Expiry Date"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => {
                          setCardExpiry(e.target.value);
                          if (paymentError) setPaymentError(null);
                        }}
                      />
                    </div>
                    <div>
                      <Input
                        label="CVV / CVC"
                        placeholder="123"
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => {
                          setCardCvv(e.target.value);
                          if (paymentError) setPaymentError(null);
                        }}
                        leftIcon={<Lock className="w-3.5 h-3.5" />}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <Input
                        label="Cardholder"
                        placeholder="Name on card"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Method-specific primary button */}
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isSubmitting}
                  onClick={handleConfirmPayment}
                >
                  Pay ₹{estimatedTotal.toLocaleString("en-IN")}
                </Button>
              </div>
            )}

            {/* 3. Net Banking Payment Gateway View */}
            {formData.paymentMethod === "netbanking" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Select Your Bank
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: "HDFC", name: "HDFC Bank", short: "HDFC" },
                      { id: "SBI", name: "State Bank of India", short: "SBI" },
                      { id: "ICICI", name: "ICICI Bank", short: "ICICI" },
                      { id: "Axis", name: "Axis Bank", short: "Axis" },
                    ].map((bank) => (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => {
                          setSelectedBank(bank.id);
                          if (paymentError) setPaymentError(null);
                        }}
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                          selectedBank === bank.id
                            ? "bg-emerald-50 border-emerald-600 text-emerald-950 font-bold shadow-xs ring-1 ring-emerald-500"
                            : "border-stone-200 hover:bg-stone-50 text-stone-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-emerald-700" />
                          <span className="text-xs">{bank.name}</span>
                        </div>
                        {selectedBank === bank.id && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Other banks dropdown */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Or Choose Another Bank
                  </label>
                  <select
                    value={["HDFC", "SBI", "ICICI", "Axis"].includes(selectedBank) ? "" : selectedBank}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedBank(e.target.value);
                        if (paymentError) setPaymentError(null);
                      }
                    }}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="">-- More Indian Banks --</option>
                    <option value="Kotak">Kotak Mahindra Bank</option>
                    <option value="PNB">Punjab National Bank</option>
                    <option value="BOB">Bank of Baroda</option>
                    <option value="IndusInd">IndusInd Bank</option>
                    <option value="Canara">Canara Bank</option>
                  </select>
                </div>

                {/* Method-specific primary button */}
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isSubmitting}
                  onClick={handleConfirmPayment}
                >
                  Pay ₹{estimatedTotal.toLocaleString("en-IN")}
                </Button>
              </div>
            )}

            {/* Test Payment Action Strip (Both Confirm Test Payment and Cancel / Simulate Failure) */}
            <div className="pt-3 border-t border-stone-200 space-y-2.5 bg-stone-50 p-4 rounded-2xl">
              <div className="flex items-center justify-between text-xs text-stone-600">
                <span className="font-bold uppercase tracking-wider text-[11px] text-stone-700">
                  Payment Simulation Controls
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  Instant Test Flow
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className="w-full"
                  isLoading={isSubmitting}
                  onClick={handleConfirmPayment}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Confirm Test Payment
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  className="w-full text-rose-700 border-rose-300 hover:bg-rose-50 hover:border-rose-400"
                  disabled={isSubmitting}
                  onClick={handleSimulateFailure}
                  leftIcon={<XCircle className="w-4 h-4 text-rose-600" />}
                >
                  Cancel / Simulate Failure
                </Button>
              </div>
            </div>

            {/* Return / Cancel Link */}
            <div className="flex justify-between items-center pt-1 text-xs text-stone-500">
              <button
                type="button"
                onClick={() => {
                  setStep("details");
                  setPaymentError(null);
                }}
                className="hover:text-stone-800 underline font-medium"
              >
                ← Back to Delivery Address
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="hover:text-stone-800 underline font-medium"
              >
                Exit Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
