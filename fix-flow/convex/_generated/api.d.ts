/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as demoAuth from "../demoAuth.js";
import type * as followUps from "../followUps.js";
import type * as geocode from "../geocode.js";
import type * as http from "../http.js";
import type * as jobCategories from "../jobCategories.js";
import type * as jobs from "../jobs.js";
import type * as llm from "../llm.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as quoteRequests from "../quoteRequests.js";
import type * as rateLimits from "../rateLimits.js";
import type * as reviews from "../reviews.js";
import type * as seed from "../seed.js";
import type * as supplierGeospatial from "../supplierGeospatial.js";
import type * as suppliers from "../suppliers.js";
import type * as users from "../users.js";
import type * as waitlist from "../waitlist.js";
import type * as zones from "../zones.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  auth: typeof auth;
  crons: typeof crons;
  demoAuth: typeof demoAuth;
  followUps: typeof followUps;
  geocode: typeof geocode;
  http: typeof http;
  jobCategories: typeof jobCategories;
  jobs: typeof jobs;
  llm: typeof llm;
  messages: typeof messages;
  notifications: typeof notifications;
  quoteRequests: typeof quoteRequests;
  rateLimits: typeof rateLimits;
  reviews: typeof reviews;
  seed: typeof seed;
  supplierGeospatial: typeof supplierGeospatial;
  suppliers: typeof suppliers;
  users: typeof users;
  waitlist: typeof waitlist;
  zones: typeof zones;
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
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
