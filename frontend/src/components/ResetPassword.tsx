import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import backgroundImage from "figma:asset/9bf36aafa693f4a63cbdf015b397abd2911f2e4f.png";
import { AUTH_CSS } from "./authStyles";
import { SabanciLogo } from "./SabanciLogo";

const API_URL = ((import.meta as any).env?.VITE_API_URL as string) || "/ehp/api";

/* ═══════════════════════════════════════════════════════════
   ResetPassword — reads the reset token from the URL query,
   collects a new password + confirm, posts to /auth/reset-password,
   and redirects to /login on success.
   Mirrors Login (panel on the LEFT).
   ═══════════════════════════════════════════════════════════ */
export function ResetPassword() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = (params.get("token") || "").trim();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState(false);
  const [confirmError, setConfirmError] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [shake, setShake] = useState(0);

  const currentLang = i18n.language?.toUpperCase() === "TR" ? "TR" : "EN";
  const switchLanguage = (val: "EN" | "TR") => i18n.changeLanguage(val.toLowerCase());

  const tokenMissing = !token || token.length !== 64;

  const fail = (msg: string, flags?: { pw?: boolean; confirm?: boolean }) => {
    setError(msg);
    setPwError(!!flags?.pw);
    setConfirmError(!!flags?.confirm);
    setShake((s) => s + 1);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && "preventDefault" in e) e.preventDefault();
    if (loading || tokenMissing) return;
    setError("");
    setPwError(false);
    setConfirmError(false);

    if (password.length < 8) return fail(t("auth.passwordMin", "Password must be at least 8 characters."), { pw: true });
    if (password !== confirm) return fail(t("signup.errors.passwordMismatch", "Passwords do not match."), { confirm: true });

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return fail(data.error || t("auth.reset.invalidToken", "This reset link is invalid or has expired."));
      }

      setDone(true);
      // Auto-redirect after a brief pause so the success screen is visible
      setTimeout(() => navigate("/login"), 2200);
    } catch {
      fail(t("login.errors.network", "Network error. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <style>{AUTH_CSS}</style>

      <div className="auth__bg" style={{ backgroundImage: `url(${backgroundImage})` }} />

      <div className="auth__split">
        {/* IVORY PANEL (LEFT) */}
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
              <h1 className="auth__title">
                {done ? t("auth.reset.successTitle", "Password updated") : t("auth.reset.title", "Set a new password")}
              </h1>
              <p className="auth__sub">
                {done
                  ? t("auth.reset.successBody")
                  : tokenMissing
                  ? t("auth.reset.missingToken")
                  : t("auth.reset.subtitle")}
              </p>
              <div className="auth__rule" />

              {done ? (
                <Link to="/login" className="auth__btn" style={{ display: "grid", placeItems: "center", textDecoration: "none" }}>
                  {t("auth.reset.goToLogin", "Go to sign in")}
                </Link>
              ) : tokenMissing ? (
                <Link to="/forgot-password" className="auth__btn" style={{ display: "grid", placeItems: "center", textDecoration: "none" }}>
                  {t("auth.reset.requestNewLink", "Request a new link")}
                </Link>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <label className={`field${pwError ? " field--error" : ""}`}>
                    <span className="field__label">{t("auth.reset.newPasswordLabel", "New password")}</span>
                    <div className="field__pw">
                      <input
                        type={showPw ? "text" : "password"}
                        value={password}
                        autoComplete="new-password"
                        placeholder={t("auth.reset.newPasswordPlaceholder", "Min. 8 characters")}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (pwError) setPwError(false);
                        }}
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
                    <p className="field__helper">{t("auth.passwordHelper", "Min. 8 characters")}</p>
                  </label>

                  <label className={`field${confirmError ? " field--error" : ""}`}>
                    <span className="field__label">{t("auth.reset.confirmPasswordLabel", "Confirm new password")}</span>
                    <div className="field__pw">
                      <input
                        type={showPw ? "text" : "password"}
                        value={confirm}
                        autoComplete="new-password"
                        placeholder={t("auth.reset.confirmPasswordPlaceholder", "Repeat the new password")}
                        onChange={(e) => {
                          setConfirm(e.target.value);
                          if (confirmError) setConfirmError(false);
                        }}
                      />
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
                        {t("auth.reset.submitting", "Updating…")}
                      </span>
                    ) : (
                      t("auth.reset.submit", "Update password")
                    )}
                  </button>

                  <p className="auth__alt">
                    <Link to="/login">{t("auth.forgot.backToLogin", "Back to sign in")}</Link>
                  </p>
                </form>
              )}
            </div>

            <footer className="auth__panel-foot">
              <p className="auth__protected">{t("auth.protected")}</p>
              <p className="auth__copyright">{t("auth.copyright")}</p>
            </footer>
          </div>
        </aside>

        {/* HERO (RIGHT) */}
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
