version:  1.0.0
updated:  2026-11-20
by:       Antigravity
change:   Initial orders collection dictionary

## Collection: `orders`
Inherits `tenantId` + 9 mandatory base fields (`convex/lib/baseFields.ts`).

| Field | Type | Required | Notes |
|---|---|---|---|
| `orderNumber` | `string` | Yes | Human-readable unique code (e.g., "VD-482910") |
| `userId` | `Id<"users">` | No | Present if signed in as `customer` |
| `sessionId` | `string` | No | Present for `guest` shoppers |
| `customerName` | `string` | Yes | Full recipient name |
| `phone` | `string` | Yes | Recipient phone number |
| `address` | `string` | Yes | Street address / apartment |
| `city` | `string` | Yes | Destination city |
| `state` | `string` | Yes | Destination state |
| `pincode` | `string` | Yes | Postal code |
| `items` | `OrderItem[]` | Yes | Snapshot of purchased plants (productId, name, quantity, price, imageUrl) |
| `subtotal` | `number` | Yes | Sum of items price * qty |
| `shipping` | `number` | Yes | Delivery fee (0 if subtotal >= 499) |
| `discount` | `number` | Yes | Applied promo code discount |
| `total` | `number` | Yes | Final payable amount |
| `paymentMethod` | `string` | Yes | `upi` \| `card` \| `cod` \| `netbanking` |
| `estimatedDeliveryDate` | `string` | Yes | Formatted delivery estimate |

## Fixed Dictionary
- `status`: `pending | confirmed | packed | shipped | delivered | cancelled`

## Indexes
- `by_tenant_orderNumber`: `["tenantId", "orderNumber"]`
- `by_tenant_status`: `["tenantId", "status"]`
- `by_tenant_user`: `["tenantId", "userId"]`
- `by_tenant_session`: `["tenantId", "sessionId"]`
