import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Footer } from "./layout/Footer";
import { NotificationBell } from "./NotificationBell";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
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
  Mail,
  Phone,
  Lock,
  AlertCircle,
  CheckCircle2,
  LogOut,
  Eye,
  EyeOff,
  Settings,
  ChevronRight,
  LayoutGrid,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   Inject animations once
   ═══════════════════════════════════════════════════════════ */
const _style = document.getElementById("account-anim") ?? (() => {
  const s = document.createElement("style");
  s.id = "account-anim";
  s.textContent = `
    @keyframes accountFadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(s);
  return s;
})();

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

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const stagger = (i: number): React.CSSProperties => ({
    animation: `accountFadeUp 0.5s ease-out ${0.1 + i * 0.06}s both`,
  });

  /* User type display */
  const userTypeDisplay = (type: string) => {
    const map: Record<string, { label: string; bg: string; text: string }> = {
      STUDENT: { label: "Student", bg: "bg-blue-50", text: "text-blue-700" },
      STAFF: { label: "Staff", bg: "bg-emerald-50", text: "text-emerald-700" },
      ADMIN: { label: "Admin", bg: "bg-violet-50", text: "text-violet-700" },
      OTHER: { label: type, bg: "bg-gray-100", text: "text-gray-700" },
    };
    return map[type] || map.OTHER;
  };

  const typeStyle = userTypeDisplay(userData.userType);

  return (
    <div className="min-h-screen bg-[#f8fafb]">
      {/* ═══ HEADER ═══════════════════════════════════════ */}
      <header
        className="sticky top-0 z-50 border-b border-white/10"
        style={{
          background: "rgba(0,51,102,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link to="/main" className="flex items-center gap-4">
                <div className="border border-[#c9a84c] px-3 py-1.5 rounded">
                  <div className="text-[11px] font-semibold text-[#c9a84c] leading-tight">
                    Sabancı
                  </div>
                  <div className="text-[10px] text-[#c9a84c]/80 leading-tight">
                    Üniversitesi
                  </div>
                </div>
                <div className="w-px h-8 bg-white/15 hidden sm:block" />
                <h1
                  className="text-white text-lg font-semibold tracking-[6px] hidden sm:block"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  EDU HOTEL
                </h1>
              </Link>
            </div>

            <h1 className="sm:hidden text-white text-base font-bold tracking-[4px]">
              EDU HOTEL
            </h1>

            <div className="flex items-center gap-3 sm:gap-5">
              {/* Main Page link */}
              <Link
                to="/main"
                className="hidden md:flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors tracking-wide"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                {t("header.mainPage", { defaultValue: "Main Page" })}
              </Link>

              {/* Language */}
              <Select value={currentLang} onValueChange={switchLanguage}>
                <SelectTrigger className="w-[58px] h-8 bg-white/5 border-white/20 text-white text-xs font-semibold hover:bg-white/10 focus:ring-0 rounded-lg">
                  <SelectValue placeholder={currentLang} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EN">EN</SelectItem>
                  <SelectItem value="TR">TR</SelectItem>
                </SelectContent>
              </Select>

              <NotificationBell lang={currentLang} />

              <Link to="/profile" className="flex items-center gap-2.5 pl-1 group cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-white/20 ring-2 ring-white/30 flex items-center justify-center transition-colors">
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

      {/* ═══ MAIN ═════════════════════════════════════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page title */}
        <div className="mb-9" style={stagger(0)}>
          <h2 className="text-[28px] font-semibold text-[#003366] tracking-tight mb-1.5">
            {t("account.title")}
          </h2>
          <p className="text-[15px] text-gray-500">{t("account.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
          {/* ── Left column (2/3) ─────────────────────── */}
          <div className="lg:col-span-2 space-y-7">
            {/* ── Profile Information ─────────────────── */}
            <div
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
              style={{
                ...stagger(1),
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,51,102,0.04)",
              }}
            >
              <div className="px-7 py-5 border-b border-gray-100/80 flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-[#003366]" />
                <h3 className="text-lg font-semibold text-[#003366] tracking-tight">
                  {t("account.profile.title")}
                </h3>
              </div>
              <div className="p-7">
                <form className="space-y-5">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      {t("signup.fullNameLabel", "Full Name")}
                    </Label>
                    <Input
                      id="fullName"
                      value={userData.fullName}
                      onChange={handleInputChange}
                      placeholder={t("signup.fullNamePlaceholder")}
                      className="h-11 rounded-xl bg-gray-50/80 border border-gray-200/80 text-gray-800 text-sm placeholder:text-gray-400
                                 transition-all duration-200 focus:bg-white focus:border-[#0066cc]/40 focus:ring-2 focus:ring-[#0066cc]/20"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      {t("account.profile.email")}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={userData.email}
                      onChange={handleInputChange}
                      className="h-11 rounded-xl bg-gray-50/80 border border-gray-200/80 text-gray-800 text-sm placeholder:text-gray-400
                                 transition-all duration-200 focus:bg-white focus:border-[#0066cc]/40 focus:ring-2 focus:ring-[#0066cc]/20"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      {t("account.profile.phone")}
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={userData.phone}
                      onChange={handleInputChange}
                      className="h-11 rounded-xl bg-gray-50/80 border border-gray-200/80 text-gray-800 text-sm placeholder:text-gray-400
                                 transition-all duration-200 focus:bg-white focus:border-[#0066cc]/40 focus:ring-2 focus:ring-[#0066cc]/20"
                    />
                  </div>

                  {/* T.C. Kimlik No */}
                  <div className="space-y-1.5 pt-3 border-t border-gray-100">
                    <Label htmlFor="tcNo" className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      {t("account.profile.tcNo", "Identification Number")}
                    </Label>
                    <Input
                      id="tcNo"
                      value={userData.tcNo}
                      className="h-11 rounded-xl bg-gray-50/50 border border-gray-100 text-gray-400 text-sm italic cursor-not-allowed"
                      disabled
                    />
                    <p className="text-[10px] text-gray-400 ml-1">{t("account.profile.tcNote")}</p>
                  </div>

                  <div className="pt-2">
                    <Button
                      className="rounded-xl text-white text-sm font-semibold px-8 h-10 relative overflow-hidden group transition-all duration-300 hover:shadow-lg"
                      style={{
                        background: "linear-gradient(135deg, #003366 0%, #004080 50%, #003366 100%)",
                        backgroundSize: "200% 200%",
                      }}
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      <span className="relative">{t("account.profile.saveBtn")}</span>
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            {/* ── Change Password ─────────────────────── */}
            <div
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
              style={{
                ...stagger(2),
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,51,102,0.04)",
              }}
            >
              <div className="px-7 py-5 border-b border-gray-100/80 flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-amber-400" />
                <h3 className="text-lg font-semibold text-[#003366] tracking-tight">
                  {t("account.password.title")}
                </h3>
              </div>
              <div className="p-7">
                <form className="space-y-5">
                  {/* Current password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="currentPassword" className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      {t("account.password.current")}
                    </Label>
                    <div className="relative flex items-center">
                      <div className="absolute left-0 w-11 h-11 flex items-center justify-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="currentPassword"
                        type={showCurrentPw ? "text" : "password"}
                        className="h-11 pl-11 pr-11 rounded-xl bg-gray-50/80 border border-gray-200/80 text-gray-800 text-sm
                                   transition-all duration-200 focus:bg-white focus:border-[#0066cc]/40 focus:ring-2 focus:ring-[#0066cc]/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute right-0 h-11 w-11 flex items-center justify-center text-gray-400 hover:text-[#003366] transition-colors"
                      >
                        {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="newPassword" className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      {t("account.password.new")}
                    </Label>
                    <div className="relative flex items-center">
                      <div className="absolute left-0 w-11 h-11 flex items-center justify-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="newPassword"
                        type={showNewPw ? "text" : "password"}
                        className="h-11 pl-11 pr-11 rounded-xl bg-gray-50/80 border border-gray-200/80 text-gray-800 text-sm
                                   transition-all duration-200 focus:bg-white focus:border-[#0066cc]/40 focus:ring-2 focus:ring-[#0066cc]/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-0 h-11 w-11 flex items-center justify-center text-gray-400 hover:text-[#003366] transition-colors"
                      >
                        {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Requirements box */}
                  <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="text-xs text-blue-800 leading-relaxed">
                      <p className="font-semibold mb-1.5">{t("account.password.mustContain")}</p>
                      <div className="space-y-1 text-blue-700">
                        <p className="flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-blue-400" />
                          {t("account.password.req1")}
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-blue-400" />
                          {t("account.password.req2")}
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-blue-400" />
                          {t("account.password.req3")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="rounded-xl text-white text-sm font-semibold px-8 h-10 relative overflow-hidden group transition-all duration-300 hover:shadow-lg"
                    style={{
                      background: "linear-gradient(135deg, #003366 0%, #004080 50%, #003366 100%)",
                      backgroundSize: "200% 200%",
                    }}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <span className="relative">{t("account.password.updateBtn")}</span>
                  </Button>
                </form>
              </div>
            </div>
          </div>

          {/* ── Right column (1/3) ────────────────────── */}
          <div className="lg:col-span-1 space-y-7">
            {/* ── Account Status ──────────────────────── */}
            <div
              className="rounded-2xl border border-gray-100 overflow-hidden"
              style={{
                ...stagger(1),
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <div
                className="px-6 py-5 text-white"
                style={{ background: "linear-gradient(135deg, #003366 0%, #004d99 100%)" }}
              >
                <div className="flex items-center gap-2.5">
                  <User className="h-5 w-5 opacity-80" />
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
                    style={{ background: "linear-gradient(135deg, #003366, #004d99)" }}
                  >
                    {userData.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
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

            {/* ── Notification Preferences ─────────── */}
            <div
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
              style={{
                ...stagger(2),
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <div className="px-6 py-5 border-b border-gray-100/80 flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-[#003366]" />
                <h3 className="text-[15px] font-semibold text-[#003366] tracking-tight flex items-center gap-2">
                  <Settings className="h-4 w-4 text-gray-400" />
                  {t("account.prefs.title", { defaultValue: "Preferences" })}
                </h3>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Email Notifications</span>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Enabled</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">SMS Notifications</span>
                  <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">Disabled</span>
                </div>
                <p className="text-[11px] text-gray-400 pt-1">
                  Language can be changed from the header.
                </p>
              </div>
            </div>

            {/* ── Quick Links ─────────────────────────── */}
            <div
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
              style={{
                ...stagger(3),
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <div className="divide-y divide-gray-100">
                <Link
                  to="/main"
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group"
                >
                  <span className="text-sm text-gray-700 font-medium group-hover:text-[#003366] transition-colors">
                    Back to Dashboard
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </Link>
                <Link
                  to="/reservations"
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group"
                >
                  <span className="text-sm text-gray-700 font-medium group-hover:text-[#003366] transition-colors">
                    My Reservations
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </Link>
                <Link
                  to="/book-room"
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group"
                >
                  <span className="text-sm text-gray-700 font-medium group-hover:text-[#003366] transition-colors">
                    Book a Room
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </Link>
              </div>
            </div>

            {/* ── Logout ──────────────────────────────── */}
            <div
              className="rounded-2xl border border-red-100 bg-white overflow-hidden"
              style={{
                ...stagger(4),
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
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