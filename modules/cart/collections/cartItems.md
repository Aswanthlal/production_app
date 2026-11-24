version:  1.0.1
updated:  2026-11-24
by:       Antigravity
change:   Standardized Base fields and 4 required Dictionaries matching convex/schema.ts 1:1

## Base fields
`tenantId` plus the 9 mandatory base fields (`createdBy`, `editedBy`, `dateCreated`, `dateEdited`, `category`, `type`, `keywords`, `status`, `sysState`) via `convex/lib/baseFields.ts`. No changes.

## Dictionaries
- `status`: `active | converted | abandoned`
- `type`: `standard-item | gift-item`
- `category`: `cart`
- `sysState`: `active | archived | soft-deleted`

## Fields unique to this collection
| Field | Label | Type | Required | Values / Notes |
|---|---|---|---|---|
| `userId` | User ID | `Id<"users">` | No | Present when signed in as `customer` |
| `sessionId` | Session ID | `string` | No | Present for `guest` browser session |
| `productId` | Product ID | `Id<"products">` | Yes | Referenced plant/product |
| `quantity` | Quantity | `number` | Yes | Integer `>= 1` and `<= product.stockQty` |
| `unitPriceSnapshot` | Unit Price Snapshot | `number` | Yes | Price at time item was added |

## Indexes
- `by_tenant_user`: `["tenantId", "userId", "status"]`
- `by_tenant_session`: `["tenantId", "sessionId", "status"]`
