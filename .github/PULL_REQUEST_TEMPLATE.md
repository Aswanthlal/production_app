## Description
<!-- Provide a concise description of what this PR introduces or aligns. -->

## Pre-Merge Verification Checklist
- [ ] **Typecheck**: `npx tsc --noEmit` exits with 0 errors.
- [ ] **Lint**: `npm run lint` exits with 0 warnings and 0 errors.
- [ ] **Automated Tests**: `npm test` passes role guard and tenant isolation test suites.
- [ ] **Production Build**: `npm run build` succeeds without broken modules or circular dependencies.
- [ ] **Auth & Role Guards Review**: Sensitive mutations require `requireRole` with appropriate role hierarchy (`guest`, `customer`, `store_admin`); caller identity is derived on the server via `getAuthUserId`.
- [ ] **Schema & Tenant Isolation Review**: Every application table in `convex/schema.ts` includes `tenantId` + the 9 mandatory base fields from `convex/lib/baseFields.ts`.
- [ ] **Spec Parity**: Target module specifications (`MODULE.md`, `collections/*.md`, `QA.md`) and `BASELINE.md` updated in the same PR.
- [ ] **Security**: No secrets, credentials, or `.env.local` files staged or committed.
