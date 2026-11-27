/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as lib_authGuard from "../lib/authGuard.js";
import type * as lib_baseFields from "../lib/baseFields.js";
import type * as modules_admin_index from "../modules/admin/index.js";
import type * as modules_ai_actions from "../modules/ai/actions.js";
import type * as modules_ai_queries from "../modules/ai/queries.js";
import type * as modules_cart_index from "../modules/cart/index.js";
import type * as modules_catalog_index from "../modules/catalog/index.js";
import type * as modules_orders_index from "../modules/orders/index.js";
import type * as modules_storefront_index from "../modules/storefront/index.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "lib/authGuard": typeof lib_authGuard;
  "lib/baseFields": typeof lib_baseFields;
  "modules/admin/index": typeof modules_admin_index;
  "modules/ai/actions": typeof modules_ai_actions;
  "modules/ai/queries": typeof modules_ai_queries;
  "modules/cart/index": typeof modules_cart_index;
  "modules/catalog/index": typeof modules_catalog_index;
  "modules/orders/index": typeof modules_orders_index;
  "modules/storefront/index": typeof modules_storefront_index;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  auth: import("@convex-dev/auth/_generated/component.js").ComponentApi<"auth">;
  authPassword: import("@convex-dev/auth/components/password/_generated/component.js").ComponentApi<"authPassword">;
  authUsername: import("@convex-dev/auth/components/username/_generated/component.js").ComponentApi<"authUsername">;
};
