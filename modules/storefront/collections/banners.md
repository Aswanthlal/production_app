version:  1.0.1
updated:  2026-11-20
by:       Aswanth Lal
change:   Completed full dictionary values for status, type, category, and sysState

## Base fields
`tenantId` plus the 9 mandatory base fields (`createdBy`, `editedBy`, `dateCreated`, `dateEdited`, `category`, `type`, `keywords`, `status`, `sysState`) via `convex/lib/baseFields.ts`. No changes.

## Dictionaries
- `status`: `draft | active | archived`
- `type`: `hero | promo | seasonal`
- `category`: `storefront-banner`
- `sysState`: `active | archived | soft-deleted`

## Fields unique to this collection
| Field | Label | Type | Required | Values / Notes |
|---|---|---|---|---|
| `title` | Headline | `string` | Yes | Hero headline text |
| `subtitle` | Subtitle | `string` | No | Supporting promo text |
| `imageUrl` | Banner Image | `string` | Yes | Banner image URL |
| `ctaText` | CTA Label | `string` | No | Button label (e.g., "Shop Now") |
| `ctaLink` | CTA Route | `string` | No | Target route or category slug |
| `sortOrder` | Sort Order | `number` | Yes | Display order ascending |

## Indexes
- `by_tenant_status`: `["tenantId", "status", "sortOrder"]`