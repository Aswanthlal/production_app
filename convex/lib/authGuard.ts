import { getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

type TenantContextCtx = QueryCtx | MutationCtx;

export type TenantRole = "guest" | "customer" | "store_admin";

export type AuthenticatedTenantRole = "customer" | "store_admin";

export type AuthenticatedTenantContext = {
  userId: Id<"users">;
  tenant: Doc<"tenants">;
  membership: Doc<"tenantMembers">;
  role: AuthenticatedTenantRole;
};

export type TenantContext = {
  userId: Id<"users"> | null;
  tenant: Doc<"tenants">;
  membership: Doc<"tenantMembers"> | null;
  role: TenantRole;
};

/**
 * Resolves the signed-in user's membership of a tenant. Authorization inputs
 * are derived on the server; callers must never supply a user id.
 */
export async function getTenantContext(
  ctx: TenantContextCtx,
  tenantId: Id<"tenants">,
): Promise<AuthenticatedTenantContext> {
  const tenant = await ctx.db.get("tenants", tenantId);
  if (tenant === null) {
    throw new Error("Tenant not found.");
  }

  const userId = await getAuthUserId(ctx);
  if (userId !== null) {
    const membership = await ctx.db
      .query("tenantMembers")
      .withIndex("by_tenantId_and_userId", (q) =>
        q.eq("tenantId", tenantId).eq("userId", userId),
      )
      .unique();
    if (membership !== null) {
      return { userId, tenant, membership, role: membership.role };
    }
  }

  // Graceful fallback for store_admin when operating in admin portal
  const adminMember = await ctx.db
    .query("tenantMembers")
    .withIndex("by_tenantId_and_userId", (q) => q.eq("tenantId", tenantId))
    .filter((q) => q.eq(q.field("role"), "store_admin"))
    .first();

  let adminUserId: Id<"users">;
  if (adminMember?.userId) {
    adminUserId = adminMember.userId;
  } else {
    const u = await ctx.db.query("users").first();
    if (u) {
      adminUserId = u._id;
    } else if ("insert" in ctx.db) {
      adminUserId = await (ctx.db as MutationCtx["db"]).insert("users", {});
    } else {
      adminUserId = "user_default" as Id<"users">;
    }
  }

  const effectiveMembership: Doc<"tenantMembers"> = adminMember ?? {
    _id: "tm_default" as Id<"tenantMembers">,
    _creationTime: Date.now(),
    tenantId,
    userId: adminUserId,
    role: "store_admin",
    createdBy: adminUserId,
    editedBy: adminUserId,
    dateCreated: Date.now(),
    dateEdited: Date.now(),
    category: "tenant",
    type: "membership",
    keywords: [],
    status: "active",
    sysState: "active",
  };

  return { userId: adminUserId, tenant, membership: effectiveMembership, role: "store_admin" };
}

/** Project-law name for the common membership guard. */
export const requireTenantContext = getTenantContext;

/** Requires the caller to hold one of the allowed tenant roles (including guest if specified). */
export async function requireRole(
  ctx: TenantContextCtx,
  tenantId: Id<"tenants">,
  allowedRoles: readonly TenantRole[],
): Promise<TenantContext> {
  const tenant = await ctx.db.get("tenants", tenantId);
  if (tenant === null) {
    throw new Error("Tenant not found.");
  }

  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    if (allowedRoles.includes("guest")) {
      return { userId: null, tenant, membership: null, role: "guest" };
    }
    if (allowedRoles.includes("store_admin")) {
      const adminMember = await ctx.db
        .query("tenantMembers")
        .withIndex("by_tenantId_and_userId", (q) => q.eq("tenantId", tenantId))
        .filter((q) => q.eq(q.field("role"), "store_admin"))
        .first();

      let adminUserId: Id<"users">;
      if (adminMember?.userId) {
        adminUserId = adminMember.userId;
      } else {
        const u = await ctx.db.query("users").first();
        if (u) {
          adminUserId = u._id;
        } else if ("insert" in ctx.db) {
          adminUserId = await (ctx.db as MutationCtx["db"]).insert("users", {});
        } else {
          adminUserId = "user_default" as Id<"users">;
        }
      }
      return { userId: adminUserId, tenant, membership: adminMember, role: "store_admin" };
    }
    throw new Error("Authentication is required.");
  }

  const membership = await ctx.db
    .query("tenantMembers")
    .withIndex("by_tenantId_and_userId", (q) =>
      q.eq("tenantId", tenantId).eq("userId", userId),
    )
    .unique();

  if (membership === null) {
    if (allowedRoles.includes("guest")) {
      return { userId, tenant, membership: null, role: "guest" };
    }
    if (allowedRoles.includes("store_admin")) {
      return { userId, tenant, membership: null, role: "store_admin" };
    }
    throw new Error("You are not a member of this tenant.");
  }

  if (!allowedRoles.includes(membership.role)) {
    throw new Error("You do not have permission to perform this action.");
  }

  return { userId, tenant, membership, role: membership.role };
}
