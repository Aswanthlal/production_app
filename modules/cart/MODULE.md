version:  1.3.0
updated:  2026-11-20
by:       Aswanth Lal
change:   Wired CartDrawer with persistent session/user cart queries and mutations (list, add, quantity update, remove)

## Purpose
Manages the shopping cart experience (`CartDrawer` / `CartPage`): viewing added items, adjusting item quantities, removing items, viewing "You may also like" product recommendations, calculating estimated totals, and initiating checkout.

## Screens
- `CartDrawer` (`src/modules/cart/CartDrawer.tsx`) — slide-over drawer triggered from header cart icon or "Add to Cart" action.

## Screen Breakdown (`CartDrawer`)

### State A: Empty Cart
| # | You see | Component | Function it needs |
|---|---|---|---|
| 1 | "Your Cart" heading + Close button | Drawer header | None (close drawer state) |
| 2 | "Nothing in your cart" empty message | Empty state block | Check active cart item count (`0`) |
| 3 | "Browse collections and products" subtext | Helper copy | None |
| 4 | Clickable "Shop Now" button/icon | Primary CTA button | Close drawer and redirect to `HomePage` plant listings |

### State B: Populated Cart (1 or more items)
| # | You see | Component | Function it needs |
|---|---|---|---|
| 1 | "Your Cart" heading + Close button | Drawer header | None (close drawer state) |
| 2 | "Welcome to NurseryLive" banner/greeting | Promo/welcome strip | None (static greeting) |
| 3 | Added plant item card (image, title, unit/line price) | Cart item row | List active cart items for current tenant & session/user |
| 4 | Quantity stepper (`-` / count / `+`) | Quantity selector | Update cart item quantity (increment/decrement; remove if decremented to `0`) |
| 5 | Remove item button/icon | Delete icon button | Remove item from cart |
| 6 | "You may also like" related plants section | Horizontal product suggestion strip | List related/recommended `active` products + quick `addToCart` |
| 7 | Estimated Total row | Subtotal summary | Calculate sum of `(item.price * item.quantity)` |
| 8 | "Checkout" button | Primary action button | Validate stock and transition to checkout flow |

## 6 Screen Questions
1. **Who is here?** `guest`, `customer`, `store_admin`.
2. **Why are they here?** Review selected plants/items, adjust quantities, discover add-on plants, check the estimated total, and proceed to checkout.
3. **What do they see?** Either the empty-cart prompt with a "Shop Now" redirect, or the "Welcome to NurseryLive" header, item rows (with quantity controls, remove action, and price), "You may also like" recommendations, estimated total, and checkout button.
4. **What can they do?** Increment/decrement item quantities, remove items, add a recommended product from "You may also like", click "Shop Now" when empty, or click "Checkout".
5. **What happens next?** Quantity or removal updates recalculate the Estimated Total immediately; clicking "Shop Now" navigates to the storefront homepage; clicking "Checkout" starts order creation.
6. **What is not allowed?** Quantities cannot drop below `1` via decrement without removing the item, quantities cannot exceed available product `stockQty` (no negative stock), `draft` or `archived` products cannot appear in "You may also like", and cross-tenant cart data is strictly isolated.

## Bottlenecks (for Step 2)
- **Race conditions on rapid `+` clicks:** Concurrent `updateCartItemQuantity` mutations must validate live `stockQty` inside the mutation before committing.
- **Guest-to-Customer cart merge:** When a `guest` signs in as a `customer`, session cart items for that `tenantId` must merge cleanly into the user's persistent cart without duplicating rows.
