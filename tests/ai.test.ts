import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "../convex/_generated/dataModel";
import {
  getActiveCatalogForAi,
  getAdminOpsSnapshot,
  verifyStoreAdminForAi,
} from "../convex/modules/ai/queries";
import {
  askPlantAdvisor,
  generateOpsBrief,
  generatePlantDraft,
} from "../convex/modules/ai/actions";
import { extractAiErrorMessage } from "../src/modules/ai/utils";

vi.mock("@convex-dev/auth/server", () => ({
  getAuthUserId: vi.fn(),
}));

type RegisteredHandler<Args, Result> = {
  _handler: (ctx: unknown, args: Args) => Promise<Result>;
};

function getHandler<Args, Result>(fn: unknown): (ctx: unknown, args: Args) => Promise<Result> {
  return (fn as RegisteredHandler<Args, Result>)._handler;
}

describe("AI IQ Layer Test Suite (TC-AI-01, TC-AI-02, TC-AI-03)", () => {
  const tenant1Id = "tenant_1" as Id<"tenants">;
  const tenant2Id = "tenant_2" as Id<"tenants">;
  const customerUserId = "user_cust_123" as Id<"users">;
  const adminUserId = "user_admin_456" as Id<"users">;

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
    createdBy: adminUserId,
    editedBy: adminUserId,
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
  ];

  const mockProducts: Doc<"products">[] = [
    {
      _id: "prod_t1_active" as Id<"products">,
      _creationTime: 1000,
      tenantId: tenant1Id,
      categoryIds: ["cat_1" as Id<"categories">],
      name: "Monstera Deliciosa",
      slug: "monstera-deliciosa",
      sku: "VD-MON-01",
      description: "Iconic indoor Swiss cheese plant",
      careDetails: "Water weekly when top soil is dry",
      careLevel: "Easy",
      light: "Bright indirect light",
      watering: "Once a week",
      price: 699,
      mrp: 899,
      stockQty: 3, // low stock <= 5
      imageUrls: ["https://example.com/monstera.jpg"],
      isTrending: true,
      createdBy: adminUserId,
      editedBy: adminUserId,
      dateCreated: 1000,
      dateEdited: 1000,
      category: "catalog",
      type: "plant",
      keywords: ["indoor", "air-purifying"],
      status: "active",
      sysState: "active",
    },
    {
      _id: "prod_t1_draft" as Id<"products">,
      _creationTime: 1001,
      tenantId: tenant1Id,
      categoryIds: ["cat_1" as Id<"categories">],
      name: "Secret Draft Orchid",
      slug: "secret-draft-orchid",
      sku: "VD-ORC-02",
      description: "Not yet published",
      price: 999,
      stockQty: 10,
      imageUrls: ["https://example.com/orchid.jpg"],
      isTrending: false,
      createdBy: adminUserId,
      editedBy: adminUserId,
      dateCreated: 1001,
      dateEdited: 1001,
      category: "catalog",
      type: "plant",
      keywords: ["orchid"],
      status: "draft",
      sysState: "active",
    },
    {
      _id: "prod_t1_oos" as Id<"products">,
      _creationTime: 1002,
      tenantId: tenant1Id,
      categoryIds: ["cat_1" as Id<"categories">],
      name: "Fiddle Leaf Fig",
      slug: "fiddle-leaf-fig",
      sku: "VD-FLF-03",
      description: "Out of stock listing",
      price: 1199,
      stockQty: 0,
      imageUrls: ["https://example.com/flf.jpg"],
      isTrending: false,
      createdBy: adminUserId,
      editedBy: adminUserId,
      dateCreated: 1002,
      dateEdited: 1002,
      category: "catalog",
      type: "plant",
      keywords: ["indoor"],
      status: "out-of-stock",
      sysState: "active",
    },
    {
      _id: "prod_t1_archived" as Id<"products">,
      _creationTime: 1003,
      tenantId: tenant1Id,
      categoryIds: ["cat_1" as Id<"categories">],
      name: "Discontinued Bonsai",
      slug: "discontinued-bonsai",
      sku: "VD-BON-04",
      description: "Archived plant",
      price: 1499,
      stockQty: 1,
      imageUrls: ["https://example.com/bonsai.jpg"],
      isTrending: false,
      createdBy: adminUserId,
      editedBy: adminUserId,
      dateCreated: 1003,
      dateEdited: 1003,
      category: "catalog",
      type: "plant",
      keywords: ["bonsai"],
      status: "archived",
      sysState: "archived",
    },
    {
      _id: "prod_t2_active" as Id<"products">,
      _creationTime: 2000,
      tenantId: tenant2Id,
      categoryIds: ["cat_2" as Id<"categories">],
      name: "Flora Tenant 2 Exclusive",
      slug: "flora-exclusive",
      sku: "FL-001",
      description: "Belongs to tenant 2",
      price: 550,
      stockQty: 2,
      imageUrls: ["https://example.com/flora.jpg"],
      isTrending: true,
      createdBy: adminUserId,
      editedBy: adminUserId,
      dateCreated: 2000,
      dateEdited: 2000,
      category: "catalog",
      type: "plant",
      keywords: ["exclusive"],
      status: "active",
      sysState: "active",
    },
  ];

  const mockOrders: Doc<"orders">[] = [
    {
      _id: "order_t1_pending" as Id<"orders">,
      _creationTime: 3000,
      tenantId: tenant1Id,
      orderNumber: "VD-100101",
      customerName: "Asha",
      phone: "9876543210",
      address: "12 Garden St",
      city: "Bengaluru",
      state: "KA",
      pincode: "560001",
      items: [
        {
          productId: "prod_t1_active" as Id<"products">,
          name: "Monstera Deliciosa",
          quantity: 2,
          price: 699,
        },
      ],
      subtotal: 1398,
      shipping: 0,
      discount: 0,
      total: 1398,
      paymentMethod: "upi",
      paymentStatus: "paid",
      estimatedDeliveryDate: "30 Nov 2026",
      createdBy: adminUserId,
      editedBy: adminUserId,
      dateCreated: 3000,
      dateEdited: 3000,
      category: "customer-order",
      type: "standard-order",
      keywords: [],
      status: "pending",
      sysState: "active",
    },
    {
      _id: "order_t1_delivered" as Id<"orders">,
      _creationTime: 3001,
      tenantId: tenant1Id,
      orderNumber: "VD-100102",
      customerName: "Vikram",
      phone: "9876543211",
      address: "14 Park Ave",
      city: "Mumbai",
      state: "MH",
      pincode: "400001",
      items: [
        {
          productId: "prod_t1_active" as Id<"products">,
          name: "Monstera Deliciosa",
          quantity: 1,
          price: 699,
        },
      ],
      subtotal: 699,
      shipping: 0,
      discount: 0,
      total: 699,
      paymentMethod: "cod",
      paymentStatus: "paid",
      estimatedDeliveryDate: "25 Nov 2026",
      createdBy: adminUserId,
      editedBy: adminUserId,
      dateCreated: 3001,
      dateEdited: 3001,
      category: "customer-order",
      type: "standard-order",
      keywords: [],
      status: "delivered",
      sysState: "active",
    },
    {
      _id: "order_t2_pending" as Id<"orders">,
      _creationTime: 3002,
      tenantId: tenant2Id,
      orderNumber: "FL-200201",
      customerName: "Cross Tenant Buyer",
      phone: "9876543212",
      address: "99 Other Rd",
      city: "Delhi",
      state: "DL",
      pincode: "110001",
      items: [
        {
          productId: "prod_t2_active" as Id<"products">,
          name: "Flora Tenant 2 Exclusive",
          quantity: 1,
          price: 550,
        },
      ],
      subtotal: 550,
      shipping: 0,
      discount: 0,
      total: 550,
      paymentMethod: "upi",
      paymentStatus: "paid",
      estimatedDeliveryDate: "30 Nov 2026",
      createdBy: adminUserId,
      editedBy: adminUserId,
      dateCreated: 3002,
      dateEdited: 3002,
      category: "customer-order",
      type: "standard-order",
      keywords: [],
      status: "pending",
      sysState: "active",
    },
  ];

  function createQueryMockCtx() {
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
        query: vi.fn((table: string) => ({
          withIndex: vi.fn(
            (
              _indexName: string,
              rangeCallback?: (q: { eq: (field: string, val: unknown) => unknown }) => void,
            ) => {
              let capturedTenantId: string | undefined;
              let capturedUserId: string | undefined;
              let capturedStatus: string | undefined;

              const qMock = {
                eq: vi.fn((field: string, val: unknown) => {
                  if (field === "tenantId" && typeof val === "string") capturedTenantId = val;
                  if (field === "userId" && typeof val === "string") capturedUserId = val;
                  if (field === "status" && typeof val === "string") capturedStatus = val;
                  return qMock;
                }),
              };

              if (rangeCallback) rangeCallback(qMock);

              const getRows = () => {
                if (table === "tenantMembers") {
                  return memberships.filter((m) => {
                    if (capturedTenantId && m.tenantId !== capturedTenantId) return false;
                    if (capturedUserId && m.userId !== capturedUserId) return false;
                    return true;
                  });
                }
                if (table === "products") {
                  return mockProducts.filter((p) => {
                    if (capturedTenantId && p.tenantId !== capturedTenantId) return false;
                    if (capturedStatus && p.status !== capturedStatus) return false;
                    return true;
                  });
                }
                if (table === "orders") {
                  return mockOrders.filter((o) => {
                    if (capturedTenantId && o.tenantId !== capturedTenantId) return false;
                    if (capturedStatus && o.status !== capturedStatus) return false;
                    return true;
                  });
                }
                return [];
              };

              return {
                filter: vi.fn(() => ({
                  first: vi.fn(async () => getRows()[0] ?? null),
                })),
                first: vi.fn(async () => getRows()[0] ?? null),
                unique: vi.fn(async () => getRows()[0] ?? null),
                take: vi.fn(async (n: number) => getRows().slice(0, n)),
                collect: vi.fn(async () => getRows()),
              };
            },
          ),
        })),
      },
    };
  }

  function createActionMockCtx(queryCtx: ReturnType<typeof createQueryMockCtx>) {
    return {
      runQuery: vi.fn(async (fnRef: unknown, args: Record<string, unknown>) => {
        const serialized = String(fnRef);
        // Dispatch by function reference or inspect property path
        if (serialized.includes("verifyStoreAdminForAi")) {
          return await getHandler(verifyStoreAdminForAi)(queryCtx, args);
        }
        if (serialized.includes("getAdminOpsSnapshot")) {
          return await getHandler(getAdminOpsSnapshot)(queryCtx, args);
        }
        if (serialized.includes("getActiveCatalogForAi")) {
          return await getHandler(getActiveCatalogForAi)(queryCtx, args);
        }
        throw new Error(`Unexpected runQuery target: ${serialized}`);
      }),
    };
  }

  const originalGroqKey = process.env.GROQ_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GROQ_API_KEY = "gsk_test_dummy_key";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalGroqKey === undefined) {
      delete process.env.GROQ_API_KEY;
    } else {
      process.env.GROQ_API_KEY = originalGroqKey;
    }
  });

  describe("TC-AI-01: Admin Role Gate", () => {
    it("rejects customer users in verifyStoreAdminForAi and getAdminOpsSnapshot", async () => {
      vi.mocked(getAuthUserId).mockResolvedValue(customerUserId);
      const queryCtx = createQueryMockCtx();

      await expect(
        getHandler<{ tenantId: Id<"tenants"> }, unknown>(verifyStoreAdminForAi)(
          queryCtx,
          { tenantId: tenant1Id },
        ),
      ).rejects.toThrow("You do not have permission to perform this action.");

      await expect(
        getHandler<{ tenantId: Id<"tenants">; userId: Id<"users"> }, unknown>(
          getAdminOpsSnapshot,
        )(queryCtx, { tenantId: tenant1Id, userId: customerUserId }),
      ).rejects.toThrow("You do not have permission to perform this action.");
    });

    it("blocks customer users before any external Groq API call in generatePlantDraft and generateOpsBrief", async () => {
      vi.mocked(getAuthUserId).mockResolvedValue(customerUserId);
      const queryCtx = createQueryMockCtx();
      const fetchSpy = vi.spyOn(globalThis, "fetch");

      const actionCtx = {
        runQuery: vi.fn(async (_ref: unknown, args: { tenantId: Id<"tenants"> }) => {
          return await getHandler(verifyStoreAdminForAi)(queryCtx, args);
        }),
      };

      await expect(
        getHandler<{ tenantId: Id<"tenants">; plantName: string }, unknown>(
          generatePlantDraft,
        )(actionCtx, { tenantId: tenant1Id, plantName: "Monstera" }),
      ).rejects.toThrow("You do not have permission to perform this action.");

      await expect(
        getHandler<{ tenantId: Id<"tenants"> }, unknown>(generateOpsBrief)(
          actionCtx,
          { tenantId: tenant1Id },
        ),
      ).rejects.toThrow("You do not have permission to perform this action.");

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("rejects customer userId passed directly to getAdminOpsSnapshot", async () => {
      vi.mocked(getAuthUserId).mockResolvedValue(adminUserId);
      const queryCtx = createQueryMockCtx();

      await expect(
        getHandler<{ tenantId: Id<"tenants">; userId: Id<"users"> }, unknown>(
          getAdminOpsSnapshot,
        )(queryCtx, { tenantId: tenant1Id, userId: customerUserId }),
      ).rejects.toThrow("You do not have permission to perform this action.");
    });

    it("rejects non-existent tenant before any Groq call", async () => {
      vi.mocked(getAuthUserId).mockResolvedValue(adminUserId);
      const queryCtx = createQueryMockCtx();
      const fetchSpy = vi.spyOn(globalThis, "fetch");

      const actionCtx = {
        runQuery: vi.fn(async (_ref: unknown, args: { tenantId: Id<"tenants"> }) => {
          return await getHandler(verifyStoreAdminForAi)(queryCtx, args);
        }),
      };

      await expect(
        getHandler<{ tenantId: Id<"tenants">; plantName: string }, unknown>(
          generatePlantDraft,
        )(actionCtx, {
          tenantId: "tenant_missing" as Id<"tenants">,
          plantName: "Peace Lily",
        }),
      ).rejects.toThrow("Tenant not found.");

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("returns only tenant-scoped low-stock products (stockQty <= 5) and pending orders for store_admin", async () => {
      vi.mocked(getAuthUserId).mockResolvedValue(adminUserId);
      const queryCtx = createQueryMockCtx();

      const snapshot = await getHandler<
        { tenantId: Id<"tenants">; userId: Id<"users"> },
        {
          lowStockProducts: Array<{ _id: string; stockQty: number; status: string }>;
          pendingOrders: Array<{ _id: string; orderNumber: string }>;
        }
      >(getAdminOpsSnapshot)(queryCtx, {
        tenantId: tenant1Id,
        userId: adminUserId,
      });

      expect(snapshot.lowStockProducts.map((p) => p._id)).toEqual([
        "prod_t1_oos",
        "prod_t1_active",
      ]);
      expect(snapshot.lowStockProducts.every((p) => p.stockQty <= 5)).toBe(true);
      expect(snapshot.lowStockProducts.some((p) => p._id === "prod_t1_archived")).toBe(false);
      expect(snapshot.lowStockProducts.some((p) => p._id === "prod_t2_active")).toBe(false);

      expect(snapshot.pendingOrders).toHaveLength(1);
      expect(snapshot.pendingOrders[0].orderNumber).toBe("VD-100101");
    });
  });

  describe("TC-AI-02: Storefront Active & Tenant Isolation", () => {
    it("returns strictly active products for the requested tenantId with compact fields", async () => {
      vi.mocked(getAuthUserId).mockResolvedValue(null);
      const queryCtx = createQueryMockCtx();

      const results = await getHandler<
        { tenantId: Id<"tenants"> },
        Array<Record<string, unknown>>
      >(getActiveCatalogForAi)(queryCtx, { tenantId: tenant1Id });

      expect(results).toHaveLength(1);
      expect(results[0]._id).toBe("prod_t1_active");
      expect(Object.keys(results[0]).sort()).toEqual([
        "_id",
        "careLevel",
        "keywords",
        "light",
        "name",
        "price",
        "stockQty",
        "watering",
      ]);

      // Must never expose draft, out-of-stock, archived, or tenant 2 records
      const ids = results.map((r) => r._id);
      expect(ids).not.toContain("prod_t1_draft");
      expect(ids).not.toContain("prod_t1_oos");
      expect(ids).not.toContain("prod_t1_archived");
      expect(ids).not.toContain("prod_t2_active");
    });

    it("grounds askPlantAdvisor recommendedProductIds strictly in the tenant active catalog", async () => {
      vi.mocked(getAuthUserId).mockResolvedValue(null);
      const queryCtx = createQueryMockCtx();

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    answer: "Monstera Deliciosa is a great bright indirect light pick.",
                    recommendedProductIds: [
                      "prod_t1_active",
                      "prod_t1_draft",
                      "prod_t2_active",
                      "hallucinated_id",
                    ],
                  }),
                },
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

      const actionCtx = {
        runQuery: vi.fn(async (_ref: unknown, args: { tenantId: Id<"tenants"> }) => {
          return await getHandler(getActiveCatalogForAi)(queryCtx, args);
        }),
      };

      const result = await getHandler<
        { tenantId: Id<"tenants">; question: string },
        { answer: string; recommendedProductIds: string[] }
      >(askPlantAdvisor)(actionCtx, {
        tenantId: tenant1Id,
        question: "Recommend an easy indoor plant",
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(result.answer).toContain("Monstera Deliciosa");
      expect(result.recommendedProductIds).toEqual(["prod_t1_active"]);
    });
  });

  describe("TC-AI-03: Graceful LLM Fallback", () => {
    it("returns a clear error when GROQ_API_KEY is missing without calling fetch", async () => {
      delete process.env.GROQ_API_KEY;
      vi.mocked(getAuthUserId).mockResolvedValue(adminUserId);
      const queryCtx = createQueryMockCtx();
      const fetchSpy = vi.spyOn(globalThis, "fetch");

      const actionCtx = {
        runQuery: vi.fn(async (_ref: unknown, args: { tenantId: Id<"tenants"> }) => {
          return await getHandler(getActiveCatalogForAi)(queryCtx, args);
        }),
      };

      await expect(
        getHandler<{ tenantId: Id<"tenants">; question: string }, unknown>(
          askPlantAdvisor,
        )(actionCtx, { tenantId: tenant1Id, question: "Low light plant?" }),
      ).rejects.toThrow(/GROQ_API_KEY/);

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("handles non-200 Groq HTTP responses cleanly (404, 429 rate limit, and 500 server error) and logs upstream body", async () => {
      vi.mocked(getAuthUserId).mockResolvedValue(adminUserId);
      const queryCtx = createQueryMockCtx();
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const adminActionCtx = {
        runQuery: vi.fn(async (_ref: unknown, args: { tenantId: Id<"tenants"> }) => {
          return await getHandler(verifyStoreAdminForAi)(queryCtx, args);
        }),
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response('{"error":{"message":"model_not_found"}}', { status: 404 }),
      );

      await expect(
        getHandler<{ tenantId: Id<"tenants">; plantName: string }, unknown>(
          generatePlantDraft,
        )(adminActionCtx, { tenantId: tenant1Id, plantName: "Snake Plant" }),
      ).rejects.toThrow(/HTTP 404/);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Groq API error (HTTP 404):",
        '{"error":{"message":"model_not_found"}}',
      );

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response("Too Many Requests", { status: 429 }),
      );

      await expect(
        getHandler<{ tenantId: Id<"tenants">; plantName: string }, unknown>(
          generatePlantDraft,
        )(adminActionCtx, { tenantId: tenant1Id, plantName: "Snake Plant" }),
      ).rejects.toThrow(/rate-limited/i);

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response("Internal Error", { status: 500 }),
      );

      await expect(
        getHandler<{ tenantId: Id<"tenants">; plantName: string }, unknown>(
          generatePlantDraft,
        )(adminActionCtx, { tenantId: tenant1Id, plantName: "Snake Plant" }),
      ).rejects.toThrow(/HTTP 500/);
    });

    it("handles malformed JSON from Groq cleanly without crashing", async () => {
      vi.mocked(getAuthUserId).mockResolvedValue(adminUserId);
      const queryCtx = createQueryMockCtx();

      let callCount = 0;
      const opsActionCtx = {
        runQuery: vi.fn(async (_ref: unknown, args: Record<string, unknown>) => {
          callCount += 1;
          if (callCount === 1) {
            return await getHandler(verifyStoreAdminForAi)(queryCtx, args);
          }
          return await getHandler(getAdminOpsSnapshot)(queryCtx, args);
        }),
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: "{ broken json" } }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

      await expect(
        getHandler<{ tenantId: Id<"tenants"> }, unknown>(generateOpsBrief)(
          opsActionCtx,
          { tenantId: tenant1Id },
        ),
      ).rejects.toThrow(/malformed JSON/i);
    });

    it("extracts clean user-readable messages via extractAiErrorMessage", () => {
      expect(
        extractAiErrorMessage({ data: "AI service is not configured." }),
      ).toBe("AI service is not configured.");
      expect(
        extractAiErrorMessage(
          new Error("[CONVEX A(modules/ai/actions:askPlantAdvisor)] Server Error Uncaught ConvexError: Rate limit reached"),
        ),
      ).toBe("Rate limit reached");
      expect(extractAiErrorMessage(null, "Fallback error")).toBe("Fallback error");
    });
  });

  // Ensure createActionMockCtx helper remains valid for reference
  it("supports end-to-end admin plant draft generation returning structured fields", async () => {
    vi.mocked(getAuthUserId).mockResolvedValue(adminUserId);
    const queryCtx = createQueryMockCtx();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  description: "Lush tropical trailing vine with heart-shaped leaves.",
                  careDetails: "Allow top inch of soil to dry between waterings.",
                  careLevel: "Easy",
                  light: "Medium to bright indirect light",
                  watering: "Once a week",
                  keywords: ["Pothos", "Indoor", "Trailing", "Easy"],
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const actionCtx = createActionMockCtx(queryCtx);
    actionCtx.runQuery = vi.fn(async (_ref: unknown, args: Record<string, unknown>) => {
      return await getHandler(verifyStoreAdminForAi)(queryCtx, args);
    });

    const draft = await getHandler<
      { tenantId: Id<"tenants">; plantName: string },
      {
        description: string;
        careDetails: string;
        careLevel: string;
        light: string;
        watering: string;
        keywords: string[];
      }
    >(generatePlantDraft)(actionCtx, {
      tenantId: tenant1Id,
      plantName: "Golden Pothos",
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(draft.careLevel).toBe("Easy");
    expect(draft.keywords).toEqual(["pothos", "indoor", "trailing", "easy"]);
    expect(draft.description).toContain("heart-shaped leaves");
  });
});
