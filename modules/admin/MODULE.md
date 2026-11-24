version:  1.0.4
updated:  2026-11-20
by:       Aswanth Lal
change:   Resolved non-member tenant crash on admin login via automated createUser/onSignIn bootstrap, checkAdminAccess query guard, and graceful unauthorized recovery UI with storefront redirect and sign-out

## Purpose
Provides authenticated store administration (`AdminLoginPage` and `AdminDashboardPage`) triggered from the renamed **"Admin"** button in the `HomePage` header. Allows `store_admin` users to sign in with username and password, create and delete categories, add/edit/delete plants assigned to one or more categories, upload/link plant images, and manage pricing, stock, and publishing status.

## Screens
- `AdminLoginPage` (`src/modules/admin/AdminLoginPage.tsx`) — username & password login gate opened via the header **"Admin"** button.
- `AdminDashboardPage` (`src/modules/admin/AdminDashboardPage.tsx`) — tabbed workspace (Manage Categories | Manage Plants | Manage Orders — rendering AdminOrdersTab from modules/orders/MODULE.md)

## Screen Breakdown

### Screen A: `AdminLoginPage`
| # | You see | Component | Function it needs |
|---|---|---|---|
| 1 | "Admin Portal" heading + Back to Storefront link | Auth card header | Navigate back to `HomePage` |
| 2 | Username input field | Text input | Bind username state |
| 3 | Password input field (with show/hide toggle) | Password input | Bind password state |
| 4 | Inline validation / invalid credentials alert | Error banner | Display auth failure message |
| 5 | "Sign In as Admin" submit button | Primary submit button | Authenticate via Convex Auth (`signIn` password provider) & verify `store_admin` role |

### Screen B: `AdminDashboardPage`
| # | You see | Component | Function it needs |
|---|---|---|---|
| 1 | Top Admin Bar (Store/Tenant badge, signed-in username, "Sign Out" button) | Admin header | Sign out and redirect to `HomePage` |
| 2 | Summary KPI strip (Total Plants, Active Plants, Out-of-Stock count, Total Categories) | Metric cards | Read catalog summary counts for current `tenantId` |
| 3 | Tab switcher (`Manage Categories` \| `Manage Plants` \| `Manage Orders`) | Tab bar | Switch active admin workspace view |
| 4 | **Category Form:** Name, Slug (auto-generated), Description, Cover Image URL/Upload, Featured toggle | Category creator form | `createCategory` (`store_admin` only) |
| 5 | **Category List:** Rows showing image, name, assigned plant count, and "Delete Category" button | Category table/list | `listCategories` + `deleteCategory` (with confirmation prompt) |
| 6 | **Add / Edit Plant Form:** Title, SKU, Multi-Category selector (must pick `>= 1` categories), Price, MRP, Stock Quantity, Care Level / Light / Watering details, Description, Image URLs / Upload, Trending toggle, Status (`draft` \| `active` \| `out-of-stock` \| `archived`) | Plant editor drawer/form | `createPlant` / `updatePlant` (`store_admin` only) |
| 7 | **Plant List:** Search/category filter bar + rows showing thumbnail, name, category badges, price/MRP, stock qty, status pill, quick status/stock edit, and "Delete Plant" button | Plant management table | `listAllPlantsForAdmin` + `deletePlant` (`store_admin` only) |

## 6 Screen Questions
1. **Who is here?** Unauthenticated users attempting admin sign-in, and authenticated users with the `store_admin` role.
2. **Why are they here?** Authenticate into the store dashboard to organize plant categories, publish new plants with images/pricing/details across one or more categories, update stock, or remove discontinued categories and plants.
3. **What do they see?** On `AdminLoginPage`: username/password form. On `AdminDashboardPage`: KPI counts, category creation & deletion controls, and a full plant management table + multi-category plant form.
4. **What can they do?** Log in with username/password, create categories, delete categories, add plants assigned to one or more categories (`categoryIds[]`), attach multiple images and plant care/pricing details, edit stock or status, and delete plants.
5. **What happens next?** Successful login routes to `AdminDashboardPage` and updates the header link state; creating, editing, or deleting `active` categories/plants immediately updates what shoppers see on `HomePage` and in `CartDrawer` recommendations.
6. **What is not allowed?**
   - Saving a plant with **zero categories** (`categoryIds` must contain at least 1 valid category ID for the same `tenantId`).
   - Deleting a category silently without handling or warning if plants are still attached (must either block deletion while plants reference it or strip that `categoryId` and prevent orphan plants with 0 categories).
   - Allowing `guest` or `customer` roles to access `AdminDashboardPage` or execute any category/plant write mutations.
   - Negative `price`, negative `mrp`, or negative `stockQty` (`stockQty === 0` automatically marks or flags `out-of-stock`).
   - Cross-tenant reads or writes (`tenantId` strictly enforced on every record).

## Additions & Guardrails Worth Including
- **Multi-Category Assignment (`categoryIds: Id<"categories">[]`):** Store an array of category IDs on each plant instead of a single `categoryId` so one plant can belong to both *"Indoor Plants"* and *"Air Purifying"* simultaneously.
- **Draft vs. Active Publishing:** Keep the `status` field from `BASELINE.md` (`draft | active | out-of-stock | archived`) so the admin can save incomplete plant listings as `draft` before making them visible to customers.
- **Inline Stock & Price Quick-Edit:** Lets the admin adjust `stockQty` or `price` directly from the plant table without reopening the full form.
- **Image Preview + Multi-Image Support:** Allows pasting image URLs or uploading images (via Convex File Storage in Step 2) with a live thumbnail preview before saving.

## Bottlenecks (for Step 2)
- **Category Deletion Integrity:** Removing a category requires checking all tenant plants referencing that `categoryId` so no plant is left with an empty `categoryIds` array.
- **Multi-Category Querying:** Filtering plants by category when `categoryIds` is an array requires either a dedicated join/index or a tenant-scoped indexed query (`by_tenant_status`) filtered cleanly in Convex.
