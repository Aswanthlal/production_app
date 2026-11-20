version:  1.0.0
updated:  2026-11-20
by:       Aswanth Lal
change:   Initial banners collection dictionary

## Base fields
`tenantId` plus the nine common fields (`createdBy`, `editedBy`, `dateCreated`, `dateEdited`, `category`, `type`, `keywords`, `status`, `sysState`). No changes.

## Dictionaries
status:    draft | active | archived
type:      hero | promo | seasonal
category:  storefront-banner
sysState:  active | archived | soft-deleted

## Fields unique to this collection
| Field | Label | Type | Values / Notes |
|---|---|---|---|
| `title` | Headline | `string` | Hero headline text |
| `subtitle` | Subtitle | `string` | Supporting promo text |
| `imageUrl` | Banner Image | `string` | Valid image URL |
| `ctaText` | CTA Label | `string` | Optional button label |
| `ctaLink` | CTA Route | `string` | Optional target route/slug |
| `sortOrder` | Sort Order | `number` | Whole number (`>= 0`) |