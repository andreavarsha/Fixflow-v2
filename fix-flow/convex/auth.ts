import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const role = params.role as "owner" | "supplier" | "admin" | undefined;
        if (!role) {
          throw new Error("Role is required (owner, supplier, or admin)");
        }
        const base = {
          email: params.email as string,
          name: (params.name as string) ?? "",
          role,
          preferredLanguage:
            (params.preferredLanguage as "en" | "si" | "ta") ?? "en",
          approved: role !== "supplier",
          suspended: false,
        };
        if (role === "supplier") {
          return { ...base, available: true };
        }
        return base;
      },
    }),
  ],
});
