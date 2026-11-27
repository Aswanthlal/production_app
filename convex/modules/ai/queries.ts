import { internalQuery } from "../../_generated/server";
import { v } from "convex/values";
import { requireRole } from "../../lib/authGuard";

/**
 * Return a compact projection of active products strictly scoped to `tenantId`
 * for storefront Plant Advisor grounding. Never exposes draft, out-of-stock,
 * archived, or cross-tenant records.
 */
export const getActiveCatalogForAi = internalQuery({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.tenantId, ["guest", "customer", "store_admin"]);

    const activeProducts = await ctx.db
      .query("products")
      .withIndex("by_tenant_status", (q) =>
        q.eq("tenantId", args.tenantId).eq("status", "active"),
      )
      .take(100);

    return activeProducts
      .filter((product) => product.tenantId === args.tenantId && product.status === "active")
      .map((product) => ({
        _id: product._id,
        name: product.name,
        price: product.price,
        stockQty: product.stockQty,
        careLevel: product.careLevel ?? null,
        light: product.light ?? null,
        watering: product.watering ?? null,
        keywords: product.keywords,
      }));
  },
});

/**
 * Verify that the caller holds `store_admin` role for `tenantId` via authGuard.ts
 * before executing admin AI actions.
 */
export const verifyStoreAdminForAi = internalQuery({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    const auth = await requireRole(ctx, args.tenantId, ["store_admin"]);
    if (!auth.userId) {
      throw new Error("Store admin authentication is required.");
    }

    return {
      authorized: true as const,
      tenantId: auth.tenant._id,
      userId: auth.userId,
      role: auth.role,
    };
  },
});

/**
 * Fetch low-stock products (stockQty <= 5) and pending orders strictly scoped
 * to `tenantId`, gated by `store_admin` role verification via authGuard.ts.
 */
export const getAdminOpsSnapshot = internalQuery({
  args: {
    tenantId: v.id("tenants"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.tenantId, ["store_admin"]);

    const targetMembership = await ctx.db
      .query("tenantMembers")
      .withIndex("by_tenantId_and_userId", (q) =>
        q.eq("tenantId", args.tenantId).eq("userId", args.userId),
      )
      .unique();

    if (targetMembership !== null && targetMembership.role !== "store_admin") {
      throw new Error("You do not have permission to perform this action.");
    }

    const [tenantProducts, pendingOrders] = await Promise.all([
      ctx.db
        .query("products")
        .withIndex("by_tenant_status", (q) => q.eq("tenantId", args.tenantId))
        .take(200),
      ctx.db
        .query("orders")
        .withIndex("by_tenant_status", (q) =>
          q.eq("tenantId", args.tenantId).eq("status", "pending"),
        )
        .take(100),
    ]);

    const lowStockProducts = tenantProducts
      .filter(
        (product) =>
          product.tenantId === args.tenantId &&
          product.status !== "archived" &&
          product.stockQty <= 5,
      )
      .sort((a, b) => a.stockQty - b.stockQty)
      .map((product) => ({
        _id: product._id,
        name: product.name,
        sku: product.sku ?? null,
        stockQty: product.stockQty,
        status: product.status,
        price: product.price,
      }));

    const scopedPendingOrders = pendingOrders
      .filter(
        (order) => order.tenantId === args.tenantId && order.status === "pending",
      )
      .sort((a, b) => b.dateCreated - a.dateCreated)
      .map((order) => ({
        _id: order._id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        total: order.total,
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        dateCreated: order.dateCreated,
      }));

    return {
      lowStockProducts,
      pendingOrders: scopedPendingOrders,
    };
  },
});
