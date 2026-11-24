# Authentication & Authorization

## Authentication Architecture
Verdant Nursery utilizes [Convex Auth](https://auth.convex.dev) (`@convex-dev/auth`) configured in `convex/auth.ts` and `convex/auth.config.ts`. The primary authentication method is the `Password` provider, enabling store owners and customers to register and authenticate securely with username/email and password credentials.

## Role Model
The system enforces three distinct access tiers across all screens and backend functions:

| Role | Auth Status | Storage Location | Capabilities |
|---|---|---|---|
| `guest` | Unauthenticated | Session ID in local storage | Browse catalog, search, add items to session cart, track orders via order number + phone |
| `customer` | Authenticated | `tenantMembers` (`role: "customer"`) | Persistent cart, order placement, customer order history lookup |
| `store_admin` | Authenticated | `tenantMembers` (`role: "store_admin"`) | Access `AdminDashboardPage`, category CRUD, plant management, order fulfillment |

## Authorization & Guardrails (`convex/lib/authGuard.ts`)

### Server-Derived Identity
Caller identity is strictly derived on the server using `getAuthUserId(ctx)`. Client arguments must never accept or pass a user ID for authorization.

### `requireRole(ctx, tenantId, allowedRoles)`
Every Convex query or mutation that requires specific permissions calls `requireRole`:
```typescript
await requireRole(ctx, args.tenantId, ["store_admin"]);
```
1. Verifies the `tenantId` exists in `tenants`.
2. Resolves the caller's `userId` via Convex Auth.
3. Looks up `tenantMembers` record matching `by_tenantId_and_userId`.
4. If role is not permitted, throws an unauthorized error preventing execution.
5. If unauthenticated caller attempts an action requiring `customer` or `store_admin`, throws an authentication error.

## Automatic Membership Provisioning (`convex/users.ts`)
- `createUser`: Internal mutation triggered on signup. Automatically creates user record and provisions membership for the default tenant (`verdant`) with `store_admin` role.
- `onSignIn`: Internal mutation triggered on each successful login, verifying that the user has an active membership record in `tenantMembers`.
