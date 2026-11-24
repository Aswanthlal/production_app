version:  1.0.1
updated:  2026-11-24
by:       Antigravity
change:   Added orders module under Modules and aligned specification spine

## What this application solves
Direct-to-consumer online plant and gardening marketplace (modeled on NurseryLive).

## Who uses it (Roles)
- `guest`: Unauthenticated visitor browsing products, searching, and adding items to a session cart.
- `customer`: Signed-in shopper with saved addresses, wishlist, and order history.
- `store_admin`: Store manager controlling hero banners, categories, products, pricing, and stock.

## Core workflows
1. Discovery: Visitor lands on HomePage -> browses hero banners, categories, or searches -> views trending products.
2. Cart: Visitor/Customer clicks "Add to Cart" -> cart count increments -> proceeds to checkout.
3. Admin Management: Store admin signs in -> creates/edits categories and plants -> updates stock and status.

## States
- Product `status`: `draft` | `active` | `out-of-stock` | `archived`
- Order `status`: `pending` | `confirmed` | `packed` | `shipped` | `delivered` | `cancelled`

## Rules that never change
- Strict multi-tenant isolation (`tenantId` required on all records).
- Every collection enforces the 9 mandatory base fields (`createdBy`, `editedBy`, `dateCreated`, `dateEdited`, `category`, `type`, `keywords`, `status`, `sysState`) via `convex/lib/baseFields.ts`.
- `guest` and `customer` roles never see `draft` or `archived` products.
- Stock cannot go negative on cart/order actions.

## Modules
- `storefront`: `modules/storefront/MODULE.md`
- `catalog`: `modules/catalog/MODULE.md`
- `cart`: `modules/cart/MODULE.md`
- `orders`: `modules/orders/MODULE.md`
- `admin`: `modules/admin/MODULE.md`