import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ffBtnPrimary, ffCard, ffPage, ffScreenTitle } from "../lib/fixflowUi";

export default function RolePicker() {
  const user = useQuery(api.users.getUser);
  const navigate = useNavigate();
  const { signOut } = useAuthActions();

  useEffect(() => {
    if (user === undefined) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role === "owner") navigate("/owner/dashboard");
    else if (user.role === "supplier") navigate("/supplier/dashboard");
  }, [user, navigate]);

  if (user === undefined || !user || user.role !== "admin") {
    return (
      <div className={`${ffPage} flex min-h-dvh flex-col items-center justify-center`}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary"
            aria-hidden
          />
          <div>
            <p className="text-base font-medium text-foreground">
              Taking you to your dashboard…
            </p>
            <p className="mt-1 text-sm text-muted-foreground">One moment.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${ffPage} flex min-h-dvh flex-col items-center justify-center px-4`}>
      <div className={`${ffCard} w-full max-w-md text-center`}>
        <h1 className={ffScreenTitle}>Admin not available</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Admin tools are turned off in this build. Sign out and use a homeowner
          or tradesperson account instead.
        </p>
        <button
          type="button"
          onClick={() => void signOut().then(() => navigate("/login"))}
          className={`${ffBtnPrimary} mt-6`}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
