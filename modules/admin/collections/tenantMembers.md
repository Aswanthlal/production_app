version:  1.0.0
updated:  2026-11-24
by:       Antigravity
change:   Initial tenantMembers collection dictionary matching convex/schema.ts

## Base fields
`tenantId` plus the 9 mandatory base fields (`createdBy`, `editedBy`, `dateCreated`, `dateEdited`, `category`, `type`, `keywords`, `status`, `sysState`) via `convex/lib/baseFields.ts`. No changes.

## Dictionaries
- `status`: `active | invited | suspended | revoked`
- `type`: `membership | staff`
- `category`: `tenant`
- `sysState`: `active | archived | soft-deleted`
- `role`: `customer | store_admin`

## Fields unique to this collection
| Field | Label | Type | Required | Values / Notes |
|---|---|---|---|---|
| `tenantId` | Tenant ID | `Id<"tenants">` | Yes | Tenant reference |
| `userId` | User ID | `Id<"users">` | Yes | Convex Auth user reference |
| `role` | Role | `"customer" \| "store_admin"` | Yes | Access tier within tenant |

## Indexes
- `by_tenantId_and_userId`: `["tenantId", "userId"]`
- `by_userId_and_tenantId`: `["userId", "tenantId"]`
