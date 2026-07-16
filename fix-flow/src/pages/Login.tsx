import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useEffect, useState } from "react";
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

export default function Login() {
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // `signIn()` resolving doesn't mean the client's reactive auth state has
  // caught up yet — navigating immediately can land on "/" while it's still
  // transiently unauthenticated, bouncing back to /login. Wait for the real
  // auth state instead of racing it.
  useEffect(() => {
    if (isAuthenticated) void navigate("/");
  }, [isAuthenticated, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn("password", { email, password, flow: "signIn" });
    } catch (err: unknown) {
      console.error("Login error:", err);
      setError(toUserFacingError(err, "login"));
      setLoading(false);
    }
  }

  return (
    <div className={`${ffPage} flex min-h-dvh flex-col justify-center pt-8`}>
      <div className={`${ffCard} mx-auto w-full max-w-md xl:max-w-xl 2xl:max-w-2xl`}>
        <h1 className={ffScreenTitle}>FixFlow AI</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to continue</p>

        <form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          className="mt-8 flex flex-col gap-5"
        >
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

          <div className="mt-6 border-t border-border pt-6">
            <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground/85">
              Quick-fill demo accounts
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail("demo.owner@fixflow.lk");
                  setPassword("FixFlowDemo1");
                }}
                className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-2 text-center transition hover:border-primary hover:bg-accent"
              >
                <span className="text-lg" aria-hidden>
                  🏠
                </span>
                <span className="mt-1 text-[10px] font-semibold text-foreground">Homeowner</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("nimal.perera.1@fixflow.lk");
                  setPassword("FixFlowDemo1");
                }}
                className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-2 text-center transition hover:border-primary hover:bg-accent"
              >
                <span className="text-lg" aria-hidden>
                  🛠️
                </span>
                <span className="mt-1 text-[10px] font-semibold text-foreground">Tradesperson</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@fixflow.lk");
                  setPassword("FixFlowDemo1");
                }}
                className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-2 text-center transition hover:border-primary hover:bg-accent"
              >
                <span className="text-lg" aria-hidden>
                  💼
                </span>
                <span className="mt-1 text-[10px] font-semibold text-foreground">Admin</span>
              </button>
            </div>
            <p className="mt-2.5 text-center text-[10px] text-muted-foreground/75">
              Pre-fills fields. Password for all:{" "}
              <span className="font-mono font-semibold text-foreground">FixFlowDemo1</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
