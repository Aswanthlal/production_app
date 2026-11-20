version:  1.0.0
updated:  2026-11-20
by:       Aswanth Lal
change:   Initial categories collection dictionary

## Collection: `categories`
Inherits `tenantId` + 9 mandatory base fields (`convex/lib/baseFields.ts`).

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | `string` | Yes | Display name (e.g., "Indoor Plants") |
| `slug` | `string` | Yes | URL-safe unique slug per tenant |
| `description` | `string` | No | Optional category blurb |
| `imageUrl` | `string` | Yes | Category thumbnail/cover URL |
| `isFeatured` | `boolean` | Yes | Shown on `HomePage` (capped at 6) |
| `sortOrder` | `number` | Yes | Display order ascending |

## Fixed Dictionary
- `status`: `active | archived`

## Indexes
- `by_tenant_slug`: `["tenantId", "slug"]`
- `by_tenant_featured`: `["tenantId", "isFeatured", "status"]`