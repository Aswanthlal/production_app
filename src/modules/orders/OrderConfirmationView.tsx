import React from "react";
import { Modal } from "../../components/ui/Modal";
import { useStore } from "../../context/StoreContext";
import { Button } from "../../components/ui/Button";
import { CheckCircle2, Truck, Calendar, MapPin } from "lucide-react";
import type { Order } from "../../types/store";

interface OrderConfirmationViewProps {
  order?: Order | null;
  onContinueShopping?: () => void;
  onTrackOrder?: (orderNumber: string, phone: string) => void;
}

export const OrderConfirmationView: React.FC<OrderConfirmationViewProps> = ({
  order: propOrder,
  onContinueShopping,
  onTrackOrder,
}) => {
  const {
    isOrderSuccessOpen,
    closeOrderSuccess,
    activeOrder,
    openTrackOrder,
  } = useStore();

  const order = propOrder || activeOrder;

  if (!order) return null;

  const handleTrack = () => {
    closeOrderSuccess();
    if (onTrackOrder) {
      onTrackOrder(order.orderNumber, order.phone);
    } else {
      openTrackOrder();
    }
  };

  const handleContinue = () => {
    closeOrderSuccess();
    if (onContinueShopping) {
      onContinueShopping();
    }
  };

  return (
    <Modal isOpen={isOrderSuccessOpen} onClose={closeOrderSuccess} maxWidth="xl">
      <div className="text-center space-y-6 p-2">
        {/* Animated Celebration Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-md ring-8 ring-emerald-50 animate-bounce">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Order Placed Successfully
          </span>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight mt-2.5">
            Thank you, {order.customerName}!
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Order <strong className="text-stone-900 font-mono">#{order.orderNumber}</strong> has been confirmed and is being prepped in our nursery.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 text-left space-y-4">
          <div className="flex items-center justify-between text-xs pb-3 border-b border-stone-200">
            <span className="text-stone-500 flex items-center gap-1.5 font-medium">
              <Calendar className="w-4 h-4 text-emerald-700" />
              Estimated Delivery:
            </span>
            <span className="font-bold text-stone-900">
              {order.estimatedDeliveryDate}
            </span>
          </div>

          {/* Delivery Address snippet */}
          <div className="flex items-start gap-2.5 text-xs text-stone-600 pb-3 border-b border-stone-200">
            <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-stone-900">Delivering to:</p>
              <p>{order.address}, {order.city}, {order.state} - {order.pincode}</p>
              <p className="text-[11px] text-stone-500 font-mono mt-0.5">Contact: {order.phone}</p>
            </div>
          </div>

          {/* Ordered Line Items Snapshot */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Items Ordered ({order.items.length})
            </span>
            <div className="max-h-40 overflow-y-auto space-y-2 pr-1 divide-y divide-stone-100">
              {order.items.map((item, idx) => (
                <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.title ?? item.name ?? "Plant"}
                        className="w-8 h-8 rounded-lg object-cover border border-stone-200 shrink-0"
                      />
                    )}
                    <span className="text-stone-800 font-semibold truncate max-w-[220px]">
                      {item.quantity}x {item.title ?? item.name ?? "Plant"}
                    </span>
                  </div>
                  <span className="font-bold text-stone-900 shrink-0">
                    ₹{((item.unitPrice ?? item.price ?? 0) * item.quantity).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Totals Breakdown */}
          <div className="pt-3 border-t border-stone-200 space-y-1.5 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Discount:</span>
                <span>-₹{order.discount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>{order.shipping === 0 ? "FREE" : `₹${order.shipping}`}</span>
            </div>
            <div className="pt-2 border-t border-stone-200 flex justify-between font-black text-stone-900 text-sm">
              <span>Total Paid ({order.paymentMethod.toUpperCase()}):</span>
              <span className="text-base text-emerald-900">₹{order.total.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="outline"
            size="md"
            className="flex-1"
            onClick={handleContinue}
          >
            Continue Shopping
          </Button>
          <Button
            variant="primary"
            size="md"
            className="flex-1"
            onClick={handleTrack}
            rightIcon={<Truck className="w-4 h-4" />}
          >
            Track Delivery
          </Button>
        </div>
      </div>
    </Modal>
  );
};
