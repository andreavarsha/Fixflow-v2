import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "../lib/LanguageContext";
import {
  IconClipboard,
  IconPersonHomeowner,
  IconPersonTradesperson,
} from "../components/icons";
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
  const { t, language, setLanguage } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div
      className={`${ffPage} relative flex min-h-dvh flex-col justify-center overflow-hidden pt-8`}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.14),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_hsl(var(--yellow)/0.08),_transparent_45%)]"
        aria-hidden
      />

      <div
        className={`${ffCard} relative z-10 mx-auto w-full max-w-md border-border/80 xl:max-w-xl 2xl:max-w-2xl`}
      >
        <div className="absolute right-4 top-4 z-20">
          <div className="flex items-center gap-1.5 rounded-lg bg-muted p-1">
            {(["en", "si", "ta"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase transition ${
                  language === lang
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {lang === "en" ? "EN" : lang === "si" ? "සිං" : "தமிழ்"}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center">
          <h1 className={`${ffScreenTitle} text-3xl sm:text-4xl`}>Better Call</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("loginSubtitle")}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 text-left">
          <div className="rounded-xl border border-border bg-muted/30 px-3 py-3">
            <IconPersonHomeowner size={36} className="mb-2" />
            <p className="text-sm font-semibold text-foreground">{t("loginHomeownersTitle")}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {t("loginHomeownersDesc")}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 px-3 py-3">
            <IconPersonTradesperson size={36} className="mb-2" />
            <p className="text-sm font-semibold text-foreground">{t("loginTradespeopleTitle")}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {t("loginTradespeopleDesc")}
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          className="mt-8 flex flex-col gap-5"
        >
          <p className="text-sm font-medium text-foreground">{t("loginSignInTitle")}</p>

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
              {t("loginEmailLabel")}
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
              {t("loginPasswordLabel")}
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
                className="absolute right-2 top-1/2 min-h-[40px] min-w-[48px] -translate-y-1/2 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:bg-white/10"
              >
                {showPassword ? t("loginHide") : t("loginShow")}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className={ffBtnPrimary}>
            {loading ? t("loginSigningIn") : t("loginSignInBtn")}
          </button>

          <Link
            to="/signup"
            className="text-center text-sm font-medium text-foreground/80 underline underline-offset-4 hover:text-foreground"
          >
            {t("loginSignUpLink")}
          </Link>

          <div className="mt-2 border-t border-border pt-6">
            <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground/85">
              {t("loginQuickFillTitle")}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail("demo.owner@fixflow.lk");
                  setPassword("FixFlowDemo1");
                }}
                className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-2.5 text-center transition hover:border-primary hover:bg-white/10"
              >
                <IconPersonHomeowner size={40} />
                <span className="mt-1.5 text-[10px] font-semibold text-foreground">
                  {t("roleOwner")}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("nimal.perera.1@fixflow.lk");
                  setPassword("FixFlowDemo1");
                }}
                className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-2.5 text-center transition hover:border-yellow hover:bg-white/10"
              >
                <IconPersonTradesperson size={40} />
                <span className="mt-1.5 text-[10px] font-semibold text-foreground">
                  {t("roleSupplier")}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@fixflow.lk");
                  setPassword("FixFlowDemo1");
                }}
                className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-2.5 text-center transition hover:border-border hover:bg-white/10"
              >
                <IconClipboard size={40} />
                <span className="mt-1.5 text-[10px] font-semibold text-foreground">
                  {t("roleAdmin")}
                </span>
              </button>
            </div>
            <p className="mt-2.5 text-center text-[10px] text-muted-foreground/75">
              {t("loginPreFillDesc")}{" "}
              <span className="font-mono font-semibold text-foreground">
                FixFlowDemo1
              </span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
