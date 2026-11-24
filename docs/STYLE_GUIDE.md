# Design System & Style Guide

## Philosophy
The Verdant aesthetic conveys organic freshness, botanical trust, and premium horticulture craft. Interface styling combines deep botanical greens with warm stone neutrals and tactile, rounded cards.

## Color Palette

### Primary (Botanical Emerald)
- `emerald-50`: Backgrounds, badge fills, active radio selections.
- `emerald-100`: Subtle borders, light accent tags.
- `emerald-600` / `emerald-700`: Primary buttons, active icons, brand accents.
- `emerald-800` / `emerald-900`: Headings, primary emphasis text, high-contrast badges.
- `emerald-950`: Dark surfaces (review carousel, hero banner accents).

### Neutral (Warm Stone)
- `stone-50` / `stone-100`: Card backgrounds, subtle table rows, secondary panels.
- `stone-200` / `stone-300`: Surface dividers, form borders, inactive chips.
- `stone-500` / `stone-600`: Helper copy, metadata labels, secondary icons.
- `stone-800` / `stone-900`: Body text, primary modal titles.

### Semantic Accents
- **Amber (`amber-500` / `amber-50`)**: Star ratings, low-stock warnings, care tips.
- **Rose (`rose-600` / `rose-50`)**: Validation errors, stock exhaustion alerts, destructive actions.
- **Teal / Cyan (`teal-700`)**: Water care tips and botanical highlights.

## Typography & Hierarchy
- **Font Stack**: Clean sans-serif system font (`Inter`, system-ui, -apple-system).
- **Titles**: `font-black text-2xl tracking-tight` for page and modal headings.
- **Section Headers**: `text-xs font-bold uppercase tracking-wider` for category and section dividers.
- **Body Text**: `text-sm text-stone-700 leading-relaxed`.
- **Micro-copy**: `text-xs text-stone-500` for helper labels, timestamps, and order metadata.

## Component Conventions
- **Buttons**:
  - `primary`: `bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl shadow-sm`.
  - `outline`: `border border-stone-200 hover:bg-stone-50 text-stone-700 font-bold rounded-2xl`.
  - `danger`: `bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl`.
- **Modals & Drawers**:
  - Backdrop blur (`bg-stone-900/60 backdrop-blur-xs`).
  - Max widths: `sm` for confirmations, `xl` for summaries, `2xl` for checkout/editor forms.
  - Full keyboard accessibility (Escape to dismiss, focus trap).
- **Form Controls**:
  - Explicit labels with optional indicator or red asterisk for required.
  - Floating helper text or validation error message below inputs.
