version:  1.0.6
updated:  2026-11-20
by:       Aswanth Lal
change:   Verified all catalog QA items against convex/modules/catalog and src/modules/catalog

## Verification Checklist
- [x] **AllCategoriesPage:** Displays all `active` categories with accurate item counts; clicking any category routes to `CategoryPlantsPage`.
- [x] **CategoryPlantsPage:** Renders only `active` plants where `categoryIds` contains the selected `categoryId`, plus an empty-state message if 0 plants match.
- [x] **TrendingPlantsPage Infinite Scroll:** Uses `usePaginatedQuery` (`paginationOptsValidator`) on `by_tenant_trending` loading batches of 6 via `IntersectionObserver`, displaying "All plants loaded" at exhaustion.
- [x] **Tenant Isolation:** No cross-tenant categories or plants leak across `listActiveCategories`, `listPlantsByCategory`, or `listTrendingPlantsPaginated`.