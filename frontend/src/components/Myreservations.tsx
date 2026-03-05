import { Footer } from "./layout/Footer";
import { NotificationBell } from "./NotificationBell";
import { useTranslation } from "react-i18next";
import React, { useEffect, useState } from "react";
import { getUserReservations, cancelReservation, type Reservation } from "../api/reservations";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Plus,
  User,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  XCircle,
  CreditCard,
  Search,
  Filter,
  ArrowRight,
  Users,
  Mail,
  Phone,
  Hash,
  MapPin,
} from "lucide-react";

import {
  Select as UISelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

/* ═══════════════════════════════════════════════════════════
   Animations
   ═══════════════════════════════════════════════════════════ */
const _style = document.getElementById("myres-anim") ?? (() => {
  const s = document.createElement("style");
  s.id = "myres-anim";
  s.textContent = `
    @keyframes myresFadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes myresSlideDown {
      from { opacity: 0; max-height: 0; }
      to   { opacity: 1; max-height: 600px; }
    }
  `;
  document.head.appendChild(s);
  return s;
})();

/* ═══════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════ */
const stagger = (i: number): React.CSSProperties => ({
  animation: `myresFadeUp 0.5s ease-out ${0.1 + i * 0.06}s both`,
});

const formatDate = (iso: string) => {
  try { return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return iso; }
};

const nightsBetween = (checkIn: string, checkOut: string) => {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
};

/* ═══════════════════════════════════════════════════════════
   Status config
   ═══════════════════════════════════════════════════════════ */
type StatusKey = string;

const statusConfig: Record<StatusKey, { label: string; color: string; bg: string; ring: string; icon: typeof CheckCircle2 }> = {
  PENDING:              { label: "Pending",            color: "text-blue-700",    bg: "bg-blue-50",    ring: "ring-blue-200",    icon: Clock },
  APPROVED:             { label: "Approved",           color: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-200", icon: CheckCircle2 },
  REJECTED:             { label: "Rejected",           color: "text-red-700",     bg: "bg-red-50",     ring: "ring-red-200",     icon: XCircle },
  CANCELLED:            { label: "Cancelled",          color: "text-gray-600",    bg: "bg-gray-50",    ring: "ring-gray-200",    icon: XCircle },
  REFUND_REQUESTED:     { label: "Refund Requested",   color: "text-orange-700",  bg: "bg-orange-50",  ring: "ring-orange-200",  icon: AlertCircle },
  REFUNDED:             { label: "Refunded",           color: "text-indigo-700",  bg: "bg-indigo-50",  ring: "ring-indigo-200",  icon: CheckCircle2 },
};

const paymentStatusConfig: Record<string, { label: string; color: string; bg: string; ring: string; icon: typeof CheckCircle2 }> = {
  PENDING_VERIFICATION: { label: "Payment Pending",   color: "text-amber-700",   bg: "bg-amber-50",   ring: "ring-amber-200",   icon: Clock },
  APPROVED:             { label: "Payment Confirmed",  color: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-200", icon: CheckCircle2 },
  REJECTED:             { label: "Payment Rejected",   color: "text-red-700",     bg: "bg-red-50",     ring: "ring-red-200",     icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || statusConfig.PENDING;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${cfg.bg} ${cfg.color} ring-1 ${cfg.ring}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function PaymentBadge({ paymentStatus }: { paymentStatus?: string }) {
  if (!paymentStatus || paymentStatus === "NONE") return null;
  const cfg = paymentStatusConfig[paymentStatus];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${cfg.bg} ${cfg.color} ring-1 ${cfg.ring}`}>
      <CreditCard className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════ */
export function MyReservations() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const userId = Number(localStorage.getItem("userId"));
  const userName = localStorage.getItem("userName") || "User";
  const currentLang = i18n.language?.toUpperCase() === "TR" ? "TR" : "EN";
  const switchLanguage = (val: string) => i18n.changeLanguage(val.toLowerCase());

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      if (!userId || isNaN(userId)) { setLoading(false); return; }
      try {
        const data = await getUserReservations(userId);
        // Sort by createdAt desc (newest first)
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReservations(data);
      } catch (err) {
        console.error("Failed to load reservations", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  /* ── Filtering ──────────────────────────── */
  const filtered = reservations.filter((r) => {
    if (filterStatus !== "ALL" && r.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = String(r.id).includes(q);
      const matchName = `${r.firstName} ${r.lastName}`.toLowerCase().includes(q);
      const matchDate = formatDate(r.checkIn).toLowerCase().includes(q) || formatDate(r.checkOut).toLowerCase().includes(q);
      if (!matchId && !matchName && !matchDate) return false;
    }
    return true;
  });

  /* ── Stats ──────────────────────────────── */
  const totalCount = reservations.length;
  const pendingCount = reservations.filter((r) => r.status === "PENDING").length;
  const approvedCount = reservations.filter((r) => r.status === "APPROVED").length;
  const completedCount = reservations.filter((r) => {
    const ps = (r as any).paymentStatus;
    return ps === "APPROVED";
  }).length;

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
                <h1 className="text-white text-lg font-semibold tracking-[6px] hidden sm:block" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>EDU HOTEL</h1>
              </Link>
            </div>
            <h1 className="sm:hidden text-white text-base font-bold tracking-[4px]">EDU HOTEL</h1>
            <div className="flex items-center gap-3 sm:gap-5">
              <Link to="/main" className="hidden md:flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors tracking-wide">
                <LayoutGrid className="h-3.5 w-3.5" />
                {t("header.mainPage", { defaultValue: "Main Page" })}
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
                <span className="text-xs text-white/70 group-hover:text-white font-medium hidden md:block max-w-[100px] truncate transition-colors">{userName}</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ MAIN ═════════════════════════════════════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Page title + action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-9" style={stagger(0)}>
          <div>
            <h1 className="text-[28px] font-semibold text-[#003366] tracking-tight mb-1.5">
              {t("reservations.title", { defaultValue: "My Reservations" })}
            </h1>
            <p className="text-[15px] text-gray-500">
              {t("reservations.subtitle", { defaultValue: "View and manage all your reservation requests." })}
            </p>
          </div>
          <Link
            to="/book-room"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-white text-sm font-semibold transition-all duration-300 hover:shadow-lg self-start"
            style={{ background: "linear-gradient(135deg, #003366 0%, #004080 50%, #003366 100%)" }}
          >
            <Plus className="h-4 w-4" />
            {t("reservations.newReservation", { defaultValue: "New Reservation" })}
          </Link>
        </div>

        {/* ── Mini Stats ──────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7" style={stagger(1)}>
          {[
            { label: t("reservations.stats.total", { defaultValue: "Total" }), value: totalCount, accent: "#3b82f6" },
            { label: t("reservations.stats.pending", { defaultValue: "Pending" }), value: pendingCount, accent: "#f59e0b" },
            { label: t("reservations.stats.approved", { defaultValue: "Approved" }), value: approvedCount, accent: "#22c55e" },
            { label: t("reservations.stats.confirmed", { defaultValue: "Confirmed" }), value: completedCount, accent: "#8b5cf6" },
          ].map((s, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-gray-100 px-4 py-3.5 flex items-center gap-3"
              style={{ borderLeft: `3px solid ${s.accent}` }}
            >
              <div className="text-[22px] font-bold text-gray-900">{s.value}</div>
              <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wider leading-tight">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Filters ─────────────────────────────────── */}
        <div
          className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row gap-3"
          style={{ ...stagger(2), boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}
        >
          {/* Search */}
          <div className="flex-1">
            <div className="flex items-center h-10 bg-gray-50/80 border border-gray-200/80 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#0066cc]/20 focus-within:border-[#0066cc]/40 transition-all">
              <div className="flex items-center justify-center w-10 h-10 flex-shrink-0">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                placeholder={t("reservations.search", { defaultValue: "Search by ID, name, or date..." })}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-full bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none pr-3"
              />
            </div>
          </div>
          {/* Status filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <UISelect value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px] h-10 rounded-xl bg-gray-50/80 border-gray-200/80 text-sm focus:ring-2 focus:ring-[#0066cc]/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("reservations.filter.all", { defaultValue: "All Statuses" })}</SelectItem>
                <SelectItem value="PENDING">{t("reservations.filter.pending", { defaultValue: "Pending" })}</SelectItem>
                <SelectItem value="APPROVED">{t("reservations.filter.approved", { defaultValue: "Approved" })}</SelectItem>
                <SelectItem value="REJECTED">{t("reservations.filter.rejected", { defaultValue: "Rejected" })}</SelectItem>
                <SelectItem value="CANCELLED">{t("reservations.filter.cancelled", { defaultValue: "Cancelled" })}</SelectItem>
                <SelectItem value="REFUND_REQUESTED">{t("reservations.filter.refundRequested", { defaultValue: "Refund Requested" })}</SelectItem>
                <SelectItem value="REFUNDED">{t("reservations.filter.refunded", { defaultValue: "Refunded" })}</SelectItem>
              </SelectContent>
            </UISelect>
          </div>
        </div>

        {/* ── Reservation List ────────────────────────── */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center" style={stagger(3)}>
              <div className="w-8 h-8 border-2 border-[#003366] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">{t("common.loading", { defaultValue: "Loading..." })}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center" style={stagger(3)}>
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-7 w-7 text-gray-300" />
              </div>
              <p className="text-base font-semibold text-gray-700 mb-1">
                {reservations.length === 0
                  ? t("reservations.empty.title", { defaultValue: "No reservations yet" })
                  : t("reservations.empty.noMatch", { defaultValue: "No matching reservations" })}
              </p>
              <p className="text-sm text-gray-500 mb-5">
                {reservations.length === 0
                  ? t("reservations.empty.subtitle", { defaultValue: "Book a room to get started." })
                  : t("reservations.empty.noMatchSub", { defaultValue: "Try adjusting your filters or search query." })}
              </p>
              {reservations.length === 0 && (
                <Link
                  to="/book-room"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#003366] text-white text-sm font-semibold hover:bg-[#002244] transition-all"
                >
                  <Plus className="h-4 w-4" />
                  {t("reservations.newReservation", { defaultValue: "New Reservation" })}
                </Link>
              )}
            </div>
          ) : (
            filtered.map((r, idx) => {
              const isExpanded = expandedId === r.id;
              const nights = nightsBetween(r.checkIn, r.checkOut);
              const ps = (r as any).paymentStatus as string | undefined;
              const canPay = r.status === "APPROVED" && (!ps || (ps !== "PENDING_VERIFICATION" && ps !== "APPROVED"));
              const canCancel = (r.status === "PENDING" || r.status === "APPROVED") && ps !== "APPROVED";

              return (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md"
                  style={{ ...stagger(idx + 3), boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}
                >
                  {/* ── Card header (always visible) ────── */}
                  <button
                    type="button"
                    className="w-full px-5 sm:px-6 py-5 flex items-center gap-4 text-left cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : r.id)}
                  >
                    {/* Reservation ID circle */}
                    <div className="w-11 h-11 rounded-xl bg-[#003366]/5 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-[#003366]">#{r.id}</span>
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="text-[15px] font-semibold text-gray-900">
                          {formatDate(r.checkIn)} → {formatDate(r.checkOut)}
                        </p>
                        <span className="text-[11px] text-gray-400 font-medium">
                          ({nights} {nights === 1 ? "night" : "nights"})
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={r.status} />
                        <PaymentBadge paymentStatus={ps} />
                        {r.accommodationType && (
                          <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                            {r.accommodationType}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Guests count */}
                    <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 flex-shrink-0">
                      <Users className="h-3.5 w-3.5" />
                      <span>{r.guests}</span>
                    </div>

                    {/* Expand arrow */}
                    <div className="flex-shrink-0">
                      {isExpanded
                        ? <ChevronUp className="h-5 w-5 text-gray-400" />
                        : <ChevronDown className="h-5 w-5 text-gray-400" />}
                    </div>
                  </button>

                  {/* ── Expanded details ────────────────── */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-5 sm:px-6 py-5 bg-gray-50/30">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                        {/* Guest Info */}
                        <div className="space-y-2.5">
                          <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t("reservations.detail.guestInfo", { defaultValue: "Guest Information" })}</h4>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <User className="h-3.5 w-3.5 text-gray-400" />
                              {r.firstName} {r.lastName}
                            </div>
                            {r.contactEmail && (
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Mail className="h-3.5 w-3.5 text-gray-400" />
                                {r.contactEmail}
                              </div>
                            )}
                            {r.phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Phone className="h-3.5 w-3.5 text-gray-400" />
                                {r.phone}
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Users className="h-3.5 w-3.5 text-gray-400" />
                              {r.guests} {r.guests === 1 ? "guest" : "guests"}
                            </div>
                          </div>
                        </div>

                        {/* Stay details */}
                        <div className="space-y-2.5">
                          <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t("reservations.detail.stayDetails", { defaultValue: "Stay Details" })}</h4>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                              {formatDate(r.checkIn)} → {formatDate(r.checkOut)}
                            </div>
                            {r.checkInTime && (
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Clock className="h-3.5 w-3.5 text-gray-400" />
                                Check-in: {r.checkInTime}
                              </div>
                            )}
                            {r.room && (
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                Room: {r.room.name} ({r.room.type})
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Hash className="h-3.5 w-3.5 text-gray-400" />
                              {r.accommodationType} / {r.invoiceType}
                            </div>
                          </div>
                        </div>

                        {/* Billing & Notes */}
                        <div className="space-y-2.5">
                          <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t("reservations.detail.billing", { defaultValue: "Billing & Notes" })}</h4>
                          <div className="space-y-1.5">
                            {r.eventType && (
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <FileText className="h-3.5 w-3.5 text-gray-400" />
                                Event: {r.eventType}
                              </div>
                            )}
                            {r.eventCode && (
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Hash className="h-3.5 w-3.5 text-gray-400" />
                                Code: {r.eventCode}
                              </div>
                            )}
                            {r.freeAccommodation && (
                              <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Free Accommodation
                              </div>
                            )}
                            {r.note && (
                              <p className="text-[13px] text-gray-500 bg-white rounded-lg border border-gray-100 p-2.5 mt-1">
                                {r.note}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Created date */}
                      <div className="text-[11px] text-gray-400 font-medium mb-4">
                        {t("reservations.detail.created", { defaultValue: "Created" })}: {formatDate(r.createdAt)}
                      </div>

                      {/* Rejection reason */}
                      {r.status === "REJECTED" && r.note && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start gap-3">
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-red-700 mb-0.5">{t("reservations.detail.rejectionReason", { defaultValue: "Rejection Reason" })}</p>
                            <p className="text-sm text-red-600">{r.note}</p>
                          </div>
                        </div>
                      )}

                      {/* Cancellation info */}
                      {r.status === "CANCELLED" && r.note && r.note.includes("[Cancelled by user]") && (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 flex items-start gap-3">
                          <XCircle className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-gray-600 mb-0.5">{t("reservations.detail.cancellationNote", { defaultValue: "Cancellation Note" })}</p>
                            <p className="text-sm text-gray-500">{r.note.replace("[Cancelled by user]", "").trim() || "Cancelled by you."}</p>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-100">
                        {canPay && (
                          <button
                            onClick={() => navigate("/payment")}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#003366] text-white text-sm font-semibold hover:bg-[#002244] hover:shadow-lg transition-all duration-300"
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            {t("reservations.action.pay", { defaultValue: "Proceed to Payment" })}
                          </button>
                        )}
                        {ps === "PENDING_VERIFICATION" && (
                          <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 text-amber-700 text-sm font-semibold ring-1 ring-amber-200">
                            <Clock className="h-3.5 w-3.5" />
                            {t("reservations.action.paymentWaiting", { defaultValue: "Awaiting Payment Verification" })}
                          </span>
                        )}
                        {ps === "APPROVED" && (
                          <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold ring-1 ring-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {t("reservations.action.paymentConfirmed", { defaultValue: "Payment Confirmed" })}
                          </span>
                        )}
                        {canCancel && (
                          <button
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-all duration-300"
                            onClick={async () => {
                              const reason = window.prompt(
                                t("reservations.action.cancelReason", { defaultValue: "Please provide a reason for cancellation (optional):" })
                              );
                              if (reason === null) return; // user pressed Cancel on prompt

                              try {
                                await cancelReservation(r.id, userId, reason || undefined);
                                // Update local state
                                setReservations((prev) =>
                                  prev.map((res) =>
                                    res.id === r.id ? { ...res, status: "CANCELLED" as any } : res
                                  )
                                );
                                setExpandedId(null);
                              } catch (err: any) {
                                alert(err.message || "Failed to cancel reservation.");
                              }
                            }}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            {t("reservations.action.cancel", { defaultValue: "Cancel Reservation" })}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Result count */}
        {!loading && filtered.length > 0 && (
          <div className="mt-4 text-center" style={stagger(filtered.length + 4)}>
            <p className="text-[12px] text-gray-400 font-medium">
              {t("reservations.showing", { defaultValue: "Showing" })} {filtered.length} {t("reservations.of", { defaultValue: "of" })} {reservations.length} {t("reservations.reservations", { defaultValue: "reservations" })}
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}