import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ffPage } from "../lib/fixflowUi";

export default function RolePicker() {
  const user = useQuery(api.users.getUser);
  const navigate = useNavigate();

  useEffect(() => {
    if (user === undefined) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role === "owner") navigate("/owner/dashboard");
    else if (user.role === "supplier") navigate("/supplier/dashboard");
    else if (user.role === "admin") navigate("/admin/dashboard");
  }, [user, navigate]);

  return (
    <div className={`${ffPage} flex min-h-dvh flex-col items-center justify-center`}>
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900"
          aria-hidden
        />
        <div>
          <p className="text-base font-medium text-gray-900">Taking you to your dashboard…</p>
          <p className="mt-1 text-sm text-gray-500">One moment.</p>
        </div>
      </div>
    </div>
  );
}
