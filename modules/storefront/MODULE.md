version:  1.0.6
updated:  2026-11-20
by:       Aswanth Lal
change:   Wired HomePage with live Convex hero banners, featured categories, trending plants, live search, and dev Seed Demo Data trigger

## Purpose
Public storefront entry point (`HomePage`): navigation, search, promotional banners, category shortcuts, trending product grid, reviews, and newsletter signup.

## Screens
- `HomePage` (`src/modules/storefront/HomePage.tsx`)

## Screen Breakdown (`HomePage`)
| # | You see | Component | Function it needs |
|---|---|---|---|
| 1 | Top announcement bar | Announcement banner | None (display active promo text) |
| 2 | Top navigation menu | Mega-menu / Navigation | List categories & subcategories |
| 3 | Search bar | Search input + dropdown | Search products by keyword |
| 4 | Header utility icons | Icon buttons + badge | Get active cart count, wishlist count, open Auth / Track Order |
| 5 | Hero promotional carousel | Image slider + CTA | List active hero banners |
| 6 | Quick-access circular icons | Category shortcut strip | List featured categories (capped at 6 + 'View All Categories' CTA) |
| 7 | Trending / Best Sellers grid | Product card grid | List featured/trending products (capped at 6 + 'View All' CTA) |
| 8 | Add to Cart button | Primary action button | Add item to cart (`guest` and `customer`) |
| 9 | Shop by Category / Purpose tiles | Collection grid | List curated collections |
| 10 | Trust badges strip | Static info strip | None |
| 11 | Customer Reviews carousel | Review card slider | List approved customer reviews |
| 12 | Footer & Newsletter signup | Links + Form | Subscribe email to newsletter |

## 6 Screen Questions
1. **Who is here?** `guest`, `customer`, `store_admin`.
2. **Why are they here?** Discover plants/gardening supplies via search, categories, or trending offers and add items to cart.
3. **What do they see?** Active banners, category trees, trending products (price, MRP, discount, rating), and cart item count.
4. **What can they do?** Search, filter by category/collection, click Add to Cart, open Track Order, subscribe to newsletter.
5. **What happens next?** Add to Cart increments cart badge and opens cart feedback; category/search routes to filtered catalog view.
6. **What is not allowed?** Guests/customers never see `draft`/`archived` products or edit banners/prices; cross-tenant data is strictly isolated.

## Bottlenecks (for Step 2)
- High read volume on homepage load (index banners and featured products by `tenantId` + `status`).
- Concurrent "Add to Cart" clicks on low-stock items.
