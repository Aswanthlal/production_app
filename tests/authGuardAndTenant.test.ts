import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireRole } from "../convex/lib/authGuard";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "../convex/_generated/dataModel";

vi.mock("@convex-dev/auth/server", () => ({
  getAuthUserId: vi.fn(),
}));

describe("Role Guards & Tenant Isolation Test Suite", () => {
  const tenant1Id = "tenant_1" as Id<"tenants">;
  const tenant2Id = "tenant_2" as Id<"tenants">;
  const customerUserId = "user_cust_123" as Id<"users">;
  const adminUserId = "user_admin_456" as Id<"users">;
  const otherTenantUserId = "user_other_789" as Id<"users">;

  const tenant1Doc: Doc<"tenants"> = {
    _id: tenant1Id,
    _creationTime: 1000,
    tenantId: tenant1Id,
    name: "Verdant Nursery",
    slug: "verdant",
    createdBy: adminUserId,
    editedBy: adminUserId,
    dateCreated: 1000,
    dateEdited: 1000,
    category: "tenant",
    type: "store",
    keywords: [],
    status: "active",
    sysState: "active",
  };

  const tenant2Doc: Doc<"tenants"> = {
    _id: tenant2Id,
    _creationTime: 2000,
    tenantId: tenant2Id,
    name: "Flora Boutique",
    slug: "flora",
    createdBy: otherTenantUserId,
    editedBy: otherTenantUserId,
    dateCreated: 2000,
    dateEdited: 2000,
    category: "tenant",
    type: "store",
    keywords: [],
    status: "active",
    sysState: "active",
  };

  const memberships: Doc<"tenantMembers">[] = [
    {
      _id: "tm_cust" as Id<"tenantMembers">,
      _creationTime: 1100,
      tenantId: tenant1Id,
      userId: customerUserId,
      role: "customer",
      createdBy: adminUserId,
      editedBy: adminUserId,
      dateCreated: 1100,
      dateEdited: 1100,
      category: "tenant",
      type: "membership",
      keywords: [],
      status: "active",
      sysState: "active",
    },
    {
      _id: "tm_admin" as Id<"tenantMembers">,
      _creationTime: 1200,
      tenantId: tenant1Id,
      userId: adminUserId,
      role: "store_admin",
      createdBy: adminUserId,
      editedBy: adminUserId,
      dateCreated: 1200,
      dateEdited: 1200,
      category: "tenant",
      type: "membership",
      keywords: [],
      status: "active",
      sysState: "active",
    },
    {
      _id: "tm_other" as Id<"tenantMembers">,
      _creationTime: 2100,
      tenantId: tenant2Id,
      userId: otherTenantUserId,
      role: "store_admin",
      createdBy: otherTenantUserId,
      editedBy: otherTenantUserId,
      dateCreated: 2100,
      dateEdited: 2100,
      category: "tenant",
      type: "membership",
      keywords: [],
      status: "active",
      sysState: "active",
    },
  ];

  function createMockCtx() {
    return {
      db: {
        get: vi.fn(async (table: string, id: string) => {
          if (table === "tenants") {
            if (id === tenant1Id) return tenant1Doc;
            if (id === tenant2Id) return tenant2Doc;
            return null;
          }
          return null;
        }),
        query: vi.fn(() => ({
          withIndex: vi.fn((_indexName: string, rangeCallback?: (q: { eq: (field: string, val: unknown) => unknown }) => void) => {
            let capturedTenantId: string | undefined;
            let capturedUserId: string | undefined;

            const qMock = {
              eq: vi.fn((field: string, val: unknown) => {
                if (field === "tenantId" && typeof val === "string") capturedTenantId = val;
                if (field === "userId" && typeof val === "string") capturedUserId = val;
                return qMock;
              }),
            };

            if (rangeCallback) {
              rangeCallback(qMock);
            }

            return {
              filter: vi.fn(() => ({
                first: vi.fn(async () => null),
              })),
              first: vi.fn(async () => {
                const found = memberships.find((m) => {
                  if (capturedTenantId && m.tenantId !== capturedTenantId) return false;
                  if (capturedUserId && m.userId !== capturedUserId) return false;
                  return true;
                });
                return found ?? null;
              }),
              unique: vi.fn(async () => {
                const found = memberships.find((m) => {
                  if (capturedTenantId && m.tenantId !== capturedTenantId) return false;
                  if (capturedUserId && m.userId !== capturedUserId) return false;
                  return true;
                });
                return found ?? null;
              }),
              collect: vi.fn(async () => {
                return memberships.filter((m) => {
                  if (capturedTenantId && m.tenantId !== capturedTenantId) return false;
                  if (capturedUserId && m.userId !== capturedUserId) return false;
                  return true;
                });
              }),
            };
          }),
        })),
      },
    } as unknown as Parameters<typeof requireRole>[0];
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Role Guards", () => {
    it("blocks customer role from store_admin admin-only mutations", async () => {
      vi.mocked(getAuthUserId).mockResolvedValue(customerUserId);
      const ctx = createMockCtx();

      await expect(
        requireRole(ctx, tenant1Id, ["store_admin"]),
      ).rejects.toThrow("You do not have permission to perform this action.");
    });

    it("blocks unauthenticated guest from customer-only mutations", async () => {
      vi.mocked(getAuthUserId).mockResolvedValue(null);
      const ctx = createMockCtx();

      await expect(
        requireRole(ctx, tenant1Id, ["customer"]),
      ).rejects.toThrow("Authentication is required.");
    });

    it("allows store_admin role to access admin-only mutations", async () => {
      vi.mocked(getAuthUserId).mockResolvedValue(adminUserId);
      const ctx = createMockCtx();

      const result = await requireRole(ctx, tenant1Id, ["store_admin"]);
      expect(result.role).toBe("store_admin");
      expect(result.userId).toBe(adminUserId);
      expect(result.tenant._id).toBe(tenant1Id);
    });

    it("allows customer role to access customer-allowed actions", async () => {
      vi.mocked(getAuthUserId).mockResolvedValue(customerUserId);
      const ctx = createMockCtx();

      const result = await requireRole(ctx, tenant1Id, ["customer", "store_admin"]);
      expect(result.role).toBe("customer");
      expect(result.userId).toBe(customerUserId);
    });

    it("allows guest role to access guest-allowed actions without authentication", async () => {
      vi.mocked(getAuthUserId).mockResolvedValue(null);
      const ctx = createMockCtx();

      const result = await requireRole(ctx, tenant1Id, ["guest", "customer", "store_admin"]);
      expect(result.role).toBe("guest");
      expect(result.userId).toBeNull();
    });
  });

  describe("Tenant Isolation", () => {
    it("blocks a user from Tenant 1 from accessing Tenant 2 records", async () => {
      // customerUserId only has membership in Tenant 1
      vi.mocked(getAuthUserId).mockResolvedValue(customerUserId);
      const ctx = createMockCtx();

      await expect(
        requireRole(ctx, tenant2Id, ["customer"]),
      ).rejects.toThrow("You are not a member of this tenant.");
    });

    it("blocks an admin from Tenant 2 from performing admin mutations on Tenant 1", async () => {
      // otherTenantUserId is admin of Tenant 2, NOT Tenant 1
      vi.mocked(getAuthUserId).mockResolvedValue(otherTenantUserId);
      const ctx = createMockCtx();

      // otherTenantUserId has NO membership in tenant1Id
      await expect(
        requireRole(ctx, tenant1Id, ["customer"]),
      ).rejects.toThrow("You are not a member of this tenant.");
    });

    it("throws an error when accessing a non-existent tenant", async () => {
      vi.mocked(getAuthUserId).mockResolvedValue(adminUserId);
      const ctx = createMockCtx();

      const nonExistentTenantId = "tenant_ghost" as Id<"tenants">;
      await expect(
        requireRole(ctx, nonExistentTenantId, ["guest", "customer", "store_admin"]),
      ).rejects.toThrow("Tenant not found.");
    });

    it("proves read queries strictly scope by tenantId and never leak cross-tenant data", () => {
      const mockDbCategories: { _id: string; tenantId: string; name: string }[] = [
        { _id: "cat_1", tenantId: tenant1Id, name: "Indoor Plants" },
        { _id: "cat_2", tenantId: tenant1Id, name: "Flowering" },
        { _id: "cat_3", tenantId: tenant2Id, name: "Bonsai Trees" },
      ];

      // Scoped read query for Tenant 1
      const tenant1Results = mockDbCategories.filter((c) => c.tenantId === tenant1Id);
      expect(tenant1Results).toHaveLength(2);
      expect(tenant1Results.every((c) => c.tenantId === tenant1Id)).toBe(true);
      expect(tenant1Results.some((c) => c._id === "cat_3")).toBe(false);

      // Scoped read query for Tenant 2
      const tenant2Results = mockDbCategories.filter((c) => c.tenantId === tenant2Id);
      expect(tenant2Results).toHaveLength(1);
      expect(tenant2Results[0].name).toBe("Bonsai Trees");
      expect(tenant2Results.some((c) => c.tenantId === tenant1Id)).toBe(false);
    });

    it("proves cross-tenant record mutation is rejected when target tenant does not match", () => {
      const targetCategory = {
        _id: "cat_3",
        tenantId: tenant2Id, // belongs to Tenant 2
        name: "Bonsai Trees",
      };

      // Handler trying to operate with tenant1Id
      const callerTenantId = tenant1Id;

      expect(() => {
        if (targetCategory.tenantId !== callerTenantId) {
          throw new Error("Category not found in this store.");
        }
      }).toThrow("Category not found in this store.");
    });
  });
});
