version:  1.0.1
updated:  2026-11-27
by:       Aswanth Lal
change:   Implemented automated Vitest coverage (TC-AI-01..03) and verified AI IQ layer module

## Verification Checklist
- [x] `TC-AI-01` **Admin Role Gate:** Authenticated `customer` users (and `customer` target `userId`s) are rejected by `verifyStoreAdminForAi` / `getAdminOpsSnapshot` via `authGuard.ts` before any external Groq API call executes in `generatePlantDraft` or `generateOpsBrief`. *(Note: `authGuard.ts` retains its existing unauthenticated demo-portal fallback for `store_admin` when `getAuthUserId` is `null` so the local `AdminDashboardPage` continues working without Convex Auth JWTs.)*
- [x] `TC-AI-02` **Storefront Active & Tenant Isolation:** `getActiveCatalogForAi` returns only `status === "active"` products scoped strictly to the requested `tenantId`, never exposing `draft`, `out-of-stock`, `archived`, or cross-tenant records, and `askPlantAdvisor` filters `recommendedProductIds` against those active IDs.
- [x] `TC-AI-03` **Graceful LLM Fallback:** Missing `GROQ_API_KEY`, upstream HTTP errors, or malformed JSON responses return a controlled, user-readable error message in `PlantAdvisorDrawer` and `AdminDashboardPage` without crashing the UI.
- [x] **Human-in-the-Loop Auto-Fill:** Clicking **Auto-Fill with AI** populates plant form fields (`description`, `careDetails`, `careLevel`, `light`, `watering`, `keywords`) for admin review without writing to `products` until **Save** is clicked.
- [ ] **Secret Hygiene:** `GROQ_API_KEY` exists only in Convex environment variables (`npx convex env list`) and is never referenced with `VITE_` or committed to Git. *(Code never references `VITE_GROQ*` or commits `.env.local`; live deployment env var setup via `npx convex env list` is verified on the Convex project.)*