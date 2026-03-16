import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Footer } from "./layout/Footer";
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

/* ─── Animation ─────────────────────────────────────────── */
const _style = document.getElementById("notif-anim") ?? (() => {
  const s = document.createElement("style");
  s.id = "notif-anim";
  s.textContent = `@keyframes notifFadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`;
  document.head.appendChild(s);
  return s;
})();

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

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; bg: string; dot: string }> = {
  info:     { icon: Info,         color: "text-blue-600",    bg: "bg-blue-50",    dot: "#3b82f6" },
  success:  { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", dot: "#22c55e" },
  error:    { icon: XCircle,      color: "text-red-600",     bg: "bg-red-50",     dot: "#ef4444" },
  warning:  { icon: AlertCircle,  color: "text-amber-600",   bg: "bg-amber-50",   dot: "#f59e0b" },
  reminder: { icon: Calendar,     color: "text-violet-600",  bg: "bg-violet-50",  dot: "#8b5cf6" },
};

function timeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diff = now.getTime() - then.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function NotificationsPage() {
  const { i18n } = useTranslation();
  const userId = Number(localStorage.getItem("userId"));
  const userName = localStorage.getItem("userName") || "User";
  const currentLang = i18n.language?.toUpperCase() === "TR" ? "TR" : "EN";
  const isTR = currentLang === "TR";
  const switchLanguage = (val: string) => i18n.changeLanguage(val.toLowerCase());

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    (async () => {
      if (!userId || isNaN(userId)) { setLoading(false); return; }
      try {
        const res = await fetch(`/ehp/api/notifications/user/${userId}`);
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

  const filtered = notifications.filter(n => filterType === "all" || n.type === filterType);

  const stagger = (i: number): React.CSSProperties => ({
    animation: `notifFadeUp 0.4s ease-out ${0.05 + i * 0.04}s both`,
  });

  const filterTabs = [
    { key: "all",      label: isTR ? "Tümü"      : "All" },
    { key: "success",  label: isTR ? "Onaylanan"  : "Approved" },
    { key: "error",    label: isTR ? "Reddedilen" : "Rejected" },
    { key: "warning",  label: isTR ? "Uyarılar"   : "Warnings" },
    { key: "info",     label: isTR ? "Bilgi"       : "Info" },
    { key: "reminder", label: isTR ? "Hatırlatma" : "Reminders" },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafb]">
      {/* ═══ HEADER ═══════════════════════════════════════ */}
      <header
        className="sticky top-0 z-50 border-b border-white/10"
        style={{ background: "rgba(0,51,102,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
      >
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link to="/main" className="flex items-center gap-4">
                <div className="border border-[#c9a84c] px-3 py-1.5 rounded">
                  <div className="text-[11px] font-semibold text-[#c9a84c] leading-tight">Sabancı</div>
                  <div className="text-[10px] text-[#c9a84c]/80 leading-tight">Üniversitesi</div>
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
            <h1 className="sm:hidden text-white text-base font-bold tracking-[4px]">EDU HOTEL</h1>
            <div className="flex items-center gap-3 sm:gap-5">
              <Link
                to="/main"
                className="hidden md:flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors tracking-wide"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                {isTR ? "Ana Sayfa" : "Main Page"}
              </Link>
              <UISelect value={currentLang} onValueChange={switchLanguage}>
                <SelectTrigger className="w-[58px] h-8 bg-white/5 border-white/20 text-white text-xs font-semibold hover:bg-white/10 focus:ring-0 rounded-lg">
                  <SelectValue placeholder={currentLang} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EN">EN</SelectItem>
                  <SelectItem value="TR">TR</SelectItem>
                </SelectContent>
              </UISelect>
              <NotificationBell lang={currentLang} />
              <Link to="/profile" className="flex items-center gap-2.5 pl-1 group">
                <div className="w-8 h-8 rounded-lg bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
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

      {/* ═══ MAIN ═════════════════════════════════════════ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        {/* Title */}
        <div className="mb-8" style={stagger(0)}>
          <h1 className="text-[28px] font-semibold text-[#003366] tracking-tight mb-1">
            {isTR ? "Bildirimler" : "Notifications"}
          </h1>
          <p className="text-[15px] text-gray-500">
            {isTR
              ? `${unreadCount} okunmamış bildirim`
              : `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Filter tabs */}
        <div
          className="flex flex-wrap items-center gap-1.5 bg-white rounded-xl border border-gray-100 p-1.5 mb-6"
          style={stagger(1)}
        >
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === tab.key
                  ? "bg-[#003366] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              {tab.key !== "all" && (
                <span className={`ml-1 ${filterType === tab.key ? "text-white/60" : "text-gray-400"}`}>
                  {notifications.filter(n => n.type === tab.key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notification list */}
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center" style={stagger(2)}>
              <div className="w-8 h-8 border-2 border-[#003366] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">{isTR ? "Yükleniyor..." : "Loading..."}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center" style={stagger(2)}>
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <Bell className="h-7 w-7 text-gray-300" />
              </div>
              <p className="text-base font-semibold text-gray-700 mb-1">
                {isTR ? "Bildirim yok" : "No notifications"}
              </p>
              <p className="text-sm text-gray-500">
                {isTR ? "Yeni bildirimler burada görünecek." : "New notifications will appear here."}
              </p>
            </div>
          ) : (
            filtered.map((n, idx) => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
              const Icon = cfg.icon;
              const title = isTR ? n.titleTR : n.title;
              const message = isTR ? n.messageTR : n.message;

              return (
                <div
                  key={n.id}
                  className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-md ${
                    n.read ? "border-gray-100" : "border-gray-200"
                  }`}
                  style={{ ...stagger(idx + 2), borderLeft: `3px solid ${cfg.dot}` }}
                >
                  <div className="px-5 py-4 flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl ${cfg.bg} ${cfg.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className={`text-[14px] font-semibold ${n.read ? "text-gray-700" : "text-gray-900"}`}>
                          {title}
                          {!n.read && (
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 ml-2 -translate-y-0.5" />
                          )}
                        </h3>
                        <span className="text-[11px] text-gray-400 font-medium flex-shrink-0">
                          {timeAgo(n.timestamp)}
                        </span>
                      </div>
                      <p className={`text-[13px] leading-relaxed ${n.read ? "text-gray-500" : "text-gray-600"}`}>
                        {message}
                      </p>
                      <Link
                        to="/reservations"
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#003366] hover:text-[#004d99] mt-2 transition-colors"
                      >
                        {isTR ? "Rezervasyonu Görüntüle" : "View Reservation"}
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Count */}
        {!loading && filtered.length > 0 && (
          <p className="text-center text-[12px] text-gray-400 mt-6" style={stagger(filtered.length + 3)}>
            {isTR
              ? `${filtered.length} bildirim gösteriliyor`
              : `Showing ${filtered.length} notification${filtered.length !== 1 ? "s" : ""}`}
          </p>
        )}
      </main>

      <Footer />
    </div>
  );
}
