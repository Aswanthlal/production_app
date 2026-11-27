version:  1.0.1
updated:  2026-11-20
by:       Aswanth Lal
change:   Verified all storefront QA items against convex/modules/storefront and src/modules/storefront

## Verification Checklist
- [x] **Active-Only Filtering:** Only `status === "active"` banners, categories, and plants render on `HomePage`; `draft`, `out-of-stock`, and `archived` records never appear.
- [x] **Display Caps:** `HomePage` caps featured categories at 6 (with "View All Categories" CTA) and trending plants at 6 (with "View All" CTA).
- [x] **Navigation:** Header "Admin" link routes to `AdminLoginPage`; cart icon opens `CartDrawer`; category cards open `CategoryPlantsPage`.
- [x] **Tenant Isolation:** Queries return records strictly scoped to the active `tenantId`.



