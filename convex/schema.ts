import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { baseFields } from "./lib/baseFields";

export default defineSchema({
  users: defineTable({}),
  tenants: defineTable({
    tenantId: v.optional(v.id("tenants")),
    name: v.string(),
    slug: v.string(),
    ...baseFields,
  }).index("by_slug", ["slug"]),

  tenantMembers: defineTable({
    tenantId: v.id("tenants"),
    userId: v.id("users"),
    role: v.union(v.literal("customer"), v.literal("store_admin")),
    ...baseFields,
  })
    .index("by_tenantId_and_userId", ["tenantId", "userId"])
    .index("by_userId_and_tenantId", ["userId", "tenantId"]),

  banners: defineTable({
    tenantId: v.id("tenants"),
    title: v.string(),
    subtitle: v.optional(v.string()),
    imageUrl: v.string(),
    ctaText: v.optional(v.string()),
    ctaLink: v.optional(v.string()),
    sortOrder: v.number(),
    ...baseFields,
  }).index("by_tenant_status", ["tenantId", "status", "sortOrder"]),

  categories: defineTable({
    tenantId: v.id("tenants"),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.string(),
    isFeatured: v.boolean(),
    sortOrder: v.number(),
    ...baseFields,
  })
    .index("by_tenant_slug", ["tenantId", "slug"])
    .index("by_tenant_featured", ["tenantId", "isFeatured", "status"])
    .index("by_tenant_status", ["tenantId", "status"]),

  products: defineTable({
    tenantId: v.id("tenants"),
    categoryIds: v.array(v.id("categories")),
    name: v.string(),
    slug: v.string(),
    sku: v.optional(v.string()),
    description: v.string(),
    careDetails: v.optional(v.string()),
    careLevel: v.optional(v.string()),
    light: v.optional(v.string()),
    watering: v.optional(v.string()),
    price: v.number(),
    mrp: v.optional(v.number()),
    stockQty: v.number(),
    imageUrls: v.array(v.string()),
    rating: v.optional(v.number()),
    reviewCount: v.optional(v.number()),
    isTrending: v.boolean(),
    ...baseFields,
  })
    .index("by_tenant_status", ["tenantId", "status"])
    .index("by_tenant_trending", ["tenantId", "isTrending", "status"])
    .index("by_tenant_slug", ["tenantId", "slug"]),

  cartItems: defineTable({
    tenantId: v.id("tenants"),
    userId: v.optional(v.id("users")),
    sessionId: v.optional(v.string()),
    productId: v.id("products"),
    quantity: v.number(),
    unitPriceSnapshot: v.number(),
    ...baseFields,
  })
    .index("by_tenant_user", ["tenantId", "userId", "status"])
    .index("by_tenant_session", ["tenantId", "sessionId", "status"]),

  orders: defineTable({
    tenantId: v.id("tenants"),
    orderNumber: v.string(),
    userId: v.optional(v.id("users")),
    sessionId: v.optional(v.string()),
    customerName: v.string(),
    phone: v.string(),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    pincode: v.string(),
    items: v.array(
      v.object({
        productId: v.id("products"),
        title: v.optional(v.string()),
        name: v.optional(v.string()),
        sku: v.optional(v.string()),
        quantity: v.number(),
        unitPrice: v.optional(v.number()),
        price: v.optional(v.number()),
        imageUrl: v.optional(v.string()),
      }),
    ),
    subtotal: v.number(),
    shipping: v.number(),
    discount: v.number(),
    total: v.number(),
    paymentMethod: v.string(),
    paymentStatus: v.optional(v.string()),
    estimatedDeliveryDate: v.string(),
    adminNotes: v.optional(v.string()),
    ...baseFields,
  })
    .index("by_tenant_orderNumber", ["tenantId", "orderNumber"])
    .index("by_tenant_status", ["tenantId", "status"])
    .index("by_tenant_user", ["tenantId", "userId"])
    .index("by_tenant_session", ["tenantId", "sessionId"]),

  reviews: defineTable({
    tenantId: v.id("tenants"),
    name: v.string(),
    city: v.string(),
    rating: v.number(),
    comment: v.string(),
    verifiedBuyer: v.boolean(),
    avatarUrl: v.string(),
    plantName: v.string(),
    productId: v.optional(v.id("products")),
    ...baseFields,
  }).index("by_tenant_status", ["tenantId", "status"]),
});
