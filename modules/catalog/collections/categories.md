version:  1.0.1
updated:  2026-11-24
by:       Antigravity
change:   Standardized Base fields, 4 required Dictionaries, and aligned indexes with convex/schema.ts

## Base fields
`tenantId` plus the 9 mandatory base fields (`createdBy`, `editedBy`, `dateCreated`, `dateEdited`, `category`, `type`, `keywords`, `status`, `sysState`) via `convex/lib/baseFields.ts`. No changes.

## Dictionaries
- `status`: `active | archived`
- `type`: `primary | seasonal | special`
- `category`: `plant-category`
- `sysState`: `active | archived | soft-deleted`

## Fields unique to this collection
| Field | Label | Type | Required | Values / Notes |
|---|---|---|---|---|
| `name` | Category Name | `string` | Yes | Display name (e.g., "Indoor Plants") |
| `slug` | Category Slug | `string` | Yes | URL-safe unique slug per tenant |
| `description` | Description | `string` | No | Optional category blurb |
| `imageUrl` | Category Image | `string` | Yes | Category thumbnail/cover URL |
| `isFeatured` | Featured Toggle | `boolean` | Yes | Shown on `HomePage` (capped at 6) |
| `sortOrder` | Sort Order | `number` | Yes | Display order ascending |

## Indexes
- `by_tenant_slug`: `["tenantId", "slug"]`
- `by_tenant_featured`: `["tenantId", "isFeatured", "status"]`
- `by_tenant_status`: `["tenantId", "status"]`
