import { query, mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requireRole } from "../../lib/authGuard";
import { createBaseFields } from "../../lib/baseFields";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "../../_generated/dataModel";

/**
 * List active cart items for current tenant & user / session.
 * Hydrates each cart item with its live product details.
 */
export const listCartItems = query({
  args: {
    tenantId: v.id("tenants"),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.tenantId, ["guest", "customer", "store_admin"]);

    const userId = await getAuthUserId(ctx);

    let rawItems: Doc<"cartItems">[] = [];
    if (userId) {
      rawItems = await ctx.db
        .query("cartItems")
        .withIndex("by_tenant_user", (q) =>
          q.eq("tenantId", args.tenantId).eq("userId", userId).eq("status", "active"),
        )
        .collect();
    } else if (args.sessionId) {
      rawItems = await ctx.db
        .query("cartItems")
        .withIndex("by_tenant_session", (q) =>
          q.eq("tenantId", args.tenantId).eq("sessionId", args.sessionId).eq("status", "active"),
        )
        .collect();
    }

    // Hydrate each item with product data
    const hydrated = await Promise.all(
      rawItems.map(async (item) => {
        const product = await ctx.db.get("products", item.productId);
        return {
          ...item,
          product: product && product.tenantId === args.tenantId ? product : null,
        };
      }),
    );

    // Filter out items whose product no longer exists
    return hydrated.filter((item) => item.product !== null);
  },
});

/**
 * Get active products as suggestions ("You may also like") for CartDrawer.
 */
export const getCartRecommendations = query({
  args: {
    tenantId: v.id("tenants"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.tenantId, ["guest", "customer", "store_admin"]);

    const maxItems = args.limit ?? 4;
    return await ctx.db
      .query("products")
      .withIndex("by_tenant_status", (q) =>
        q.eq("tenantId", args.tenantId).eq("status", "active"),
      )
      .take(maxItems);
  },
});

/**
 * Add a plant/product to cart. Increments quantity if already in cart.
 */
export const addToCart = mutation({
  args: {
    tenantId: v.id("tenants"),
    productId: v.id("products"),
    quantity: v.optional(v.number()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.tenantId, ["guest", "customer", "store_admin"]);

    const product = await ctx.db.get("products", args.productId);
    if (!product || product.tenantId !== args.tenantId) {
      throw new Error("Product not found in this store.");
    }
    if (product.status !== "active") {
      throw new Error("Product is not currently available for purchase.");
    }

    const addQty = args.quantity ?? 1;
    if (addQty <= 0) {
      throw new Error("Quantity must be greater than zero.");
    }

    const userId = await getAuthUserId(ctx);
    if (!userId && !args.sessionId) {
      throw new Error("Either a signed-in user or a guest sessionId is required.");
    }

    // Find if already in cart
    let existingItem: Doc<"cartItems"> | null = null;
    if (userId) {
      const userItems = await ctx.db
        .query("cartItems")
        .withIndex("by_tenant_user", (q) =>
          q.eq("tenantId", args.tenantId).eq("userId", userId).eq("status", "active"),
        )
        .collect();
      existingItem = userItems.find((i) => i.productId === args.productId) ?? null;
    } else if (args.sessionId) {
      const sessionItems = await ctx.db
        .query("cartItems")
        .withIndex("by_tenant_session", (q) =>
          q.eq("tenantId", args.tenantId).eq("sessionId", args.sessionId).eq("status", "active"),
        )
        .collect();
      existingItem = sessionItems.find((i) => i.productId === args.productId) ?? null;
    }

    if (existingItem) {
      const newQty = existingItem.quantity + addQty;
      if (newQty > product.stockQty) {
        throw new Error(`Only ${product.stockQty} item(s) available in stock.`);
      }
      await ctx.db.patch("cartItems", existingItem._id, {
        quantity: newQty,
        unitPriceSnapshot: product.price,
        dateEdited: Date.now(),
      });
      return existingItem._id;
    }

    if (addQty > product.stockQty) {
      throw new Error(`Only ${product.stockQty} item(s) available in stock.`);
    }

    let creatorId: Id<"users">;
    if (userId) {
      creatorId = userId;
    } else {
      const firstUser = await ctx.db.query("users").first();
      creatorId = firstUser?._id ?? (await ctx.db.insert("users", {}));
    }

    const newCartId = await ctx.db.insert("cartItems", {
      tenantId: args.tenantId,
      userId: userId ?? undefined,
      sessionId: args.sessionId,
      productId: args.productId,
      quantity: addQty,
      unitPriceSnapshot: product.price,
      ...createBaseFields({
        userId: creatorId,
        category: "cart",
        type: "cart_item",
        status: "active",
      }),
    });

    return newCartId;
  },
});

/**
 * Update quantity for an item in the cart.
 * If quantity <= 0, deletes the item.
 */
export const updateCartItemQuantity = mutation({
  args: {
    tenantId: v.id("tenants"),
    cartItemId: v.id("cartItems"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.tenantId, ["guest", "customer", "store_admin"]);

    const item = await ctx.db.get("cartItems", args.cartItemId);
    if (!item || item.tenantId !== args.tenantId) {
      throw new Error("Cart item not found.");
    }

    if (args.quantity < 0) {
      throw new Error("Quantity cannot be negative.");
    }

    if (args.quantity === 0) {
      await ctx.db.delete("cartItems", args.cartItemId);
      return { deleted: true, cartItemId: args.cartItemId };
    }

    const product = await ctx.db.get("products", item.productId);
    if (!product || product.tenantId !== args.tenantId) {
      await ctx.db.delete("cartItems", args.cartItemId);
      throw new Error("Product no longer available.");
    }

    if (args.quantity > product.stockQty) {
      throw new Error(`Cannot add more than ${product.stockQty} items (current stock limit).`);
    }

    await ctx.db.patch("cartItems", args.cartItemId, {
      quantity: args.quantity,
      unitPriceSnapshot: product.price,
      dateEdited: Date.now(),
    });

    return { success: true, cartItemId: args.cartItemId, quantity: args.quantity };
  },
});

/**
 * Remove an item from the cart.
 */
export const removeFromCart = mutation({
  args: {
    tenantId: v.id("tenants"),
    cartItemId: v.id("cartItems"),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.tenantId, ["guest", "customer", "store_admin"]);

    const item = await ctx.db.get("cartItems", args.cartItemId);
    if (!item || item.tenantId !== args.tenantId) {
      throw new Error("Cart item not found.");
    }

    await ctx.db.delete("cartItems", args.cartItemId);
    return { success: true, deletedCartItemId: args.cartItemId };
  },
});

/**
 * Clear all cart items for user or session.
 */
export const clearCart = mutation({
  args: {
    tenantId: v.id("tenants"),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.tenantId, ["guest", "customer", "store_admin"]);

    const userId = await getAuthUserId(ctx);

    let items: Doc<"cartItems">[] = [];
    if (userId) {
      items = await ctx.db
        .query("cartItems")
        .withIndex("by_tenant_user", (q) =>
          q.eq("tenantId", args.tenantId).eq("userId", userId).eq("status", "active"),
        )
        .collect();
    } else if (args.sessionId) {
      items = await ctx.db
        .query("cartItems")
        .withIndex("by_tenant_session", (q) =>
          q.eq("tenantId", args.tenantId).eq("sessionId", args.sessionId).eq("status", "active"),
        )
        .collect();
    }

    for (const item of items) {
      await ctx.db.delete("cartItems", item._id);
    }

    return { clearedCount: items.length };
  },
});
