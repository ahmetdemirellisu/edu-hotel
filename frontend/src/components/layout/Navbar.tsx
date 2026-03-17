import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import {
  Globe,
  Bell,
  User,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"; // Ensure path matches your project structure

/* ── Inject keyframes once ─────────────────────────────── */
const _navStyle = document.getElementById("navbar-anim") ?? (() => {
  const s = document.createElement("style");
  s.id = "navbar-anim";
  s.textContent = `
    @keyframes navGradientShimmer {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes navPulse {
      0%, 100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(201,168,76,0.7); }
      50%       { transform: scale(1.15); opacity: 0.9; box-shadow: 0 0 0 6px rgba(201,168,76,0); }
    }
    @keyframes navUnderlineIn {
      from { transform: scaleX(0); }
      to   { transform: scaleX(1); }
    }
    @keyframes navBellRipple {
      0%   { transform: scale(0.8); opacity: 1; }
      100% { transform: scale(2.4); opacity: 0; }
    }
    @keyframes navLetterSpacing {
      0%   { letter-spacing: 6px; }
      50%  { letter-spacing: 10px; }
      100% { letter-spacing: 6px; }
    }
    .nav-link-hover {
      position: relative;
    }
    .nav-link-hover::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, #c9a84c, #4da6ff, #c9a84c);
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
    }
    .nav-link-hover:hover::after {
      transform: scaleX(1);
    }
    .nav-link-hover:hover {
      color: white !important;
    }
    .nav-logo-hover:hover {
      animation: navLetterSpacing 1.2s ease-in-out;
    }
    .nav-bell-ripple::before {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      background: rgba(201,168,76,0.4);
      animation: navBellRipple 1.5s ease-out infinite;
    }
  `;
  document.head.appendChild(s);
  return s;
})();

export function Navbar() {
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);

  const currentLang = i18n.language?.toUpperCase() === "TR" ? "TR" : "EN";

  const switchLanguage = (val: string) => {
    const next = val.toLowerCase();
    i18n.changeLanguage(next);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 text-white transition-all duration-500"
      style={{
        background: scrolled
          ? "rgba(0,25,51,0.97)"
          : "rgba(0,30,60,0.92)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: scrolled
          ? "0 1px 0 rgba(255,255,255,0.05), 0 8px 32px rgba(0,20,50,0.5)"
          : "0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,20,50,0.3)",
      }}
    >
      {/* Animated gradient border-bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "1.5px",
          background: "linear-gradient(90deg, #c9a84c, #4da6ff, #c9a84c, #4da6ff, #c9a84c)",
          backgroundSize: "300% 100%",
          animation: "navGradientShimmer 5s ease infinite",
          opacity: 0.7,
        }}
      />

      <div className="max-w-7xl mx-auto px-6 py-3.5 relative">
        <div className="flex items-center justify-between">

          {/* Left: Sabancı Logo Branding */}
          <div className="flex items-center gap-4">
            <div
              className="border border-[#c9a84c]/60 px-3 py-1.5 rounded cursor-pointer transition-all duration-300 hover:border-[#c9a84c] hover:shadow-[0_0_12px_rgba(201,168,76,0.25)]"
              style={{ background: "rgba(201,168,76,0.06)" }}
            >
              <div className="text-[11px] font-bold text-[#c9a84c] leading-tight tracking-wider uppercase">Sabancı</div>
              <div className="text-[9px] text-[#c9a84c]/70 leading-tight tracking-widest">Üniversitesi</div>
            </div>
          </div>

          {/* Center: Main Title (Absolute Centered) */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2.5">
            {/* Animated pulse dot */}
            <div
              className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] flex-shrink-0"
              style={{ animation: "navPulse 2.5s ease-in-out infinite" }}
            />
            <h1
              className="text-[17px] font-light whitespace-nowrap tracking-[6px] uppercase nav-logo-hover cursor-default select-none transition-all duration-300"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              EDU HOTEL
            </h1>
            <div
              className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] flex-shrink-0"
              style={{ animation: "navPulse 2.5s ease-in-out infinite 1.25s" }}
            />
          </div>

          {/* Right: Navigation & Actions */}
          <div className="flex items-center gap-5">
            <Link
              to="/dashboard"
              className="nav-link-hover text-white/70 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden md:inline">
                {t("nav.dashboard", "Dashboard")}
              </span>
            </Link>

            {/* Language Switcher */}
            <Select value={currentLang} onValueChange={switchLanguage}>
              <SelectTrigger
                className="w-16 h-8 border-white/20 text-white text-xs font-bold hover:border-[#c9a84c]/60 focus:ring-0 rounded-lg transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <SelectValue placeholder={currentLang} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EN">EN</SelectItem>
                <SelectItem value="TR">TR</SelectItem>
              </SelectContent>
            </Select>

            {/* Notification Bell with ripple */}
            <button
              type="button"
              className="relative hover:text-white text-white/70 transition-colors"
              aria-label={t("nav.notifications", "Notifications")}
            >
              <span className="relative inline-flex">
                <Bell className="h-5 w-5 relative z-10" />
                {/* Ripple ring */}
                <span
                  className="nav-bell-ripple absolute inset-0"
                  style={{ borderRadius: "50%" }}
                />
              </span>
              <span
                className="absolute -top-1.5 -right-1.5 text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center z-20"
                style={{
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  boxShadow: "0 1px 4px rgba(239,68,68,0.5)",
                  color: "white",
                }}
              >
                3
              </span>
            </button>

            {/* Profile */}
            <Link
              to="/profile"
              className="nav-link-hover text-white/70 transition-colors group flex items-center gap-2"
              aria-label={t("nav.profile", "Profile")}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:shadow-[0_0_12px_rgba(255,255,255,0.15)]"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                <User className="h-4 w-4" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
