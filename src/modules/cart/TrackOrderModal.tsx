import React, { useState, useMemo } from "react";
import { Modal } from "../../components/ui/Modal";
import { useStore } from "../../context/StoreContext";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { MapPin, Search } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { Order } from "../../types/store";

export const TrackOrderModal: React.FC = () => {
  const { tenantId, isTrackOrderOpen, closeTrackOrder, orders, getOrder } = useStore();
  const [orderQuery, setOrderQuery] = useState(
    orders[0]?.orderNumber || "VD-482910",
  );
  const [submittedQuery, setSubmittedQuery] = useState(
    orders[0]?.orderNumber || "VD-482910",
  );

  const isRealTenant = Boolean(tenantId && !tenantId.startsWith("tenant_"));
  const liveOrder = useQuery(
    api.modules.orders.index.getOrderByNumber,
    isRealTenant && submittedQuery.trim()
      ? { tenantId: tenantId as Id<"tenants">, orderNumber: submittedQuery.trim().toUpperCase() }
      : "skip",
  );

  const isQueryLoading = isRealTenant && Boolean(submittedQuery.trim()) && liveOrder === undefined;

  const searchedOrder: Order | null = useMemo(() => {
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
        items: liveOrder.items,
        subtotal: liveOrder.subtotal,
        shipping: liveOrder.shipping,
        discount: liveOrder.discount,
        total: liveOrder.total,
        paymentMethod: liveOrder.paymentMethod as "upi" | "card" | "cod" | "netbanking",
        status: liveOrder.status as Order["status"],
        createdAt: liveOrder.dateCreated,
        estimatedDeliveryDate: new Date(liveOrder.dateCreated + 3 * 86400000).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      };
    }
    const local = getOrder(submittedQuery);
    if (local) return local;
    return null;
  }, [liveOrder, submittedQuery, getOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderQuery.trim()) return;
    setSubmittedQuery(orderQuery.trim());
  };

  const steps = [
    { key: "pending", label: "Order Received", desc: "Payment verified" },
    { key: "confirmed", label: "Confirmed", desc: "Sent to nursery" },
    { key: "packed", label: "Packed", desc: "Shockproof boxing" },
    { key: "shipped", label: "On The Way", desc: "With express courier" },
    { key: "delivered", label: "Delivered", desc: "At your doorstep" },
  ];

  const getStepStatus = (stepKey: string) => {
    const currentStatus = searchedOrder?.status || "confirmed";
    const statusOrder = ["pending", "confirmed", "packed", "shipped", "delivered"];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepKey);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

  return (
    <Modal isOpen={isTrackOrderOpen} onClose={closeTrackOrder} maxWidth="xl">
      <div className="space-y-6">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            Live Delivery Tracking
          </span>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">
            Track Your Botanical Order
          </h2>
        </div>

        {/* Search input */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Enter Order # (e.g. VD-482910)"
            value={orderQuery}
            onChange={(e) => setOrderQuery(e.target.value)}
            className="text-xs uppercase font-mono font-bold"
          />
          <Button type="submit" variant="primary" size="md" leftIcon={<Search className="w-3.5 h-3.5" />}>
            Track
          </Button>
        </form>

        {isQueryLoading ? (
          <div className="bg-stone-50 rounded-3xl p-10 text-center border border-stone-200/80 space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-stone-600">
              Searching for order #{submittedQuery}...
            </p>
          </div>
        ) : searchedOrder ? (
          <div className="bg-stone-50 rounded-3xl p-6 border border-stone-200/80 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-stone-200">
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Order Number
                </span>
                <h4 className="text-base font-black text-stone-900">
                  #{searchedOrder.orderNumber}
                </h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Estimated Delivery
                </span>
                <h4 className="text-sm font-bold text-emerald-800">
                  {searchedOrder.estimatedDeliveryDate}
                </h4>
              </div>
            </div>

            {/* Stepper Timeline */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
              {steps.map((st) => {
                const status = getStepStatus(st.key);
                return (
                  <div key={st.key} className="relative flex items-start gap-4">
                    <span
                      className={`absolute -left-6 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                        status === "completed"
                          ? "bg-emerald-600 text-white"
                          : status === "current"
                          ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                          : "bg-stone-200 text-stone-500"
                      }`}
                    >
                      {status === "completed" ? "✓" : ""}
                    </span>
                    <div>
                      <h5
                        className={`text-xs font-bold ${
                          status === "current"
                            ? "text-emerald-900"
                            : status === "completed"
                            ? "text-stone-800"
                            : "text-stone-400"
                        }`}
                      >
                        {st.label}
                      </h5>
                      <p className="text-[11px] text-stone-500">{st.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Shipping Address snippet */}
            <div className="pt-4 border-t border-stone-200 text-xs text-stone-600 flex items-start gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-stone-800">{searchedOrder.customerName}</p>
                <p>
                  {searchedOrder.address}, {searchedOrder.city}, {searchedOrder.state} -{" "}
                  {searchedOrder.pincode}
                </p>
                <p className="mt-1 text-[11px] text-stone-400 font-mono">
                  Items: {searchedOrder.items.length} plants • Total: ₹{searchedOrder.total}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-stone-50 rounded-3xl p-8 text-center border border-stone-200 text-stone-500 text-xs">
            No order found with number &quot;{submittedQuery}&quot;. Please verify the order number and try again.
          </div>
        )}
      </div>
    </Modal>
  );
};
