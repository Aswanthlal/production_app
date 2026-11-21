version:  1.0.0
updated:  2026-11-21
by:       Aswanth Lal
change:   Initial QA checklist for orders module

## Verification Checklist
- [x] `npx tsc --noEmit` and `npm run build` pass with zero errors.
- [x] Placing an order decrements `products.stockQty` accurately and never allows negative stock.
- [x] Placing an order clears the shopper's active `cartItems` and creates a `pending` record in `orders` with `tenantId` + all 9 base fields.
- [x] New orders appear immediately in `AdminDashboardPage` -> **Manage Orders** without refreshing the browser.
- [x] `store_admin` can update order status (`pending` -> `confirmed` -> `packed` -> `shipped` -> `delivered` / `cancelled`), and cancelling restores `stockQty`.
- [x] `TrackOrderPage` returns order status when matching `orderNumber` + `phone` and rejects mismatched phone numbers.