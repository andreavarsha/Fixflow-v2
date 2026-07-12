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
import { toUserFacingError } from "../lib/userFacingError";

export default function Signup() {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      await signIn("password", {
        email,
        password,
        flow: "signUp",
        role: "owner",
      });
      navigate("/");
    } catch (err: unknown) {
      console.error("Signup error:", err);
      setError(toUserFacingError(err, "signup"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`${ffPage} flex min-h-dvh flex-col justify-center pt-8`}>
      <div className={`${ffCard} mx-auto w-full max-w-md xl:max-w-xl 2xl:max-w-2xl`}>
        <h1 className={ffScreenTitle}>Create account</h1>
        <p className="mt-2 text-sm text-gray-600">
          Sign up as a homeowner to report repairs and get live quotes from
          vetted tradespeople.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

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
            {loading ? "Creating…" : "Create homeowner account"}
          </button>

          <p className="text-center text-xs text-gray-500">
            Tradespeople are pre-vetted by FixFlow. Supplier accounts are not
            created through public sign-up — use a demo login if you were given
            one.
          </p>

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
