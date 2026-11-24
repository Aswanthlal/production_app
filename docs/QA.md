# Master QA & Verification Checklist

## Overview
This master QA document links to all module-level verification checklists and defines the regression verification criteria required before shipping any pull request or deployment.

## Module QA Checklists
- [Storefront Module QA](file:///D:/new_app/nursery_app/modules/storefront/QA.md)
- [Catalog Module QA](file:///D:/new_app/nursery_app/modules/catalog/QA.md)
- [Cart Module QA](file:///D:/new_app/nursery_app/modules/cart/QA.md)
- [Orders Module QA](file:///D:/new_app/nursery_app/modules/orders/QA.md)
- [Admin Module QA](file:///D:/new_app/nursery_app/modules/admin/QA.md)

## Master Pre-Finish Checks

### 1. Automated Checks
- [ ] `npx tsc --noEmit` passes with 0 errors across frontend and backend.
- [ ] `npm run lint` passes with 0 errors and 0 warnings.
- [ ] `npm test` executes and passes all test suites (role guards and tenant isolation).
- [ ] `npm run build` succeeds and produces the client bundle without broken imports.

### 2. Multi-Tenant Isolation
- [ ] All database queries and mutations scope queries by `tenantId`.
- [ ] No cross-tenant data leaks across category listings, plant browsing, cart items, or admin order tables.
- [ ] Accessing a tenant without valid membership is rejected with `"You are not a member of this tenant."`

### 3. Role Guards & Security
- [ ] `guest` and `customer` roles cannot execute administrative mutations (`createCategory`, `deleteCategory`, `createPlant`, `updatePlant`, `deletePlant`, `updateOrderStatus`).
- [ ] Non-admin users cannot access `AdminDashboardPage`.
- [ ] Caller identity is derived exclusively via `getAuthUserId(ctx)` on the server.

### 4. Data Integrity & Invariants
- [ ] Plant creation/updates enforce `categoryIds.length >= 1`.
- [ ] Category deletion protects against orphaned plants.
- [ ] Order placement atomically validates and decrements `products.stockQty` (stock never goes negative).
- [ ] Order cancellation restores product `stockQty`.
- [ ] All 9 base fields (`createdBy`, `editedBy`, `dateCreated`, `dateEdited`, `category`, `type`, `keywords`, `status`, `sysState`) are populated on every inserted document.
