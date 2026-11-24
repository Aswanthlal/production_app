import React, { useState, useEffect } from "react";
import {
  Search,
  Truck,
  ArrowLeft,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  Box,
  AlertTriangle,
  Receipt,
  XCircle,
  Package,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useStore } from "../../context/StoreContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import type { Order, OrderStatus } from "../../types/store";

interface TrackOrderPageProps {
  onBackToHome?: () => void;
  initialOrderNumber?: string;
  initialPhone?: string;
}

export const TrackOrderPage: React.FC<TrackOrderPageProps> = ({
  onBackToHome,
  initialOrderNumber = "",
  initialPhone = "",
}) => {
  const { tenantId, orders } = useStore();

  const [orderNumberInput, setOrderNumberInput] = useState(initialOrderNumber);
  const [phoneInput, setPhoneInput] = useState(initialPhone);
  const [submittedQuery, setSubmittedQuery] = useState<{
    orderNumber: string;
    phone: string;
  } | null>(
    initialOrderNumber && initialPhone
      ? { orderNumber: initialOrderNumber.trim().toUpperCase(), phone: initialPhone.trim().replace(/\D/g, "") }
      : null,
  );

  const [validationError, setValidationError] = useState<string | null>(null);

  // Auto-fill from store if initial is empty but store has orders
  useEffect(() => {
    if (!initialOrderNumber && orders.length > 0 && !submittedQuery) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOrderNumberInput(orders[0].orderNumber);
      setPhoneInput(orders[0].phone);
      setSubmittedQuery({
        orderNumber: orders[0].orderNumber,
        phone: orders[0].phone.replace(/\D/g, ""),
      });
    }
  }, [initialOrderNumber, orders, submittedQuery]);

  const isRealTenant = Boolean(tenantId && !tenantId.startsWith("tenant_"));

  // 1. Live server-side track order query
  const liveOrder = useQuery(
    api.modules.orders.index.trackOrderByNumberAndPhone,
    isRealTenant && submittedQuery
      ? {
          tenantId: tenantId as Id<"tenants">,
          orderNumber: submittedQuery.orderNumber,
          phone: submittedQuery.phone,
        }
      : "skip",
  );

  // 2. Live recent orders for current user/session
  const myRecentOrders = useQuery(
    api.modules.orders.index.listMyOrders,
    isRealTenant
      ? {
          tenantId: tenantId as Id<"tenants">,
        }
      : "skip",
  );

  const isQueryLoading =
    isRealTenant && Boolean(submittedQuery) && liveOrder === undefined;

  // Local fallback if running on demo mock state
  const fallbackOrder: Order | null = React.useMemo(() => {
    if (!submittedQuery) return null;
    const cleanNum = submittedQuery.orderNumber.toUpperCase();
    const cleanPh = submittedQuery.phone;
    const match = orders.find(
      (o) =>
        o.orderNumber.toUpperCase() === cleanNum &&
        o.phone.replace(/\D/g, "") === cleanPh,
    );
    return match || null;
  }, [submittedQuery, orders]);

  const activeTrackingOrder: Order | null = React.useMemo(() => {
    if (liveOrder) {
      return {
        _id: liveOrder._id,
        orderNumber: liveOrder.orderNumber,
        customerName: liveOrder.customerName,
        phone: liveOrder.phone,
        address: liveOrder.address,
        city: liveOrder.city,
        state: liveOrder.state,
        pincode: liveOrder.pincode,
        items: liveOrder.items.map((i) => ({
          ...i,
          name: i.name || i.title,
          price: i.price ?? i.unitPrice,
        })),
        subtotal: liveOrder.subtotal,
        shipping: liveOrder.shipping,
        discount: liveOrder.discount,
        total: liveOrder.total,
        paymentMethod: liveOrder.paymentMethod as Order["paymentMethod"],
        paymentStatus: liveOrder.paymentStatus,
        status: liveOrder.status as OrderStatus,
        createdAt: liveOrder.dateCreated,
        estimatedDeliveryDate: liveOrder.estimatedDeliveryDate,
        adminNotes: liveOrder.adminNotes,
      };
    }
    return fallbackOrder;
  }, [liveOrder, fallbackOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const cleanNum = orderNumberInput.trim().toUpperCase();
    const cleanPh = phoneInput.trim().replace(/\D/g, "");

    if (!cleanNum) {
      setValidationError("Please enter an Order Number (e.g. VD-482910).");
      return;
    }
    if (!cleanPh || cleanPh.length < 10) {
      setValidationError("Please enter the 10-digit mobile number used during checkout.");
      return;
    }

    setSubmittedQuery({
      orderNumber: cleanNum,
      phone: cleanPh,
    });
  };

  const steps = [
    { key: "pending", label: "Order Received", desc: "Awaiting nursery confirmation", icon: Clock },
    { key: "confirmed", label: "Confirmed", desc: "Assigned to botanical specialist", icon: CheckCircle2 },
    { key: "packed", label: "Packed", desc: "Ventilated shockproof boxing", icon: Box },
    { key: "shipped", label: "In Transit", desc: "With express botanical courier", icon: Truck },
    { key: "delivered", label: "Delivered", desc: "At your doorstep", icon: Package },
  ];

  const getStepStatus = (stepKey: string, currentStatus: OrderStatus) => {
    if (currentStatus === "cancelled") return "cancelled";
    const statusOrder: OrderStatus[] = ["pending", "confirmed", "packed", "shipped", "delivered"];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepKey as OrderStatus);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-fade-in">
      {/* 1. Header Navigation Bar */}
      <div className="flex items-center justify-between gap-4">
        {onBackToHome && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBackToHome}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Storefront
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
          <Truck className="w-4 h-4 text-emerald-700" />
          <span>Real-time Order Tracker</span>
        </div>
      </div>

      {/* 2. Hero Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-stone-900 tracking-tight">
          Track Your Delivery
        </h1>
        <p className="text-sm text-stone-500 max-w-md mx-auto">
          Enter your Order Number and verified checkout phone number to see live fulfillment updates.
        </p>
      </div>

      {/* 3. Lookup Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4">
        {validationError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
          <div className="sm:col-span-2">
            <Input
              label="Order Number"
              placeholder="e.g. VD-482910"
              value={orderNumberInput}
              onChange={(e) => setOrderNumberInput(e.target.value)}
              className="font-mono text-xs font-bold uppercase"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="10-digit Phone Number"
              placeholder="e.g. 9876543210"
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="text-xs"
              required
            />
          </div>
          <div className="sm:col-span-1">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full h-10"
              leftIcon={<Search className="w-4 h-4" />}
            >
              Track
            </Button>
          </div>
        </form>
      </div>

      {/* 4. Tracking Results Viewport */}
      {isQueryLoading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 space-y-3 shadow-xs">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-stone-600">
            Fetching order #{submittedQuery?.orderNumber}...
          </p>
        </div>
      ) : activeTrackingOrder ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-8 animate-fade-in">
          {/* Order Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider font-mono">
                  Order Details
                </span>
                <Badge
                  variant={
                    activeTrackingOrder.status === "delivered"
                      ? "success"
                      : activeTrackingOrder.status === "cancelled"
                      ? "danger"
                      : "brand"
                  }
                  size="md"
                >
                  {activeTrackingOrder.status.toUpperCase()}
                </Badge>
              </div>
              <h2 className="text-2xl font-black text-stone-900 font-mono">
                #{activeTrackingOrder.orderNumber}
              </h2>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-stone-400 font-bold uppercase tracking-wider block">
                Estimated Delivery
              </span>
              <span className="text-base font-extrabold text-emerald-800 flex items-center sm:justify-end gap-1.5 mt-0.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                {activeTrackingOrder.estimatedDeliveryDate}
              </span>
            </div>
          </div>

          {/* Cancellation Alert if Cancelled */}
          {activeTrackingOrder.status === "cancelled" && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-800">
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-rose-900">This order has been cancelled</h4>
                <p className="mt-0.5">
                  Fulfillment was discontinued and any stock holds have been restored. If payment was made, your refund is being processed according to your payment provider&apos;s timeline.
                </p>
              </div>
            </div>
          )}

          {/* Visual Fulfillment Stepper */}
          {activeTrackingOrder.status !== "cancelled" && (
            <div className="py-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-6">
                Fulfillment Status
              </span>
              <div className="relative flex flex-col md:flex-row justify-between gap-6 md:gap-2">
                {/* Connector line for desktop */}
                <div className="hidden md:block absolute top-5 left-8 right-8 h-1 bg-stone-100 z-0" />

                {steps.map((st) => {
                  const status = getStepStatus(st.key, activeTrackingOrder.status);
                  const Icon = st.icon;
                  return (
                    <div
                      key={st.key}
                      className="relative z-10 flex md:flex-col items-center md:text-center gap-3.5 md:gap-2 md:flex-1"
                    >
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                          status === "completed"
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                            : status === "current"
                            ? "bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-md animate-pulse"
                            : "bg-stone-100 text-stone-400"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          className={`text-xs font-bold ${
                            status === "current"
                              ? "text-emerald-900"
                              : status === "completed"
                              ? "text-stone-900"
                              : "text-stone-400"
                          }`}
                        >
                          {st.label}
                        </h4>
                        <p className="text-[11px] text-stone-400 line-clamp-1">{st.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Destination & Payment Information Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-stone-200 text-xs">
            {/* Delivery address */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-1.5">
              <span className="font-bold text-stone-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                Shipping Destination
              </span>
              <p className="font-bold text-stone-900 text-sm">
                {activeTrackingOrder.customerName}
              </p>
              <p className="text-stone-600">
                {activeTrackingOrder.address}, {activeTrackingOrder.city},{" "}
                {activeTrackingOrder.state} - {activeTrackingOrder.pincode}
              </p>
              <p className="font-mono text-stone-500">Contact: {activeTrackingOrder.phone}</p>
            </div>

            {/* Payment & Invoice summary */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-1.5">
              <span className="font-bold text-stone-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-emerald-700" />
                Payment & Billing
              </span>
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-stone-600">Payment Method:</span>
                <span className="font-bold uppercase text-stone-900">
                  {activeTrackingOrder.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-stone-600">Payment Status:</span>
                <Badge
                  variant={
                    activeTrackingOrder.paymentStatus === "paid" ? "success" : "neutral"
                  }
                  size="sm"
                >
                  {(activeTrackingOrder.paymentStatus || "unpaid").toUpperCase()}
                </Badge>
              </div>
              <div className="flex justify-between items-baseline pt-1 font-bold text-stone-900">
                <span>Total Amount:</span>
                <span className="text-sm font-black text-emerald-900">
                  ₹{activeTrackingOrder.total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Ordered Line Items Snapshot */}
          <div className="pt-6 border-t border-stone-200 space-y-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
              Items Snapshot ({activeTrackingOrder.items.length})
            </span>
            <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-stone-50/50">
              {activeTrackingOrder.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.title ?? item.name ?? "Plant"}
                        className="w-10 h-10 rounded-xl object-cover border border-stone-200 bg-white shrink-0"
                      />
                    )}
                    <div>
                      <h4 className="font-bold text-stone-900 truncate">
                        {item.title ?? item.name ?? "Plant"}
                      </h4>
                      <span className="text-stone-400 text-[11px]">
                        Qty: {item.quantity} × ₹{item.unitPrice ?? item.price ?? 0}
                      </span>
                    </div>
                  </div>
                  <span className="font-black text-stone-900 shrink-0">
                    ₹{((item.unitPrice ?? item.price ?? 0) * item.quantity).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : submittedQuery ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-stone-200 text-stone-500 text-xs space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-stone-800">No Matching Order Found</h3>
          <p className="max-w-md mx-auto text-stone-500">
            We could not find an order for <strong className="text-stone-900">#{submittedQuery.orderNumber}</strong> matching phone number <strong className="text-stone-900">{submittedQuery.phone}</strong>.
            Please verify that both the Order # and the contact number match your checkout confirmation.
          </p>
        </div>
      ) : null}

      {/* 5. Past Order History (if available) */}
      {myRecentOrders && myRecentOrders.length > 0 && (
        <div className="pt-6 border-t border-stone-200 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500">
            Recent Orders in this Session ({myRecentOrders.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {myRecentOrders.map((ro) => (
              <div
                key={ro._id}
                onClick={() => {
                  setOrderNumberInput(ro.orderNumber);
                  setPhoneInput(ro.phone);
                  setSubmittedQuery({
                    orderNumber: ro.orderNumber,
                    phone: ro.phone.replace(/\D/g, ""),
                  });
                }}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer flex justify-between items-center ${
                  submittedQuery?.orderNumber === ro.orderNumber
                    ? "bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-500/20"
                    : "bg-white border-stone-200 hover:border-stone-300"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs text-stone-900">
                      #{ro.orderNumber}
                    </span>
                    <Badge variant="brand" size="sm">
                      {ro.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    {ro.items.length} items • ₹{ro.total} • {ro.estimatedDeliveryDate}
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  View
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
