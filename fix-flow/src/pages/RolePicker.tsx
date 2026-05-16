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
      navigate("/login");
      return;
    }
    if (user.role === "owner") navigate("/owner/dashboard");
    else if (user.role === "supplier") navigate("/supplier/dashboard");
    else if (user.role === "admin") navigate("/admin/dashboard");
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black">
      <p className="text-sm text-gray-500">Redirecting...</p>
    </div>
  );
}