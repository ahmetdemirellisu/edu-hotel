// src/components/admin/AdminDashboard.tsx
import { useState } from "react";
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
  Home,
} from "lucide-react";
import { Input } from "../ui/input";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

// page components
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
  // i18n
  const { t, i18n } = useTranslation("admin");

  // infer initial language from i18n
  const initialLang =
    i18n.language && i18n.language.toLowerCase().startsWith("tr")
      ? "TR"
      : "EN";

  const [activePage, setActivePage] = useState<PageType>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [language, setLanguage] = useState<"EN" | "TR">(initialLang);

  const handleLanguageChange = (lng: "en" | "tr") => {
    setLanguage(lng.toUpperCase() as "EN" | "TR");
    i18n.changeLanguage(lng);
  };

  const menuItems = [
    {
      id: "dashboard" as PageType,
      label: t("menu.dashboard"),
      icon: LayoutDashboard,
    },
    {
      id: "reservations" as PageType,
      label: t("menu.reservations"),
      icon: Calendar,
      badge: 8,
    },
    {
      id: "calendar" as PageType,
      label: t("menu.calendar"),
      icon: Calendar,
    },
    { id: "rooms" as PageType, label: t("menu.rooms"), icon: Bed },
    { id: "guests" as PageType, label: t("menu.guests"), icon: Users },
    {
      id: "payments" as PageType,
      label: t("menu.payments"),
      icon: CreditCard,
    },
    {
      id: "blacklist" as PageType,
      label: t("menu.blacklist"),
      icon: UserX,
    },
    { id: "reports" as PageType, label: t("menu.reports"), icon: FileText },
    {
      id: "admin-users" as PageType,
      label: t("menu.adminUsers"),
      icon: Shield,
    },
    { id: "settings" as PageType, label: t("menu.settings"), icon: Settings },
  ];

  const pageTitles: Record<PageType, string> = {
    dashboard: t("pages.dashboard.title"),
    reservations: t("pages.reservations.title", "Reservation Management"),
    calendar: t("pages.calendar.title", "Calendar View"),
    rooms: t("pages.rooms.title", "Room Management"),
    guests: t("pages.guests.title", "Guest Management"),
    payments: t("pages.payments.title", "Payment Management"),
    blacklist: t("pages.blacklist.title", "Blacklist Management"),
    "admin-users": t(
      "pages.adminUsers.title",
      "Admin User Management"
    ),
    settings: t("pages.settings.title", "System Settings"),
  };

  const notificationItems = [
    {
      textKey: "notifications.newReservation",
      timeKey: "notifications.time.5min",
    },
    {
      textKey: "notifications.paymentReceived",
      timeKey: "notifications.time.1h",
    },
    {
      textKey: "notifications.checkout",
      timeKey: "notifications.time.2h",
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarCollapsed ? "w-20" : "w-64"
        } bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shadow-sm`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200 px-4">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2">
              <div className="bg-[#0066cc] p-2 rounded-lg">
                <Home className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-gray-900">EDU HOTEL</h2>
                <p className="text-xs text-gray-500">
                  {t("common.adminPanel")}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-[#0066cc] p-2 rounded-lg">
              <Home className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors relative ${
                  isActive
                    ? "bg-blue-50 text-[#0066cc] border-r-4 border-[#0066cc]"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="text-sm">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="h-12 border-t border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          )}
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-gray-900 text-xl">
              {pageTitles[activePage]}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder={t("common.searchPlaceholder")}
                className="pl-10 w-64"
              />
            </div>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleLanguageChange("en")}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  language === "EN"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => handleLanguageChange("tr")}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  language === "TR"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                TR
              </button>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  3
                </span>
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-gray-900">
                      {t("notifications.title")}
                    </h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notificationItems.map((notif, idx) => (
                      <div
                        key={idx}
                        className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                      >
                        <p className="text-sm text-gray-900">
                          {t(notif.textKey)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {t(notif.timeKey)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
              >
                <div className="w-8 h-8 bg-[#0066cc] rounded-full flex items-center justify-center text-white">
                  AD
                </div>
                <div className="text-left">
                  <p className="text-sm text-gray-900">
                    {t("profile.name")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t("profile.role")}
                  </p>
                </div>
              </button>
              {showProfile && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-2">
                    <button className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm text-gray-700">
                      {t("profile.profileSettings")}
                    </button>
                    <button className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm text-gray-700">
                      {t("profile.changePassword")}
                    </button>
                    <Link
                      to="/"
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm text-red-600 block"
                    >
                      {t("profile.logout")}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {activePage === "dashboard" && <DashboardPage />}
          {activePage === "reservations" && <ReservationsPage />}
          {activePage === "calendar" && <CalendarPage />}
          {activePage === "rooms" && <RoomsPage />}
          {activePage === "guests" && <GuestsPage />}
          {activePage === "payments" && <PaymentsPage />}
          {activePage === "blacklist" && <BlacklistPage />}
          {activePage === "reports" && <ReportsPage />}
          {activePage === "admin-users" && <AdminUsersPage />}
          {activePage === "settings" && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}
