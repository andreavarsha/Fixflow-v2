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
import type * as demoAuth from "../demoAuth.js";
import type * as http from "../http.js";
import type * as jobCategories from "../jobCategories.js";
import type * as jobs from "../jobs.js";
import type * as llm from "../llm.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as quoteRequests from "../quoteRequests.js";
import type * as seed from "../seed.js";
import type * as supplierGeospatial from "../supplierGeospatial.js";
import type * as suppliers from "../suppliers.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  demoAuth: typeof demoAuth;
  http: typeof http;
  jobCategories: typeof jobCategories;
  jobs: typeof jobs;
  llm: typeof llm;
  messages: typeof messages;
  notifications: typeof notifications;
  quoteRequests: typeof quoteRequests;
  seed: typeof seed;
  supplierGeospatial: typeof supplierGeospatial;
  suppliers: typeof suppliers;
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
  geospatial: import("@convex-dev/geospatial/_generated/component.js").ComponentApi<"geospatial">;
};
