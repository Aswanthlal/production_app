version:  1.0.1
updated:  2026-11-20
by:       Aswanth Lal
change:   Verified all admin QA items against convex/modules/admin and src/modules/admin

## Verification Checklist
- [x] **Role & Tenant Guard:** `guest` and `customer` users cannot access `AdminDashboardPage` or invoke `createCategory`, `deleteCategory`, `createPlant`, `updatePlant`, or `deletePlant`.
- [x] **Graceful Auth Boundary:** Non-admin or non-member users see a clear error banner with Sign Out / Back to Storefront actions (never an uncaught crash).
- [x] **Multi-Category Validation:** Creating or updating a plant with `categoryIds.length === 0` is blocked on both frontend and backend.
- [x] **Orphan Category Protection:** Deleting a category strips/blocks removal if it would leave any plant with `0` assigned categories.
- [x] **Reload Persistence:** Created/edited/deleted categories and plants persist across `F5` reloads and immediately reflect on `HomePage` and `AllCategoriesPage`.