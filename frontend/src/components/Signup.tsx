import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import backgroundImage from "figma:asset/9bf36aafa693f4a63cbdf015b397abd2911f2e4f.png";
import { Footer } from "./layout/Footer";
import { Eye, EyeOff, UserPlus } from "lucide-react";

import {
  Select as UISelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const API_URL =
  (import.meta.env.VITE_API_URL as string) || "api";

/* ═══════════════════════════════════════════════════════════
   Inline keyframes (inject once)
   ═══════════════════════════════════════════════════════════ */
const _style = document.getElementById("signup-animations") ?? (() => {
  const s = document.createElement("style");
  s.id = "signup-animations";
  s.textContent = `
    @keyframes signupCardIn {
      from { opacity: 0; transform: translateY(24px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes signupFadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes signupShimmer {
      0%, 100% { background-position: 0% 50%; }
      50%      { background-position: 100% 50%; }
    }
    @keyframes signupIconPulse {
      0%, 100% { box-shadow: 0 4px 16px rgba(0,51,102,0.25); }
      50%      { box-shadow: 0 4px 28px rgba(0,102,204,0.35); }
    }
    @keyframes signupFloat {
      0%   { transform: translateY(100vh) scale(0); opacity: 0; }
      10%  { opacity: 0.6; }
      90%  { opacity: 0.6; }
      100% { transform: translateY(-10vh) scale(1); opacity: 0; }
    }
  `;
  document.head.appendChild(s);
  return s;
})();

/* ═══════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════ */
export function Signup() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const currentLang = i18n.language?.toUpperCase() === "TR" ? "TR" : "EN";
  const switchLanguage = (val: string) => i18n.changeLanguage(val.toLowerCase());

  const [signupMethod, setSignupMethod] = useState<"email" | "phone">("email");
  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName || !contact || !password || !confirmPassword) {
      setError(t("signup.errors.fillAll"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("signup.errors.passwordMismatch"));
      return;
    }

    setLoading(true);

    try {
      localStorage.removeItem("userId");
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");

      const registerRes = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: contact, password, name: fullName }),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        setError(registerData.error || t("signup.errors.failed"));
        setLoading(false);
        return;
      }

      // Auto-login
      try {
        const loginRes = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: contact, password }),
        });

        const loginData = await loginRes.json();

        if (loginRes.ok) {
          localStorage.setItem("authToken", loginData.token);
          if (loginData.user) {
            localStorage.setItem("user", JSON.stringify(loginData.user));
            localStorage.setItem("userId", loginData.user.id.toString());
            localStorage.setItem("userEmail", loginData.user.email ?? "");
            localStorage.setItem("userName", loginData.user.name ?? "");
          }
          setLoading(false);
          navigate("/main");
          return;
        } else {
          setSuccess(t("signup.success.accountCreated"));
          setError(loginData.error || null);
        }
      } catch (loginErr) {
        console.error("Auto-login after signup failed:", loginErr);
        setSuccess(t("signup.success.accountCreated"));
        setError(t("signup.errors.network"));
      }

      setLoading(false);
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError(t("signup.errors.network"));
      setLoading(false);
    }
  };

  /* ── Stagger helper ─────────────────────── */
  const stagger = (i: number): React.CSSProperties => ({
    animation: `signupFadeUp 0.55s ease-out ${0.3 + i * 0.07}s both`,
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#003366]">
      {/* ═══ HEADER ═══════════════════════════════════════ */}
      <header
        className="sticky top-0 z-50 border-b border-white/10"
        style={{
          background: "rgba(0,51,102,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-3.5">
          <div className="flex justify-between items-center">
            {/* Left — logo group */}
            <div className="flex items-center gap-4">
              <div className="border border-[#c9a84c] px-3 py-1.5 rounded">
                <div className="text-[11px] font-semibold text-[#c9a84c] leading-tight">
                  Sabancı
                </div>
                <div className="text-[10px] text-[#c9a84c]/80 leading-tight">
                  Üniversitesi
                </div>
              </div>
              <div className="w-px h-8 bg-white/15 hidden sm:block" />
              <div className="hidden sm:block">
                <h1
                  className="text-white text-lg font-semibold tracking-[6px]"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  EDU HOTEL
                </h1>
              </div>
            </div>

            {/* Center title (mobile) */}
            <h1 className="sm:hidden text-white text-base font-bold tracking-[4px]">
              EDU HOTEL
            </h1>

            {/* Right — nav */}
            <div className="flex items-center gap-5">
              <a
                href="#"
                className="text-xs text-white/60 hover:text-white transition-colors hidden md:inline tracking-wide"
              >
                {t("header.mySU")}
              </a>
              <UISelect value={currentLang} onValueChange={switchLanguage}>
                <SelectTrigger className="w-[58px] h-8 bg-white/5 border-white/20 text-white text-xs font-semibold hover:bg-white/10 focus:ring-0 rounded-lg">
                  <SelectValue placeholder={currentLang} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EN">EN</SelectItem>
                  <SelectItem value="TR">TR</SelectItem>
                </SelectContent>
              </UISelect>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ MAIN ═════════════════════════════════════════ */}
      <main className="relative flex-1">
        {/* Background photo */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 40%, rgba(0,51,102,0.15) 0%, rgba(0,51,102,0.45) 70%, rgba(0,20,50,0.65) 100%)",
          }}
        />
        {/* Noise texture */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
          }}
        />
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/20"
              style={{
                width: 1.5 + Math.random() * 2,
                height: 1.5 + Math.random() * 2,
                left: `${Math.random() * 100}%`,
                animation: `signupFloat ${14 + Math.random() * 18}s linear ${Math.random() * 12}s infinite`,
              }}
            />
          ))}
        </div>

        {/* ── Card ─────────────────────────────── */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex justify-center">
            <div
              className="w-full max-w-[420px]"
              style={{ animation: "signupCardIn 0.8s cubic-bezier(0.16,1,0.3,1) 0.15s both" }}
            >
              <Card
                className="border-0 rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.92)",
                  backdropFilter: "blur(40px)",
                  WebkitBackdropFilter: "blur(40px)",
                  boxShadow:
                    "0 32px 80px rgba(0,0,0,0.22), 0 8px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.5)",
                }}
              >
                {/* Shimmer strip */}
                <div
                  style={{
                    height: 3,
                    background: "linear-gradient(90deg, #c9a84c, #0066cc, #c9a84c)",
                    backgroundSize: "200% 100%",
                    animation: "signupShimmer 4s ease-in-out infinite",
                  }}
                />

                <CardContent className="pt-7 pb-7 px-7 sm:px-8">
                  {/* Icon + title */}
                  <div className="text-center mb-6" style={stagger(0)}>
                    <div
                      className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg, #003366 0%, #004080 100%)",
                        animation: "signupIconPulse 3s ease-in-out infinite",
                      }}
                    >
                      <UserPlus className="w-5 h-5 text-[#c9a84c]" strokeWidth={1.8} />
                    </div>
                    <h2 className="text-xl font-semibold text-[#003366] tracking-tight">
                      {t("signup.createAccount")}
                    </h2>
                    <p className="text-[13px] text-gray-400 mt-1">
                      {t("signup.signupWith")}
                    </p>
                  </div>

                  <form className="space-y-4" onSubmit={handleSubmit}>
                    {/* Full name */}
                    <div className="space-y-1.5" style={stagger(1)}>
                      <Label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        {t("signup.fullNameLabel")}
                      </Label>
                      <Input
                        type="text"
                        placeholder={t("signup.fullNamePlaceholder")}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="h-11 rounded-xl bg-gray-50/80 border border-gray-200/80 text-gray-800 text-sm placeholder:text-gray-400
                                   transition-all duration-200 focus:bg-white focus:border-[#0066cc]/40 focus:ring-2 focus:ring-[#0066cc]/20"
                      />
                    </div>

                    {/* Signup method */}
                    <div className="space-y-1.5" style={stagger(2)}>
                      <Label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        {t("signup.signupWith")}
                      </Label>
                      <UISelect
                        value={signupMethod}
                        onValueChange={(v) => setSignupMethod(v as "email" | "phone")}
                      >
                        <SelectTrigger className="h-11 rounded-xl bg-gray-50/80 border border-gray-200/80 text-gray-800 text-sm focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc]/40 transition-all">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">{t("signup.email")}</SelectItem>
                          <SelectItem value="phone">{t("signup.phone")}</SelectItem>
                        </SelectContent>
                      </UISelect>
                    </div>

                    {/* Contact (email / phone) */}
                    <div className="space-y-1.5" style={stagger(3)}>
                      <Label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        {signupMethod === "email"
                          ? t("signup.emailAddress")
                          : t("signup.phoneNumber")}
                      </Label>
                      <Input
                        type={signupMethod === "email" ? "email" : "tel"}
                        placeholder={
                          signupMethod === "email"
                            ? t("signup.enterEmail")
                            : t("signup.enterPhone")
                        }
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        required
                        className="h-11 rounded-xl bg-gray-50/80 border border-gray-200/80 text-gray-800 text-sm placeholder:text-gray-400
                                   transition-all duration-200 focus:bg-white focus:border-[#0066cc]/40 focus:ring-2 focus:ring-[#0066cc]/20"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5" style={stagger(4)}>
                      <Label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        {t("signup.passwordLabel")}
                      </Label>
                      <div className="relative flex items-center">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder={t("signup.passwordPlaceholder")}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-11 pr-11 rounded-xl bg-gray-50/80 border border-gray-200/80 text-gray-800 text-sm placeholder:text-gray-400
                                     transition-all duration-200 focus:bg-white focus:border-[#0066cc]/40 focus:ring-2 focus:ring-[#0066cc]/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-0 h-11 w-11 flex items-center justify-center text-gray-400 hover:text-[#003366] transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm password */}
                    <div className="space-y-1.5" style={stagger(5)}>
                      <Label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        {t("signup.confirmPasswordLabel")}
                      </Label>
                      <div className="relative flex items-center">
                        <Input
                          type={showConfirm ? "text" : "password"}
                          placeholder={t("signup.confirmPasswordPlaceholder")}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="h-11 pr-11 rounded-xl bg-gray-50/80 border border-gray-200/80 text-gray-800 text-sm placeholder:text-gray-400
                                     transition-all duration-200 focus:bg-white focus:border-[#0066cc]/40 focus:ring-2 focus:ring-[#0066cc]/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-0 h-11 w-11 flex items-center justify-center text-gray-400 hover:text-[#003366] transition-colors"
                        >
                          {showConfirm ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Messages */}
                    {error && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                      </div>
                    )}
                    {success && (
                      <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        {success}
                      </div>
                    )}

                    {/* Submit */}
                    <div style={stagger(6)}>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 rounded-xl text-white text-sm font-semibold relative overflow-hidden group
                                   transition-all duration-300 hover:shadow-lg active:scale-[0.99] disabled:opacity-60"
                        style={{
                          background: "linear-gradient(135deg, #003366 0%, #004080 50%, #003366 100%)",
                          backgroundSize: "200% 200%",
                        }}
                      >
                        {/* Shimmer sweep on hover */}
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        <span className="relative">
                          {loading ? t("signup.creatingAccount") : t("signup.createAccount")}
                        </span>
                      </Button>
                    </div>

                    {/* Link to login */}
                    <div className="text-center pt-1" style={stagger(7)}>
                      <Link
                        to="/"
                        className="text-[13px] text-[#003366] hover:text-[#0066cc] transition-colors font-medium"
                      >
                        {t("signup.alreadyHaveAccount")}
                      </Link>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Security note */}
              <p
                className="text-center text-[10px] text-white/30 mt-5 tracking-wide"
                style={stagger(8)}
              >
                Protected by Sabancı University IT Infrastructure
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
