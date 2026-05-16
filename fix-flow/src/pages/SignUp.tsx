import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ffBtnPrimary,
  ffCard,
  ffInput,
  ffLabel,
  ffPage,
  ffScreenTitle,
} from "../lib/fixflowUi";

export default function Signup() {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"owner" | "supplier">("owner");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await signIn("password", { email, password, flow: "signUp", role });
      navigate("/");
    } catch (err: unknown) {
      console.error("Signup error:", err);
      const raw = err instanceof Error ? err.message : "Signup failed.";
      const message =
        raw.includes("Invalid password")
          ? "Password must be at least 8 characters."
          : raw;
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`${ffPage} flex min-h-dvh flex-col justify-center pt-8`}>
      <div className={`${ffCard} mx-auto w-full max-w-md xl:max-w-xl 2xl:max-w-2xl`}>
        <h1 className={ffScreenTitle}>Create account</h1>
        <p className="mt-2 text-sm text-gray-600">
          Homeowners and suppliers use the same sign-up — pick your role below.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="signup-role" className={ffLabel}>
              I am a…
            </label>
            <select
              id="signup-role"
              value={role}
              onChange={(e) => setRole(e.target.value as "owner" | "supplier")}
              className={ffInput}
            >
              <option value="owner">Homeowner / property owner</option>
              <option value="supplier">Supplier / tradesperson</option>
            </select>
          </div>

          <div>
            <label htmlFor="signup-email" className={ffLabel}>
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={ffInput}
              required
            />
          </div>

          <div>
            <label htmlFor="signup-password" className={ffLabel}>
              Password
            </label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${ffInput} pr-14`}
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-2 top-1/2 min-h-[40px] min-w-[48px] -translate-y-1/2 rounded-lg px-2 text-xs font-medium text-gray-600 hover:bg-gray-100"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className={ffBtnPrimary}>
            {loading ? "Creating…" : "Create account"}
          </button>

          <Link
            to="/login"
            className="text-center text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-gray-900"
          >
            Already have an account? Sign in
          </Link>
        </form>
      </div>
    </div>
  );
}
