version:  1.0.0
updated:  2026-11-20
by:       Aswanth Lal
change:   Initial cartItems collection dictionary

## Collection: `cartItems`
Inherits `tenantId` + 9 mandatory base fields (`convex/lib/baseFields.ts`).

| Field | Type | Required | Notes |
|---|---|---|---|
| `userId` | `Id<"users">` | No | Present when signed in as `customer` |
| `sessionId` | `string` | No | Present for `guest` browser session |
| `productId` | `Id<"products">` | Yes | Referenced plant/product |
| `quantity` | `number` | Yes | Integer `>= 1` and `<= product.stockQty` |
| `unitPriceSnapshot` | `number` | Yes | Price at time item was added |

## Fixed Dictionary
- `status`: `active | converted | abandoned`

## Indexes
- `by_tenant_user`: `["tenantId", "userId", "status"]`
- `by_tenant_session`: `["tenantId", "sessionId", "status"]`