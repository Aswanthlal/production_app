version:  1.0.5
updated:  2026-11-20
by:       Aswanth Lal
change:   Implemented CategoryPlantsPage with listPlantsByCategory query and wired category navigation from AllCategoriesPage and HomePage

## Purpose
Full category browsing (`AllCategoriesPage`), category-filtered plant browsing (`CategoryPlantsPage`), and infinite-scroll trending plant browsing (`TrendingPlantsPage`) triggered from `HomePage` or category cards.

## Screens
- `AllCategoriesPage` (`src/modules/catalog/AllCategoriesPage.tsx`)
- `TrendingPlantsPage` (`src/modules/catalog/TrendingPlantsPage.tsx`)
- `CategoryPlantsPage` (`src/modules/catalog/CategoryPlantsPage.tsx`)

## Screen Breakdown
| Screen | Elements | Function Needed |
|---|---|---|
| `AllCategoriesPage` | Back button, page title, full grid of active categories (image, name, item count), click category to open `CategoryPlantsPage` | `listActiveCategories` |
| `TrendingPlantsPage` | Back button, page title, responsive plant grid (batches of 6), bottom `IntersectionObserver` sentinel ("Loading more..." / "All plants loaded"), Add to Cart action | `listTrendingPlantsPaginated` |
| `CategoryPlantsPage` | Back button (`All Categories` / `Home`), category title/description header, item count, filtered grid of `active` plants in that category (with Add to Cart), empty-category state | `listPlantsByCategory` |

## Rules & Guardrails
- Roles: `guest`, `customer`, `store_admin`.
- Only `status === "active"` categories and `status === "active"` plants shown (`isTrending === true` on `TrendingPlantsPage`; `categoryIds.includes(categoryId)` on `CategoryPlantsPage`).
- `HomePage` shows max 6 featured categories ("View All Categories" CTA) and max 6 trending plants ("View All" CTA).
- **Step 2 Bottleneck:** `TrendingPlantsPage` must use Convex cursor pagination (`paginationOptsValidator`) on `by_tenant_trending`, never `.collect()`.