import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import backgroundImage from "figma:asset/9bf36aafa693f4a63cbdf015b397abd2911f2e4f.png";
import { Eye, EyeOff, BedDouble, MapPin, Clock } from "lucide-react";

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
   Pre-calculate window animation data OUTSIDE the component
   ═══════════════════════════════════════════════════════════ */
const WIN_DATA = Array.from({ length: 30 }, (_, i) => ({
  delay: ((i * 0.73 + i * i * 0.031) % 7).toFixed(2),
  duration: (2.5 + (i * 0.41 + (i % 5) * 0.6) % 4).toFixed(2),
  startLit: i % 3 !== 0,
}));

/* Pre-calculate particle data */
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

    @keyframes aurora {
      0%   { transform: translate(0, 0) scale(1) rotate(0deg); }
      33%  { transform: translate(40px, -30px) scale(1.15) rotate(120deg); }
      66%  { transform: translate(-25px, 20px) scale(0.9) rotate(240deg); }
      100% { transform: translate(0, 0) scale(1) rotate(360deg); }
    }
    @keyframes aurora2 {
      0%   { transform: translate(0, 0) scale(1.1) rotate(0deg); }
      50%  { transform: translate(-50px, 40px) scale(0.85) rotate(180deg); }
      100% { transform: translate(0, 0) scale(1.1) rotate(360deg); }
    }
    @keyframes aurora3 {
      0%   { transform: translate(0, 0) scale(0.9) rotate(0deg); }
      40%  { transform: translate(60px, 20px) scale(1.2) rotate(144deg); }
      100% { transform: translate(0, 0) scale(0.9) rotate(360deg); }
    }
    @keyframes winBlink {
      0%,100% { opacity: 0.05; }
      50%     { opacity: 0.85; }
    }
    @keyframes floatCard {
      0%,100% { transform: translateY(0px); }
      50%     { transform: translateY(-10px); }
    }
    @keyframes shimmerText {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes particleFloat {
      0%   { transform: translateY(100vh); opacity: 0; }
      8%   { opacity: 0.7; }
      92%  { opacity: 0.5; }
      100% { transform: translateY(-10vh); opacity: 0; }
    }
    @keyframes loginCardSlide {
      from { opacity: 0; transform: translateX(30px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes loginShimmer {
      0%,100% { background-position: 0% 50%; }
      50%     { background-position: 100% 50%; }
    }
    @keyframes loginFadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes shimmerSweep {
      from { transform: translateX(-100%); }
      to   { transform: translateX(100%); }
    }
    @keyframes goldPulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(201,168,76,0.15); }
      50%     { box-shadow: 0 0 0 8px rgba(201,168,76,0); }
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
    animation: `loginFadeUp 0.55s ease-out ${0.1 + i * 0.07}s both`,
  });

  /* Keep backgroundImage import used (suppress unused warning) */
  void backgroundImage;

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
          LEFT PANEL — Cinematic Hotel Showcase
          ══════════════════════════════════════════════════════ */}
      <div
        style={{
          display: "none",
          width: "58%",
          flexShrink: 0,
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(160deg, #020817 0%, #0a1628 50%, #0d1f3c 100%)",
        }}
        className="lg:!flex lg:!flex-col"
      >
        {/* Aurora blobs */}
        {[
          { w: 700, h: 700, top: "-20%", left: "-15%", color1: "rgba(59,130,246,0.18)", color2: "rgba(99,102,241,0.12)", dur: "22s", anim: "aurora" },
          { w: 600, h: 600, top: "30%", left: "40%", color1: "rgba(139,92,246,0.15)", color2: "rgba(59,130,246,0.10)", dur: "28s", anim: "aurora2" },
          { w: 500, h: 500, top: "60%", left: "-10%", color1: "rgba(14,165,233,0.12)", color2: "rgba(99,102,241,0.08)", dur: "18s", anim: "aurora3" },
        ].map((b, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: b.w,
              height: b.h,
              top: b.top,
              left: b.left,
              borderRadius: "50%",
              background: `radial-gradient(circle at 40% 40%, ${b.color1} 0%, ${b.color2} 40%, transparent 70%)`,
              animation: `${b.anim} ${b.dur} ease-in-out infinite`,
              pointerEvents: "none",
              filter: "blur(2px)",
            }}
          />
        ))}

        {/* Grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage: `
              linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px)
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
                background: i % 3 === 0 ? "rgba(201,168,76,0.6)" : "rgba(255,255,255,0.3)",
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
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "#c9a84c", letterSpacing: "0.5px" }}>Sabancı</div>
              <div style={{ fontSize: 10, color: "rgba(201,168,76,0.75)", letterSpacing: "0.3px" }}>Üniversitesi</div>
            </div>
          </div>

          {/* Center content */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: 0 }}>
            {/* WELCOME TO label */}
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
              WELCOME TO
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
              }}
            >
              EDU HOTEL
            </h1>

            {/* Stars */}
            <div style={{ display: "flex", gap: 6, marginTop: 20, marginBottom: 48 }}>
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="#c9a84c">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>

            {/* Hotel building */}
            <div style={{ position: "relative", marginBottom: 48 }}>
              {/* Building container */}
              <div
                style={{
                  position: "relative",
                  display: "inline-block",
                  filter: "drop-shadow(0 20px 60px rgba(59,130,246,0.3))",
                }}
              >
                {/* Main building facade */}
                <div
                  style={{
                    background: "linear-gradient(180deg, #1a2744 0%, #0f1a2e 100%)",
                    border: "1px solid rgba(201,168,76,0.2)",
                    borderRadius: "6px 6px 0 0",
                    padding: "16px 20px 12px",
                    position: "relative",
                    width: 220,
                  }}
                >
                  {/* Roof */}
                  <div
                    style={{
                      position: "absolute",
                      top: -18,
                      left: -8,
                      right: -8,
                      height: 20,
                      background: "linear-gradient(180deg, #0d1528 0%, #1a2744 100%)",
                      borderRadius: "4px 4px 0 0",
                      border: "1px solid rgba(201,168,76,0.25)",
                      borderBottom: "none",
                    }}
                  />
                  {/* Roof pinnacle */}
                  <div
                    style={{
                      position: "absolute",
                      top: -30,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 0,
                      height: 0,
                      borderLeft: "10px solid transparent",
                      borderRight: "10px solid transparent",
                      borderBottom: "14px solid #0d1528",
                    }}
                  />

                  {/* Floor labels + windows grid */}
                  {[0, 1, 2, 3, 4].map((floor) => (
                    <div
                      key={floor}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: floor < 4 ? 8 : 0,
                      }}
                    >
                      {/* Floor label */}
                      <span
                        style={{
                          fontSize: 8,
                          color: "rgba(201,168,76,0.5)",
                          fontWeight: 600,
                          letterSpacing: "0.5px",
                          width: 20,
                          textAlign: "right",
                          flexShrink: 0,
                        }}
                      >
                        FL{5 - floor}
                      </span>
                      {/* 6 windows per floor */}
                      <div style={{ display: "flex", gap: 6 }}>
                        {[0, 1, 2, 3, 4, 5].map((col) => {
                          const idx = floor * 6 + col;
                          const win = WIN_DATA[idx];
                          return (
                            <div
                              key={col}
                              style={{
                                width: 20,
                                height: 16,
                                borderRadius: 3,
                                background: win.startLit
                                  ? "rgba(255,200,80,0.85)"
                                  : "rgba(255,200,80,0.05)",
                                border: "1px solid rgba(201,168,76,0.2)",
                                boxShadow: win.startLit
                                  ? "0 0 8px rgba(255,200,80,0.6), 0 0 2px rgba(255,200,80,0.4)"
                                  : "none",
                                animation: `winBlink ${win.duration}s ${win.delay}s ease-in-out infinite`,
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Lobby/entrance */}
                <div
                  style={{
                    background: "linear-gradient(180deg, #0f1a2e 0%, #080f1e 100%)",
                    border: "1px solid rgba(201,168,76,0.25)",
                    borderTop: "2px solid rgba(201,168,76,0.35)",
                    borderRadius: "0 0 4px 4px",
                    padding: "8px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {/* Entrance arch */}
                  <div
                    style={{
                      width: 28,
                      height: 20,
                      background: "rgba(201,168,76,0.1)",
                      border: "1px solid rgba(201,168,76,0.3)",
                      borderRadius: "14px 14px 0 0",
                    }}
                  />
                  <span style={{ fontSize: 9, color: "rgba(201,168,76,0.7)", letterSpacing: "2px", fontWeight: 600 }}>
                    LOBBY
                  </span>
                  <div
                    style={{
                      width: 28,
                      height: 20,
                      background: "rgba(201,168,76,0.1)",
                      border: "1px solid rgba(201,168,76,0.3)",
                      borderRadius: "14px 14px 0 0",
                    }}
                  />
                </div>

                {/* Dark base */}
                <div
                  style={{
                    height: 8,
                    background: "#050c18",
                    borderRadius: "0 0 4px 4px",
                    border: "1px solid rgba(201,168,76,0.15)",
                    borderTop: "none",
                  }}
                />

                {/* Glow reflection */}
                <div
                  style={{
                    position: "absolute",
                    bottom: -24,
                    left: "10%",
                    right: "10%",
                    height: 20,
                    background: "radial-gradient(ellipse, rgba(59,130,246,0.25) 0%, transparent 70%)",
                    filter: "blur(6px)",
                    pointerEvents: "none",
                  }}
                />
              </div>
            </div>

            {/* 3 floating feature cards */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              {[
                { icon: <BedDouble size={16} color="#c9a84c" strokeWidth={1.8} />, title: "49 Rooms", sub: "Comfortable & Modern", delay: "0s" },
                { icon: <MapPin size={16} color="#c9a84c" strokeWidth={1.8} />, title: "Campus Location", sub: "Sabancı University", delay: "0.4s" },
                { icon: <Clock size={16} color="#c9a84c" strokeWidth={1.8} />, title: "24/7 Service", sub: "Always Here For You", delay: "0.8s" },
              ].map((card, i) => (
                <div
                  key={i}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    animation: `floatCard ${4 + i * 0.8}s ${card.delay} ease-in-out infinite`,
                    minWidth: 140,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "rgba(201,168,76,0.1)",
                      border: "1px solid rgba(201,168,76,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {card.icon}
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.9)", lineHeight: 1.2 }}>
                      {card.title}
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
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
            <p style={{ fontSize: 10, color: "rgba(201,168,76,0.4)", letterSpacing: "0.8px", margin: 0 }}>
              © 2026 Sabancı University · All Rights Reserved
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          RIGHT PANEL — Login Form
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
          animation: "loginCardSlide 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both",
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
                marginBottom: 24,
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
              Sign in to your account
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
              marginBottom: 28,
              ...stagger(2),
            }}
          />

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
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
                {t("login.loginWith")}
              </Label>
              <UISelect
                value={loginMethod}
                onValueChange={(v) => setLoginMethod(v as "email" | "phone")}
              >
                <SelectTrigger className="h-11 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">{t("login.email")}</SelectItem>
                  <SelectItem value="phone">{t("login.phone")}</SelectItem>
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
                {loginMethod === "email" ? t("login.emailAddress") : t("login.phoneNumber")}
              </Label>
              <Input
                type={loginMethod === "email" ? "email" : "tel"}
                placeholder={loginMethod === "email" ? t("login.enterEmail") : t("login.enterPhone")}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="h-11 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm placeholder:text-gray-400 transition-all duration-200 focus:bg-white focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Password */}
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
                {t("login.password")}
              </Label>
              <div style={{ position: "relative" }}>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("login.enterPassword")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-11 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm placeholder:text-gray-400 transition-all duration-200 focus:bg-white focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
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

            {/* Error */}
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
            <div style={stagger(6)}>
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
                  {loading ? t("login.loggingIn") : t("login.loginButton")}
                </span>
              </Button>
            </div>

            {/* Links */}
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 8, ...stagger(7) }}>
              <a
                style={{
                  fontSize: 13,
                  color: "#9ca3af",
                  cursor: "pointer",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#003366")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
              >
                {t("login.forgotPassword")}
              </a>
              <Link
                to="/signup"
                style={{
                  fontSize: 13,
                  color: "#003366",
                  fontWeight: 500,
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#0066cc")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#003366")}
              >
                {t("login.firstTime")}
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
            ...stagger(8),
          }}
        >
          Protected by Sabancı University IT Infrastructure
        </p>
      </div>
    </div>
  );
}
