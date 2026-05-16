import { createAccount, modifyAccountCredentials } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  internalAction,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";

/** Shared password for all seeded @fixflow.lk supplier accounts (demo / judging). */
export const DEMO_SUPPLIER_PASSWORD = "FixFlowDemo1";

export const getDemoSupplierLoginInfo = query({
  args: {},
  handler: async () => ({
    password: DEMO_SUPPLIER_PASSWORD,
    emailHint: "Use any seeded supplier email, e.g. mahesh.rathnayake.8@fixflow.lk",
  }),
});

export const listSeededSuppliers = internalQuery({
  args: {},
  handler: async (ctx) => {
    const suppliers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "supplier"))
      .collect();

    return suppliers
      .filter((s) => s.email?.endsWith("@fixflow.lk"))
      .map((s) => ({
        userId: s._id,
        email: s.email!,
        name: s.name,
      }));
  },
});

/** Attach password auth to every seeded supplier (run once per deployment). */
export const setupDemoSupplierPasswords = mutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(0, internal.demoAuth.setupDemoSupplierPasswordsAction, {});
    return {
      message: "Setting up demo supplier passwords…",
      password: DEMO_SUPPLIER_PASSWORD,
    };
  },
});

type SetupResult = {
  linked: number;
  updated: number;
  errors: string[];
  total: number;
};

export const setupDemoSupplierPasswordsAction = internalAction({
  args: {},
  handler: async (ctx): Promise<SetupResult> => {
    const suppliers = await ctx.runQuery(internal.demoAuth.listSeededSuppliers, {});

    let linked = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const supplier of suppliers) {
      try {
        await createAccount(ctx, {
          provider: "password",
          account: {
            id: supplier.email,
            secret: DEMO_SUPPLIER_PASSWORD,
          },
          // Linked to existing seed row via createOrUpdateUser in auth.ts — profile is not used for inserts.
          profile: {
            email: supplier.email,
            name: supplier.name ?? supplier.email,
          },
        } as never);
        linked++;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("already exists")) {
          try {
            await modifyAccountCredentials(ctx, {
              provider: "password",
              account: {
                id: supplier.email,
                secret: DEMO_SUPPLIER_PASSWORD,
              },
            });
            updated++;
          } catch (inner) {
            errors.push(
              `${supplier.email}: ${inner instanceof Error ? inner.message : String(inner)}`,
            );
          }
        } else {
          errors.push(`${supplier.email}: ${message}`);
        }
      }
    }

    console.log("Demo supplier passwords ready", {
      linked,
      updated,
      password: DEMO_SUPPLIER_PASSWORD,
      errors,
    });

    return { linked, updated, errors, total: suppliers.length };
  },
});
