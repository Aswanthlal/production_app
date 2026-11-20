version:  1.1.0
updated:  2026-11-20
by:       Antigravity
change:   Added careLevel, light, and watering fields to products collection dictionary

## Collection: `products`
Inherits `tenantId` + 9 mandatory base fields (`convex/lib/baseFields.ts`).

| Field | Type | Required | Notes |
|---|---|---|---|
| `categoryIds` | `Id<"categories">[]` | Yes | Must contain `>= 1` valid category ID |
| `name` | `string` | Yes | Plant/product title |
| `slug` | `string` | Yes | URL-safe unique slug per tenant |
| `sku` | `string` | No | Optional stock-keeping unit |
| `description` | `string` | Yes | Plant details & overview |
| `careDetails` | `string` | No | Free-text care instructions |
| `careLevel` | `string` | No | "Easy" \| "Moderate" \| "Expert" |
| `light` | `string` | No | Sunlight recommendation |
| `watering` | `string` | No | Watering schedule recommendation |
| `price` | `number` | Yes | Selling price (`>= 0`) |
| `mrp` | `number` | No | Original price for discount display (`>= price`) |
| `stockQty` | `number` | Yes | Available inventory (`>= 0`) |
| `imageUrls` | `string[]` | Yes | At least 1 image URL (`imageUrls[0]` is primary) |
| `rating` | `number` | No | Average rating (`0–5`) |
| `reviewCount` | `number` | No | Total reviews count |
| `isTrending` | `boolean` | Yes | Eligible for Trending Plants grid & infinite scroll |

## Fixed Dictionary
- `status`: `draft | active | out-of-stock | archived`

## Indexes
- `by_tenant_status`: `["tenantId", "status"]`
- `by_tenant_trending`: `["tenantId", "isTrending", "status"]`
- `by_tenant_slug`: `["tenantId", "slug"]`
