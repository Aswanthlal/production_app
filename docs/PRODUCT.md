# Product Specification: Verdant Nursery Marketplace

## Vision
A high-performance direct-to-consumer online plant nursery and gardening supplies marketplace (modeled after NurseryLive). The platform combines rich botanical discovery, live inventory tracking, seamless session-to-account cart workflows, and store owner fulfillment controls.

## Target Audience & Roles
- **`guest`**: Unauthenticated shopper discovering plants through search, categories, and trending carousels; maintains a lightweight session-backed cart.
- **`customer`**: Authenticated shopper with persistent profile, multi-item order placement, and delivery status tracking.
- **`store_admin`**: Store manager overseeing category hierarchies, plant listings, pricing, live inventory, and multi-stage order fulfillment.

## Core Workflows
1. **Botanical Discovery**:
   - Dynamic hero banners highlighting seasonal plant sales.
   - Quick-access circular category tiles (featured top 6) and dedicated full-catalog page (`AllCategoriesPage`).
   - Infinite-scroll trending plants grid (`TrendingPlantsPage`) powered by cursor pagination.
   - Multi-category plant filtering (`CategoryPlantsPage`).
2. **Shopping & Cart Management**:
   - Slide-over `CartDrawer` with live line-item pricing, quantity steppers, and free-shipping progress indicators (`>= ₹499`).
   - Real-time recommendation strip ("You may also like").
3. **Checkout & Payment**:
   - Modal-based checkout collecting validated delivery addresses (PIN code, phone, state, city).
   - Multi-rail payment gateway (UPI dynamic QR simulation, Credit/Debit card sandbox with visual preview, Net Banking, and Cash on Delivery).
   - Atomic order placement with stock deduction and order number generation (`VD-XXXXXX`).
4. **Order Tracking**:
   - Public tracking via order number and phone verification.
   - Authenticated order history listing for signed-in customers.
   - Five-stage visual timeline (`pending` -> `confirmed` -> `packed` -> `shipped` -> `delivered` / `cancelled`).
5. **Administration**:
   - Tabbed administrative workspace (`Manage Categories`, `Manage Plants`, `Manage Orders`).
   - Real-time inventory KPI metrics.
   - Multi-category assignment for plants (`categoryIds[]`).
   - Stock quick-adjust and cancellation stock restoration.
