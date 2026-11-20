version:  1.1.0
updated:  2026-11-20
by:       Antigravity
change:   Documented orders module specifications, order placement workflow, tracking modal and checkout validation

## Purpose
Order lifecycle management for Verdant Nursery (`CheckoutModal`, `OrderConfirmationModal`, `TrackOrderModal`, and admin order overview): placing orders from active cart items, enforcing live stock decrement, validating shipping addresses, generating unique order reference numbers (`VD-XXXXXX`), calculating subtotal/discounts/shipping, and providing live order delivery tracking with step progression.

## Screens & Dialogs
- `CheckoutModal` (`src/modules/cart/CheckoutModal.tsx`)
- `OrderConfirmationModal` (`src/modules/cart/OrderConfirmationModal.tsx`)
- `TrackOrderModal` (`src/modules/cart/TrackOrderModal.tsx`)

## Workflows
1. Shopper reviews cart in `CartDrawer` -> clicks "Proceed to Checkout".
2. Fills shipping details (Name, Phone, Address, City, State, PIN code) and chooses payment method (`upi`, `card`, `cod`, `netbanking`).
3. Clicks "Confirm Order" -> mutation `createOrder`:
   - Validates live `stockQty` for all cart items.
   - Atomically decrements `stockQty` for each product (and transitions `status` to `out-of-stock` if depleted).
   - Generates unique `orderNumber` (`VD-XXXXXX`).
   - Clears cart items for the session/user.
   - Returns created order record.
4. `OrderConfirmationModal` opens with order receipt and estimated delivery date.
5. Shopper can enter `orderNumber` in `TrackOrderModal` at any time to monitor status progression:
   `pending` -> `confirmed` -> `packed` -> `shipped` -> `delivered`.
