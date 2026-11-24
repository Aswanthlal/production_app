# Task: [Short Descriptive Task Name]

## Goal
A clear, concise summary of the desired outcome and business/technical value.

## Background / Context
- Affected modules: `modules/<module>/`
- Target screens: `src/modules/<module>/...`
- Target Convex functions: `convex/modules/<module>/...`
- Pre-requisites or relevant previous steps.

## Constraints
- **Multi-Tenancy**: All queries and mutations must be scoped by `tenantId`.
- **Base Fields**: Tables must include `tenantId` + the 9 mandatory base fields via `convex/lib/baseFields.ts`.
- **Role Guard**: Enforce `requireRole` on all sensitive operations.
- **Spec Parity**: Markdown specifications (`MODULE.md`, `collections/*.md`, `QA.md`) must be kept in sync with code in the same PR.
- **UI Quality**: Follow Tailwind CSS conventions and handle loading, empty, and error states.

## Acceptance Criteria
- [ ] Requirement 1: [Specific testable condition]
- [ ] Requirement 2: [Specific testable condition]
- [ ] Requirement 3: [Specific testable condition]
- [ ] `npx tsc --noEmit` exits with 0 errors.
- [ ] `npm run lint` exits with 0 errors.
- [ ] `npm run build` succeeds.

## Verification Steps
1. Run `npx tsc --noEmit` and confirm typecheck passes.
2. Run `npm test` and confirm tests pass.
3. Test the specific UI or backend workflow in browser / test harness.
