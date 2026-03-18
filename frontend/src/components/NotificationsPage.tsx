import React, { useEffect, useState } from "react";
import { userFetch } from "../api/userFetch";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Footer } from "./layout/Footer";
import { PageHeader } from "./ui/page-header";
import {
  Bell,
  User,
  LayoutGrid,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Calendar,
  Info,
  ChevronRight,
} from "lucide-react";
import {
  Select as UISelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { NotificationBell } from "./NotificationBell";

/* ─── Inject animation styles ───────────────────────── */
if (!document.getElementById("notif-anim")) {
  const s = document.createElement("style");
  s.id = "notif-anim";
  s.textContent = `
    @keyframes notifFadeUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(24px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes underlineGrow {
      from { transform: scaleX(0); }
      to   { transform: scaleX(1); }
    }
    @keyframes bellSwing {
      0%, 100% { transform: rotate(0deg); }
      20%       { transform: rotate(15deg); }
      40%       { transform: rotate(-12deg); }
      60%       { transform: rotate(8deg); }
      80%       { transform: rotate(-5deg); }
    }
    @keyframes dotPop {
      0%   { transform: scale(0); opacity: 0; }
      60%  { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(1);   opacity: 1; }
    }
  `;
  document.head.appendChild(s);
}

type Notification = {
  id: string;
  type: "info" | "success" | "error" | "warning" | "reminder";
  title: string;
  titleTR: string;
  message: string;
  messageTR: string;
  timestamp: string;
  reservationId: number;
  read: boolean;
};

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; bg: string; dot: string; ring: string }> = {
  info:     { icon: Info,         color: "#3b82f6",  bg: "#eff6ff",  dot: "#3b82f6",  ring: "rgba(59,130,246,0.15)" },
  success:  { icon: CheckCircle2, color: "#22c55e",  bg: "#f0fdf4",  dot: "#22c55e",  ring: "rgba(34,197,94,0.15)"  },
  error:    { icon: XCircle,      color: "#ef4444",  bg: "#fef2f2",  dot: "#ef4444",  ring: "rgba(239,68,68,0.15)"  },
  warning:  { icon: AlertCircle,  color: "#f59e0b",  bg: "#fffbeb",  dot: "#f59e0b",  ring: "rgba(245,158,11,0.15)" },
  reminder: { icon: Calendar,     color: "#8b5cf6",  bg: "#f5f3ff",  dot: "#8b5cf6",  ring: "rgba(139,92,246,0.15)" },
};

function timeAgo(timestamp: string, t: (key: string, opts?: object) => string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diff = now.getTime() - then.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("notifications.timeAgo.justNow");
  if (mins < 60) return t("notifications.timeAgo.minutesAgo", { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("notifications.timeAgo.hoursAgo", { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t("notifications.timeAgo.daysAgo", { count: days });
  return then.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function NotificationsPage() {
  const { t, i18n } = useTranslation();
  const userId = Number(localStorage.getItem("userId"));
  const userName = localStorage.getItem("userName") || "User";
  const currentLang = i18n.language?.toUpperCase() === "TR" ? "TR" : "EN";
  const isTR = currentLang === "TR";
  const switchLanguage = (val: string) => i18n.changeLanguage(val.toLowerCase());

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");

  useEffect(() => {
    (async () => {
      if (!userId || isNaN(userId)) { setLoading(false); return; }
      try {
        const res = await userFetch(`/ehp/api/notifications/user/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const filtered = notifications.filter(n => {
    const typeMatch = filterType === "all" || n.type === filterType;
    const readMatch =
      readFilter === "all"
        ? true
        : readFilter === "unread"
        ? !n.read
        : n.read;
    return typeMatch && readMatch;
  });

  const filterTabs = [
    { key: "all",      label: t("notifications.filter.all",      "All") },
    { key: "success",  label: t("notifications.filter.approved",  "Approved") },
    { key: "error",    label: t("notifications.filter.rejected",  "Rejected") },
    { key: "warning",  label: t("notifications.filter.warnings",  "Warnings") },
    { key: "info",     label: t("notifications.filter.info",      "Info") },
    { key: "reminder", label: t("notifications.filter.reminders", "Reminders") },
  ];

  const readFilterTabs: Array<{ key: "all" | "unread" | "read"; label: string }> = [
    { key: "all",    label: t("notifications.readFilter.all",    "All") },
    { key: "unread", label: t("notifications.readFilter.unread", "Unread") },
    { key: "read",   label: t("notifications.readFilter.read",   "Read") },
  ];

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #f0f4f8 0%, #e8eef5 50%, #f0f4f8 100%)" }}>

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
                <h1 className="text-white text-lg font-light tracking-[7px] uppercase hidden sm:block"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
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
              <UISelect value={currentLang} onValueChange={switchLanguage}>
                <SelectTrigger className="w-[58px] h-8 bg-white/6 border-white/18 text-white text-xs font-semibold hover:bg-white/10 focus:ring-0 rounded-lg">
                  <SelectValue placeholder={currentLang} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EN">EN</SelectItem>
                  <SelectItem value="TR">TR</SelectItem>
                </SelectContent>
              </UISelect>
              <NotificationBell lang={currentLang} />
              <Link to="/profile" className="flex items-center gap-2.5 pl-1 group">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:shadow-[0_0_12px_rgba(255,255,255,0.12)]"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.14)" }}
                >
                  <User className="h-4 w-4 text-white/70" />
                </div>
                <span className="text-xs text-white/70 group-hover:text-white font-medium hidden md:block max-w-[100px] truncate transition-colors">
                  {userName}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <PageHeader
        title={t("notifications.pageTitle", "Notifications")}
        subtitle={t("notifications.subtitle", "Stay updated with your latest reservation status and campus alerts.")}
        category="EDU HOTEL"
        icon={<Bell className="h-8 w-8" />}
      />

      {/* ═══ MAIN ═════════════════════════════════════════ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Read/Unread filter tabs */}
        <div className="mb-4">
          <div
            className="inline-flex items-center gap-1 bg-white rounded-2xl border border-slate-100 p-1.5 shadow-sm"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
          >
            {readFilterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setReadFilter(tab.key)}
                className="relative px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200"
                style={{
                  color: readFilter === tab.key ? "white" : "#94a3b8",
                  background: readFilter === tab.key ? "linear-gradient(135deg, #001a3a 0%, #003366 100%)" : "transparent",
                }}
              >
                {tab.label}
                {tab.key === "unread" && unreadCount > 0 && (
                  <span
                    className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-black"
                    style={{
                      background: readFilter === "unread" ? "rgba(255,255,255,0.2)" : "#ef4444",
                      color: "white",
                      animation: "dotPop 0.3s ease-out both",
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Type filter tabs */}
        <div
          className="flex flex-wrap items-center gap-1.5 bg-white rounded-2xl border border-slate-100 p-1.5 mb-7"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
        >
          {filterTabs.map(tab => {
            const cfg = TYPE_CONFIG[tab.key];
            const count = tab.key === "all" ? notifications.length : notifications.filter(n => n.type === tab.key).length;
            const isActive = filterType === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilterType(tab.key)}
                className="relative px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5"
                style={{
                  background: isActive
                    ? (cfg ? cfg.bg : "#eff6ff")
                    : "transparent",
                  color: isActive
                    ? (cfg ? cfg.color : "#003366")
                    : "#94a3b8",
                  border: isActive
                    ? `1.5px solid ${cfg ? cfg.dot + "40" : "rgba(0,51,102,0.2)"}`
                    : "1.5px solid transparent",
                }}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black"
                    style={{
                      background: isActive ? (cfg ? cfg.dot : "#003366") : "#e2e8f0",
                      color: isActive ? "white" : "#94a3b8",
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Notification list */}
        <div className="space-y-3">
          {loading ? (
            <div
              className="bg-white rounded-3xl border border-slate-100 p-16 text-center"
              style={{ boxShadow: "0 4px 6px -1px rgba(0,0,0,0.04)" }}
            >
              <div className="w-10 h-10 border-2 border-[#003366]/20 border-t-[#003366] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-slate-400 font-medium">{t("common.loading", "Loading...")}</p>
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-slate-100 p-16 text-center"
              style={{ boxShadow: "0 4px 6px -1px rgba(0,0,0,0.04)" }}
            >
              {/* Empty state illustration */}
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div
                  className="w-24 h-24 rounded-3xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)" }}
                >
                  <Bell className="h-10 w-10 text-slate-300" />
                </div>
                {/* Decorative rings */}
                <div className="absolute -inset-3 rounded-[28px] border-2 border-dashed border-slate-100" />
                <div className="absolute -inset-6 rounded-[36px] border border-slate-100/60" />
              </div>
              <p className="text-lg font-bold text-slate-600 mb-2">
                {t("notifications.empty.title", "No notifications yet")}
              </p>
              <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
                {t("notifications.empty.subtitle", "Reservation updates and alerts will appear here when available.")}
              </p>
              <Link
                to="/main"
                className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:shadow-lg"
                style={{ background: "linear-gradient(135deg, #003366 0%, #0052a3 100%)" }}
              >
                {t("notifications.empty.backToHome", "Back to Home")}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </motion.div>
          ) : (
            <AnimatePresence>
              {filtered.map((n, idx) => {
                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
                const Icon = cfg.icon;
                const title = isTR ? n.titleTR : n.title;
                const message = isTR ? n.messageTR : n.message;

                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.3, delay: idx * 0.04, ease: "easeOut" }}
                    className="group relative bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:translate-x-0.5"
                    style={{
                      boxShadow: n.read
                        ? "0 1px 3px rgba(0,0,0,0.04)"
                        : "0 4px 16px rgba(0,0,0,0.06)",
                      border: `1px solid ${n.read ? "rgba(226,232,240,0.8)" : "rgba(203,213,225,0.8)"}`,
                    }}
                  >
                    {/* Left accent bar */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-all duration-200 group-hover:w-1.5"
                      style={{ background: cfg.dot }}
                    />

                    <div className="pl-5 pr-5 py-4 flex items-start gap-4">
                      {/* Unread indicator dot */}
                      {!n.read && (
                        <div
                          className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{
                            background: cfg.dot,
                            boxShadow: `0 0 0 3px ${cfg.ring}`,
                            animation: "dotPop 0.4s ease-out both",
                          }}
                        />
                      )}

                      {/* Icon */}
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-105"
                        style={{
                          background: cfg.bg,
                          boxShadow: `0 2px 8px ${cfg.ring}`,
                        }}
                      >
                        <Icon className="h-5 w-5" style={{ color: cfg.color }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3
                            className="text-[14px] leading-snug tracking-tight"
                            style={{
                              fontWeight: n.read ? 500 : 700,
                              color: n.read ? "#64748b" : "#0f172a",
                            }}
                          >
                            {title}
                          </h3>
                          <span className="text-[11px] text-slate-400 font-medium flex-shrink-0 tabular-nums mt-0.5">
                            {timeAgo(n.timestamp, t)}
                          </span>
                        </div>
                        <p
                          className="text-[13px] leading-relaxed mb-2.5"
                          style={{ color: n.read ? "#94a3b8" : "#475569" }}
                        >
                          {message}
                        </p>
                        <Link
                          to="/reservations"
                          className="inline-flex items-center gap-1 text-[12px] font-bold transition-all duration-200 hover:gap-1.5"
                          style={{ color: cfg.color }}
                        >
                          {t("notifications.viewReservation", "View Reservation")}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Count footer */}
        {!loading && filtered.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center text-[12px] text-slate-400 mt-8 font-medium"
          >
            {t("notifications.showingCount", { count: filtered.length, defaultValue: `Showing ${filtered.length} notification${filtered.length !== 1 ? "s" : ""}` })}
          </motion.p>
        )}
      </main>

      <Footer />
    </div>
  );
}
