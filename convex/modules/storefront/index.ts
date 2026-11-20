import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requireRole } from "../../lib/authGuard";

/**
 * Get active storefront tenant by slug or default to 'verdant'.
 */
export const getStorefrontTenant = query({
  args: {
    slug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const slug = args.slug?.trim() || "verdant";
    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (tenant) return tenant;
    return await ctx.db.query("tenants").first();
  },
});

export const getDefaultTenant = getStorefrontTenant;

/**
 * List active hero promotional banners for the storefront.
 * Sorted by sortOrder ascending.
 */
export const listActiveBanners = query({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.tenantId, ["guest", "customer", "store_admin"]);

    const banners = await ctx.db
      .query("banners")
      .withIndex("by_tenant_status", (q) =>
        q.eq("tenantId", args.tenantId).eq("status", "active"),
      )
      .collect();

    banners.sort((a, b) => a.sortOrder - b.sortOrder);
    return banners;
  },
});

export const listHeroBanners = listActiveBanners;

/**
 * List featured categories for HomePage shortcut circular tiles.
 * Capped at 6 items by default per specification.
 */
export const listFeaturedCategories = query({
  args: {
    tenantId: v.id("tenants"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.tenantId, ["guest", "customer", "store_admin"]);

    const maxItems = args.limit ?? 6;
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_tenant_featured", (q) =>
        q
          .eq("tenantId", args.tenantId)
          .eq("isFeatured", true)
          .eq("status", "active"),
      )
      .take(maxItems);

    categories.sort((a, b) => a.sortOrder - b.sortOrder);
    return categories;
  },
});

/**
 * List trending products for HomePage grid.
 * Capped at 6 items by default per specification.
 */
export const listTrendingPlants = query({
  args: {
    tenantId: v.id("tenants"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.tenantId, ["guest", "customer", "store_admin"]);

    const maxItems = args.limit ?? 6;
    const plants = await ctx.db
      .query("products")
      .withIndex("by_tenant_trending", (q) =>
        q
          .eq("tenantId", args.tenantId)
          .eq("isTrending", true)
          .eq("status", "active"),
      )
      .take(maxItems);

    return plants;
  },
});

export const listFeaturedProducts = listTrendingPlants;

/**
 * Search active storefront products by name, description, SKU, or keywords.
 */
export const searchProducts = query({
  args: {
    tenantId: v.id("tenants"),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.tenantId, ["guest", "customer", "store_admin"]);

    const term = args.query.toLowerCase().trim();
    if (!term) return [];

    const maxItems = args.limit ?? 10;
    const products = await ctx.db
      .query("products")
      .withIndex("by_tenant_status", (q) =>
        q.eq("tenantId", args.tenantId).eq("status", "active"),
      )
      .collect();

    const matched = products.filter((p) => {
      const inName = p.name.toLowerCase().includes(term);
      const inDesc = p.description.toLowerCase().includes(term);
      const inKeywords = p.keywords.some((k) => k.toLowerCase().includes(term));
      const inSku = p.sku?.toLowerCase().includes(term) ?? false;
      return inName || inDesc || inKeywords || inSku;
    });

    return matched.slice(0, maxItems);
  },
});

/**
 * Get aggregated data for HomePage in one call (active banners, featured categories, trending plants).
 */
export const getStorefrontData = query({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.tenantId, ["guest", "customer", "store_admin"]);

    const [banners, categories, trendingPlants] = await Promise.all([
      ctx.db
        .query("banners")
        .withIndex("by_tenant_status", (q) =>
          q.eq("tenantId", args.tenantId).eq("status", "active"),
        )
        .collect(),
      ctx.db
        .query("categories")
        .withIndex("by_tenant_featured", (q) =>
          q
            .eq("tenantId", args.tenantId)
            .eq("isFeatured", true)
            .eq("status", "active"),
        )
        .take(6),
      ctx.db
        .query("products")
        .withIndex("by_tenant_trending", (q) =>
          q
            .eq("tenantId", args.tenantId)
            .eq("isTrending", true)
            .eq("status", "active"),
        )
        .take(6),
    ]);

    banners.sort((a, b) => a.sortOrder - b.sortOrder);
    categories.sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      banners,
      featuredCategories: categories,
      trendingPlants,
    };
  },
});

/**
 * List approved customer reviews for the storefront review carousel.
 */
export const listApprovedReviews = query({
  args: {
    tenantId: v.id("tenants"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.tenantId, ["guest", "customer", "store_admin"]);

    const maxItems = args.limit ?? 10;
    return await ctx.db
      .query("reviews")
      .withIndex("by_tenant_status", (q) =>
        q.eq("tenantId", args.tenantId).eq("status", "active"),
      )
      .take(maxItems);
  },
});
