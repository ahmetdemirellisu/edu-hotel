import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import backgroundImage from "figma:asset/9bf36aafa693f4a63cbdf015b397abd2911f2e4f.png";
import { AUTH_CSS } from "./authStyles";
import { SabanciLogo } from "./SabanciLogo";

const API_URL = ((import.meta as any).env?.VITE_API_URL as string) || "/ehp/api";

// Basic RFC-ish email format check.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ═══════════════════════════════════════════════════════════
   Login — editorial split: ivory panel on the LEFT (~44%),
   campus hero with "EDU HOTEL" wordmark on the RIGHT.
   Backend, localStorage, i18n, and routing are unchanged.
   ═══════════════════════════════════════════════════════════ */
export function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);

  const currentLang = i18n.language?.toUpperCase() === "TR" ? "TR" : "EN";
  const switchLanguage = (val: "EN" | "TR") => i18n.changeLanguage(val.toLowerCase());

  const fail = (msg: string, emailBad = false) => {
    setError(msg);
    setEmailError(emailBad);
    setShake((s) => s + 1);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && "preventDefault" in e) e.preventDefault();
    if (loading) return;
    setError("");
    setEmailError(false);

    const trimmed = email.trim();
    if (!trimmed || !password) {
      return fail(t("auth.fillCredentials", "Please enter your email and password."));
    }
    if (!EMAIL_RE.test(trimmed)) {
      return fail(t("auth.invalidEmail", "Please enter a valid email address."), true);
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        fail(data.error || t("auth.invalidCredentials", "Invalid email or password."));
        return;
      }

      localStorage.setItem("authToken", data.token);
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("userId", String(data.user.id));
        localStorage.setItem("userEmail", data.user.email ?? "");
        localStorage.setItem("userName", data.user.name ?? "");
      }
      navigate("/main");
    } catch {
      fail(t("login.errors.network", "Network error. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <style>{AUTH_CSS}</style>

      {/* Full-screen campus photo */}
      <div className="auth__bg" style={{ backgroundImage: `url(${backgroundImage})` }} />

      <div className="auth__split">
        {/* ===== IVORY PANEL (LEFT) ===== */}
        <aside className="auth__panel">
          <div className="auth__panel-inner" key={shake} data-shake={shake > 0}>
            <header className="auth__panel-top">
              <Link to="/" className="auth__monogram" aria-label="EDU Hotel">E</Link>
              <div className="auth__lang">
                {(["EN", "TR"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    className={currentLang === l ? "is-active" : ""}
                    onClick={() => switchLanguage(l)}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </header>

            <div className="auth__form-area">
              <p className="auth__eyebrow">{t("auth.eyebrow")}</p>
              <h1 className="auth__title">{t("login.welcomeTitle", "Welcome back")}</h1>
              <p className="auth__sub">{t("auth.loginSubtitle")}</p>
              <div className="auth__rule" />

              <form onSubmit={handleSubmit} noValidate>
                <label className={`field${emailError ? " field--error" : ""}`}>
                  <span className="field__label">{t("login.emailAddress", "Email address")}</span>
                  <input
                    type="email"
                    value={email}
                    autoComplete="email"
                    placeholder={t("auth.emailPlaceholder", "name@sabanciuniv.edu")}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(false);
                    }}
                  />
                </label>

                <label className="field">
                  <span className="field__label">
                    {t("login.password", "Password")}
                    <Link to="/forgot-password" className="field__link">
                      {t("auth.forgotPassword", "Forgot password?")}
                    </Link>
                  </span>
                  <div className="field__pw">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      autoComplete="current-password"
                      placeholder={t("auth.passwordPlaceholder", "Enter your password")}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="field__eye"
                      aria-label={showPw ? t("auth.hidePassword") : t("auth.showPassword")}
                      onClick={() => setShowPw((v) => !v)}
                    >
                      <EyeIcon off={showPw} />
                    </button>
                  </div>
                </label>

                {error && (
                  <div className="auth__error" role="alert">
                    <span className="auth__error-dot" />
                    {error}
                  </div>
                )}

                <button type="submit" className="auth__btn" disabled={loading}>
                  {loading ? (
                    <span className="auth__btn-loading">
                      <span className="auth__spinner" />
                      {t("auth.signingIn", "Signing in…")}
                    </span>
                  ) : (
                    t("auth.signIn", "Sign in")
                  )}
                </button>

                <p className="auth__alt">
                  {t("login.firstTimePrompt", "First time user?")}{" "}
                  <Link to="/signup">{t("login.signupLink", "Create an account")}</Link>
                </p>
              </form>
            </div>

            <footer className="auth__panel-foot">
              <p className="auth__protected">{t("auth.protected")}</p>
              <p className="auth__copyright">{t("auth.copyright")}</p>
            </footer>
          </div>
        </aside>

        {/* ===== HERO (RIGHT) — image visible + EDU HOTEL wordmark ===== */}
        <section className="auth__hero" aria-hidden="true">
          <div className="auth__hero-tint" />
          <div className="auth__hero-fade" />

          <SabanciLogo size="md" className="auth__hero-badge auth__hero-badge--logo" />

          <div className="auth__hero-center">
            <p className="auth__hero-eyebrow">{t("auth.welcomeBackTo", "Welcome back to")}</p>
            <h2 className="auth__hero-wordmark">EDU&nbsp;HOTEL</h2>
            <div className="auth__hero-rule" />
            <p className="auth__hero-tagline">{t("auth.tagline")}</p>
          </div>
        </section>
      </div>
    </div>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M2.5 12C4.5 7.5 8 5 12 5s7.5 2.5 9.5 7c-2 4.5-5.5 7-9.5 7s-7.5-2.5-9.5-7Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      {off && (
        <line
          x1="4"
          y1="20"
          x2="20"
          y2="4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
