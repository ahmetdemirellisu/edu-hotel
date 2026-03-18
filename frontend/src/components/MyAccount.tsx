import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Footer } from "./layout/Footer";
import { NotificationBell } from "./NotificationBell";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  User,
  Lock,
  AlertCircle,
  CheckCircle2,
  LogOut,
  Eye,
  EyeOff,
  Settings,
  ChevronRight,
  LayoutGrid,
  Shield,
  Bell,
  Sliders,
  IdCard,
  AtSign,
  Smartphone
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   Inject animations once
   ═══════════════════════════════════════════════════════════ */
void (document.getElementById("account-anim") ?? (() => {
  const s = document.createElement("style");
  s.id = "account-anim";
  s.textContent = `
    @keyframes accountFadeUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes accountHeroShimmer {
      0%   { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes accountAurora {
      0%   { transform: translate(0,0) scale(1); }
      50%  { transform: translate(20px,-15px) scale(1.06); }
      100% { transform: translate(0,0) scale(1); }
    }
    @keyframes accountAurora2 {
      0%   { transform: translate(0,0) scale(1); }
      50%  { transform: translate(-15px,12px) scale(0.96); }
      100% { transform: translate(0,0) scale(1); }
    }
    @keyframes accountAvatarPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(201,168,76,0.4), 0 0 0 0 rgba(201,168,76,0.15); }
      50%       { box-shadow: 0 0 0 6px rgba(201,168,76,0.12), 0 0 0 12px rgba(201,168,76,0.04); }
    }
    @keyframes accountOnlinePulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.7; transform: scale(1.3); }
    }
    @keyframes accountBorderFloat {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes accountStrengthFill {
      from { width: 0%; }
    }
    .account-tab-item {
      transition: all 0.2s ease;
    }
    .account-tab-item:hover {
      background: rgba(0,51,102,0.05);
    }
    .account-input-field {
      transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
    }
    .account-input-field:focus {
      background: white;
      border-color: rgba(0,102,204,0.5);
      box-shadow: 0 0 0 3px rgba(0,102,204,0.1);
    }
    .account-save-btn {
      background: linear-gradient(135deg, #001f40 0%, #003366 50%, #004d80 100%);
      background-size: 200% 200%;
      transition: all 0.3s ease;
    }
    .account-save-btn:hover {
      background-position: 100% 50%;
      box-shadow: 0 8px 24px rgba(0,51,102,0.3);
      transform: translateY(-1px);
    }
    .account-quick-link {
      transition: all 0.2s ease;
    }
    .account-quick-link:hover {
      background: rgba(248,250,252,1);
      padding-left: 24px;
    }
  `;
  document.head.appendChild(s);
  return s;
})());

/* ── Password strength helper ──────────────────────────── */
function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "#e5e7eb" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map: Record<number, { label: string; color: string }> = {
    0: { label: "tooShort", color: "#ef4444" },
    1: { label: "weak",     color: "#f97316" },
    2: { label: "fair",     color: "#f59e0b" },
    3: { label: "good",     color: "#22c55e" },
    4: { label: "strong",   color: "#10b981" },
  };
  return { score, ...map[score] };
}

export function MyAccount() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [userData, setUserData] = useState({
    fullName: "",
    email: "",
    phone: "",
    tcNo: "",
    userType: "",
  });

  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"info" | "security" | "prefs">("info");

  const currentLang = i18n.language?.toUpperCase() === "TR" ? "TR" : "EN";
  const switchLanguage = (val: string) => i18n.changeLanguage(val.toLowerCase());
  const userName = localStorage.getItem("userName") || "User";

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedName = localStorage.getItem("userName");

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserData({
          fullName: parsedUser.name || storedName || "",
          email: parsedUser.email || localStorage.getItem("userEmail") || "",
          phone: parsedUser.phone || "",
          tcNo: parsedUser.tcNo || "Not Provided",
          userType: parsedUser.userType || "STUDENT",
        });
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    } else if (!localStorage.getItem("authToken")) {
      navigate("/");
    }
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setUserData((prev) => ({ ...prev, [id]: value }));
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    navigate("/");
  };

  const stagger = (i: number): React.CSSProperties => ({
    animation: `accountFadeUp 0.55s cubic-bezier(0.22,1,0.36,1) ${0.08 + i * 0.07}s both`,
  });

  /* User type display */
  const userTypeDisplay = (type: string) => {
    const map: Record<string, { labelKey: string; bg: string; text: string }> = {
      STUDENT: { labelKey: "account.userType.student", bg: "bg-blue-50", text: "text-blue-700" },
      STAFF:   { labelKey: "account.userType.staff",   bg: "bg-emerald-50", text: "text-emerald-700" },
      ADMIN:   { labelKey: "account.userType.admin",   bg: "bg-violet-50", text: "text-violet-700" },
    };
    const entry = map[type];
    return entry
      ? { label: t(entry.labelKey, type), bg: entry.bg, text: entry.text }
      : { label: type, bg: "bg-gray-100", text: "text-gray-700" };
  };

  const typeStyle = userTypeDisplay(userData.userType);

  /* Initials from name */
  const initials = userData.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const pwStrength = getPasswordStrength(newPassword);

  const tabs = [
    { key: "info" as const, label: t("account.profile.title", { defaultValue: "Personal Info" }), icon: User },
    { key: "security" as const, label: t("account.password.title", { defaultValue: "Security" }), icon: Shield },
    { key: "prefs" as const, label: t("account.prefs.title", { defaultValue: "Preferences" }), icon: Sliders },
  ];

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #eef2f7 0%, #e8eef5 60%, #eef2f7 100%)" }}>
      {/* ═══ HEADER ═══════════════════════════════════════ */}
      <header
        className="sticky top-0 z-50 border-b border-white/10"
        style={{
          background: "rgba(0,25,51,0.96)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.05), 0 6px 28px rgba(0,20,50,0.4)",
        }}
      >
        {/* gradient border bottom */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "1.5px",
          background: "linear-gradient(90deg, transparent, #c9a84c 30%, #4da6ff 60%, #c9a84c 80%, transparent)",
          opacity: 0.55,
        }} />
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link to="/main" className="flex items-center gap-4">
                <div
                  className="border border-[#c9a84c]/55 px-3 py-1.5 rounded transition-all duration-300 hover:border-[#c9a84c] hover:shadow-[0_0_14px_rgba(201,168,76,0.2)]"
                  style={{ background: "rgba(201,168,76,0.07)" }}
                >
                  <div className="text-[11px] font-bold text-[#c9a84c] leading-tight tracking-wider uppercase">Sabancı</div>
                  <div className="text-[10px] text-[#c9a84c]/70 leading-tight">Üniversitesi</div>
                </div>
                <div className="w-px h-8 bg-white/15 hidden sm:block" />
                <h1 className="text-white text-lg font-light tracking-[7px] uppercase hidden sm:block" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  EDU HOTEL
                </h1>
              </Link>
            </div>

            <h1 className="sm:hidden text-white text-base font-light tracking-[5px] uppercase">EDU HOTEL</h1>

            <div className="flex items-center gap-3 sm:gap-5">
              <Link to="/main" className="hidden md:flex items-center gap-1.5 text-xs text-white/55 hover:text-white transition-colors tracking-wide">
                <LayoutGrid className="h-3.5 w-3.5" />
                {t("header.mainPage", { defaultValue: "Main Page" })}
              </Link>

              <Select value={currentLang} onValueChange={switchLanguage}>
                <SelectTrigger className="w-[58px] h-8 bg-white/6 border-white/18 text-white text-xs font-semibold hover:bg-white/10 focus:ring-0 rounded-lg">
                  <SelectValue placeholder={currentLang} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EN">EN</SelectItem>
                  <SelectItem value="TR">TR</SelectItem>
                </SelectContent>
              </Select>

              <NotificationBell lang={currentLang} />

              <Link to="/profile" className="flex items-center gap-2.5 pl-1 group cursor-pointer">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:shadow-[0_0_12px_rgba(255,255,255,0.12)]"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.14)" }}
                >
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs text-white font-medium hidden md:block max-w-[100px] truncate">
                  {userName}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ PROFILE HERO ═════════════════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #000e1f 0%, #001f40 35%, #003366 65%, #004d80 100%)",
        }}
      >
        {/* Aurora orbs */}
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)", animation: "accountAurora 14s ease-in-out infinite" }} />
        <div className="absolute -bottom-20 -left-10 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(77,166,255,0.08) 0%, transparent 70%)", animation: "accountAurora2 18s ease-in-out infinite" }} />

        {/* Grid overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.025] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="acctGrid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M 36 0 L 0 0 0 36" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#acctGrid)" />
        </svg>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6" style={stagger(0)}>
            {/* Avatar with animated ring */}
            <div className="relative flex-shrink-0">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white select-none"
                style={{
                  background: "linear-gradient(135deg, #001f40, #003d80)",
                  border: "2px solid rgba(201,168,76,0.45)",
                  animation: "accountAvatarPulse 3s ease-in-out infinite",
                  boxShadow: "0 8px 24px rgba(0,31,64,0.5)",
                }}
              >
                {initials}
              </div>
              {/* Online badge */}
              <div
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#000e1f] flex items-center justify-center"
                style={{ background: "#10b981" }}
              >
                <div
                  className="w-2 h-2 rounded-full bg-white"
                  style={{ animation: "accountOnlinePulse 2s ease-in-out infinite" }}
                />
              </div>
            </div>

            {/* Name + role */}
            <div className="text-center sm:text-left">
              <h1
                className="text-2xl sm:text-3xl font-light text-white tracking-tight mb-1"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  background: "linear-gradient(90deg, #fff, #c9a84c, #f0d080, #fff)",
                  backgroundSize: "300% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  animation: "accountHeroShimmer 6s linear infinite",
                }}
              >
                {userData.fullName || userName}
              </h1>
              <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${typeStyle.bg} ${typeStyle.text}`}>
                  {typeStyle.label}
                </span>
                <span className="text-xs text-white/40 font-medium">{userData.email}</span>
              </div>
            </div>

            {/* Logout — far right on desktop */}
            <div className="sm:ml-auto">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-300 border border-red-500/25 hover:bg-red-500/10 hover:border-red-500/40 transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                {t("account.session.logoutBtn")}
              </button>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="mt-8 flex gap-1 p-1 rounded-2xl w-fit" style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
                  style={{
                    background: isActive ? "rgba(255,255,255,0.95)" : "transparent",
                    color: isActive ? "#003366" : "rgba(255,255,255,0.55)",
                    boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ MAIN ═════════════════════════════════════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
          {/* ── Left column (2/3) ─────────────────────── */}
          <div className="lg:col-span-2 space-y-7">

            {/* ── Tab: Personal Info ──────────────────── */}
            {activeTab === "info" && (
              <div
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                style={{
                  ...stagger(1),
                  boxShadow: "0 2px 4px rgba(0,0,0,0.03), 0 10px 28px rgba(0,51,102,0.05)",
                }}
              >
                <div className="px-7 py-5 border-b border-gray-100/80 flex items-center gap-3"
                  style={{ background: "linear-gradient(90deg, #f8fafc, #ffffff)" }}
                >
                  <div className="w-1 h-6 rounded-full bg-[#003366]" />
                  <h3 className="text-lg font-semibold text-[#003366] tracking-tight">
                    {t("account.profile.title")}
                  </h3>
                </div>
                <div className="p-7">
                  <form className="space-y-6">
                    
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName" className="text-[11px] font-bold text-gray-500 uppercase tracking-[2px]">
                        {t("signup.fullNameLabel", "Full Name")}
                      </Label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <IdCard className="h-5 w-5 text-gray-400 group-focus-within:text-[#003366] transition-colors" />
                        </div>
                        <Input
                          id="fullName"
                          value={userData.fullName}
                          onChange={handleInputChange}
                          placeholder={t("signup.fullNamePlaceholder")}
                          className="account-input-field w-full h-12 !pl-12 rounded-xl bg-gray-50/80 border border-gray-200/80 text-gray-800 text-sm placeholder:text-gray-400"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-[11px] font-bold text-gray-500 uppercase tracking-[2px]">
                        {t("account.profile.email")}
                      </Label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <AtSign className="h-5 w-5 text-gray-400 group-focus-within:text-[#003366] transition-colors" />
                        </div>
                        <Input
                          id="email"
                          type="email"
                          value={userData.email}
                          onChange={handleInputChange}
                          className="account-input-field w-full h-12 !pl-12 rounded-xl bg-gray-50/80 border border-gray-200/80 text-gray-800 text-sm"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-[11px] font-bold text-gray-500 uppercase tracking-[2px]">
                        {t("account.profile.phone")}
                      </Label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Smartphone className="h-5 w-5 text-gray-400 group-focus-within:text-[#003366] transition-colors" />
                        </div>
                        <Input
                          id="phone"
                          type="tel"
                          value={userData.phone}
                          onChange={handleInputChange}
                          className="account-input-field w-full h-12 !pl-12 rounded-xl bg-gray-50/80 border border-gray-200/80 text-gray-800 text-sm"
                        />
                      </div>
                    </div>

                    {/* T.C. Kimlik No */}
                    <div className="space-y-1.5 pt-4 border-t border-gray-100">
                      <Label htmlFor="tcNo" className="text-[11px] font-bold text-gray-400 uppercase tracking-[2px]">
                        {t("account.profile.tcNo", "Identification Number")}
                      </Label>
                      <Input
                        id="tcNo"
                        value={userData.tcNo}
                        className="h-12 rounded-xl bg-gray-50/40 border border-gray-100 text-gray-400 text-sm italic cursor-not-allowed"
                        disabled
                      />
                      <p className="text-[10px] text-gray-400 ml-1">{t("account.profile.tcNote")}</p>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        className="account-save-btn rounded-xl text-white text-sm font-semibold px-8 h-11 relative overflow-hidden"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
                        <span className="relative">{t("account.profile.saveBtn")}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ── Tab: Security ───────────────────────── */}
            {activeTab === "security" && (
              <div
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                style={{
                  ...stagger(1),
                  boxShadow: "0 2px 4px rgba(0,0,0,0.03), 0 10px 28px rgba(0,51,102,0.05)",
                }}
              >
                <div className="px-7 py-5 border-b border-gray-100/80 flex items-center gap-3"
                  style={{ background: "linear-gradient(90deg, #fffbf0, #ffffff)" }}
                >
                  <div className="w-1 h-6 rounded-full bg-amber-400" />
                  <h3 className="text-lg font-semibold text-[#003366] tracking-tight">
                    {t("account.password.title")}
                  </h3>
                </div>
                <div className="p-7">
                  <form className="space-y-6">
                    {/* Current password */}
                    <div className="space-y-1.5">
                      <Label htmlFor="currentPassword" className="text-[11px] font-bold text-gray-500 uppercase tracking-[2px]">
                        {t("account.password.current")}
                      </Label>
                      <div className="relative group flex items-center">
                        <Lock className="absolute left-3.5 h-4 w-4 text-gray-400 pointer-events-none group-focus-within:text-[#003366] transition-colors" />
                        <Input
                          id="currentPassword"
                          type={showCurrentPw ? "text" : "password"}
                          className="account-input-field h-12 pl-10 pr-11 rounded-xl bg-gray-50/80 border border-gray-200/80 text-gray-800 text-sm w-full"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPw(!showCurrentPw)}
                          className="absolute right-3 h-11 w-9 flex items-center justify-center text-gray-400 hover:text-[#003366] transition-colors"
                        >
                          {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* New password */}
                    <div className="space-y-1.5">
                      <Label htmlFor="newPassword" className="text-[11px] font-bold text-gray-500 uppercase tracking-[2px]">
                        {t("account.password.new")}
                      </Label>
                      <div className="relative group flex items-center">
                        <Lock className="absolute left-3.5 h-4 w-4 text-gray-400 pointer-events-none group-focus-within:text-[#003366] transition-colors" />
                        <Input
                          id="newPassword"
                          type={showNewPw ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="account-input-field h-12 pl-10 pr-11 rounded-xl bg-gray-50/80 border border-gray-200/80 text-gray-800 text-sm w-full"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPw(!showNewPw)}
                          className="absolute right-3 h-11 w-9 flex items-center justify-center text-gray-400 hover:text-[#003366] transition-colors"
                        >
                          {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Password strength meter */}
                      {newPassword.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <div className="flex gap-1.5">
                            {[1, 2, 3, 4].map((seg) => (
                              <div
                                key={seg}
                                className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-100"
                              >
                                <div
                                  className="h-full rounded-full transition-all duration-400"
                                  style={{
                                    width: pwStrength.score >= seg ? "100%" : "0%",
                                    background: pwStrength.color,
                                    animation: pwStrength.score >= seg ? "accountStrengthFill 0.4s ease-out both" : "none",
                                    animationDelay: `${seg * 0.07}s`,
                                    transition: "width 0.4s ease",
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold" style={{ color: pwStrength.color }}>
                              {pwStrength.label ? t(`account.passwordStrength.${pwStrength.label}`, pwStrength.label) : ""}
                            </span>
                            <span className="text-[10px] text-gray-400">{newPassword.length} chars</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Requirements box */}
                    <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="text-xs text-blue-800 leading-relaxed">
                        <p className="font-semibold mb-1.5">{t("account.password.mustContain")}</p>
                        <div className="space-y-1 text-blue-700">
                          {[
                            t("account.password.req1"),
                            t("account.password.req2"),
                            t("account.password.req3"),
                          ].map((req, i) => (
                            <p key={i} className="flex items-center gap-2">
                              <span className="w-1 h-1 rounded-full bg-blue-400" />
                              {req}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="account-save-btn rounded-xl text-white text-sm font-semibold px-8 h-11 relative overflow-hidden"
                    >
                      <span className="relative">{t("account.password.updateBtn")}</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* ── Tab: Preferences ────────────────────── */}
            {activeTab === "prefs" && (
              <div
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                style={{
                  ...stagger(1),
                  boxShadow: "0 2px 4px rgba(0,0,0,0.03), 0 10px 28px rgba(0,51,102,0.05)",
                }}
              >
                <div className="px-7 py-5 border-b border-gray-100/80 flex items-center gap-3"
                  style={{ background: "linear-gradient(90deg, #f8fafc, #ffffff)" }}
                >
                  <div className="w-1 h-6 rounded-full bg-[#003366]" />
                  <h3 className="text-lg font-semibold text-[#003366] tracking-tight flex items-center gap-2">
                    <Settings className="h-4.5 w-4.5 text-gray-400" />
                    {t("account.prefs.title", { defaultValue: "Preferences" })}
                  </h3>
                </div>
                <div className="p-7 space-y-5">
                  <div
                    className="flex items-center justify-between py-4 px-5 rounded-xl"
                    style={{ background: "linear-gradient(135deg, #f8fafc, #f1f5f9)", border: "1px solid rgba(0,51,102,0.06)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <Bell className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{t("account.prefs.emailNotifs", "Email Notifications")}</p>
                        <p className="text-[11px] text-gray-400">{t("account.prefs.emailNotifsDesc", "Receive updates via email")}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full ring-1 ring-emerald-200">{t("account.prefs.enabled", "Enabled")}</span>
                  </div>

                  <div
                    className="flex items-center justify-between py-4 px-5 rounded-xl"
                    style={{ background: "linear-gradient(135deg, #f8fafc, #f1f5f9)", border: "1px solid rgba(0,51,102,0.06)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                        <Smartphone className="h-4 w-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-500">{t("account.prefs.smsNotifs", "SMS Notifications")}</p>
                        <p className="text-[11px] text-gray-400">{t("account.prefs.smsNotifsDesc", "Receive updates via SMS")}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full ring-1 ring-gray-200">{t("account.prefs.disabled", "Disabled")}</span>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                      <Settings className="h-3 w-3" />
                      {t("account.prefs.langNote", "Language can be changed from the header.")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Right column (1/3) ────────────────────── */}
          <div className="lg:col-span-1 space-y-7">
            {/* ── Account Status ──────────────────────── */}
            <div
              className="rounded-2xl border border-gray-100 overflow-hidden"
              style={{
                ...stagger(1),
                boxShadow: "0 2px 4px rgba(0,0,0,0.02), 0 6px 18px rgba(0,51,102,0.05)",
              }}
            >
              <div
                className="px-6 py-5 text-white relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, #001428 0%, #003366 60%, #004d99 100%)" }}
              >
                <div className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-8"
                  style={{ background: "radial-gradient(circle, #c9a84c, transparent)", transform: "translate(40%,-40%)" }} />
                <div className="relative flex items-center gap-2.5">
                  <User className="h-5 w-5 opacity-75" />
                  <h3 className="text-[15px] font-semibold tracking-tight">
                    {t("account.status.title")}
                  </h3>
                </div>
              </div>
              <div className="bg-white p-5 space-y-4">
                {/* User initials avatar */}
                <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #001428, #003d80)", border: "1.5px solid rgba(201,168,76,0.3)" }}
                  >
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{userData.fullName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{userData.email}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-xs text-gray-500 font-medium">{t("account.status.type")}</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${typeStyle.bg} ${typeStyle.text}`}>
                    {typeStyle.label}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs text-gray-500 font-medium">{t("account.status.label")}</span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t("account.status.active")}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Quick Links ─────────────────────────── */}
            <div
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
              style={{
                ...stagger(2),
                boxShadow: "0 2px 4px rgba(0,0,0,0.02), 0 6px 18px rgba(0,51,102,0.04)",
              }}
            >
              <div className="divide-y divide-gray-100/80">
                {[
                  { to: "/main",         label: t("account.nav.backToDashboard", "Back to Dashboard") },
                  { to: "/reservations", label: t("account.nav.myReservations",  "My Reservations") },
                  { to: "/book-room",    label: t("account.nav.bookRoom",        "Book a Room") },
                ].map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="account-quick-link flex items-center justify-between px-5 py-4 transition-all duration-200 group"
                  >
                    <span className="text-sm text-gray-700 font-medium group-hover:text-[#003366] transition-colors">
                      {link.label}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[#003366] group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))}
              </div>
            </div>

            {/* ── Logout ──────────────────────────────── */}
            <div
              className="rounded-2xl border border-red-100 bg-white overflow-hidden"
              style={{
                ...stagger(3),
                boxShadow: "0 2px 4px rgba(0,0,0,0.01)",
              }}
            >
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-5 py-4 text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
              >
                <div className="w-9 h-9 rounded-xl bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                  <LogOut className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold">{t("account.session.logoutBtn")}</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}