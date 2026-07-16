import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import type { MutationCtx } from "./_generated/server";

/** Link new password accounts to existing users rows (seeded suppliers). */
async function createOrUpdateUser(
  ctx: MutationCtx,
  args: {
    existingUserId: import("./_generated/dataModel").Id<"users"> | null;
    profile: Record<string, unknown> & { email?: string };
  },
) {
  if (args.existingUserId) {
    return args.existingUserId;
  }

  const email = typeof args.profile.email === "string" ? args.profile.email : undefined;
  if (email) {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (existing) {
      return existing._id;
    }
  }

  return await ctx.db.insert("users", args.profile as never);
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  callbacks: {
    createOrUpdateUser,
  },
  providers: [
    Password({
      profile(params): { email: string; name: string } & Record<string, string | boolean> {
        const flow = params.flow as string | undefined;
        const email = params.email as string;

        if (flow === "signIn") {
          return {
            email,
            name: (params.name as string) ?? "",
          };
        }

        const role = params.role as string | undefined;
        if (role === "supplier" || role === "admin") {
          throw new Error(
            "Supplier accounts are not created through public sign-up",
          );
        }
        if (role !== undefined && role !== "owner") {
          throw new Error("Only homeowner accounts can be created here");
        }
        return {
          email,
          name: (params.name as string) ?? "",
          role: "owner",
          preferredLanguage: "en",
          approved: true,
          suspended: false,
        };
      },
    }),
  ],
});
