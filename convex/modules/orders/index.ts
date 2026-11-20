import { query, mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requireRole } from "../../lib/authGuard";
import { createBaseFields } from "../../lib/baseFields";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "../../_generated/dataModel";

/**
 * Place a new order from current active cart items.
 * Validates stock, decrements inventory, generates orderNumber, and clears cart.
 */
export const createOrder = mutation({
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

    // 2. Validate live stock and hydrate products
    const orderItems: {
      productId: Id<"products">;
      name: string;
      quantity: number;
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
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        imageUrl: product.imageUrls[0] || "",
      });

      subtotal += product.price * item.quantity;
    }

    // 3. Decrement live stock for each product
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

    // 5. Generate human-readable order number
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

    // 6. Create order record
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
      estimatedDeliveryDate,
      ...createBaseFields({
        userId: creatorId,
        category: "orders",
        type: "order",
        keywords: [orderNumber.toLowerCase(), args.customerName.toLowerCase()],
        status: "confirmed",
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
    };
  },
});

/**
 * Fetch an order by orderNumber for live tracking.
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
      return await ctx.db
        .query("orders")
        .withIndex("by_tenant_user", (q) =>
          q.eq("tenantId", args.tenantId).eq("userId", userId),
        )
        .collect();
    } else if (args.sessionId) {
      return await ctx.db
        .query("orders")
        .withIndex("by_tenant_session", (q) =>
          q.eq("tenantId", args.tenantId).eq("sessionId", args.sessionId),
        )
        .collect();
    }
    return [];
  },
});

/**
 * List all store orders for admin dashboard.
 */
export const listOrdersForAdmin = query({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.tenantId, ["store_admin"]);

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_tenant_orderNumber", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    orders.sort((a, b) => b.dateCreated - a.dateCreated);
    return orders;
  },
});

/**
 * Update order fulfillment status.
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
  },
  handler: async (ctx, args) => {
    const admin = await requireRole(ctx, args.tenantId, ["store_admin"]);

    const order = await ctx.db.get("orders", args.orderId);
    if (!order || order.tenantId !== args.tenantId) {
      throw new Error("Order not found in this store.");
    }

    await ctx.db.patch("orders", args.orderId, {
      status: args.status,
      editedBy: admin.userId!,
      dateEdited: Date.now(),
    });

    return { success: true };
  },
});
