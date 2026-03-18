import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import backgroundImage from "figma:asset/9bf36aafa693f4a63cbdf015b397abd2911f2e4f.png";
import { Eye, EyeOff, AtSign, Smartphone, Lock, CalendarCheck, Zap, Headphones } from "lucide-react";

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
void (document.getElementById("login-animations") ?? (() => {
  const s = document.createElement("style");
  s.id = "login-animations";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

    @keyframes cinematicZoom {
      0%   { transform: scale(1); }
      100% { transform: scale(1.15); }
    }
    @keyframes loginCardSlideLeft {
      from { opacity: 0; transform: translateX(-30px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes loginFadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes loginShimmer {
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
export function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentLang = i18n.language?.toUpperCase() === "TR" ? "TR" : "EN";
  const switchLanguage = (val: string) => i18n.changeLanguage(val.toLowerCase());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("login.errors.loginFailed"));
        setLoading(false);
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
      setError(t("login.errors.network"));
    } finally {
      setLoading(false);
    }
  };

  const stagger = (i: number): React.CSSProperties => ({
    animation: `loginFadeUp 0.55s ease-out ${0.1 + i * 0.05}s both`,
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
          LEFT PANEL — Login Form (Mirrored from Signup)
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
          animation: "loginCardSlideLeft 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both",
          minHeight: "100vh",
        }}
      >
        {/* Top-left: language selector (moved to left to mirror design) */}
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 28,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
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
              Welcome back
            </h1>
            <p style={{ fontSize: 14, color: "#9ca3af", margin: "0 0 20px" }}>
              Sign in to your EDU Hotel account
            </p>
          </div>

          {/* Separator */}
          <div
            style={{
              height: 2,
              background: "linear-gradient(90deg, #c9a84c, #0066cc, #c9a84c)",
              backgroundSize: "200% 100%",
              animation: "loginShimmer 4s ease-in-out infinite",
              borderRadius: 2,
              marginBottom: 24,
              ...stagger(2),
            }}
          />

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            
            {/* Login method */}
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
                {t("login.loginWith", "Login With")}
              </Label>
              <UISelect
                value={loginMethod}
                onValueChange={(v) => setLoginMethod(v as "email" | "phone")}
              >
                <SelectTrigger className="h-11 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">{t("login.email", "Email")}</SelectItem>
                  <SelectItem value="phone">{t("login.phone", "Phone")}</SelectItem>
                </SelectContent>
              </UISelect>
            </div>

            {/* Identifier */}
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
                {loginMethod === "email" ? t("login.emailAddress", "Email Address") : t("login.phoneNumber", "Phone Number")}
              </Label>
              <div className="relative group flex items-center w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  {loginMethod === "email" ? (
                    <AtSign className="h-4.5 w-4.5 text-gray-400 group-focus-within:text-[#003366] transition-colors" />
                  ) : (
                    <Smartphone className="h-4.5 w-4.5 text-gray-400 group-focus-within:text-[#003366] transition-colors" />
                  )}
                </div>
                <Input
                  type={loginMethod === "email" ? "email" : "tel"}
                  placeholder={loginMethod === "email" ? t("login.enterEmail", "Enter your email") : t("login.enterPhone", "Enter your phone")}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="w-full h-11 !pl-11 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm placeholder:text-gray-400 transition-all duration-200 focus:bg-white focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Password */}
            <div style={stagger(5)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <Label
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                  }}
                >
                  {t("login.password", "Password")}
                </Label>
                <a
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#003366",
                    cursor: "pointer",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#0066cc")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#003366")}
                >
                  {t("login.forgotPassword", "Forgot password?")}
                </a>
              </div>
              <div className="relative group flex items-center w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4.5 w-4.5 text-gray-400 group-focus-within:text-[#003366] transition-colors" />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("login.enterPassword", "••••••••")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-11 !pl-11 pr-11 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm placeholder:text-gray-400 transition-all duration-200 focus:bg-white focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    height: 44,
                    width: 44,
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
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div
                style={{
                  borderRadius: 10,
                  border: "1px solid #fecaca",
                  background: "#fef2f2",
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#b91c1c",
                  ...stagger(6),
                }}
              >
                {error}
              </div>
            )}

            {/* Submit button */}
            <div style={stagger(7)} className="pt-2">
              <Button
                type="submit"
                disabled={loading}
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
                  {loading ? t("login.loggingIn", "Logging in...") : t("login.loginButton", "Login to your account")}
                </span>
              </Button>
            </div>

            {/* Link to Signup */}
            <div style={{ textAlign: "center", marginTop: 4, ...stagger(8) }}>
              <span style={{ fontSize: 13, color: "#9ca3af" }}>
                First time user?{" "}
              </span>
              <Link
                to="/signup"
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
                {t("login.firstTime", "Create account")}
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
            ...stagger(9),
          }}
        >
          Protected by Sabancı University IT Infrastructure
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════
          RIGHT PANEL — Cinematic Image Showcase (Now on Right)
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

        {/* Navy Gradient Overlay */}
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
          {/* Sabancı badge top-right (mirrored from Signup) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 16 }}>
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
            {/* WELCOME BACK label */}
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
              WELCOME BACK TO
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
              Access your dashboard to manage reservations, explore room availability, and customize your upcoming stays.
            </p>

            {/* 3 floating feature cards (Targeted for returning users) */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              {[
                { icon: <CalendarCheck size={16} color="#c9a84c" strokeWidth={1.8} />, title: "Manage Stays", sub: "View & Edit Bookings", delay: "0s" },
                { icon: <Zap size={16} color="#c9a84c" strokeWidth={1.8} />, title: "Instant Access", sub: "Fast Check-in Portal", delay: "0.4s" },
                { icon: <Headphones size={16} color="#c9a84c" strokeWidth={1.8} />, title: "24/7 Support", sub: "Contact Reception", delay: "0.8s" },
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
    </div>
  );
}