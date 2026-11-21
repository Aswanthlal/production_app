version:  1.0.0
updated:  2026-11-21
by:       Aswanth Lal
change:   Initial orders module screen and mutation specification

## Purpose
Handles end-to-end order placement from `CartDrawer` (`CheckoutModal` / `CheckoutPage`), shopper order status tracking (`TrackOrderPage`), and real-time store owner order fulfillment inside `AdminDashboardPage`.

## Screens & Views
- `CheckoutModal` / `CheckoutPage` (`src/modules/orders/CheckoutModal.tsx`) — triggered by clicking **"Checkout"** in `CartDrawer`.
- `OrderConfirmationView` (`src/modules/orders/OrderConfirmationView.tsx`) — displays generated `orderNumber` (e.g., `VD-482910`), item summary, and estimated delivery date after checkout.
- `TrackOrderPage` (`src/modules/orders/TrackOrderPage.tsx`) — triggered from header **"Track Order"** link; allows looking up an order by `orderNumber` + `phone` (or listing signed-in `customer` orders).
- `AdminOrdersTab` (`src/modules/orders/AdminOrdersTab.tsx`) — rendered as the **"Manage Orders"** tab inside `AdminDashboardPage` (`store_admin` only).

## Screen Breakdown

### Screen A: `CheckoutModal`
| # | You see | Component | Function it needs |
|---|---|---|---|
| 1 | Order summary strip (item count, subtotal, free-shipping threshold indicator `>= 499`, final total) | Summary card | Read active `cartItems` for current `tenantId` & `sessionId`/`userId` |
| 2 | Shipping form (`customerName`, `phone`, `address`, `city`, `state`, `pincode`) | Address form | Validate non-empty fields & valid pincode/phone |
| 3 | Payment method selector (`UPI`, `Card`, `NetBanking`, `Cash on Delivery`) | Radio group | Bind `paymentMethod` state |
| 4 | "Place Order" submit button | Primary CTA | Execute atomic `placeOrder` mutation (validate stock, decrement `stockQty`, insert `orders` doc, clear `cartItems`) |

### Screen B: `TrackOrderPage`
| # | You see | Component | Function it needs |
|---|---|---|---|
| 1 | Order lookup inputs (`orderNumber` + `phone`) | Lookup form | Query `trackOrderByNumberAndPhone` scoped to `tenantId` |
| 2 | Saved orders list (for signed-in `customer` role) | Order history cards | Query `listMyOrders` by `["tenantId", "userId"]` |
| 3 | Visual status stepper (`pending` -> `confirmed` -> `packed` -> `shipped` -> `delivered` or `cancelled`) | Progress timeline | Render current order `status`, items, total, and `estimatedDeliveryDate` |

### Screen C: `AdminOrdersTab` (Owner View inside `AdminDashboardPage`)
| # | You see | Component | Function it needs |
|---|---|---|---|
| 1 | Order KPI strip (Pending Orders, Active/In-Transit, Delivered, Gross Revenue) | Metric cards | Reactive counts from `listOrdersForAdmin` (`tenantId`) |
| 2 | Status filter pills (`All`, `pending`, `confirmed`, `packed`, `shipped`, `delivered`, `cancelled`) + Order # / Phone search | Filter bar | Filter tenant orders by `by_tenant_status` index |
| 3 | Live Order Rows (Order #, Date/Time, Customer Name & Phone, City/Pincode, Item count & expandable item list, Total & Payment badge, Status dropdown) | Order table | `listOrdersForAdmin` + `updateOrderStatus` (`store_admin` only) |

## 6 Screen Questions
1. **Who is here?** `guest` and `customer` shoppers placing or tracking orders; `store_admin` viewing and fulfilling incoming orders.
2. **Why are they here?** Shoppers want to complete checkout and check delivery progress; the store owner wants real-time visibility into new orders and a control to advance fulfillment statuses.
3. **What do they see?** Shoppers see shipping/payment inputs, order confirmation numbers, and a step-by-step delivery status tracker. The store owner sees a live-updating order queue with customer contact details, ordered plants, totals, and status controls.
4. **What can they do?** Shoppers can submit checkout and look up orders by `orderNumber` + `phone`. `store_admin` can filter orders, inspect line items, add tracking/admin notes, and change order `status`.
5. **What happens next?** Submitting checkout atomically deducts product `stockQty`, creates a `pending` order, clears the cart, and immediately pushes the new order to the owner's `AdminOrdersTab` in real time. Changing an order to `cancelled` restores `stockQty`.
6. **What is not allowed?**
   - Placing an order with an empty cart or when any item's `quantity > product.stockQty` (stock must never go negative).
   - Allowing `guest` or `customer` roles to view all tenant orders or invoke `updateOrderStatus`.
   - Exposing another customer's order in `TrackOrderPage` without matching both `orderNumber` and `phone` (or owning `userId`).
   - Cross-tenant order reads or writes (`tenantId` enforced on every query/mutation).

## Bottlenecks (for Implementation)
- **Atomic Stock Deduction (`placeOrder`):** Check every cart item's live `stockQty` inside the single Convex mutation before patching any product; if any item has insufficient stock, throw a `ConvexError` listing the out-of-stock item so the entire transaction rolls back cleanly.
- **Stock Restoration on Cancellation (`updateOrderStatus`):** If `store_admin` transitions an order from a non-cancelled state to `cancelled`, increment each product's `stockQty` back and flip `status` from `out-of-stock` to `active` if `stockQty > 0`.