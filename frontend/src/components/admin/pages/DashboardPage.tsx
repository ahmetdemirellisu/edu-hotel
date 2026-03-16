// src/components/admin/pages/DashboardPage.tsx
import React, { useEffect, useState } from "react";
import {
  Clock,
  CheckCircle,
  Users,
  Bed,
  Calendar,
  FileText,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  CreditCard,
  AlertCircle,
  BedDouble,
  Plus,
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
        const res = await fetch("/ehp/api/admin/dashboard-stats");
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

  const statusBadge = (status: string) => {
    const map: Record<string, { key: string; bg: string; text: string }> = {
      PENDING: { key: "reservations.statusLabels.pending", bg: "bg-amber-50", text: "text-amber-700" },
      APPROVED: { key: "reservations.statusLabels.approved", bg: "bg-emerald-50", text: "text-emerald-700" },
      REJECTED: { key: "reservations.statusLabels.rejected", bg: "bg-red-50", text: "text-red-700" },
      CANCELLED: { key: "reservations.statusLabels.canceled", bg: "bg-gray-100", text: "text-gray-600" },
    };
    const cfg = map[status] || map.PENDING;
    return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{t(cfg.key)}</span>;
  };

  const paymentBadge = (ps: string) => {
    if (ps === "APPROVED") return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">{t("tables.paymentPaid")}</span>;
    if (ps === "PENDING_VERIFICATION") return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{t("tables.paymentPending")}</span>;
    if (ps === "REJECTED") return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700">{t("tables.paymentRejected")}</span>;
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-50 text-gray-500">{t("tables.paymentNA")}</span>;
  };

  /* ── Skeleton loader ─────────────────── */
  const Skeleton = ({ w = "w-full", h = "h-4" }: { w?: string; h?: string }) => (
    <div className={`${w} ${h} bg-gray-200 rounded animate-pulse`} />
  );

  const pendingPayments = latestReservations.filter(r => (r as any).paymentStatus === "PENDING_VERIFICATION").length;

  return (
    <div className="space-y-6">
      {/* ── Welcome Header ─────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            {t("pages.dashboard.title", "Dashboard")}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigate("reservations")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#003366] text-white text-sm font-semibold hover:bg-[#002244] transition-all hover:shadow-lg"
          >
            <Plus className="h-4 w-4" />
            {t("pages.dashboard.actions.createReservation", "New Reservation")}
          </button>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: t("pages.dashboard.pendingReservations", "Pending Requests"),
            value: stats?.pendingReservations,
            icon: Clock,
            color: "#f59e0b",
            iconBg: "bg-amber-50",
            iconText: "text-amber-600",
            action: () => onNavigate("reservations"),
          },
          {
            label: t("pages.dashboard.approvedReservations", "Approved"),
            value: stats?.approvedReservations,
            icon: CheckCircle,
            color: "#22c55e",
            iconBg: "bg-emerald-50",
            iconText: "text-emerald-600",
            action: () => onNavigate("reservations"),
          },
          {
            label: t("pages.dashboard.guestsStaying", "Guests Staying"),
            value: stats?.guestsStaying,
            icon: Users,
            color: "#3b82f6",
            iconBg: "bg-blue-50",
            iconText: "text-blue-600",
            action: undefined,
          },
          {
            label: t("pages.dashboard.availableRooms", "Available Rooms"),
            value: stats?.availableRooms,
            icon: Bed,
            color: "#8b5cf6",
            iconBg: "bg-violet-50",
            iconText: "text-violet-600",
            action: () => onNavigate("rooms"),
          },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`bg-white rounded-2xl border border-gray-100 p-5 transition-all duration-300 hover:shadow-md ${card.action ? "cursor-pointer hover:-translate-y-0.5" : ""}`}
              style={{ borderLeft: `3px solid ${card.color}`, animation: `adminFadeIn 0.4s ease-out ${idx * 0.08}s both` }}
              onClick={card.action}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[13px] text-gray-500 font-medium">{card.label}</p>
                  {loadingStats ? (
                    <Skeleton w="w-16" h="h-9" />
                  ) : (
                    <p className="text-[32px] font-bold text-gray-900 leading-tight mt-1 tracking-tight">
                      {card.value ?? 0}
                    </p>
                  )}
                </div>
                <div className={`w-10 h-10 rounded-xl ${card.iconBg} ${card.iconText} flex items-center justify-center`}>
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Main Grid ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Latest Reservations (2/3) ────── */}
        <div
          className="lg:col-span-2 bg-white rounded-2xl border border-gray-100"
          style={{ animation: "adminFadeIn 0.4s ease-out 0.3s both" }}
        >
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-semibold text-gray-900">
                {t("pages.dashboard.latestReservations")}
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">{t("pages.dashboard.latestBookingActivity")}</p>
            </div>
            <button
              onClick={() => onNavigate("reservations")}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition-colors"
            >
              {t("pages.dashboard.viewAll")} <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            {loadingRes ? (
              <div className="p-6 space-y-3">
                {[1,2,3].map(i => <Skeleton key={i} h="h-12" />)}
              </div>
            ) : latestReservations.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">{t("pages.dashboard.noReservationsYet")}</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    {[
                      t("tables.id"),
                      t("tables.guestName"),
                      t("tables.checkIn"),
                      t("tables.checkOut"),
                      t("tables.status"),
                      t("tables.payment"),
                    ].map(h => (
                      <th key={h} className="text-left py-2.5 px-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider first:pl-6">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {latestReservations.map((res) => {
                    const guestName = (res as any).firstName
                      ? `${(res as any).firstName} ${(res as any).lastName || ""}`.trim()
                      : res.user?.name || res.user?.email || "—";
                    return (
                      <tr key={res.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 pl-6 pr-4 text-xs font-mono text-gray-500">#{res.id}</td>
                        <td className="py-3 px-4">
                          <p className="text-[13px] font-medium text-gray-800">{guestName}</p>
                          <p className="text-[10px] text-gray-400">{res.guests} {t(res.guests > 1 ? "tables.guest_other" : "tables.guest_one")}</p>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600">{formatDate(res.checkIn)}</td>
                        <td className="py-3 px-4 text-xs text-gray-600">{formatDate(res.checkOut)}</td>
                        <td className="py-3 px-4">{statusBadge(res.status)}</td>
                        <td className="py-3 px-4">{paymentBadge((res as any).paymentStatus || "NONE")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Right Column (1/3) ───────────── */}
        <div className="space-y-5" style={{ animation: "adminFadeIn 0.4s ease-out 0.4s both" }}>

          {/* Occupancy Widget */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-[15px] font-semibold text-gray-900 mb-4">
              {t("pages.dashboard.roomOccupancy", "Room Occupancy")}
            </h3>
            {loadingStats ? (
              <div className="space-y-3"><Skeleton h="h-3" /><Skeleton h="h-20" /></div>
            ) : (
              <>
                {/* Occupancy bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">
                      {t("pages.dashboard.occupancyRate", "Occupancy Rate")}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {(stats?.occupancyRate ?? 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700"
                      style={{ width: `${stats?.occupancyRate ?? 0}%` }}
                    />
                  </div>
                </div>

                {/* Room breakdown */}
                <div className="space-y-2.5">
                  {[
                    { label: t("pages.dashboard.occupied", "Occupied"), value: stats?.occupiedRooms ?? 0, dot: "#ef4444" },
                    { label: t("pages.dashboard.available", "Available"), value: stats?.availableRooms ?? 0, dot: "#22c55e" },
                    { label: t("pages.dashboard.maintenance", "Maintenance"), value: stats?.maintenanceRooms ?? 0, dot: "#f59e0b" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: item.dot }} />
                        <span className="text-xs text-gray-600">{item.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Today's check-ins */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="bg-blue-50/70 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-600 font-medium">
                        {t("pages.dashboard.expectedCheckinsToday", "Expected Check-ins Today")}
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">{stats?.expectedCheckinsToday ?? 0}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-[15px] font-semibold text-gray-900 mb-3">{t("pages.dashboard.quickActions")}</h3>
            <div className="space-y-2">
              {[
                { label: t("pages.dashboard.actions.viewCalendar"), icon: Calendar, color: "text-emerald-600", bg: "bg-emerald-50", target: "calendar" as DashboardNavTarget },
                { label: t("pages.dashboard.actions.manageRooms"), icon: BedDouble, color: "text-violet-600", bg: "bg-violet-50", target: "rooms" as DashboardNavTarget },
                { label: t("pages.dashboard.actions.pendingPayments"), icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50", target: "payments" as DashboardNavTarget },
                { label: t("pages.dashboard.actions.generateReport"), icon: FileText, color: "text-blue-600", bg: "bg-blue-50", target: "reports" as DashboardNavTarget },
              ].map((action, idx) => {
                const Icon = action.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => onNavigate(action.target)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-gray-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${action.bg} ${action.color} flex items-center justify-center`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-[13px] font-medium text-gray-700 group-hover:text-gray-900 transition-colors">{action.label}</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alerts */}
          {(stats?.pendingReservations ?? 0) > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  {t((stats?.pendingReservations ?? 0) > 1 ? "pages.dashboard.pendingAlert.title_other" : "pages.dashboard.pendingAlert.title_one", { count: stats?.pendingReservations ?? 0 })}
                </p>
                <p className="text-xs text-amber-600 mt-0.5">{t("pages.dashboard.pendingAlert.message")}</p>
                <button
                  onClick={() => onNavigate("reservations")}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-900 mt-2 flex items-center gap-1 transition-colors"
                >
                  {t("pages.dashboard.pendingAlert.reviewNow")} <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}