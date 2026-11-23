version:  1.0.0
updated:  2026-11-20
by:       Aswanth Lal
change:   Initial AI execution rules and repository architecture contract

## Execution Order
1. Read `AGENTS.md` and `BASELINE.md` before writing any code.
2. Read the active target `modules/<module>/MODULE.md` and `modules/<module>/collections/*.md`.
3. Never modify unrelated modules. Work strictly on the requested module and step.

## Three-Layer Architecture (Mandatory)
- `modules/<module>/` -> Markdown specs (`MODULE.md`, `collections/*.md`, `QA.md`).
- `src/modules/<module>/` -> React + TypeScript + Tailwind UI screens and components.
- `convex/modules/<module>/` -> Convex queries, mutations, and actions.
- `convex/lib/baseFields.ts` -> Shared validator & helper injecting `tenantId` + the 9 base fields.

## Database & Security Rules
- Every table in `convex/schema.ts` MUST include `tenantId` and the 9 mandatory base fields (`createdBy`, `editedBy`, `dateCreated`, `dateEdited`, `category`, `type`, `keywords`, `status`, `sysState`).
- Every query and mutation MUST scope reads/writes by `tenantId` and validate arguments with `convex/values`.
- If a field exists in `convex/schema.ts` and is missing from `modules/<module>/collections/<collection>.md`, update the Markdown collection file first.
- Never commit `.env.local` or secret keys.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
