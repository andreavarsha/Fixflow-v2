import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import {
  ffBtnPrimary,
  ffCard,
  ffInput,
  ffLabel,
  ffPage,
  ffScreenTitle,
} from "../lib/fixflowUi";
import { toUserFacingError } from "../lib/userFacingError";

export default function Login() {
  const { signIn } = useAuthActions();
  const demoLogin = useQuery(api.demoAuth.getDemoSupplierLoginInfo);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn("password", { email, password, flow: "signIn" });
      navigate("/");
    } catch (err: unknown) {
      console.error("Login error:", err);
      setError(toUserFacingError(err, "login"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`${ffPage} flex min-h-dvh flex-col justify-center pt-8`}>
      <div className={`${ffCard} mx-auto w-full max-w-md xl:max-w-xl 2xl:max-w-2xl`}>
        <h1 className={ffScreenTitle}>FixFlow AI</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to continue</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          {error && (
            <p
              className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          )}

          <div>
            <label htmlFor="login-email" className={ffLabel}>
              Email
            </label>
            <input
              id="login-email"
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
            <label htmlFor="login-password" className={ffLabel}>
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${ffInput} pr-14`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-2 top-1/2 min-h-[40px] min-w-[48px] -translate-y-1/2 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:bg-accent"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className={ffBtnPrimary}>
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <Link
            to="/signup"
            className="text-center text-sm font-medium text-foreground/80 underline underline-offset-4 hover:text-foreground"
          >
            Need an account? Sign up
          </Link>

          {demoLogin && (
            <div className="rounded-lg border border-dashed border-border bg-muted/50 px-3 py-3 text-xs leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground/90">Demo supplier login</p>
              <p className="mt-1">{demoLogin.emailHint}</p>
              <p className="mt-1">
                Password:{" "}
                <span className="font-mono font-semibold text-foreground">
                  {demoLogin.password}
                </span>
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
