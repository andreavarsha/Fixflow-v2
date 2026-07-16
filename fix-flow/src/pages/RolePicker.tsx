import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function RolePicker() {
  const user = useQuery(api.users.getUser);
  const navigate = useNavigate();

  useEffect(() => {
    if (user === undefined) return;
    if (!user) {
      void navigate("/login");
      return;
    }
    if (user.role === "owner") void navigate("/owner/dashboard");
    else if (user.role === "supplier") void navigate("/supplier/dashboard");
    else if (user.role === "admin") void navigate("/admin/dashboard");
  }, [user, navigate]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center">
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
