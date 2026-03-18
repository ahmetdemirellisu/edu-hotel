// src/components/admin/pages/DashboardPage.tsx
import React, { useEffect, useState } from "react";
import { adminFetch } from "../../../api/adminFetch";
import {
  Clock,
  CheckCircle,
  Users,
  Bed,
  Calendar,
  FileText,
  ArrowRight,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  AlertCircle,
  BedDouble,
  Plus,
  LayoutDashboard,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { getAdminReservations, type Reservation } from "../../../api/reservations";

type DashboardNavTarget = "reservations" | "calendar" | "rooms" | "reports" | "payments";

interface DashboardPageProps {
  onNavigate: (page: DashboardNavTarget) => void;
}

interface DashboardStats {
  pendingReservations: number;
  approvedReservations: number;
  guestsStaying: number;
  availableRooms: number;
  occupiedRooms: number;
  maintenanceRooms: number;
  totalRooms: number;
  occupancyRate: number;
  expectedCheckinsToday: number;
}

type AdminReservation = Reservation & {
  user?: { name?: string | null; email?: string | null };
};

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { t } = useTranslation("admin");

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [latestReservations, setLatestReservations] = useState<AdminReservation[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingRes, setLoadingRes] = useState(true);

  // Load live dashboard stats
  useEffect(() => {
    (async () => {
      try {
        const res = await adminFetch("/ehp/api/admin/dashboard-stats");
        if (res.ok) setStats(await res.json());
      } catch (err) { console.error("Failed to load dashboard stats:", err); }
      finally { setLoadingStats(false); }
    })();
  }, []);

  // Load latest reservations
  useEffect(() => {
    (async () => {
      try {
        const data = await getAdminReservations() as AdminReservation[];
        const sorted = [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setLatestReservations(sorted.slice(0, 6));
      } catch (err) { console.error("Failed to load reservations:", err); }
      finally { setLoadingRes(false); }
    })();
  }, []);

  const formatDate = (iso: string) => iso?.slice(0, 10) || "—";

  const getInitials = (name: string) => {
    if (!name || name === "—") return "?";
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  };

  const AVATAR_COLORS = [
    "from-blue-500 to-blue-700",
    "from-violet-500 to-violet-700",
    "from-emerald-500 to-emerald-700",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-rose-700",
    "from-teal-500 to-teal-700",
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, { key: string; bg: string; text: string; dot: string }> = {
      PENDING:   { key: "reservations.statusLabels.pending",  bg: "bg-amber-50",   text: "text-amber-700",   dot: "#f59e0b" },
      APPROVED:  { key: "reservations.statusLabels.approved", bg: "bg-emerald-50", text: "text-emerald-700", dot: "#22c55e" },
      REJECTED:  { key: "reservations.statusLabels.rejected", bg: "bg-red-50",     text: "text-red-700",     dot: "#ef4444" },
      CANCELLED: { key: "reservations.statusLabels.canceled", bg: "bg-gray-100",   text: "text-gray-600",    dot: "#9ca3af" },
    };
    const cfg = map[status] || map.PENDING;
    return (
      <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
        {t(cfg.key)}
      </span>
    );
  };

  const paymentBadge = (ps: string) => {
    if (ps === "APPROVED") return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        {t("tables.paymentPaid")}
      </span>
    );
    if (ps === "PENDING_VERIFICATION") return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        {t("tables.paymentPending")}
      </span>
    );
    if (ps === "REJECTED") return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        {t("tables.paymentRejected")}
      </span>
    );
    return <span className="text-[10px] text-gray-400">—</span>;
  };

  /* ── Skeleton loader ─────────────────────── */
  const Skeleton = ({ w = "w-full", h = "h-4" }: { w?: string; h?: string }) => (
    <div className={`${w} ${h} bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg animate-pulse`}
      style={{ backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
  );

  const pendingPayments = latestReservations.filter(r => (r as any).paymentStatus === "PENDING_VERIFICATION").length;

  const kpiCards = [
    {
      label: t("pages.dashboard.pendingReservations", "Pending Requests"),
      value: stats?.pendingReservations,
      icon: Clock,
      gradient: "from-amber-400 to-orange-500",
      iconBg: "bg-amber-50",
      iconText: "text-amber-600",
      borderColor: "#f59e0b",
      action: () => onNavigate("reservations"),
      trend: "+2",
      trendUp: true,
    },
    {
      label: t("pages.dashboard.approvedReservations", "Approved"),
      value: stats?.approvedReservations,
      icon: CheckCircle,
      gradient: "from-emerald-400 to-green-500",
      iconBg: "bg-emerald-50",
      iconText: "text-emerald-600",
      borderColor: "#22c55e",
      action: () => onNavigate("reservations"),
      trend: "+5",
      trendUp: true,
    },
    {
      label: t("pages.dashboard.guestsStaying", "Guests Staying"),
      value: stats?.guestsStaying,
      icon: Users,
      gradient: "from-blue-400 to-blue-600",
      iconBg: "bg-blue-50",
      iconText: "text-blue-600",
      borderColor: "#3b82f6",
      action: undefined,
      trend: null,
      trendUp: true,
    },
    {
      label: t("pages.dashboard.availableRooms", "Available Rooms"),
      value: stats?.availableRooms,
      icon: Bed,
      gradient: "from-violet-400 to-violet-600",
      iconBg: "bg-violet-50",
      iconText: "text-violet-600",
      borderColor: "#8b5cf6",
      action: () => onNavigate("rooms"),
      trend: null,
      trendUp: true,
    },
  ];

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes dashIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dash-card { animation: dashIn 0.4s ease-out both; }
      `}</style>

      {/* ── Welcome Header ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" style={{ animation: "dashIn 0.3s ease-out" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#003366] to-[#0055aa] flex items-center justify-center shadow-lg">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {t("pages.dashboard.title", "Dashboard")}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigate("reservations")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#003366] to-[#0055aa] text-white text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150"
          >
            <Plus className="h-4 w-4" />
            {t("pages.dashboard.actions.createReservation", "New Reservation")}
          </button>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`dash-card bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-150 ${card.action ? "cursor-pointer hover:-translate-y-0.5" : ""} overflow-hidden relative`}
              style={{ animationDelay: `${idx * 0.07}s` }}
              onClick={card.action}
            >
              {/* Gradient accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} rounded-t-2xl`} />

              <div className="flex items-start justify-between mt-1">
                <div className="flex-1">
                  <p className="text-[12px] text-gray-500 font-medium uppercase tracking-wide">{card.label}</p>
                  {loadingStats ? (
                    <div className="mt-2"><Skeleton w="w-20" h="h-9" /></div>
                  ) : (
                    <p className="text-[38px] font-extrabold text-gray-900 leading-tight mt-1 tracking-tight">
                      {card.value ?? 0}
                    </p>
                  )}
                  {card.trend && !loadingStats && (
                    <div className="flex items-center gap-1 mt-1">
                      <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                      <span className="text-[11px] text-emerald-600 font-medium">{card.trend} this week</span>
                    </div>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-2xl ${card.iconBg} ${card.iconText} flex items-center justify-center shadow-sm`}>
                  <Icon className="h-6 w-6" strokeWidth={1.7} />
                </div>
              </div>

              {card.action && (
                <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-gray-400 group-hover:text-gray-600 transition-colors">
                  <span>View all</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Main Grid ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Latest Reservations (2/3) ──────────────── */}
        <div
          className="dash-card lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          style={{ animationDelay: "0.28s" }}
        >
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-white to-gray-50/50">
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">
                {t("pages.dashboard.latestReservations")}
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">{t("pages.dashboard.latestBookingActivity")}</p>
            </div>
            <button
              onClick={() => onNavigate("reservations")}
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg"
            >
              {t("pages.dashboard.viewAll")} <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {loadingRes ? (
            <div className="p-6 space-y-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton w="w-8" h="h-8" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton w="w-32" h="h-3" />
                    <Skeleton w="w-20" h="h-2.5" />
                  </div>
                  <Skeleton w="w-16" h="h-5" />
                  <Skeleton w="w-16" h="h-5" />
                </div>
              ))}
            </div>
          ) : latestReservations.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-7 w-7 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">{t("pages.dashboard.noReservationsYet")}</p>
              <p className="text-xs text-gray-400 mt-1">No reservations have been made yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/30">
                    {[
                      t("tables.guestName"),
                      t("tables.checkIn"),
                      t("tables.checkOut"),
                      t("tables.status"),
                      t("tables.payment"),
                    ].map(h => (
                      <th key={h} className="text-left py-2.5 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest first:pl-6">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {latestReservations.map((res, rowIdx) => {
                    const guestName = (res as any).firstName
                      ? `${(res as any).firstName} ${(res as any).lastName || ""}`.trim()
                      : res.user?.name || res.user?.email || "—";
                    const initials = getInitials(guestName);
                    const avatarGradient = AVATAR_COLORS[rowIdx % AVATAR_COLORS.length];
                    return (
                      <tr key={res.id} className="border-b border-gray-50 last:border-b-0 hover:bg-blue-50/20 transition-colors duration-150 group">
                        <td className="py-3 pl-6 pr-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center flex-shrink-0`}>
                              <span className="text-[10px] font-bold text-white">{initials}</span>
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-gray-800">{guestName}</p>
                              <p className="text-[10px] text-gray-400">#{res.id} · {res.guests} {t(res.guests > 1 ? "tables.guest_other" : "tables.guest_one")}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs font-medium text-gray-600">{formatDate(res.checkIn)}</td>
                        <td className="py-3 px-4 text-xs font-medium text-gray-600">{formatDate(res.checkOut)}</td>
                        <td className="py-3 px-4">{statusBadge(res.status)}</td>
                        <td className="py-3 px-4">{paymentBadge((res as any).paymentStatus || "NONE")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Right Column (1/3) ─────────────────────── */}
        <div className="space-y-5">

          {/* Occupancy Widget */}
          <div
            className="dash-card bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
            style={{ animationDelay: "0.35s" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-gray-900">
                {t("pages.dashboard.roomOccupancy", "Room Occupancy")}
              </h3>
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                <BedDouble className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            {loadingStats ? (
              <div className="space-y-3">
                <Skeleton h="h-3" />
                <Skeleton h="h-3" />
                <Skeleton h="h-16" />
              </div>
            ) : (
              <>
                {/* Occupancy bar */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 font-medium">
                      {t("pages.dashboard.occupancyRate", "Occupancy Rate")}
                    </span>
                    <span className="text-sm font-extrabold text-gray-900">
                      {(stats?.occupancyRate ?? 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700 relative"
                      style={{ width: `${stats?.occupancyRate ?? 0}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 rounded-full" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)" }} />
                    </div>
                  </div>
                </div>

                {/* Room breakdown */}
                <div className="space-y-2.5">
                  {[
                    { label: t("pages.dashboard.occupied", "Occupied"), value: stats?.occupiedRooms ?? 0, dot: "#ef4444", bg: "bg-red-50" },
                    { label: t("pages.dashboard.available", "Available"), value: stats?.availableRooms ?? 0, dot: "#22c55e", bg: "bg-emerald-50" },
                    { label: t("pages.dashboard.maintenance", "Maintenance"), value: stats?.maintenanceRooms ?? 0, dot: "#f59e0b", bg: "bg-amber-50" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-6 h-6 rounded-lg ${item.bg} flex items-center justify-center`}>
                          <span className="w-2 h-2 rounded-full" style={{ background: item.dot }} />
                        </div>
                        <span className="text-xs text-gray-600 font-medium">{item.label}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-800">{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Today's check-ins */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 flex items-center justify-between shadow-md">
                    <div>
                      <p className="text-[11px] text-blue-100 font-medium uppercase tracking-wide">
                        {t("pages.dashboard.expectedCheckinsToday", "Expected Check-ins Today")}
                      </p>
                    </div>
                    <p className="text-3xl font-extrabold text-white">{stats?.expectedCheckinsToday ?? 0}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div
            className="dash-card bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
            style={{ animationDelay: "0.42s" }}
          >
            <h3 className="text-[15px] font-bold text-gray-900 mb-3">{t("pages.dashboard.quickActions")}</h3>
            <div className="space-y-1">
              {[
                { label: t("pages.dashboard.actions.viewCalendar"), icon: Calendar, gradient: "from-emerald-400 to-teal-500", bg: "bg-emerald-50", color: "text-emerald-600", target: "calendar" as DashboardNavTarget },
                { label: t("pages.dashboard.actions.manageRooms"), icon: BedDouble, gradient: "from-violet-400 to-purple-500", bg: "bg-violet-50", color: "text-violet-600", target: "rooms" as DashboardNavTarget },
                { label: t("pages.dashboard.actions.pendingPayments"), icon: CreditCard, gradient: "from-amber-400 to-orange-500", bg: "bg-amber-50", color: "text-amber-600", target: "payments" as DashboardNavTarget },
                { label: t("pages.dashboard.actions.generateReport"), icon: FileText, gradient: "from-blue-400 to-blue-600", bg: "bg-blue-50", color: "text-blue-600", target: "reports" as DashboardNavTarget },
              ].map((action, idx) => {
                const Icon = action.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => onNavigate(action.target)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all duration-150 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl ${action.bg} ${action.color} flex items-center justify-center`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-[13px] font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">{action.label}</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all duration-150" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alerts */}
          {(stats?.pendingReservations ?? 0) > 0 && (
            <div
              className="dash-card bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3"
              style={{ animationDelay: "0.49s" }}
            >
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-800">
                  {t((stats?.pendingReservations ?? 0) > 1 ? "pages.dashboard.pendingAlert.title_other" : "pages.dashboard.pendingAlert.title_one", { count: stats?.pendingReservations ?? 0 })}
                </p>
                <p className="text-xs text-amber-600 mt-0.5">{t("pages.dashboard.pendingAlert.message")}</p>
                <button
                  onClick={() => onNavigate("reservations")}
                  className="text-xs font-bold text-amber-700 hover:text-amber-900 mt-2.5 flex items-center gap-1 transition-colors bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg"
                >
                  {t("pages.dashboard.pendingAlert.reviewNow")} <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Navigate Cards ─────────────────────── */}
      <div
        className="dash-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        style={{ animationDelay: "0.5s" }}
      >
        {[
          {
            icon: Calendar,
            title: t("pages.dashboard.actions.viewCalendar", "Calendar"),
            desc: "View room availability over time",
            gradient: "from-emerald-400 to-teal-500",
            bg: "bg-gradient-to-br from-emerald-50 to-teal-50",
            iconBg: "bg-gradient-to-br from-emerald-400 to-teal-500",
            target: "calendar" as DashboardNavTarget,
          },
          {
            icon: CreditCard,
            title: t("pages.dashboard.actions.pendingPayments", "Payments"),
            desc: "Verify and process receipts",
            gradient: "from-amber-400 to-orange-500",
            bg: "bg-gradient-to-br from-amber-50 to-orange-50",
            iconBg: "bg-gradient-to-br from-amber-400 to-orange-500",
            target: "payments" as DashboardNavTarget,
          },
          {
            icon: Users,
            title: "Guests",
            desc: "Manage guests and access levels",
            gradient: "from-blue-400 to-blue-600",
            bg: "bg-gradient-to-br from-blue-50 to-sky-50",
            iconBg: "bg-gradient-to-br from-blue-400 to-blue-600",
            target: "reservations" as DashboardNavTarget,
          },
          {
            icon: BedDouble,
            title: t("pages.dashboard.actions.manageRooms", "Rooms"),
            desc: "Floor plan and room status",
            gradient: "from-violet-400 to-purple-500",
            bg: "bg-gradient-to-br from-violet-50 to-purple-50",
            iconBg: "bg-gradient-to-br from-violet-400 to-purple-500",
            target: "rooms" as DashboardNavTarget,
          },
        ].map((nav, idx) => {
          const Icon = nav.icon;
          return (
            <button
              key={idx}
              onClick={() => onNavigate(nav.target)}
              className={`${nav.bg} rounded-2xl border border-gray-100 p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 group`}
            >
              <div className={`w-11 h-11 rounded-2xl ${nav.iconBg} flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform duration-150`}>
                <Icon className="h-5 w-5 text-white" strokeWidth={2} />
              </div>
              <h4 className="text-[14px] font-bold text-gray-900 mb-0.5">{nav.title}</h4>
              <p className="text-[11px] text-gray-500 leading-snug">{nav.desc}</p>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-gray-400 group-hover:text-gray-600 transition-colors">
                <span>Open</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform duration-150" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
