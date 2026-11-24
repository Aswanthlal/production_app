# Backend API Reference

All backend functions are implemented in `convex/modules/*` and invoked using the typed `api` object from `convex/_generated/api`.

---

## 1. Storefront Module (`convex/modules/storefront/index.ts`)

### `getStorefrontTenant` (Query)
- **Args**: `{ slug?: string }`
- **Returns**: `Doc<"tenants"> | null`
- **Description**: Resolves active tenant by slug (defaults to `"verdant"`).

### `listActiveBanners` / `listHeroBanners` (Query)
- **Args**: `{ tenantId: Id<"tenants"> }`
- **Returns**: `Doc<"banners">[]`
- **Description**: Returns all `active` banners sorted by `sortOrder` ascending.

### `listFeaturedCategories` (Query)
- **Args**: `{ tenantId: Id<"tenants">, limit?: number }`
- **Returns**: `Doc<"categories">[]`
- **Description**: Returns featured active categories (default limit: 6).

### `listTrendingPlants` (Query)
- **Args**: `{ tenantId: Id<"tenants">, limit?: number }`
- **Returns**: `Doc<"products">[]`
- **Description**: Returns active trending plants (default limit: 6).

### `listApprovedReviews` (Query)
- **Args**: `{ tenantId: Id<"tenants"> }`
- **Returns**: `Doc<"reviews">[]`
- **Description**: Returns customer reviews with `status: "approved"`.

---

## 2. Catalog Module (`convex/modules/catalog/index.ts`)

### `listActiveCategories` (Query)
- **Args**: `{ tenantId: Id<"tenants"> }`
- **Returns**: `(Doc<"categories"> & { productCount: number })[]`
- **Description**: Returns all active categories with calculated assigned product counts.

### `listTrendingPlantsPaginated` (Query)
- **Args**: `{ tenantId: Id<"tenants">, paginationOpts: paginationOptsValidator }`
- **Returns**: Paginated products (`page`, `isDone`, `continueCursor`).
- **Description**: Powers infinite scroll on `TrendingPlantsPage`.

### `getCategoryBySlug` (Query)
- **Args**: `{ tenantId: Id<"tenants">, slug: string }`
- **Returns**: `Doc<"categories"> | null`

### `listPlantsByCategory` (Query)
- **Args**: `{ tenantId: Id<"tenants">, categoryId: Id<"categories"> }`
- **Returns**: `Doc<"products">[]`

---

## 3. Cart Module (`convex/modules/cart/index.ts`)

### `listCartItems` (Query)
- **Args**: `{ tenantId: Id<"tenants">, sessionId?: string }`
- **Returns**: `(Doc<"cartItems"> & { product: Doc<"products"> })[]`

### `getCartRecommendations` (Query)
- **Args**: `{ tenantId: Id<"tenants">, limit?: number }`
- **Returns**: `Doc<"products">[]`

### `addToCart` (Mutation)
- **Args**: `{ tenantId: Id<"tenants">, productId: Id<"products">, quantity?: number, sessionId?: string }`
- **Returns**: `Id<"cartItems">`

### `updateCartItemQuantity` (Mutation)
- **Args**: `{ tenantId: Id<"tenants">, cartItemId: Id<"cartItems">, quantity: number }`
- **Returns**: `null`

### `removeCartItem` (Mutation)
- **Args**: `{ tenantId: Id<"tenants">, cartItemId: Id<"cartItems"> }`
- **Returns**: `null`

---

## 4. Orders Module (`convex/modules/orders/index.ts`)

### `placeOrder` (Mutation)
- **Args**: `{ tenantId: Id<"tenants">, sessionId?: string, customerName: string, phone: string, address: string, city: string, state: string, pincode: string, paymentMethod: string, paymentStatus?: string, couponCode?: string }`
- **Returns**: `Doc<"orders">`
- **Description**: Validates stock, decrements inventory atomically, creates pending order, and clears cart.

### `trackOrderByNumberAndPhone` (Query)
- **Args**: `{ tenantId: Id<"tenants">, orderNumber: string, phone: string }`
- **Returns**: `Doc<"orders"> | null`

### `listOrdersForAdmin` (Query)
- **Args**: `{ tenantId: Id<"tenants">, statusFilter?: string }`
- **Returns**: `Doc<"orders">[]`
- **Guard**: Requires `store_admin` role.

### `updateOrderStatus` (Mutation)
- **Args**: `{ tenantId: Id<"tenants">, orderId: Id<"orders">, status: string, adminNotes?: string }`
- **Returns**: `null`
- **Guard**: Requires `store_admin` role. Restores stock if transitioning to `cancelled`.

---

## 5. Admin Module (`convex/modules/admin/index.ts`)

### `createCategory` / `updateCategory` / `deleteCategory` (Mutations)
- **Guard**: Requires `store_admin` role. Enforces orphan category protection.

### `createPlant` / `updatePlant` / `deletePlant` (Mutations)
- **Guard**: Requires `store_admin` role. Enforces `categoryIds.length >= 1`.

### `getAdminKpis` (Query)
- **Guard**: Requires `store_admin` role. Returns inventory and order KPI counts.
