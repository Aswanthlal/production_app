version:  1.2.0
updated:  2026-11-24
by:       Antigravity
change:   Standardized Base fields and 4 required Dictionaries matching convex/schema.ts 1:1

## Base fields
`tenantId` plus the 9 mandatory base fields (`createdBy`, `editedBy`, `dateCreated`, `dateEdited`, `category`, `type`, `keywords`, `status`, `sysState`) via `convex/lib/baseFields.ts`. No changes.

## Dictionaries
- `status`: `draft | active | out-of-stock | archived`
- `type`: `indoor | outdoor | flowering | succulent | foliage`
- `category`: `catalog-product`
- `sysState`: `active | archived | soft-deleted`

## Fields unique to this collection
| Field | Label | Type | Required | Values / Notes |
|---|---|---|---|---|
| `categoryIds` | Category IDs | `Id<"categories">[]` | Yes | Must contain `>= 1` valid category ID |
| `name` | Plant Name | `string` | Yes | Plant/product title |
| `slug` | Plant Slug | `string` | Yes | URL-safe unique slug per tenant |
| `sku` | SKU Code | `string` | No | Optional stock-keeping unit |
| `description` | Description | `string` | Yes | Plant details & overview |
| `careDetails` | Care Details | `string` | No | Free-text care instructions |
| `careLevel` | Care Level | `string` | No | "Easy" \| "Moderate" \| "Expert" |
| `light` | Light Requirements | `string` | No | Sunlight recommendation |
| `watering` | Watering Schedule | `string` | No | Watering schedule recommendation |
| `price` | Selling Price | `number` | Yes | Selling price (`>= 0`) |
| `mrp` | MRP | `number` | No | Original price for discount display (`>= price`) |
| `stockQty` | Stock Quantity | `number` | Yes | Available inventory (`>= 0`) |
| `imageUrls` | Image URLs | `string[]` | Yes | At least 1 image URL (`imageUrls[0]` is primary) |
| `rating` | Rating | `number` | No | Average rating (`0–5`) |
| `reviewCount` | Review Count | `number` | No | Total reviews count |
| `isTrending` | Trending Toggle | `boolean` | Yes | Eligible for Trending Plants grid & infinite scroll |

## Indexes
- `by_tenant_status`: `["tenantId", "status"]`
- `by_tenant_trending`: `["tenantId", "isTrending", "status"]`
- `by_tenant_slug`: `["tenantId", "slug"]`
