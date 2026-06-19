import { useEffect, useState, useRef, useMemo } from "react";
import { userFetch } from "../api/userFetch";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Calendar,
  Info,
  ChevronRight,
  CheckCheck,
} from "lucide-react";
import { loadSeenIds, markSeen, markManySeen, subscribeSeenChanges } from "../lib/notificationsSeen";

type Notification = {
  id: string;
  type: string;
  title: string;
  titleTR: string;
  message: string;
  messageTR: string;
  timestamp: string;
  reservationId: number;
  read: boolean;
};

const TYPE_ICONS: Record<string, { icon: typeof Bell; dot: string }> = {
  info:     { icon: Info,         dot: "#3b82f6" },
  success:  { icon: CheckCircle2, dot: "#22c55e" },
  error:    { icon: XCircle,      dot: "#ef4444" },
  warning:  { icon: AlertCircle,  dot: "#f59e0b" },
  reminder: { icon: Calendar,     dot: "#8b5cf6" },
};

function timeAgo(timestamp: string, t: any): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("notifications.timeAgo.justNow");
  if (mins < 60) return t("notifications.timeAgo.minutesAgo", { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("notifications.timeAgo.hoursAgo", { count: hours });
  return t("notifications.timeAgo.daysAgo", { count: Math.floor(hours / 24) });
}

export function NotificationBell({ lang = "EN" }: { lang?: "EN" | "TR" }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);
  const isTR = lang === "TR" || i18n.language?.toLowerCase().startsWith("tr");

  const userId = Number(localStorage.getItem("userId"));

  useEffect(() => {
    if (!userId || isNaN(userId)) return;
    setSeenIds(loadSeenIds(userId));
    const unsub = subscribeSeenChanges(userId, () => setSeenIds(loadSeenIds(userId)));
    return unsub;
  }, [userId]);

  useEffect(() => {
    if (!userId || isNaN(userId)) return;
    (async () => {
      try {
        const res = await userFetch(`/ehp/api/notifications/user/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setNotifications((data.notifications || []).slice(0, 8));
        }
      } catch {}
    })();
  }, [userId]);

  // Compute unread count using locally persisted seen set as an override.
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read && !seenIds.has(n.id)).length,
    [notifications, seenIds]
  );

  const handleNotificationClick = (n: Notification) => {
    if (!userId || isNaN(userId)) return;
    if (!seenIds.has(n.id)) markSeen(userId, n.id);
    setOpen(false);
    navigate("/reservations");
  };

  const handleMarkAllRead = () => {
    if (!userId || isNaN(userId)) return;
    const unreadIds = notifications.filter((n) => !n.read && !seenIds.has(n.id)).map((n) => n.id);
    if (unreadIds.length > 0) markManySeen(userId, unreadIds);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
      >
        <Bell className="h-4 w-4 text-white/70" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-[9px] text-white font-bold rounded-full flex items-center justify-center ring-2 ring-[#003366] px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
          style={{ animation: "notifFadeUp 0.15s ease-out" }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              {t("notificationBell.title", "Notifications")}
            </h3>
            {unreadCount > 0 && (
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {unreadCount} {t("notificationBell.new", "new")}
              </span>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">
                  {t("notificationBell.empty", "No notifications")}
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const cfg = TYPE_ICONS[n.type] || TYPE_ICONS.info;
                const title = isTR ? n.titleTR : n.title;
                const isUnread = !n.read && !seenIds.has(n.id);

                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors ${
                      isUnread ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: cfg.dot }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-[12px] font-semibold truncate ${isUnread ? "text-gray-900" : "text-gray-700"}`}>
                            {title}
                          </p>
                          <span className="text-[10px] text-gray-400 flex-shrink-0">
                            {timeAgo(n.timestamp, t)}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                          {isTR ? n.messageTR : n.message}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-gray-100 bg-gray-50/50 flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center justify-center gap-1 text-[11px] font-semibold text-gray-600 hover:text-[#003366] transition-colors px-2.5 py-1.5 rounded-md hover:bg-white"
              >
                <CheckCheck className="h-3 w-3" />
                {t("notificationBell.markAllRead", "Mark all as read")}
              </button>
            )}
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#003366] hover:text-[#004d99] transition-colors"
            >
              {t("notificationBell.viewAll", "View All Notifications")}
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
