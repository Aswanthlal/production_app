import { query, mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requireRole } from "../../lib/authGuard";
import { createBaseFields } from "../../lib/baseFields";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "../../_generated/dataModel";

/**
 * Place a new order from current active cart items.
 * Validates live stock (throwing if insufficient so stock never goes negative),
 * decrements stockQty, inserts a pending order with line-item snapshots, and clears cartItems.
 */
export const placeOrder = mutation({
  args: {
    tenantId: v.id("tenants"),
    sessionId: v.optional(v.string()),
    customerName: v.string(),
    phone: v.string(),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    pincode: v.string(),
    paymentMethod: v.string(),
    paymentStatus: v.optional(v.string()),
    couponCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.tenantId, ["guest", "customer", "store_admin"]);

    const userId = await getAuthUserId(ctx);
    if (!userId && !args.sessionId) {
      throw new Error("Shopper identification (userId or sessionId) required.");
    }

    // 1. Fetch active cart items
    let cartItems: Doc<"cartItems">[] = [];
    if (userId) {
      cartItems = await ctx.db
        .query("cartItems")
        .withIndex("by_tenant_user", (q) =>
          q.eq("tenantId", args.tenantId).eq("userId", userId).eq("status", "active"),
        )
        .collect();
    } else if (args.sessionId) {
      cartItems = await ctx.db
        .query("cartItems")
        .withIndex("by_tenant_session", (q) =>
          q.eq("tenantId", args.tenantId).eq("sessionId", args.sessionId).eq("status", "active"),
        )
        .collect();
    }

    if (cartItems.length === 0) {
      throw new Error("Cannot place an order with an empty cart.");
    }

    // 2. Atomically validate live stock and hydrate snapshots
    const orderItems: {
      productId: Id<"products">;
      title: string;
      name: string;
      sku?: string;
      quantity: number;
      unitPrice: number;
      price: number;
      imageUrl: string;
    }[] = [];

    let subtotal = 0;

    for (const item of cartItems) {
      const product = await ctx.db.get("products", item.productId);
      if (!product || product.tenantId !== args.tenantId) {
        throw new Error("One or more items in your cart is no longer available.");
      }

      if (product.status !== "active") {
        throw new Error(`"${product.name}" is currently not available for purchase.`);
      }

      if (item.quantity > product.stockQty) {
        throw new Error(
          `Insufficient stock for "${product.name}". Available: ${product.stockQty}, requested: ${item.quantity}.`,
        );
      }

      orderItems.push({
        productId: product._id,
        title: product.name,
        name: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice: product.price,
        price: product.price,
        imageUrl: product.imageUrls[0] || "",
      });

      subtotal += product.price * item.quantity;
    }

    // 3. Decrement live stock for each product (stock will never go negative)
    for (const item of cartItems) {
      const product = (await ctx.db.get("products", item.productId))!;
      const newStock = Math.max(0, product.stockQty - item.quantity);
      await ctx.db.patch("products", product._id, {
        stockQty: newStock,
        status: newStock === 0 ? "out-of-stock" : product.status,
        dateEdited: Date.now(),
      });
    }

    // 4. Calculate discount & shipping
    let discount = 0;
    const cleanCoupon = args.couponCode?.trim().toUpperCase();
    if (cleanCoupon === "GREEN10") {
      discount = Math.round(subtotal * 0.1);
    } else if (cleanCoupon === "SAVE100") {
      discount = Math.min(100, subtotal);
    }

    const shipping = subtotal >= 499 || cleanCoupon === "FREESHIP" ? 0 : 49;
    const total = Math.max(0, subtotal - discount + shipping);

    // 5. Generate human-readable order number & delivery date
    const orderNumber = "VD-" + Math.floor(100000 + Math.random() * 900000);

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3);
    const estimatedDeliveryDate = deliveryDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    let creatorId: Id<"users">;
    if (userId) {
      creatorId = userId;
    } else {
      const firstUser = await ctx.db.query("users").first();
      creatorId = firstUser?._id ?? (await ctx.db.insert("users", {}));
    }

    const paymentMethodLower = args.paymentMethod.toLowerCase();
    const paymentStatus =
      paymentMethodLower === "cod"
        ? "unpaid"
        : args.paymentStatus === "paid"
          ? "paid"
          : "unpaid";

    // 6. Create order record with initial 'pending' status
    const orderId = await ctx.db.insert("orders", {
      tenantId: args.tenantId,
      orderNumber,
      userId: userId ?? undefined,
      sessionId: args.sessionId,
      customerName: args.customerName.trim(),
      phone: args.phone.trim(),
      address: args.address.trim(),
      city: args.city.trim(),
      state: args.state.trim(),
      pincode: args.pincode.trim(),
      items: orderItems,
      subtotal,
      shipping,
      discount,
      total,
      paymentMethod: args.paymentMethod,
      paymentStatus,
      estimatedDeliveryDate,
      ...createBaseFields({
        userId: creatorId,
        category: "customer-order",
        type: "standard-order",
        keywords: [
          orderNumber.toLowerCase(),
          args.customerName.toLowerCase(),
          args.phone.replace(/\D/g, ""),
        ],
        status: "pending",
      }),
    });

    // 7. Clear cart items
    for (const item of cartItems) {
      await ctx.db.delete("cartItems", item._id);
    }

    return {
      orderId,
      orderNumber,
      total,
      estimatedDeliveryDate,
      status: "pending",
    };
  },
});

/** Backwards-compatible alias for placeOrder */
export const createOrder = placeOrder;

/**
 * Customer order lookup by orderNumber and matching phone number.
 * Rejects lookup if phone number does not match.
 */
export const trackOrderByNumberAndPhone = query({
  args: {
    tenantId: v.id("tenants"),
    orderNumber: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.tenantId, ["guest", "customer", "store_admin"]);

    const cleanOrderNumber = args.orderNumber.trim().toUpperCase();
    const cleanPhone = args.phone.trim().replace(/\D/g, "");

    if (!cleanOrderNumber || !cleanPhone) {
      return null;
    }

    const order = await ctx.db
      .query("orders")
      .withIndex("by_tenant_orderNumber", (q) =>
        q.eq("tenantId", args.tenantId).eq("orderNumber", cleanOrderNumber),
      )
      .unique();

    if (!order) {
      return null;
    }

    const orderPhoneClean = order.phone.replace(/\D/g, "");
    const matchesPhone =
      orderPhoneClean === cleanPhone ||
      (orderPhoneClean.length >= 10 &&
        cleanPhone.length >= 10 &&
        orderPhoneClean.slice(-10) === cleanPhone.slice(-10));

    if (!matchesPhone) {
      return null;
    }

    return order;
  },
});

/**
 * Fetch an order by orderNumber (legacy / helper).
 */
export const getOrderByNumber = query({
  args: {
    tenantId: v.id("tenants"),
    orderNumber: v.string(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.tenantId, ["guest", "customer", "store_admin"]);

    const clean = args.orderNumber.trim().toUpperCase();
    return await ctx.db
      .query("orders")
      .withIndex("by_tenant_orderNumber", (q) =>
        q.eq("tenantId", args.tenantId).eq("orderNumber", clean),
      )
      .unique();
  },
});

/**
 * List orders for customer / session history.
 */
export const listMyOrders = query({
  args: {
    tenantId: v.id("tenants"),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.tenantId, ["guest", "customer", "store_admin"]);

    const userId = await getAuthUserId(ctx);
    if (userId) {
      const orders = await ctx.db
        .query("orders")
        .withIndex("by_tenant_user", (q) =>
          q.eq("tenantId", args.tenantId).eq("userId", userId),
        )
        .collect();
      orders.sort((a, b) => b.dateCreated - a.dateCreated);
      return orders;
    } else if (args.sessionId) {
      const orders = await ctx.db
        .query("orders")
        .withIndex("by_tenant_session", (q) =>
          q.eq("tenantId", args.tenantId).eq("sessionId", args.sessionId),
        )
        .collect();
      orders.sort((a, b) => b.dateCreated - a.dateCreated);
      return orders;
    }
    return [];
  },
});

/**
 * List store orders for admin dashboard with reactive status filtering.
 */
export const listOrdersForAdmin = query({
  args: {
    tenantId: v.id("tenants"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.tenantId, ["store_admin"]);

    let orders;
    if (args.status && args.status !== "all") {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_tenant_status", (q) =>
          q.eq("tenantId", args.tenantId).eq("status", args.status!),
        )
        .collect();
    } else {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_tenant_orderNumber", (q) => q.eq("tenantId", args.tenantId))
        .collect();
    }

    orders.sort((a, b) => b.dateCreated - a.dateCreated);
    return orders;
  },
});

/**
 * Update order fulfillment status. Restores stockQty if transitioned to 'cancelled'.
 */
export const updateOrderStatus = mutation({
  args: {
    tenantId: v.id("tenants"),
    orderId: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("packed"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled"),
    ),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireRole(ctx, args.tenantId, ["store_admin"]);

    const order = await ctx.db.get("orders", args.orderId);
    if (!order || order.tenantId !== args.tenantId) {
      throw new Error("Order not found in this store.");
    }

    // If transitioned to 'cancelled', restore stockQty back to products
    if (order.status !== "cancelled" && args.status === "cancelled") {
      for (const item of order.items) {
        const product = await ctx.db.get("products", item.productId);
        if (product && product.tenantId === args.tenantId) {
          const newStock = product.stockQty + item.quantity;
          await ctx.db.patch("products", product._id, {
            stockQty: newStock,
            status: newStock > 0 && product.status === "out-of-stock" ? "active" : product.status,
            dateEdited: Date.now(),
          });
        }
      }
    }

    let paymentStatus =
      order.paymentStatus ||
      (order.paymentMethod && order.paymentMethod.toLowerCase() === "cod" ? "unpaid" : "paid");
    if (args.status === "delivered" && order.paymentMethod && order.paymentMethod.toLowerCase() === "cod") {
      paymentStatus = "paid";
    } else if (args.status === "cancelled" && order.paymentStatus === "paid") {
      paymentStatus = "refunded";
    }

    const patchData: {
      status: typeof args.status;
      editedBy: Id<"users">;
      dateEdited: number;
      paymentStatus: string;
      adminNotes?: string;
    } = {
      status: args.status,
      editedBy: admin.userId!,
      dateEdited: Date.now(),
      paymentStatus,
    };

    if (args.adminNotes !== undefined) {
      patchData.adminNotes = args.adminNotes;
    }

    await ctx.db.patch("orders", args.orderId, patchData);

    return { success: true };
  },
});
