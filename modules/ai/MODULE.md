version:  1.0.1
updated:  2026-11-27
by:       Aswanth Lal
change:   Implemented AI IQ layer module (`convex/modules/ai/*`, `PlantAdvisorDrawer`, AdminDashboardPage AI triggers, and `tests/ai.test.ts`)

## Purpose
Provides the tenant-scoped IQ Layer across the storefront and admin dashboard via Convex `"use node"` actions backed by Groq (`openai/gpt-oss-20b` structured JSON outputs). Enables shoppers (`guest` / `customer`) to query live `active` inventory via natural language and empowers `store_admin` users to auto-generate structured plant metadata and actionable inventory/order briefs.

## Screens
- `PlantAdvisorDrawer` (`src/modules/ai/PlantAdvisorDrawer.tsx`) — slide-over assistant drawer opened from the `HomePage` / `Header` **"Plant Advisor AI"** trigger.
- `AdminDashboardPage` AI Triggers (`src/modules/admin/AdminDashboardPage.tsx`) — inline **"Auto-Fill with AI"** button in the Add/Edit Plant modal and **"AI Ops Brief"** card in the admin workspace.

## Screen Breakdown

### Screen A: `PlantAdvisorDrawer` (Storefront IQ)
| # | You see | Component | Function it needs |
|---|---|---|---|
| 1 | Drawer header ("Plant Advisor") + close button | Drawer header | Toggle drawer open/closed state |
| 2 | Suggested prompt chips + natural-language question input & "Ask" button | Prompt form | `askPlantAdvisor` (`guest` / `customer` allowed, scoped by `tenantId`) |
| 3 | Loading indicator / graceful error alert | Status banner | Display action pending state or rate-limit/missing-key fallback |
| 4 | Grounded recommendation summary | Advice card | Render LLM response text constrained to active tenant catalog |
| 5 | Matched active plant cards with price, stock badge, and "Add to Cart" button | Product match list | Hydrate `recommendedProductIds` from `active` products & invoke `addToCart` |

### Screen B: `AdminDashboardPage` AI Capabilities (Admin IQ)
| # | You see | Component | Function it needs |
|---|---|---|---|
| 1 | **"Auto-Fill with AI"** button next to Plant Name in Add/Edit Plant modal | Secondary action button | `generatePlantDraft` (`store_admin` only) — populates `description`, `careDetails`, `careLevel`, `light`, `watering`, and `keywords` |
| 2 | **"AI Ops Brief"** button & collapsible action card in Admin header | Ops brief panel | `generateOpsBrief` (`store_admin` only) — summarizes low-stock products (`stockQty <= 5`) and `pending` orders |

## 6 Screen Questions
1. **Who is here?** Shoppers (`guest` and `customer`) on `HomePage`, and authenticated `store_admin` users on `AdminDashboardPage`.
2. **Why are they here?** Shoppers want fast, catalog-grounded plant recommendations they can add directly to their cart; admins want one-click botanical metadata drafting and low-stock/order prioritization.
3. **What do they see?** Shoppers see a drawer with prompt input, AI advice, and clickable in-stock plant cards; admins see an Auto-Fill trigger inside the plant editor and an Ops Brief panel on the dashboard.
4. **What can they do?** Submit natural-language plant queries and add matched items to cart (`guest`/`customer`), or auto-populate plant form fields and generate operational briefs (`store_admin`).
5. **What happens next?** `generatePlantDraft` populates form state in the browser without auto-saving so the admin reviews pricing/stock before calling `createPlant`/`updatePlant`; `askPlantAdvisor` adds selected matches directly to `cartItems`.
6. **What is not allowed?**
  - Exposing `draft`, `out-of-stock`, or `archived` products—or records from another `tenantId`—in `askPlantAdvisor`.
  - Allowing `guest` or `customer` roles to invoke `generatePlantDraft` or `generateOpsBrief`.
  - Exposing `GROQ_API_KEY` in client code or `VITE_*` variables (must live strictly in Convex server environment variables).
  - Auto-committing AI-generated plant drafts to `products` without human `store_admin` confirmation.

## Additions & Guardrails Worth Including
- **Zero New Tables Required:** Operates as stateless Convex actions reading `products` and `orders` via tenant-scoped `internalQuery` helpers (`getActiveCatalogForAi`, `getAdminOpsSnapshot`).
- **Strict Structured Outputs:** Uses Groq JSON Schema / JSON Object mode (`max_tokens: 1200`) so responses parse deterministically into TypeScript types.
- **Compact Context Payloads:** Passes only essential product/order fields (`_id`, `name`, `price`, `stockQty`, `careLevel`, `light`, `watering`, `keywords`) to keep token usage minimal.

## Bottlenecks (for Step 2)
-