import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import backgroundImage from "figma:asset/9bf36aafa693f4a63cbdf015b397abd2911f2e4f.png";
import { AUTH_CSS } from "./authStyles";
import { SabanciLogo } from "./SabanciLogo";

const API_URL = ((import.meta as any).env?.VITE_API_URL as string) || "/ehp/api";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ═══════════════════════════════════════════════════════════
   ForgotPassword — collects the user's email, posts to
   /auth/forgot-password, and shows a generic success state
   regardless of whether the email exists (no enumeration).
   ═══════════════════════════════════════════════════════════ */
export function ForgotPassword() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
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
    if (!trimmed) return fail(t("auth.fillEmail", "Please enter your email address."), true);
    if (!EMAIL_RE.test(trimmed)) return fail(t("auth.invalidEmail", "Please enter a valid email address."), true);

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 404 || data?.code === "EMAIL_NOT_REGISTERED") {
          return fail(
            t("auth.forgot.notRegistered", "This email is not registered."),
            true
          );
        }
        return fail(data.error || t("login.errors.network", "Network error. Please try again."));
      }

      setSent(true);
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
                {sent ? t("auth.forgot.successTitle", "Check your inbox") : t("auth.forgot.title", "Forgot your password?")}
              </h1>
              <p className="auth__sub">
                {sent ? t("auth.forgot.successBody") : t("auth.forgot.subtitle")}
              </p>
              <div className="auth__rule" />

              {!sent ? (
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
                        {t("auth.forgot.sending", "Sending…")}
                      </span>
                    ) : (
                      t("auth.forgot.submit", "Send reset link")
                    )}
                  </button>

                  <p className="auth__alt">
                    <Link to="/login">{t("auth.forgot.backToLogin", "Back to sign in")}</Link>
                  </p>
                </form>
              ) : (
                <div>
                  <Link to="/login" className="auth__btn" style={{ display: "grid", placeItems: "center", textDecoration: "none" }}>
                    {t("auth.forgot.backToLogin", "Back to sign in")}
                  </Link>
                </div>
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
