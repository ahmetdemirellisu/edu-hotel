import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import backgroundImage from "figma:asset/9bf36aafa693f4a63cbdf015b397abd2911f2e4f.png";
import { AUTH_CSS, REGISTER_CSS } from "./authStyles";
import { SabanciLogo } from "./SabanciLogo";

const API_URL = ((import.meta as any).env?.VITE_API_URL as string) || "/ehp/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SU_DOMAIN = "@sabanciuniv.edu";

/* ═══════════════════════════════════════════════════════════
   Signup — mirror of Login. Ivory panel on the RIGHT (~44%),
   campus hero on the LEFT with the "EDU HOTEL" wordmark.
   The panel is `overflow-y: auto`, so a tall register form
   scrolls inside the panel instead of being cut off.
   Backend, localStorage cleanup, i18n, and routing unchanged.
   ═══════════════════════════════════════════════════════════ */
export function Signup() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [consent, setConsent] = useState(false);
  const [kvkkOpen, setKvkkOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);

  // Per-field error flags so the underline turns red on the offending input(s)
  const [emailError, setEmailError] = useState(false);
  const [pwError, setPwError] = useState(false);
  const [confirmError, setConfirmError] = useState(false);
  const [consentError, setConsentError] = useState(false);

  const currentLang = i18n.language?.toUpperCase() === "TR" ? "TR" : "EN";
  const switchLanguage = (val: "EN" | "TR") => i18n.changeLanguage(val.toLowerCase());

  const fail = (msg: string, flags?: { email?: boolean; pw?: boolean; confirm?: boolean; consent?: boolean }) => {
    setError(msg);
    setEmailError(!!flags?.email);
    setPwError(!!flags?.pw);
    setConfirmError(!!flags?.confirm);
    setConsentError(!!flags?.consent);
    setShake((s) => s + 1);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && "preventDefault" in e) e.preventDefault();
    if (loading) return;
    setError("");
    setEmailError(false);
    setPwError(false);
    setConfirmError(false);
    setConsentError(false);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) return fail(t("auth.fillFullName", "Please enter your full name."));
    if (!trimmedEmail) return fail(t("auth.fillEmail", "Please enter your email address."), { email: true });
    if (!EMAIL_RE.test(trimmedEmail)) {
      return fail(t("auth.invalidEmail", "Please enter a valid email address."), { email: true });
    }
    if (!trimmedEmail.toLowerCase().endsWith(SU_DOMAIN)) {
      return fail(t("auth.notSuEmail", "Please use your @sabanciuniv.edu email address."), { email: true });
    }
    if (password.length < 8) {
      return fail(t("auth.passwordMin", "Password must be at least 8 characters."), { pw: true });
    }
    if (password !== confirm) {
      return fail(t("signup.errors.passwordMismatch", "Passwords do not match."), { confirm: true });
    }
    if (!consent) {
      return fail(t("auth.kvkkRequired", "Please accept the KVKK consent to create your account."), { consent: true });
    }

    try {
      setLoading(true);

      localStorage.removeItem("userId");
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");

      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password, name: trimmedName }),
      });
      const data = await res.json();

      if (!res.ok) {
        fail(data.error || t("signup.errors.failed", "Registration failed."));
        return;
      }

      setPassword("");
      setConfirm("");
      navigate("/login");
    } catch {
      fail(t("signup.errors.network", "Network error. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <style>{AUTH_CSS + REGISTER_CSS}</style>

      {/* Full-screen campus photo */}
      <div className="auth__bg" style={{ backgroundImage: `url(${backgroundImage})` }} />

      <div className="auth__split auth__split--reverse">
        {/* ===== HERO (LEFT) — image visible + EDU HOTEL wordmark ===== */}
        <section className="auth__hero" aria-hidden="true">
          <div className="auth__hero-tint" />
          <div className="auth__hero-fade" />

          <SabanciLogo size="md" className="auth__hero-badge auth__hero-badge--logo" />

          <div className="auth__hero-center">
            <p className="auth__hero-eyebrow">{t("auth.joinCommunity", "Join our community")}</p>
            <h2 className="auth__hero-wordmark">EDU&nbsp;HOTEL</h2>
            <div className="auth__hero-rule" />
            <p className="auth__hero-tagline">{t("auth.tagline")}</p>
          </div>
        </section>

        {/* ===== IVORY PANEL (RIGHT) ===== */}
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
              <h1 className="auth__title">{t("auth.registerTitle", "Create your EDU Hotel account")}</h1>
              <p className="auth__sub">{t("auth.registerSubtitle")}</p>
              <div className="auth__rule" />

              <form onSubmit={handleSubmit} noValidate>
                <label className="field field--tight">
                  <span className="field__label">{t("signup.fullNameLabel", "Full name")}</span>
                  <input
                    type="text"
                    value={fullName}
                    autoComplete="name"
                    placeholder={t("auth.namePlaceholder", "Enter your full name")}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </label>

                <label className={`field field--tight${emailError ? " field--error" : ""}`}>
                  <span className="field__label">{t("signup.emailAddress", "Email address")}</span>
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

                <label className={`field field--tight${pwError ? " field--error" : ""}`}>
                  <span className="field__label">{t("signup.passwordLabel", "Password")}</span>
                  <div className="field__pw">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      autoComplete="new-password"
                      placeholder={t("auth.passwordMinPlaceholder", "Min. 8 characters")}
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

                <label className={`field field--tight${confirmError ? " field--error" : ""}`}>
                  <span className="field__label">{t("signup.confirmPasswordLabel", "Confirm password")}</span>
                  <div className="field__pw">
                    <input
                      type={showPw ? "text" : "password"}
                      value={confirm}
                      autoComplete="new-password"
                      placeholder={t("auth.passwordConfirmPlaceholder", "Repeat password")}
                      onChange={(e) => {
                        setConfirm(e.target.value);
                        if (confirmError) setConfirmError(false);
                      }}
                    />
                  </div>
                </label>

                {/* KVKK consent — cleaner, smaller, with subtle gold border */}
                <div className={`reg__consent${consentError ? " reg__consent--error" : ""}`}>
                  <button
                    type="button"
                    className={`reg__check${consent ? " is-checked" : ""}`}
                    role="checkbox"
                    aria-checked={consent}
                    onClick={() => {
                      setConsent((v) => !v);
                      if (consentError) setConsentError(false);
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6.5 L4.8 9.2 L10 3.4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <div className="reg__consent-text">
                    {t("auth.kvkkShort")}
                    <button
                      type="button"
                      className="reg__consent-more"
                      onClick={() => setKvkkOpen((v) => !v)}
                    >
                      {kvkkOpen ? t("auth.kvkkHideDetails", "Hide details") : t("auth.kvkkReadDetails", "Read details")}
                    </button>
                    {kvkkOpen && (
                      <p className="reg__consent-details">{t("auth.kvkkDetails")}</p>
                    )}
                  </div>
                </div>

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
                      {t("signup.creatingAccount", "Creating account…")}
                    </span>
                  ) : (
                    t("signup.createAccount", "Create account")
                  )}
                </button>

                <p className="auth__alt">
                  {t("signup.haveAccountPrompt", "Already have an account?")}{" "}
                  <Link to="/login">{t("signup.loginLink", "Sign in")}</Link>
                </p>
              </form>
            </div>

            <footer className="auth__panel-foot">
              <p className="auth__protected">{t("auth.protected")}</p>
              <p className="auth__copyright">{t("auth.copyright")}</p>
            </footer>
          </div>
        </aside>
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
