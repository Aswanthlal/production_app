version:  1.0.0
updated:  2026-11-24
by:       Antigravity
change:   Frontend rules for UI components, state management, and styling

## Frontend Invariants
- Strict TypeScript: No `any` types. Import typed models from `src/types/store.ts` and generated Convex types from `convex/_generated/dataModel`.
- Styling: Standardize on Tailwind CSS utility classes adhering to the Verdant botanical design theme (emerald primary, warm stone neutrals, amber alerts).
- State Handling: Every view and component MUST handle three states gracefully:
  1. Loading state (spinners, skeletons, or disabled buttons).
  2. Empty state (helpful user prompt with actionable CTA).
  3. Error state (actionable inline or toast alert without crashing).
- No Hardcoded Mock Data: Do not ship static mock data in production screens. Connect to live Convex reactive hooks (`useQuery`, `useMutation`) and StoreContext.
- Responsive Design: All pages must be fully responsive across mobile (375px+), tablet, and desktop viewports.
- Atomic State Updates: Keep UI state in sync with server mutations; avoid synchronous cascading `setState` calls inside `useEffect`.
