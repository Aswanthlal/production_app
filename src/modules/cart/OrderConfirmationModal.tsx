import React from "react";
import { Modal } from "../../components/ui/Modal";
import { useStore } from "../../context/StoreContext";
import { Button } from "../../components/ui/Button";
import { CheckCircle2, Truck, Calendar } from "lucide-react";

export const OrderConfirmationModal: React.FC = () => {
  const {
    isOrderSuccessOpen,
    closeOrderSuccess,
    activeOrder,
    openTrackOrder,
  } = useStore();

  if (!activeOrder) return null;

  return (
    <Modal isOpen={isOrderSuccessOpen} onClose={closeOrderSuccess} maxWidth="xl">
      <div className="text-center space-y-5 p-2">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            Order Confirmed!
          </span>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight mt-1">
            Thank you, {activeOrder.customerName}!
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Order #{activeOrder.orderNumber} is being prepared by our botanical nursery team.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 text-left space-y-3">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-stone-200">
            <span className="text-stone-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              Estimated Delivery:
            </span>
            <span className="font-bold text-stone-900">
              {activeOrder.estimatedDeliveryDate}
            </span>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Items Ordered ({activeOrder.items.length})
            </span>
            {activeOrder.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-stone-800 font-semibold truncate max-w-[200px]">
                  {item.quantity}x {item.name}
                </span>
                <span className="font-bold text-stone-900">
                  ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-stone-200 flex justify-between text-xs font-black text-stone-900">
            <span>Total Paid</span>
            <span>₹{activeOrder.total.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <Button
            variant="outline"
            size="md"
            className="flex-1"
            onClick={closeOrderSuccess}
          >
            Continue Shopping
          </Button>
          <Button
            variant="primary"
            size="md"
            className="flex-1"
            onClick={() => {
              closeOrderSuccess();
              openTrackOrder();
            }}
            rightIcon={<Truck className="w-4 h-4" />}
          >
            Track Delivery
          </Button>
        </div>
      </div>
    </Modal>
  );
};
