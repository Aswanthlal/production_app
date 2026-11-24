version:  1.0.0
updated:  2026-11-24
by:       Antigravity
change:   Initial reviews collection dictionary matching convex/schema.ts

## Base fields
`tenantId` plus the 9 mandatory base fields (`createdBy`, `editedBy`, `dateCreated`, `dateEdited`, `category`, `type`, `keywords`, `status`, `sysState`) via `convex/lib/baseFields.ts`. No changes.

## Dictionaries
- `status`: `approved | pending | rejected | archived`
- `type`: `product-review | store-review`
- `category`: `customer-feedback`
- `sysState`: `active | archived | soft-deleted`

## Fields unique to this collection
| Field | Label | Type | Required | Values / Notes |
|---|---|---|---|---|
| `name` | Reviewer Name | `string` | Yes | Customer display name |
| `city` | Reviewer City | `string` | Yes | Customer city / location |
| `rating` | Star Rating | `number` | Yes | Rating value from 1 to 5 |
| `comment` | Review Comment | `string` | Yes | Written review body |
| `verifiedBuyer` | Verified Buyer | `boolean` | Yes | True if purchaser is verified |
| `avatarUrl` | Avatar Image | `string` | Yes | URL to customer avatar thumbnail |
| `plantName` | Plant Name | `string` | Yes | Associated plant or product name |
| `productId` | Product ID | `Id<"products">` | No | Optional reference to specific plant |

## Indexes
- `by_tenant_status`: `["tenantId", "status"]`
