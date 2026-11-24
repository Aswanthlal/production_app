version:  1.0.0
updated:  2026-11-24
by:       Antigravity
change:   Initial tenants collection dictionary matching convex/schema.ts

## Base fields
`tenantId` (optional self-reference `v.optional(v.id("tenants"))`) plus the 9 mandatory base fields (`createdBy`, `editedBy`, `dateCreated`, `dateEdited`, `category`, `type`, `keywords`, `status`, `sysState`) via `convex/lib/baseFields.ts`. No changes.

## Dictionaries
- `status`: `active | suspended | archived`
- `type`: `store | organization`
- `category`: `tenant`
- `sysState`: `active | archived | soft-deleted`

## Fields unique to this collection
| Field | Label | Type | Required | Values / Notes |
|---|---|---|---|---|
| `name` | Tenant Name | `string` | Yes | Store or organization display name |
| `slug` | Slug | `string` | Yes | URL-safe identifier (e.g., "verdant") |

## Indexes
- `by_slug`: `["slug"]`
