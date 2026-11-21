import React, { useState, useMemo } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  Truck,
  CheckCircle2,
  IndianRupee,
  FileText,
  RotateCcw,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../components/ui/Toast";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import type { OrderStatus } from "../../types/store";

export const AdminOrdersTab: React.FC = () => {
  const { tenantId, orders: localOrders } = useStore();
  const { success, error } = useToast();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [cancelModalOrderId, setCancelModalOrderId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isRealTenant = Boolean(tenantId && !tenantId.startsWith("tenant_"));

  // 1. Live Convex Orders Query for Store Admin
  const liveAdminOrders = useQuery(
    api.modules.orders.index.listOrdersForAdmin,
    isRealTenant
      ? {
          tenantId: tenantId as Id<"tenants">,
          status: statusFilter === "all" ? undefined : statusFilter,
        }
      : "skip",
  );

  // 2. Status Mutation
  const updateStatusMutation = useMutation(api.modules.orders.index.updateOrderStatus);

  // Derive active orders list (live Convex data or local state fallback)
  const allOrders = useMemo(() => {
    if (liveAdminOrders) {
      return liveAdminOrders;
    }
    // Filter local orders by status if in demo mode
    if (statusFilter === "all") {
      return localOrders.map((o) => ({
        ...o,
        dateCreated: o.createdAt,
        paymentStatus: o.paymentStatus || "unpaid",
        items: o.items.map((i) => ({
          ...i,
          title: i.name,
          unitPrice: i.price,
          imageUrl: i.imageUrl || "",
        })),
      }));
    }
    return localOrders
      .filter((o) => o.status === statusFilter)
      .map((o) => ({
        ...o,
        dateCreated: o.createdAt,
        paymentStatus: o.paymentStatus || "unpaid",
        items: o.items.map((i) => ({
          ...i,
          title: i.name,
          unitPrice: i.price,
          imageUrl: i.imageUrl || "",
        })),
      }));
  }, [liveAdminOrders, localOrders, statusFilter]);

  // Client-side text search (Order #, Customer Name, Phone, City)
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return allOrders;
    const query = searchQuery.toLowerCase().trim();
    return allOrders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(query) ||
        o.customerName.toLowerCase().includes(query) ||
        o.phone.toLowerCase().includes(query) ||
        o.city.toLowerCase().includes(query) ||
        o.pincode.toLowerCase().includes(query),
    );
  }, [allOrders, searchQuery]);

  // Calculate live KPIs across all tenant orders
  const kpis = useMemo(() => {
    const list = liveAdminOrders || localOrders;
    let pendingCount = 0;
    let inTransitCount = 0;
    let deliveredCount = 0;
    let grossRevenue = 0;

    for (const o of list) {
      if (o.status === "pending") pendingCount++;
      else if (["confirmed", "packed", "shipped"].includes(o.status)) inTransitCount++;
      else if (o.status === "delivered") deliveredCount++;

      if (o.status !== "cancelled") {
        grossRevenue += o.total;
      }
    }

    return {
      pendingCount,
      inTransitCount,
      deliveredCount,
      grossRevenue,
    };
  }, [liveAdminOrders, localOrders]);

  // Handle Order Status Transition
  const handleUpdateStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    adminNote?: string,
  ) => {
    setActionError(null);
    try {
      if (newStatus === "cancelled") {
        setCancelModalOrderId(orderId);
        return;
      }
      await executeStatusUpdate(orderId, newStatus, adminNote);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update order status.";
      setActionError(msg);
      error("Update Failed", msg);
    }
  };

  const executeStatusUpdate = async (
    orderId: string,
    newStatus: OrderStatus,
    adminNote?: string,
  ) => {
    setActionError(null);
    try {
      if (isRealTenant && !orderId.startsWith("order_")) {
        await updateStatusMutation({
          tenantId: tenantId as Id<"tenants">,
          orderId: orderId as Id<"orders">,
          status: newStatus,
          adminNotes: adminNote,
        });
      }
      if (newStatus === "cancelled") {
        success(
          "Order Cancelled",
          "Order status updated to cancelled. Product stock quantities have been restored.",
        );
      } else {
        success("Status Updated", `Order marked as ${newStatus}.`);
      }
      setCancelModalOrderId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update order status.";
      setActionError(msg);
      error("Update Failed", msg);
    }
  };

  const handleSaveNote = async (orderId: string) => {
    setActionError(null);
    const note = notesDraft[orderId];
    try {
      if (isRealTenant && !orderId.startsWith("order_")) {
        const order = allOrders.find((o) => o._id === orderId);
        if (order) {
          await updateStatusMutation({
            tenantId: tenantId as Id<"tenants">,
            orderId: orderId as Id<"orders">,
            status: order.status as OrderStatus,
            adminNotes: note,
          });
        }
      }
      success("Note Saved", "Internal fulfillment note updated.");
      setEditingNoteId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save note.";
      setActionError(msg);
      error("Error", msg);
    }
  };

  const filterTabs = [
    { key: "all", label: "All Orders" },
    { key: "pending", label: "Pending" },
    { key: "confirmed", label: "Confirmed" },
    { key: "packed", label: "Packed" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Live Order KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              Pending Orders
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-amber-600 mt-2 block">
            {kpis.pendingCount}
          </span>
          <span className="text-[10px] text-stone-400 mt-1 block">Requires fulfillment action</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              Active / In-Transit
            </span>
            <Truck className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2 block">
            {kpis.inTransitCount}
          </span>
          <span className="text-[10px] text-stone-400 mt-1 block">Confirmed, packed, or shipped</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              Delivered
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-stone-900 mt-2 block">
            {kpis.deliveredCount}
          </span>
          <span className="text-[10px] text-stone-400 mt-1 block">Successfully arrived at customer</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              Gross Order Value
            </span>
            <IndianRupee className="w-4 h-4 text-stone-500" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-emerald-950 mt-2 block">
            ₹{kpis.grossRevenue.toLocaleString("en-IN")}
          </span>
          <span className="text-[10px] text-stone-400 mt-1 block">Non-cancelled revenue</span>
        </div>
      </div>

      {/* Inline Action Error Alert */}
      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-800 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-700 hover:text-rose-900 font-bold underline ml-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Filter Bar & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === tab.key
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Order #, customer, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-emerald-600"
          />
        </div>
      </div>

      {/* 3. Live Order Queue Table */}
      <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Order Details</th>
                <th className="p-4">Customer & Contact</th>
                <th className="p-4">Destination</th>
                <th className="p-4">Items</th>
                <th className="p-4">Total & Billing</th>
                <th className="p-4">Fulfillment Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-stone-400">
                    <div className="w-12 h-12 rounded-full bg-stone-50 text-stone-400 flex items-center justify-center mx-auto mb-2">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-stone-600">No orders found</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {searchQuery
                        ? "No orders match your search criteria."
                        : `No orders currently have status "${statusFilter}".`}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isExpanded = expandedOrderId === order._id;
                  const orderDate = new Date(order.dateCreated).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <React.Fragment key={order._id}>
                      <tr className="hover:bg-stone-50/60 transition">
                        {/* Order Number & Timestamp */}
                        <td className="p-4">
                          <span className="font-mono font-black text-stone-900 block">
                            #{order.orderNumber}
                          </span>
                          <span className="text-[11px] text-stone-400 block mt-0.5">
                            {orderDate}
                          </span>
                        </td>

                        {/* Customer & Phone */}
                        <td className="p-4">
                          <span className="font-bold text-stone-900 block">
                            {order.customerName}
                          </span>
                          <span className="text-stone-500 font-mono text-[11px] block mt-0.5">
                            {order.phone}
                          </span>
                        </td>

                        {/* Destination */}
                        <td className="p-4">
                          <span className="text-stone-800 block">{order.city}</span>
                          <span className="text-stone-400 text-[11px] block">
                            PIN: {order.pincode}
                          </span>
                        </td>

                        {/* Line Items summary with toggle */}
                        <td className="p-4">
                          <button
                            onClick={() =>
                              setExpandedOrderId(isExpanded ? null : order._id)
                            }
                            className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold cursor-pointer"
                          >
                            <span>
                              {order.items.length} {order.items.length === 1 ? "plant" : "plants"}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>

                        {/* Total & Payment Badge */}
                        <td className="p-4">
                          <span className="font-black text-stone-900 block text-sm">
                            ₹{order.total.toLocaleString("en-IN")}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] font-bold uppercase text-stone-500">
                              {order.paymentMethod}
                            </span>
                            <Badge
                              variant={order.paymentStatus === "paid" ? "success" : "neutral"}
                              size="sm"
                            >
                              {(order.paymentStatus || "unpaid").toUpperCase()}
                            </Badge>
                          </div>
                        </td>

                        {/* Status Dropdown */}
                        <td className="p-4">
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleUpdateStatus(order._id, e.target.value as OrderStatus)
                            }
                            className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border focus:outline-none cursor-pointer ${
                              order.status === "delivered"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : order.status === "cancelled"
                                ? "bg-rose-50 text-rose-800 border-rose-200"
                                : order.status === "pending"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-stone-50 text-stone-800 border-stone-200"
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="packed">Packed</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled (Restore Stock)</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          <button
                            onClick={() =>
                              setExpandedOrderId(isExpanded ? null : order._id)
                            }
                            className="p-1.5 text-stone-500 hover:text-emerald-700 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                            title="Inspect order details"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Accordion View: Line items & Admin Fulfillment Notes */}
                      {isExpanded && (
                        <tr className="bg-stone-50/70">
                          <td colSpan={7} className="p-4 sm:p-6 space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Left: Snapshot items */}
                              <div className="space-y-2">
                                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                                  Ordered Plants Snapshot ({order.items.length})
                                </span>
                                <div className="divide-y divide-stone-200 border border-stone-200 rounded-2xl overflow-hidden bg-white">
                                  {order.items.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="p-3 flex items-center justify-between gap-3 text-xs"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        {item.imageUrl && (
                                          <img
                                            src={item.imageUrl}
                                            alt={item.title ?? item.name ?? "Plant"}
                                            className="w-10 h-10 rounded-xl object-cover border border-stone-200 shrink-0"
                                          />
                                        )}
                                        <div>
                                          <h5 className="font-bold text-stone-900 truncate">
                                            {item.title ?? item.name ?? "Plant"}
                                          </h5>
                                          <span className="text-stone-400 text-[11px]">
                                            Qty: {item.quantity} × ₹{item.unitPrice ?? item.price ?? 0}
                                          </span>
                                        </div>
                                      </div>
                                      <span className="font-bold text-stone-900 shrink-0">
                                        ₹{((item.unitPrice ?? item.price ?? 0) * item.quantity).toLocaleString("en-IN")}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Right: Full shipping address & Fulfillment Notes */}
                              <div className="space-y-4">
                                <div className="bg-white p-3.5 rounded-2xl border border-stone-200 space-y-1">
                                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                                    Full Delivery Address
                                  </span>
                                  <p className="text-stone-800 font-semibold text-xs">
                                    {order.address}
                                  </p>
                                  <p className="text-stone-600 text-xs">
                                    {order.city}, {order.state} - {order.pincode}
                                  </p>
                                  <p className="text-stone-500 text-xs font-mono">
                                    Recipient Phone: {order.phone}
                                  </p>
                                  <p className="text-stone-500 text-xs">
                                    Delivery Window: {order.estimatedDeliveryDate}
                                  </p>
                                </div>

                                {/* Internal Fulfillment Notes */}
                                <div className="bg-white p-3.5 rounded-2xl border border-stone-200 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                                      Internal Fulfillment / Tracking Note
                                    </span>
                                    {editingNoteId !== order._id && (
                                      <button
                                        onClick={() => {
                                          setEditingNoteId(order._id);
                                          setNotesDraft({
                                            ...notesDraft,
                                            [order._id]: order.adminNotes || "",
                                          });
                                        }}
                                        className="text-xs text-emerald-700 font-bold hover:underline"
                                      >
                                        Edit Note
                                      </button>
                                    )}
                                  </div>

                                  {editingNoteId === order._id ? (
                                    <div className="space-y-2">
                                      <input
                                        type="text"
                                        placeholder="e.g. Courier: BlueDart, Tracking # 783921..."
                                        value={notesDraft[order._id] ?? (order.adminNotes || "")}
                                        onChange={(e) =>
                                          setNotesDraft({
                                            ...notesDraft,
                                            [order._id]: e.target.value,
                                          })
                                        }
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-emerald-600"
                                      />
                                      <div className="flex justify-end gap-2">
                                        <button
                                          onClick={() => setEditingNoteId(null)}
                                          className="px-2.5 py-1 text-xs text-stone-500 hover:text-stone-700"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={() => handleSaveNote(order._id)}
                                          className="px-3 py-1 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800"
                                        >
                                          Save
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-stone-600 italic">
                                      {order.adminNotes || "No notes added yet."}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Cancellation Confirmation Modal (Guarantees Stock Restoration Awareness) */}
      {cancelModalOrderId && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-stone-200 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-stone-900">
                Cancel Order & Restore Stock?
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Cancelling this order will mark its fulfillment as cancelled and automatically increment the catalog stock quantity for each ordered botanical item back into active inventory.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelModalOrderId(null)}
              >
                Go Back
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => executeStatusUpdate(cancelModalOrderId, "cancelled")}
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
