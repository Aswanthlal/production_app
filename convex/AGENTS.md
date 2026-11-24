version:  1.0.0
updated:  2026-11-24
by:       Antigravity
change:   Backend rules for Convex functions, schema, base fields, and authorization

## Backend Invariants
- `tenantId` + `baseFields.ts` (`createdBy`, `editedBy`, `dateCreated`, `dateEdited`, `category`, `type`, `keywords`, `status`, `sysState`) are strictly required on all application tables.
- Never disable schema validation in `convex/schema.ts`. Tables must mirror their corresponding `modules/*/collections/*.md` specifications 1:1.
- All function parameters and return types must use `convex/values` validators (`v.string()`, `v.id()`, `v.number()`, `v.object()`, etc.).
- Always authorize via `convex/lib/authGuard.ts` (`requireRole` or `getTenantContext`). Enforce role hierarchy: `guest`, `customer`, `store_admin`.
- Derive caller identity on the server (`getAuthUserId`). Never accept a client-supplied user ID for authorization or ownership.
- Every query and mutation MUST scope reads and writes by `tenantId`. Never query or mutate cross-tenant records.
- Preserve transactional integrity: perform stock verification and inventory deduction atomically inside mutations (e.g. `placeOrder`).
- Keep queries bounded: prefer index lookups (`.withIndex()`) and pagination (`.paginate()`) or bounded takes (`.take(n)`) over unbounded scans (`.collect()`).
