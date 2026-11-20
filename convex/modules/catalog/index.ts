import { query } from "../../_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { requireRole } from "../../lib/authGuard";

/**
 * List all active categories for AllCategoriesPage.
 * Includes assigned active product count for each category.
 * Sorted by sortOrder ascending.
 */
export const listActiveCategories = query({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.tenantId, ["guest", "customer", "store_admin"]);

    const categories = await ctx.db
      .query("categories")
      .withIndex("by_tenant_status", (q) =>
        q.eq("tenantId", args.tenantId).eq("status", "active"),
      )
      .collect();

    categories.sort((a, b) => a.sortOrder - b.sortOrder);

    // Calculate active product counts per category
    const activeProducts = await ctx.db
      .query("products")
      .withIndex("by_tenant_status", (q) =>
        q.eq("tenantId", args.tenantId).eq("status", "active"),
      )
      .collect();

    const productCountMap = new Map<string, number>();
    for (const cat of categories) {
      productCountMap.set(cat._id, 0);
    }
    for (const prod of activeProducts) {
      for (const catId of prod.categoryIds) {
        if (productCountMap.has(catId)) {
          productCountMap.set(catId, (productCountMap.get(catId) ?? 0) + 1);
        }
      }
    }

    return categories.map((cat) => ({
      ...cat,
      productCount: productCountMap.get(cat._id) ?? 0,
    }));
  },
});

/**
 * Cursor-paginated trending plants query using paginationOptsValidator.
 * Powers infinite-scroll browsing on TrendingPlantsPage.
 */
export const listTrendingPlantsPaginated = query({
  args: {
    tenantId: v.id("tenants"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.tenantId, ["guest", "customer", "store_admin"]);

    return await ctx.db
      .query("products")
      .withIndex("by_tenant_trending", (q) =>
        q
          .eq("tenantId", args.tenantId)
          .eq("isTrending", true)
          .eq("status", "active"),
      )
      .paginate(args.paginationOpts);
  },
});

/** Exact lowercase casing alias as requested in prompt. */
export const listtrendingPlantsPaginated = listTrendingPlantsPaginated;

/**
 * Fetch a single category by slug within a tenant.
 */
export const getCategoryBySlug = query({
  args: {
    tenantId: v.id("tenants"),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.tenantId, ["guest", "customer", "store_admin"]);

    return await ctx.db
      .query("categories")
      .withIndex("by_tenant_slug", (q) =>
        q.eq("tenantId", args.tenantId).eq("slug", args.slug),
      )
      .unique();
  },
});

/**
 * Fetch a single product by slug within a tenant.
 */
export const getProductBySlug = query({
  args: {
    tenantId: v.id("tenants"),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.tenantId, ["guest", "customer", "store_admin"]);

    return await ctx.db
      .query("products")
      .withIndex("by_tenant_slug", (q) =>
        q.eq("tenantId", args.tenantId).eq("slug", args.slug),
      )
      .unique();
  },
});

/**
 * Fetch a single category by id or slug within a tenant.
 */
export const getCategoryById = query({
  args: {
    tenantId: v.id("tenants"),
    categoryId: v.union(v.id("categories"), v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.tenantId, ["guest", "customer", "store_admin"]);

    const categories = await ctx.db
      .query("categories")
      .withIndex("by_tenant_status", (q) =>
        q.eq("tenantId", args.tenantId).eq("status", "active"),
      )
      .collect();

    const matched = categories.find(
      (c) => c._id === args.categoryId || c.slug === args.categoryId,
    );

    return matched ?? null;
  },
});

export const getCategory = getCategoryById;

/**
 * List all active products for the storefront catalog.
 * Scoped by tenantId, status === "active".
 */
export const listActivePlants = query({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.tenantId, ["guest", "customer", "store_admin"]);

    const products = await ctx.db
      .query("products")
      .withIndex("by_tenant_status", (q) =>
        q.eq("tenantId", args.tenantId).eq("status", "active"),
      )
      .collect();

    return products;
  },
});

export const listAllPlants = listActivePlants;
export const listActiveProducts = listActivePlants;

/**
 * List active products assigned to a category.
 * Scoped by tenantId, status === "active", and categoryIds includes categoryId.
 */
export const listPlantsByCategory = query({
  args: {
    tenantId: v.id("tenants"),
    categoryId: v.union(v.id("categories"), v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.tenantId, ["guest", "customer", "store_admin"]);

    // If categoryId matches a slug, resolve its category _id
    let targetCategoryId: string = args.categoryId;
    const catBySlug = await ctx.db
      .query("categories")
      .withIndex("by_tenant_slug", (q) =>
        q.eq("tenantId", args.tenantId).eq("slug", args.categoryId),
      )
      .first();
    if (catBySlug) {
      targetCategoryId = catBySlug._id;
    }

    const products = await ctx.db
      .query("products")
      .withIndex("by_tenant_status", (q) =>
        q.eq("tenantId", args.tenantId).eq("status", "active"),
      )
      .collect();

    return products.filter((p) =>
      p.categoryIds.some(
        (cId) => cId === targetCategoryId || cId === args.categoryId,
      ),
    );
  },
});

/** Exact prompt alias and casing aliases */
export const ListPlanstByCategory = listPlantsByCategory;
export const listPlanstByCategory = listPlantsByCategory;
export const ListPlantsByCategory = listPlantsByCategory;
export const listProductsByCategory = listPlantsByCategory;
