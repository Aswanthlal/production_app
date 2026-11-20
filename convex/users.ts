import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { createBaseFields } from "./lib/baseFields";

// Creates a `users` row for a new account and returns its id. Convex Auth
// calls this when someone signs up. Automatically links the newly registered
// user to the default tenant ("verdant") as store_admin if not already linked.
export const createUser = internalMutation({
  args: {
    method: v.object({
      name: v.literal("usernamePassword"),
      profile: v.object({}),
    }),
  },
  returns: v.id("users"),
  handler: async (ctx) => {
    const userId = await ctx.db.insert("users", {});

    const defaultSlug = "verdant";
    let tenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", defaultSlug))
      .unique();

    if (!tenant) {
      const tenantId = await ctx.db.insert("tenants", {
        name: "Verdant Nursery",
        slug: defaultSlug,
        ...createBaseFields({
          userId,
          category: "tenant",
          type: "store",
          status: "active",
        }),
      });
      await ctx.db.patch("tenants", tenantId, { tenantId });
      tenant = (await ctx.db.get("tenants", tenantId))!;
    }

    const membership = await ctx.db
      .query("tenantMembers")
      .withIndex("by_tenantId_and_userId", (q) =>
        q.eq("tenantId", tenant._id).eq("userId", userId),
      )
      .unique();

    if (!membership) {
      await ctx.db.insert("tenantMembers", {
        tenantId: tenant._id,
        userId,
        role: "store_admin",
        ...createBaseFields({
          userId,
          category: "tenant",
          type: "membership",
          status: "active",
        }),
      });
    }

    return userId;
  },
});

// Runs on every sign-in (including the first one).
// Ensures the authenticated user is linked to the default tenant as store_admin.
export const onSignIn = internalMutation({
  args: {
    method: v.object({
      name: v.literal("usernamePassword"),
      profile: v.object({}),
    }),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const defaultSlug = "verdant";
    let tenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", defaultSlug))
      .unique();

    if (!tenant) {
      const tenantId = await ctx.db.insert("tenants", {
        name: "Verdant Nursery",
        slug: defaultSlug,
        ...createBaseFields({
          userId: args.userId,
          category: "tenant",
          type: "store",
          status: "active",
        }),
      });
      await ctx.db.patch("tenants", tenantId, { tenantId });
      tenant = (await ctx.db.get("tenants", tenantId))!;
    }

    const membership = await ctx.db
      .query("tenantMembers")
      .withIndex("by_tenantId_and_userId", (q) =>
        q.eq("tenantId", tenant._id).eq("userId", args.userId),
      )
      .unique();

    if (!membership) {
      await ctx.db.insert("tenantMembers", {
        tenantId: tenant._id,
        userId: args.userId,
        role: "store_admin",
        ...createBaseFields({
          userId: args.userId,
          category: "tenant",
          type: "membership",
          status: "active",
        }),
      });
    }

    return null;
  },
});
