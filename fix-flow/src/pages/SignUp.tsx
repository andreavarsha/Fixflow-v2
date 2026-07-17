import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "../lib/LanguageContext";
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
  const { isAuthenticated } = useConvexAuth();
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Same fix as Login.tsx: wait for the reactive auth state instead of
  // navigating right after signIn() resolves, which can race the client's
  // token handshake and bounce back to /login.
  useEffect(() => {
    if (isAuthenticated) void navigate("/");
  }, [isAuthenticated, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError(
        language === "si"
          ? "මුරපදය අවම වශයෙන් අක්ෂර 8ක් විය යුතුය."
          : language === "ta"
            ? "கடவுச்சொல் குறைந்தது 8 எழுத்துக்களாக இருக்க வேண்டும்."
            : "Password must be at least 8 characters.",
      );
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
    } catch (err: unknown) {
      console.error("Signup error:", err);
      setError(toUserFacingError(err, "signup"));
      setLoading(false);
    }
  }

  return (
    <div className={`${ffPage} flex min-h-dvh flex-col justify-center pt-8`}>
      <div className={`${ffCard} relative mx-auto w-full max-w-md xl:max-w-xl 2xl:max-w-2xl`}>
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

        <h1 className={ffScreenTitle}>{t("signupTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("signupSubtitle")}
        </p>

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
            <label htmlFor="signup-email" className={ffLabel}>
              {t("loginEmailLabel")}
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
              {t("loginPasswordLabel")}
            </label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={t("signupPlaceholderPassword")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${ffInput} pr-14`}
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-2 top-1/2 min-h-[40px] min-w-[48px] -translate-y-1/2 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:bg-accent"
              >
                {showPassword ? t("loginHide") : t("loginShow")}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className={ffBtnPrimary}>
            {loading ? t("signupCreating") : t("signupCreateBtn")}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            {t("signupTradespeopleTip")}
          </p>

          <Link
            to="/login"
            className="text-center text-sm font-medium text-foreground/80 underline underline-offset-4 hover:text-foreground"
          >
            {t("signupAlreadyHaveAcc")}
          </Link>
        </form>
      </div>
    </div>
  );
}
