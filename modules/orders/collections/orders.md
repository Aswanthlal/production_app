version:  1.1.0
updated:  2026-11-21
by:       Aswanth Lal
change:   Standardized Base fields & 4-field Dictionaries sections, added paymentStatus and embedded OrderItem shape

## Base fields
`tenantId` plus the 9 mandatory base fields (`createdBy`, `editedBy`, `dateCreated`, `dateEdited`, `category`, `type`, `keywords`, `status`, `sysState`) via `convex/lib/baseFields.ts`. No changes.

## Dictionaries
- `status`: `pending | confirmed | packed | shipped | delivered | cancelled`
- `type`: `standard-order | express-order`
- `category`: `customer-order`
- `sysState`: `active | archived | soft-deleted`
- `paymentMethod`: `upi | card | cod | netbanking`
- `paymentStatus`: `unpaid | paid | refunded`

## Fields unique to this collection
| Field | Label | Type | Required | Values / Notes |
|---|---|---|---|---|
| `orderNumber` | Order Number | `string` | Yes | Human-readable unique code per tenant (e.g., `"VD-482910"`) |
| `userId` | Customer User ID | `Id<"users">` | No | Present when placed by signed-in `customer` |
| `sessionId` | Guest Session ID | `string` | No | Present when placed by `guest` shopper |
| `customerName` | Recipient Name | `string` | Yes | Full recipient name |
| `phone` | Recipient Phone | `string` | Yes | 10-digit contact number for delivery |
| `address` | Street Address | `string` | Yes | House/flat, building, street |
| `city` | City | `string` | Yes | Destination city |
| `state` | State | `string` | Yes | Destination state |
| `pincode` | Pincode | `string` | Yes | 6-digit postal code |
| `items` | Line Items Snapshot | `OrderItem[]` | Yes | Array of `{ productId: Id<"products">, title?: string, name?: string, sku?: string, quantity: number, unitPrice?: number, price?: number, imageUrl?: string }` |
| `subtotal` | Subtotal | `number` | Yes | Sum of `(unitPrice * quantity)` (`>= 0`) |
| `shipping` | Shipping Fee | `number` | Yes | `0` if `subtotal >= 499`, else flat shipping fee |
| `discount` | Discount Amount | `number` | Yes | Promo discount (`>= 0`) |
| `total` | Final Total | `number` | Yes | `subtotal + shipping - discount` (`>= 0`) |
| `paymentMethod` | Payment Method | `string` | Yes | See dictionary (`upi | card | cod | netbanking`) |
| `paymentStatus` | Payment Status | `string` | No | See dictionary (`unpaid | paid | refunded`) |
| `estimatedDeliveryDate` | Estimated Delivery | `string` | Yes | Formatted delivery date window |
| `adminNotes` | Internal Fulfillment Notes | `string` | No | Optional tracking ID or packing note set by `store_admin` |

## Indexes
- `by_tenant_orderNumber`: `["tenantId", "orderNumber"]`
- `by_tenant_status`: `["tenantId", "status"]`
- `by_tenant_user`: `["tenantId", "userId"]`
- `by_tenant_session`: `["tenantId", "sessionId"]`