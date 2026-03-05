// src/components/admin/AdminDashboard.tsx
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Calendar,
  Bed,
  Users,
  CreditCard,
  UserX,
  FileText,
  Shield,
  Settings,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { DashboardPage } from "./pages/DashboardPage";
import { ReservationsPage } from "./pages/ReservationsPage";
import { CalendarPage } from "./pages/CalendarPage";
import { RoomsPage } from "./pages/RoomsPage";
import { GuestsPage } from "./pages/GuestsPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { BlacklistPage } from "./pages/BlacklistPage";
import { ReportsPage } from "./pages/ReportsPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { SettingsPage } from "./pages/SettingsPage";

/* ═══════════════════════════════════════════════════════════
   Inject animations
   ═══════════════════════════════════════════════════════════ */
const _style = document.getElementById("admin-anim") ?? (() => {
  const s = document.createElement("style");
  s.id = "admin-anim";
  s.textContent = `
    @keyframes adminFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes adminPulse { 0%,100% { opacity:1; } 50% { opacity:.6; } }
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
  `;
  document.head.appendChild(s);
  return s;
})();

type PageType =
  | "dashboard"
  | "reservations"
  | "calendar"
  | "rooms"
  | "guests"
  | "payments"
  | "blacklist"
  | "reports"
  | "admin-users"
  | "settings";

export function AdminDashboard() {
  const { t, i18n } = useTranslation("admin");
  const initialLang = i18n.language?.toLowerCase().startsWith("tr") ? "TR" : "EN";

  const [activePage, setActivePage] = useState<PageType>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [language, setLanguage] = useState<"EN" | "TR">(initialLang);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLanguageChange = (lng: "en" | "tr") => {
    setLanguage(lng.toUpperCase() as "EN" | "TR");
    i18n.changeLanguage(lng);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = () => { setShowNotifications(false); setShowProfile(false); };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const menuSections = [
    {
      label: t("menu.sectionMain", "Main"),
      items: [
        { id: "dashboard" as PageType, label: t("menu.dashboard"), icon: LayoutDashboard },
        { id: "reservations" as PageType, label: t("menu.reservations"), icon: Calendar, badge: null },
        { id: "calendar" as PageType, label: t("menu.calendar"), icon: Calendar },
      ],
    },
    {
      label: t("menu.sectionManage", "Management"),
      items: [
        { id: "rooms" as PageType, label: t("menu.rooms"), icon: Bed },
        { id: "guests" as PageType, label: t("menu.guests"), icon: Users },
        { id: "payments" as PageType, label: t("menu.payments"), icon: CreditCard },
        { id: "blacklist" as PageType, label: t("menu.blacklist"), icon: UserX },
      ],
    },
    {
      label: t("menu.sectionSystem", "System"),
      items: [
        { id: "reports" as PageType, label: t("menu.reports"), icon: FileText },
        { id: "admin-users" as PageType, label: t("menu.adminUsers"), icon: Shield },
        { id: "settings" as PageType, label: t("menu.settings"), icon: Settings },
      ],
    },
  ];

  const pageTitles: Record<PageType, string> = {
    dashboard: t("pages.dashboard.title"),
    reservations: t("pages.reservations.title", "Reservations"),
    calendar: t("pages.calendar.title", "Calendar"),
    rooms: t("pages.rooms.title", "Rooms"),
    guests: t("pages.guests.title", "Guests"),
    payments: t("pages.payments.title", "Payments"),
    blacklist: t("pages.blacklist.title", "Blacklist"),
    reports: "Reports",
    "admin-users": t("pages.adminUsers.title", "Admin Users"),
    settings: t("pages.settings.title", "Settings"),
  };

  const pageDescriptions: Record<PageType, string> = {
    dashboard: "Overview of hotel operations and key metrics",
    reservations: "Manage reservation requests, approvals, and assignments",
    calendar: "Monthly room occupancy and booking timeline",
    rooms: "Room inventory, status, and floor plan management",
    guests: "Guest profiles, history, and blacklist management",
    payments: "Payment verification queue and receipt management",
    blacklist: "Blocked users and access restrictions",
    reports: "Generate and download operational reports",
    "admin-users": "System administrators and role management",
    settings: "Hotel configuration and system preferences",
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className={`flex items-center ${sidebarCollapsed ? "justify-center px-2" : "px-5"} h-16 border-b border-white/[0.06]`}>
        {!sidebarCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white text-xs font-bold">E</span>
            </div>
            <div>
              <h2 className="text-white text-sm font-semibold tracking-wide">EDU HOTEL</h2>
              <p className="text-[10px] text-white/40 font-medium tracking-wider uppercase">Admin Panel</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] flex items-center justify-center">
            <span className="text-white text-xs font-bold">E</span>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {menuSections.map((section, sIdx) => (
          <div key={sIdx} className={sIdx > 0 ? "mt-6" : ""}>
            {!sidebarCollapsed && (
              <p className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.15em] px-3 mb-2">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActivePage(item.id); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 rounded-lg transition-all duration-200 relative group
                      ${sidebarCollapsed ? "px-2.5 py-2.5 justify-center" : "px-3 py-2.5"}
                      ${isActive
                        ? "bg-white/[0.08] text-white"
                        : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
                      }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-blue-400" />
                    )}
                    <Icon className={`h-[18px] w-[18px] flex-shrink-0 transition-colors ${isActive ? "text-blue-400" : ""}`} />
                    {!sidebarCollapsed && (
                      <span className="text-[13px] font-medium">{item.label}</span>
                    )}
                    {sidebarCollapsed && (
                      <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
                        {item.label}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse button */}
      <div className="px-3 py-3 border-t border-white/[0.06]">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all text-xs"
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span className="font-medium">Collapse</span></>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#f8f9fb]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* ═══ SIDEBAR (Desktop) ═══ */}
      <aside
        className={`hidden lg:flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out ${sidebarCollapsed ? "w-[68px]" : "w-[240px]"}`}
        style={{ background: "#0f172a" }}
      >
        <SidebarContent />
      </aside>

      {/* ═══ MOBILE OVERLAY ═══ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[260px] flex flex-col" style={{ background: "#0f172a" }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ═══ MAIN AREA ═══ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* ── Header ──────────────────────────── */}
        <header className="h-16 bg-white border-b border-gray-200/60 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle */}
            <button
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>

            {/* Page title + breadcrumb */}
            <div>
              <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
                <span>Admin</span>
                <span>/</span>
                <span className="text-gray-600">{pageTitles[activePage]}</span>
              </div>
              <h1 className="text-gray-900 text-[17px] font-semibold tracking-tight -mt-0.5">
                {pageTitles[activePage]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search (desktop) */}
            <div className="hidden md:block">
              <div className="flex items-center h-9 w-56 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-300 transition-all">
                <div className="flex items-center justify-center w-9 h-9 flex-shrink-0">
                  <Search className="h-3.5 w-3.5 text-gray-400" />
                </div>
                <input type="text" placeholder={t("common.searchPlaceholder", "Search...")}
                  className="flex-1 h-full bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none pr-3" />
              </div>
            </div>

            {/* Language */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              {(["en", "tr"] as const).map((lng) => (
                <button
                  key={lng}
                  onClick={() => handleLanguageChange(lng)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    language === lng.toUpperCase()
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {lng.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Notifications */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
                className="relative w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <Bell className="h-[18px] w-[18px] text-gray-500" />
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-[9px] text-white font-bold rounded-full flex items-center justify-center">3</span>
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden" style={{ animation: "adminFadeIn 0.15s ease-out" }}>
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">{t("notifications.title", "Notifications")}</h3>
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">3 new</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {[
                      { text: "New reservation request from Elmar A.", time: "5 min ago", dot: "#f59e0b" },
                      { text: "Payment receipt uploaded for #3", time: "1 hour ago", dot: "#3b82f6" },
                      { text: "Check-out completed for Room 230", time: "2 hours ago", dot: "#22c55e" },
                    ].map((n, idx) => (
                      <div key={idx} className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition-colors">
                        <div className="flex items-start gap-2.5">
                          <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: n.dot }} />
                          <div>
                            <p className="text-[13px] text-gray-800">{n.text}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{n.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
                className="flex items-center gap-2.5 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#003366] to-[#0059b3] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  AD
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-gray-800">{t("profile.name", "Admin")}</p>
                  <p className="text-[10px] text-gray-400">{t("profile.role", "Super Admin")}</p>
                </div>
              </button>
              {showProfile && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden" style={{ animation: "adminFadeIn 0.15s ease-out" }}>
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{t("profile.name", "Admin")}</p>
                    <p className="text-xs text-gray-400">admin@sabanciuniv.edu</p>
                  </div>
                  <div className="py-1.5">
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-[13px] text-gray-700 transition-colors">
                      {t("profile.profileSettings", "Profile Settings")}
                    </button>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-[13px] text-gray-700 transition-colors">
                      {t("profile.changePassword", "Change Password")}
                    </button>
                  </div>
                  <div className="border-t border-gray-100 py-1.5">
                    <Link
                      to="/"
                      className="w-full text-left px-4 py-2 hover:bg-red-50 text-[13px] text-red-600 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      {t("profile.logout", "Logout")}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Page Content ────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8" style={{ animation: "adminFadeIn 0.3s ease-out" }} key={activePage}>
            {activePage === "dashboard" && <DashboardPage onNavigate={(page) => setActivePage(page as PageType)} />}
            {activePage === "reservations" && <ReservationsPage />}
            {activePage === "calendar" && <CalendarPage />}
            {activePage === "rooms" && <RoomsPage />}
            {activePage === "guests" && <GuestsPage />}
            {activePage === "payments" && <PaymentsPage />}
            {activePage === "blacklist" && <BlacklistPage />}
            {activePage === "reports" && <ReportsPage />}
            {activePage === "admin-users" && <AdminUsersPage />}
            {activePage === "settings" && <SettingsPage />}
          </div>
        </main>
      </div>
    </div>
  );
}