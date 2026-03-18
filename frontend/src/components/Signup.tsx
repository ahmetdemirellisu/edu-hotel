import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import backgroundImage from "figma:asset/9bf36aafa693f4a63cbdf015b397abd2911f2e4f.png";
import { Eye, EyeOff, BedDouble, MapPin, ShieldCheck } from "lucide-react";

import {
  Select as UISelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const API_URL =
  (import.meta.env.VITE_API_URL as string) || "/ehp/api";

/* ═══════════════════════════════════════════════════════════
   Pre-calculate particle data
   ═══════════════════════════════════════════════════════════ */
const PARTICLE_DATA = Array.from({ length: 22 }, (_, i) => ({
  left: ((i * 137.5 + 13) % 100).toFixed(1),
  size: (1.5 + (i * 0.37 % 2.5)).toFixed(1),
  duration: (14 + (i * 2.3 % 18)).toFixed(1),
  delay: (i * 0.6 % 12).toFixed(1),
}));

/* ═══════════════════════════════════════════════════════════
   Inject keyframes once
   ═══════════════════════════════════════════════════════════ */
void (document.getElementById("signup-animations") ?? (() => {
  const s = document.createElement("style");
  s.id = "signup-animations";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

    @keyframes cinematicZoom {
      0%   { transform: scale(1); }
      100% { transform: scale(1.15); }
    }
    @keyframes signupCardSlide {
      from { opacity: 0; transform: translateX(30px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes signupFadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes signupShimmer {
      0%, 100% { background-position: 0% 50%; }
      50%      { background-position: 100% 50%; }
    }
    @keyframes particleFloat {
      0%   { transform: translateY(100vh); opacity: 0; }
      8%   { opacity: 0.7; }
      92%  { opacity: 0.5; }
      100% { transform: translateY(-10vh); opacity: 0; }
    }
    @keyframes floatCard {
      0%,100% { transform: translateY(0px); }
      50%     { transform: translateY(-10px); }
    }
    @keyframes goldPulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(201,168,76,0.15); }
      50%     { box-shadow: 0 0 0 8px rgba(201,168,76,0); }
    }
    @keyframes shimmerText {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `;
  document.head.appendChild(s);
  return s;
})());

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

  const [kvkkChecked, setKvkkChecked] = useState(false);
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

    if (!kvkkChecked) {
      setError(t("signup.errors.kvkkRequired", "KVKK aydınlatma metnini onaylamanız gerekmektedir."));
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

  const stagger = (i: number): React.CSSProperties => ({
    animation: `signupFadeUp 0.55s ease-out ${0.1 + i * 0.05}s both`,
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        fontFamily: "'Inter', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* ══════════════════════════════════════════════════════
          LEFT PANEL — Cinematic Image Showcase
          ══════════════════════════════════════════════════════ */}
      <div
        style={{
          display: "none",
          width: "58%",
          flexShrink: 0,
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#020817",
        }}
        className="lg:!flex lg:!flex-col"
      >
        {/* Animated Background Image */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            transformOrigin: "center center",
            animation: "cinematicZoom 35s alternate infinite ease-in-out",
          }}
        />

        {/* Navy Gradient Overlay for text legibility & branding */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(160deg, rgba(2,8,23,0.9) 0%, rgba(10,22,40,0.65) 50%, rgba(13,31,60,0.9) 100%)",
          }}
        />

        {/* Grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage: `
              linear-gradient(rgba(201,168,76,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(201,168,76,0.05) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />

        {/* Floating particles */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          {PARTICLE_DATA.map((p, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                bottom: 0,
                left: `${p.left}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                borderRadius: "50%",
                background: i % 3 === 0 ? "rgba(201,168,76,0.7)" : "rgba(255,255,255,0.4)",
                animation: `particleFloat ${p.duration}s linear ${p.delay}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            padding: "40px 48px",
          }}
        >
          {/* Sabancı badge top-left */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                border: "1px solid rgba(201,168,76,0.6)",
                padding: "8px 14px",
                borderRadius: 8,
                animation: "goldPulse 4s ease-in-out infinite",
                background: "rgba(0,0,0,0.2)",
                backdropFilter: "blur(4px)",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "#c9a84c", letterSpacing: "0.5px" }}>Sabancı</div>
              <div style={{ fontSize: 10, color: "rgba(201,168,76,0.75)", letterSpacing: "0.3px" }}>Üniversitesi</div>
            </div>
          </div>

          {/* Center content */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: 0 }}>
            {/* JOIN COMMUNITY label */}
            <div
              style={{
                fontSize: 11,
                letterSpacing: "6px",
                color: "#c9a84c",
                fontWeight: 500,
                marginBottom: 16,
                textTransform: "uppercase",
              }}
            >
              JOIN OUR COMMUNITY
            </div>

            {/* EDU HOTEL title */}
            <h1
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "clamp(52px, 5vw, 80px)",
                fontWeight: 700,
                letterSpacing: "12px",
                margin: 0,
                background: "linear-gradient(90deg, #c9a84c 0%, #fff5d6 25%, #c9a84c 50%, #fff8e1 75%, #c9a84c 100%)",
                backgroundSize: "300% 100%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "shimmerText 5s ease-in-out infinite",
                filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))",
              }}
            >
              EDU HOTEL
            </h1>

            {/* Subtitle */}
            <p style={{ color: "rgba(255,255,255,0.7)", maxWidth: 400, marginTop: 24, marginBottom: 48, fontSize: 14, lineHeight: 1.6, fontWeight: 300 }}>
              Experience academic excellence and unparalleled comfort right in the heart of the Sabancı University campus.
            </p>

            {/* 3 floating feature cards */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              {[
                { icon: <BedDouble size={16} color="#c9a84c" strokeWidth={1.8} />, title: "Premium Stay", sub: "Modern & Comfortable", delay: "0s" },
                { icon: <MapPin size={16} color="#c9a84c" strokeWidth={1.8} />, title: "Campus Core", sub: "Steps from faculties", delay: "0.4s" },
                { icon: <ShieldCheck size={16} color="#c9a84c" strokeWidth={1.8} />, title: "Secure Access", sub: "University Protected", delay: "0.8s" },
              ].map((card, i) => (
                <div
                  key={i}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    background: "rgba(10,22,40,0.4)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    animation: `floatCard ${4 + i * 0.8}s ${card.delay} ease-in-out infinite`,
                    minWidth: 150,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "rgba(201,168,76,0.15)",
                      border: "1px solid rgba(201,168,76,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {card.icon}
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.95)", lineHeight: 1.2 }}>
                      {card.title}
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                      {card.sub}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom copyright */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                height: 1,
                background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)",
                marginBottom: 16,
              }}
            />
            <p style={{ fontSize: 10, color: "rgba(201,168,76,0.6)", letterSpacing: "0.8px", margin: 0 }}>
              © 2026 Sabancı University · All Rights Reserved
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          RIGHT PANEL — Signup Form
          ══════════════════════════════════════════════════════ */}
      <div
        style={{
          flex: 1,
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px",
          position: "relative",
          animation: "signupCardSlide 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both",
          minHeight: "100vh",
        }}
      >
        {/* Top-right: language selector + brand */}
        <div
          style={{
            position: "absolute",
            top: 24,
            right: 28,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "4px",
              color: "#94a3b8",
              display: "none",
            }}
            className="sm:!inline"
          >
            EDU HOTEL
          </span>
          <div
            style={{
              display: "flex",
              gap: 2,
              background: "#f1f5f9",
              borderRadius: 8,
              padding: 3,
            }}
          >
            {["EN", "TR"].map((lang) => (
              <button
                key={lang}
                onClick={() => switchLanguage(lang)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  transition: "all 0.2s ease",
                  background: currentLang === lang ? "#003366" : "transparent",
                  color: currentLang === lang ? "#ffffff" : "#64748b",
                }}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Form container */}
        <div style={{ width: "100%", maxWidth: 400 }}>
          {/* Logo mark */}
          <div style={stagger(0)}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "linear-gradient(135deg, #003366 0%, #0a1f4e 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
                boxShadow: "0 8px 24px rgba(0,51,102,0.25)",
              }}
            >
              <span
                style={{
                  color: "#c9a84c",
                  fontSize: 22,
                  fontWeight: 700,
                  fontFamily: "'Playfair Display', Georgia, serif",
                  lineHeight: 1,
                }}
              >
                E
              </span>
            </div>
          </div>

          {/* Heading */}
          <div style={stagger(1)}>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#111827",
                margin: "0 0 6px",
                letterSpacing: "-0.5px",
              }}
            >
              Create an account
            </h1>
            <p style={{ fontSize: 14, color: "#9ca3af", margin: "0 0 20px" }}>
              Sign up to get started with EDU Hotel
            </p>
          </div>

          {/* Separator */}
          <div
            style={{
              height: 2,
              background: "linear-gradient(90deg, #c9a84c, #0066cc, #c9a84c)",
              backgroundSize: "200% 100%",
              animation: "signupShimmer 4s ease-in-out infinite",
              borderRadius: 2,
              marginBottom: 24,
              ...stagger(2),
            }}
          />

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            
            {/* Full Name */}
            <div style={stagger(3)}>
              <Label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  marginBottom: 6,
                }}
              >
                {t("signup.fullNameLabel", "Full Name")}
              </Label>
              <Input
                type="text"
                placeholder={t("signup.fullNamePlaceholder", "Enter your full name")}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-11 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm placeholder:text-gray-400 transition-all duration-200 focus:bg-white focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
              {/* Signup method */}
              <div style={stagger(4)}>
                <Label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    marginBottom: 6,
                  }}
                >
                  {t("signup.signupWith", "Method")}
                </Label>
                <UISelect
                  value={signupMethod}
                  onValueChange={(v) => setSignupMethod(v as "email" | "phone")}
                >
                  <SelectTrigger className="h-11 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">{t("signup.email", "Email")}</SelectItem>
                    <SelectItem value="phone">{t("signup.phone", "Phone")}</SelectItem>
                  </SelectContent>
                </UISelect>
              </div>

              {/* Identifier */}
              <div style={stagger(5)}>
                <Label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    marginBottom: 6,
                  }}
                >
                  {signupMethod === "email" ? t("signup.emailAddress", "Email Address") : t("signup.phoneNumber", "Phone Number")}
                </Label>
                <Input
                  type={signupMethod === "email" ? "email" : "tel"}
                  placeholder={signupMethod === "email" ? t("signup.enterEmail", "Enter your email") : t("signup.enterPhone", "Enter your phone")}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  required
                  className="h-11 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm placeholder:text-gray-400 transition-all duration-200 focus:bg-white focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {/* Password */}
              <div style={stagger(6)}>
                <Label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    marginBottom: 6,
                  }}
                >
                  {t("signup.passwordLabel", "Password")}
                </Label>
                <div style={{ position: "relative" }}>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-9 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm placeholder:text-gray-400 transition-all duration-200 focus:bg-white focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 0,
                      height: 44,
                      width: 36,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#9ca3af",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#003366")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div style={stagger(7)}>
                <Label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    marginBottom: 6,
                    whiteSpace: "nowrap"
                  }}
                >
                  {t("signup.confirmPasswordLabel", "Confirm Pw")}
                </Label>
                <div style={{ position: "relative" }}>
                  <Input
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-11 pr-9 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm placeholder:text-gray-400 transition-all duration-200 focus:bg-white focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 0,
                      height: 44,
                      width: 36,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#9ca3af",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#003366")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Error / Success Messages */}
            {error && (
              <div
                style={{
                  borderRadius: 10,
                  border: "1px solid #fecaca",
                  background: "#fef2f2",
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#b91c1c",
                  ...stagger(8),
                }}
              >
                {error}
              </div>
            )}
            {success && (
              <div
                style={{
                  borderRadius: 10,
                  border: "1px solid #bbf7d0",
                  background: "#f0fdf4",
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#15803d",
                  ...stagger(8),
                }}
              >
                {success}
              </div>
            )}

            {/* KVKK Consent */}
            <div style={stagger(9)} className="pt-1">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50/50 border border-blue-100/60 transition-colors hover:bg-blue-50">
                <Checkbox
                  id="kvkk"
                  checked={kvkkChecked}
                  onCheckedChange={(v) => setKvkkChecked(v as boolean)}
                  className="mt-0.5 border-blue-300 data-[state=checked]:bg-[#003366] data-[state=checked]:border-[#003366]"
                />
                <Label htmlFor="kvkk" className="text-[10px] text-gray-500 leading-relaxed cursor-pointer font-medium">
                  {t("signup.kvkk", "I consent to the processing of my personal data for accommodation services according to KVKK Law No. 6698. My data will not be shared with 3rd parties.")}
                  <span className="text-red-400 ml-0.5">*</span>
                </Label>
              </div>
            </div>

            {/* Submit button */}
            <div style={stagger(10)} className="pt-1">
              <Button
                type="submit"
                disabled={loading || !kvkkChecked}
                className="w-full h-11 rounded-xl text-white text-sm font-semibold relative overflow-hidden group transition-all duration-300 hover:shadow-lg active:scale-[0.99] disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #003366 0%, #004080 50%, #003366 100%)",
                  backgroundSize: "200% 200%",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
                    transform: "translateX(-100%)",
                    transition: "transform 0.7s ease",
                  }}
                  className="group-hover:!translate-x-full"
                />
                <span style={{ position: "relative" }}>
                  {loading ? t("signup.creatingAccount", "Creating Account...") : t("signup.createAccount", "Create Account")}
                </span>
              </Button>
            </div>

            {/* Link to login */}
            <div style={{ textAlign: "center", marginTop: 4, ...stagger(11) }}>
              <span style={{ fontSize: 13, color: "#9ca3af" }}>
                Already have an account?{" "}
              </span>
              <Link
                to="/"
                style={{
                  fontSize: 13,
                  color: "#003366",
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#0066cc")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#003366")}
              >
                {t("signup.loginLink", "Log in")}
              </Link>
            </div>
          </form>
        </div>

        {/* Bottom security note */}
        <p
          style={{
            position: "absolute",
            bottom: 20,
            fontSize: 10,
            color: "#d1d5db",
            letterSpacing: "0.4px",
            textAlign: "center",
            margin: 0,
            ...stagger(12),
          }}
        >
          Protected by Sabancı University IT Infrastructure
        </p>
      </div>
    </div>
  );
}