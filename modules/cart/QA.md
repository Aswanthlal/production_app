version:  1.0.1
updated:  2026-11-20
by:       Aswanth Lal
change:   Verified all cart QA items against convex/modules/cart and src/modules/cart

## Verification Checklist
- [x] **Empty State:** Shows "Nothing in your cart" and a working "Shop Now" CTA redirecting to `HomePage` when cart count is `0`.
- [x] **Populated State:** Displays "Welcome to NurseryLive", item rows (`+` / `-` / remove), "You may also like" `active` suggestions, accurate Estimated Total, and Checkout CTA.
- [x] **Stock & Quantity Guardrails:** Incrementing cannot exceed live `product.stockQty`; decrementing below `1` removes the item; negative quantities are rejected in backend mutations.
- [x] **Persistence & Isolation:** Cart items survive a full page reload (`F5`) and stay strictly isolated per `tenantId` and `sessionId`/`userId`.