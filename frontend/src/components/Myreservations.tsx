import React from "react";
import { Footer } from "./layout/Footer";
import { NotificationBell } from "./NotificationBell";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { getUserReservations, cancelReservation, type Reservation } from "../api/reservations";
import { toast } from "sonner";
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

/* ═══════════════════════════════════════════════════════════
   Animations
   ═══════════════════════════════════════════════════════════ */
void (document.getElementById("myres-anim") ?? (() => {
  const s = document.createElement("style");
  s.id = "myres-anim";
  s.textContent = `
    @keyframes myresFadeUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes myresSlideDown {
      from { opacity: 0; max-height: 0; }
      to   { opacity: 1; max-height: 800px; }
    }
    @keyframes myresAurora1 {
      0%   { transform: translate(0,0) scale(1); }
      50%  { transform: translate(25px,-15px) scale(1.07); }
      100% { transform: translate(0,0) scale(1); }
    }
    @keyframes myresAurora2 {
      0%   { transform: translate(0,0) scale(1); }
      50%  { transform: translate(-20px,12px) scale(0.96); }
      100% { transform: translate(0,0) scale(1); }
    }
    @keyframes myresBannerShimmer {
      0%   { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes myresPulseDot {
      0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 currentColor; }
      50%       { opacity: 0.8; transform: scale(1.25); }
    }
    @keyframes myresCardIn {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes myresApprovedGlow {
      0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0.55), 0 1px 3px rgba(0,0,0,0.03), 0 4px 14px rgba(0,0,0,0.04); }
      35%  { box-shadow: 0 0 0 8px rgba(16,185,129,0.12), 0 4px 24px rgba(16,185,129,0.28); }
      100% { box-shadow: 0 0 0 0 rgba(16,185,129,0),    0 1px 3px rgba(0,0,0,0.03), 0 4px 14px rgba(0,0,0,0.04); }
    }
    .myres-approved {
      border-left-color: #10b981 !important;
    }
    .myres-card {
      transition: box-shadow 0.25s ease, transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
    }
    .myres-card:hover {
      transform: translateY(-2px);
    }
    .myres-action-btn {
      transition: all 0.2s ease;
    }
    .myres-action-btn:hover {
      transform: translateY(-1px);
    }
    .myres-link-hover {
      position: relative;
      transition: color 0.2s ease, padding-left 0.2s ease;
    }
  `;
  document.head.appendChild(s);
  return s;
})());

/* ═══════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════ */
const stagger = (i: number): React.CSSProperties => ({
  animation: `myresFadeUp 0.55s cubic-bezier(0.22,1,0.36,1) ${0.08 + i * 0.07}s both`,
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

const statusConfig: Record<StatusKey, {
  labelKey: string;
  color: string;
  bg: string;
  ring: string;
  accentBar: string;
  dotColor: string;
  icon: typeof CheckCircle2;
}> = {
  PENDING:          { labelKey: "reservations.status.pending",          color: "text-amber-700",   bg: "bg-amber-50",   ring: "ring-amber-200",   accentBar: "#f59e0b", dotColor: "#f59e0b", icon: Clock },
  APPROVED:         { labelKey: "reservations.status.approved",         color: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-200", accentBar: "#10b981", dotColor: "#10b981", icon: CheckCircle2 },
  REJECTED:         { labelKey: "reservations.status.rejected",         color: "text-red-700",     bg: "bg-red-50",     ring: "ring-red-200",     accentBar: "#ef4444", dotColor: "#ef4444", icon: XCircle },
  CANCELLED:        { labelKey: "reservations.status.cancelled",        color: "text-gray-600",    bg: "bg-gray-50",    ring: "ring-gray-200",    accentBar: "#9ca3af", dotColor: "#9ca3af", icon: XCircle },
  REFUND_REQUESTED: { labelKey: "reservations.status.refundRequested",  color: "text-orange-700",  bg: "bg-orange-50",  ring: "ring-orange-200",  accentBar: "#f97316", dotColor: "#f97316", icon: AlertCircle },
  REFUNDED:         { labelKey: "reservations.status.refunded",         color: "text-indigo-700",  bg: "bg-indigo-50",  ring: "ring-indigo-200",  accentBar: "#6366f1", dotColor: "#6366f1", icon: CheckCircle2 },
};

const paymentStatusConfig: Record<string, {
  labelKey: string; color: string; bg: string; ring: string; icon: typeof CheckCircle2;
}> = {
  PENDING_VERIFICATION: { labelKey: "reservations.paymentStatus.pending",    color: "text-amber-700",   bg: "bg-amber-50",   ring: "ring-amber-200",   icon: Clock },
  APPROVED:             { labelKey: "reservations.paymentStatus.confirmed",  color: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-200", icon: CheckCircle2 },
  REJECTED:             { labelKey: "reservations.paymentStatus.rejected",   color: "text-red-700",     bg: "bg-red-50",     ring: "ring-red-200",     icon: XCircle },
};

/* ── Status badge ────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const cfg = statusConfig[status] || statusConfig.PENDING;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide ${cfg.bg} ${cfg.color} ring-1 ${cfg.ring}`}>
      {/* Animated pulse dot */}
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{
          background: cfg.dotColor,
          animation: ["PENDING", "REFUND_REQUESTED"].includes(status)
            ? "myresPulseDot 1.8s ease-in-out infinite"
            : "none",
          boxShadow: `0 0 4px ${cfg.dotColor}80`,
        }}
      />
      <Icon className="h-3 w-3" />
      {t(cfg.labelKey, status)}
    </span>
  );
}

/* ── Payment badge ───────────────────────────────────────── */
function PaymentBadge({ paymentStatus }: { paymentStatus?: string }) {
  const { t } = useTranslation();
  if (!paymentStatus || paymentStatus === "NONE") return null;
  const cfg = paymentStatusConfig[paymentStatus];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide ${cfg.bg} ${cfg.color} ring-1 ${cfg.ring}`}>
      <CreditCard className="h-3 w-3" />
      {t(cfg.labelKey, paymentStatus)}
    </span>
  );
}

/* ── CSS geometric room icon ─────────────────────────────── */
function RoomIcon({ accentColor }: { accentColor: string }) {
  return (
    <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-xl relative overflow-hidden"
      style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}25` }}
    >
      {/* Door */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-5 h-7 rounded-t-sm border-2"
        style={{ borderColor: accentColor, opacity: 0.6 }} />
      {/* Window */}
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-6 h-4 rounded-sm border-2"
        style={{ borderColor: accentColor, opacity: 0.5 }} />
      {/* Window cross */}
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-px h-4 bg-current opacity-30"
        style={{ color: accentColor }} />
      {/* Doorknob */}
      <div className="absolute bottom-4 left-[calc(50%+4px)] w-1 h-1 rounded-full"
        style={{ background: accentColor, opacity: 0.7 }} />
    </div>
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
  const [justApproved, setJustApproved] = useState<Set<number>>(new Set());

  // Tracks the last-known status of each reservation for change detection
  const prevStatusesRef = useRef<Map<number, string>>(new Map());

  useEffect(() => {
    async function load() {
      if (!userId || isNaN(userId)) { setLoading(false); return; }
      try {
        const data = await getUserReservations(userId);
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReservations(data);
        // Seed the ref so the first poll has a baseline to diff against
        const map = new Map<number, string>();
        data.forEach(r => map.set(r.id, r.status));
        prevStatusesRef.current = map;
      } catch (err) {
        console.error("Failed to load reservations", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  // ── Live polling ──────────────────────────────────────────
  useEffect(() => {
    if (!userId || isNaN(userId)) return;

    const poll = async () => {
      try {
        const data = await getUserReservations(userId);
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const newlyApproved: number[] = [];
        data.forEach(r => {
          const prev = prevStatusesRef.current.get(r.id);
          if (prev === "PENDING" && r.status === "APPROVED") {
            newlyApproved.push(r.id);
            toast.success(t("reservations.poll.approved", { defaultValue: "Your reservation has been approved!" }), {
              description: t("reservations.poll.approvedDesc", { id: r.id, defaultValue: `Reservation #${r.id} — you can now proceed to payment.` }),
              duration: 7000,
            });
          }
        });

        // Update baseline
        const map = new Map<number, string>();
        data.forEach(r => map.set(r.id, r.status));
        prevStatusesRef.current = map;

        setReservations(data);

        if (newlyApproved.length > 0) {
          setJustApproved(prev => {
            const next = new Set(prev);
            newlyApproved.forEach(id => next.add(id));
            return next;
          });
          // Remove glow after animation completes
          setTimeout(() => {
            setJustApproved(prev => {
              const next = new Set(prev);
              newlyApproved.forEach(id => next.delete(id));
              return next;
            });
          }, 4000);
        }
      } catch {
        // Silent — polling errors shouldn't surface to the user
      }
    };

    const interval = setInterval(poll, 30_000);
    return () => clearInterval(interval);
  }, [userId, t]);

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
  const totalCount     = reservations.length;
  const pendingCount   = reservations.filter((r) => r.status === "PENDING").length;
  const approvedCount  = reservations.filter((r) => r.status === "APPROVED").length;
  const completedCount = reservations.filter((r) => (r as any).paymentStatus === "APPROVED").length;

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
        <div
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: "1.5px",
            background: "linear-gradient(90deg, transparent, #c9a84c 30%, #4da6ff 60%, #c9a84c 80%, transparent)",
            opacity: 0.55,
          }}
        />
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
                <span className="text-xs text-white/70 group-hover:text-white font-medium hidden md:block max-w-[100px] truncate transition-colors">{userName}</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ PAGE BANNER ══════════════════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #000e1f 0%, #001f40 35%, #003366 65%, #004d80 100%)",
        }}
      >
        {/* Aurora orbs */}
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)", animation: "myresAurora1 14s ease-in-out infinite" }} />
        <div className="absolute -bottom-20 left-0 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(77,166,255,0.08) 0%, transparent 70%)", animation: "myresAurora2 18s ease-in-out infinite" }} />

        {/* Grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.025] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="myresGrid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M 36 0 L 0 0 0 36" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#myresGrid)" />
        </svg>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-9">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5" style={stagger(0)}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-3 h-px inline-block" style={{ background: "#c9a84c" }} />
                <span className="text-[#c9a84c]/90 text-[10px] font-bold tracking-[4px] uppercase">Sabancı Üniversitesi</span>
              </div>
              <h1
                className="text-2xl sm:text-3xl font-light text-white tracking-tight mb-2"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  background: "linear-gradient(90deg, #fff, #c9a84c, #f0d080, #fff)",
                  backgroundSize: "300% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  animation: "myresBannerShimmer 7s linear infinite",
                }}
              >
                {t("reservations.title", { defaultValue: "My Reservations" })}
              </h1>
              <p className="text-blue-200/55 text-sm leading-relaxed max-w-md">
                {t("reservations.subtitle", { defaultValue: "View and manage all your reservation requests." })}
              </p>
              <div className="flex items-center gap-1.5 mt-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ animation: "myresPulseDot 1.8s ease-in-out infinite", boxShadow: "0 0 4px #34d39980" }} />
                <span className="text-[10px] font-bold tracking-[2px] uppercase text-emerald-400/80">Live</span>
              </div>
            </div>

            <Link
              to="/book-room"
              className="inline-flex items-center justify-center gap-2.5 rounded-2xl px-6 py-3.5 text-sm font-bold transition-all duration-300 self-start hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #f0d080 0%, #c9a84c 60%, #e0b840 100%)",
                color: "#001428",
                boxShadow: "0 6px 20px rgba(201,168,76,0.35)",
              }}
            >
              <Plus className="h-4 w-4" />
              {t("reservations.newReservation", { defaultValue: "New Reservation" })}
            </Link>
          </div>
        </div>
      </div>

      {/* ═══ MAIN ═════════════════════════════════════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-9">

        {/* ── Mini Stats ──────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7" style={stagger(1)}>
          {[
            { label: t("reservations.stats.total",     { defaultValue: "Total" }),     value: totalCount,     accent: "#3b82f6", bg: "#eff6ff" },
            { label: t("reservations.stats.pending",   { defaultValue: "Pending" }),   value: pendingCount,   accent: "#f59e0b", bg: "#fffbeb" },
            { label: t("reservations.stats.approved",  { defaultValue: "Approved" }),  value: approvedCount,  accent: "#10b981", bg: "#f0fdf4" },
            { label: t("reservations.stats.confirmed", { defaultValue: "Confirmed" }), value: completedCount, accent: "#8b5cf6", bg: "#f5f3ff" },
          ].map((s, idx) => (
            <div
              key={idx}
              className="rounded-xl px-4 py-3.5 flex items-center gap-3 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: s.bg,
                borderLeft: `3px solid ${s.accent}`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
              }}
            >
              <div className="text-[24px] font-bold text-gray-900">{s.value}</div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-[1.5px] leading-tight">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Filters ─────────────────────────────────── */}
        <div
          className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row gap-3"
          style={{ ...stagger(2), boxShadow: "0 1px 3px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.03)" }}
        >
          <div className="flex-1">
            <div className="flex items-center h-11 bg-gray-50/80 border border-gray-200/80 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#003366]/15 focus-within:border-[#003366]/30 transition-all">
              <div className="flex items-center justify-center w-11 h-11 flex-shrink-0">
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
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <UISelect value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[170px] h-11 rounded-xl bg-gray-50/80 border-gray-200/80 text-sm focus:ring-2 focus:ring-[#003366]/15">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("reservations.filter.all",           { defaultValue: "All Statuses" })}</SelectItem>
                <SelectItem value="PENDING">{t("reservations.filter.pending",   { defaultValue: "Pending" })}</SelectItem>
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
            <div
              className="bg-white rounded-2xl border border-gray-100 p-14 text-center"
              style={{ ...stagger(3), boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}
            >
              <div
                className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
                style={{ borderColor: "#003366", borderTopColor: "transparent" }}
              />
              <p className="text-sm text-gray-500 font-medium">{t("common.loading", { defaultValue: "Loading..." })}</p>
            </div>

          ) : filtered.length === 0 ? (
            /* ── Beautiful empty state ───────────────── */
            <div
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
              style={{ ...stagger(3), boxShadow: "0 2px 4px rgba(0,0,0,0.03), 0 8px 24px rgba(0,51,102,0.05)" }}
            >
              <div
                className="relative py-16 px-8 text-center overflow-hidden"
                style={{ background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)" }}
              >
                {/* Decorative ring */}
                <div className="relative mx-auto mb-6 w-24 h-24 flex items-center justify-center">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: "linear-gradient(135deg, rgba(0,51,102,0.06), rgba(0,51,102,0.02))",
                      border: "1px solid rgba(0,51,102,0.08)",
                    }}
                  />
                  <div
                    className="absolute inset-3 rounded-full"
                    style={{
                      background: "linear-gradient(135deg, rgba(0,51,102,0.05), transparent)",
                      border: "1px solid rgba(0,51,102,0.06)",
                    }}
                  />
                  <FileText className="h-9 w-9 text-[#003366]/25 relative z-10" strokeWidth={1.5} />
                </div>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {reservations.length === 0
                    ? t("reservations.empty.title",   { defaultValue: "No reservations yet" })
                    : t("reservations.empty.noMatch", { defaultValue: "No matching reservations" })}
                </h3>
                <p className="text-sm text-gray-500 mb-7 max-w-xs mx-auto leading-relaxed">
                  {reservations.length === 0
                    ? t("reservations.empty.subtitle",   { defaultValue: "Book your first room to get started with your EDU Hotel experience." })
                    : t("reservations.empty.noMatchSub", { defaultValue: "Try adjusting your filters or search query." })}
                </p>
                {reservations.length === 0 && (
                  <Link
                    to="/book-room"
                    className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl text-white text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                    style={{
                      background: "linear-gradient(135deg, #001f40, #003366, #004d80)",
                      boxShadow: "0 4px 16px rgba(0,51,102,0.25)",
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    {t("reservations.newReservation", { defaultValue: "New Reservation" })}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>

          ) : (
            filtered.map((r, idx) => {
              const isExpanded = expandedId === r.id;
              const nights = nightsBetween(r.checkIn, r.checkOut);
              const ps = (r as any).paymentStatus as string | undefined;
              const canPay    = r.status === "APPROVED" && (!ps || (ps !== "PENDING_VERIFICATION" && ps !== "APPROVED"));
              const canCancel = (r.status === "PENDING" || r.status === "APPROVED") && ps !== "APPROVED";
              const cfg = statusConfig[r.status] || statusConfig.PENDING;

              const isGlowing = justApproved.has(r.id);

              return (
                <div
                  key={r.id}
                  className={`myres-card bg-white rounded-2xl border border-gray-100 overflow-hidden${isGlowing ? " myres-approved" : ""}`}
                  style={{
                    ...stagger(idx + 3),
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03), 0 4px 14px rgba(0,0,0,0.04)",
                    borderLeft: `4px solid ${cfg.accentBar}`,
                    ...(isGlowing && { animation: "myresApprovedGlow 1.4s ease-out 3 forwards" }),
                  }}
                >
                  {/* ── Card header (always visible) ────── */}
                  <button
                    type="button"
                    className="w-full px-5 sm:px-6 py-5 flex items-center gap-4 text-left cursor-pointer hover:bg-gray-50/60 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : r.id)}
                  >
                    {/* Room icon */}
                    <RoomIcon accentColor={cfg.accentBar} />

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      {/* Dates — prominent */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <div className="flex items-center gap-1.5 text-gray-900 font-semibold text-[15px]">
                          <CalendarDays className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          <span>{formatDate(r.checkIn)}</span>
                          <ArrowRight className="h-3 w-3 text-gray-300 flex-shrink-0" />
                          <span>{formatDate(r.checkOut)}</span>
                        </div>
                        <span className="text-[11px] text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                          {nights} {nights === 1 ? "night" : "nights"}
                        </span>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={r.status} />
                        <PaymentBadge paymentStatus={ps} />
                        {r.accommodationType && (
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                            {r.accommodationType}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Reservation ID pill */}
                    <div
                      className="hidden sm:flex flex-col items-center justify-center px-3 py-2 rounded-xl flex-shrink-0"
                      style={{ background: `${cfg.accentBar}10`, border: `1px solid ${cfg.accentBar}25` }}
                    >
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">ID</span>
                      <span className="text-sm font-bold" style={{ color: cfg.accentBar }}>#{r.id}</span>
                    </div>

                    {/* Guest count */}
                    <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 flex-shrink-0">
                      <Users className="h-3.5 w-3.5" />
                      <span className="font-medium">{r.guests}</span>
                    </div>

                    {/* Expand arrow */}
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                      style={{
                        background: isExpanded ? `${cfg.accentBar}15` : "rgba(0,0,0,0.04)",
                        color: isExpanded ? cfg.accentBar : "#9ca3af",
                      }}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </button>

                  {/* ── Expanded details ────────────────── */}
                  {isExpanded && (
                    <div
                      className="border-t px-5 sm:px-6 py-6"
                      style={{
                        borderColor: `${cfg.accentBar}20`,
                        background: "linear-gradient(180deg, rgba(248,250,252,0.8) 0%, rgba(255,255,255,0.95) 100%)",
                        animation: "myresSlideDown 0.3s ease-out both",
                      }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">

                        {/* Guest Info */}
                        <div className="space-y-2.5">
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px] flex items-center gap-1.5">
                            <span className="w-2 h-px inline-block" style={{ background: cfg.accentBar }} />
                            {t("reservations.detail.guestInfo", { defaultValue: "Guest Information" })}
                          </h4>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                              {r.firstName} {r.lastName}
                            </div>
                            {r.contactEmail && (
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                {r.contactEmail}
                              </div>
                            )}
                            {r.phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                {r.phone}
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Users className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                              {r.guests} {r.guests === 1 ? "guest" : "guests"}
                            </div>
                          </div>
                        </div>

                        {/* Stay details */}
                        <div className="space-y-2.5">
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px] flex items-center gap-1.5">
                            <span className="w-2 h-px inline-block" style={{ background: cfg.accentBar }} />
                            {t("reservations.detail.stayDetails", { defaultValue: "Stay Details" })}
                          </h4>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <CalendarDays className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                              {formatDate(r.checkIn)} → {formatDate(r.checkOut)}
                            </div>
                            {r.checkInTime && (
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Clock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                Check-in: {r.checkInTime}
                              </div>
                            )}
                            {r.room && (
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                Room: {r.room.name} ({r.room.type})
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Hash className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                              {r.accommodationType} / {r.invoiceType}
                            </div>
                          </div>
                        </div>

                        {/* Billing & Notes */}
                        <div className="space-y-2.5">
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px] flex items-center gap-1.5">
                            <span className="w-2 h-px inline-block" style={{ background: cfg.accentBar }} />
                            {t("reservations.detail.billing", { defaultValue: "Billing & Notes" })}
                          </h4>
                          <div className="space-y-1.5">
                            {r.eventType && (
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <FileText className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                Event: {r.eventType}
                              </div>
                            )}
                            {r.eventCode && (
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Hash className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                Code: {r.eventCode}
                              </div>
                            )}
                            {r.freeAccommodation && (
                              <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                                Free Accommodation
                              </div>
                            )}
                            {r.note && (
                              <p className="text-[13px] text-gray-500 bg-white rounded-xl border border-gray-100 p-2.5 mt-1 leading-relaxed">
                                {r.note}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Created date */}
                      <div className="text-[11px] text-gray-400 font-medium mb-4 flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {t("reservations.detail.created", { defaultValue: "Created" })}: {formatDate(r.createdAt)}
                      </div>

                      {/* Rejection reason */}
                      {r.status === "REJECTED" && r.note && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start gap-3">
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-red-700 mb-0.5 uppercase tracking-wide">
                              {t("reservations.detail.rejectionReason", { defaultValue: "Rejection Reason" })}
                            </p>
                            <p className="text-sm text-red-600">{r.note}</p>
                          </div>
                        </div>
                      )}

                      {/* Cancellation info */}
                      {r.status === "CANCELLED" && r.note && r.note.includes("[Cancelled by user]") && (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 flex items-start gap-3">
                          <XCircle className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-gray-600 mb-0.5 uppercase tracking-wide">
                              {t("reservations.detail.cancellationNote", { defaultValue: "Cancellation Note" })}
                            </p>
                            <p className="text-sm text-gray-500">{r.note.replace("[Cancelled by user]", "").trim() || "Cancelled by you."}</p>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                        {canPay && (
                          <button
                            onClick={() => navigate("/payment")}
                            className="myres-action-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold"
                            style={{
                              background: "linear-gradient(135deg, #001f40, #003366, #004d80)",
                              boxShadow: "0 4px 14px rgba(0,51,102,0.25)",
                            }}
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
                            className="myres-action-btn inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors duration-200"
                            onClick={async () => {
                              const reason = window.prompt(
                                t("reservations.action.cancelReason", { defaultValue: "Please provide a reason for cancellation (optional):" })
                              );
                              if (reason === null) return;
                              try {
                                await cancelReservation(r.id, reason || undefined);
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
          <div className="mt-5 text-center" style={stagger(filtered.length + 4)}>
            <p className="text-[12px] text-gray-400 font-medium">
              {t("reservations.showing", { defaultValue: "Showing" })}{" "}
              <span className="font-bold text-gray-600">{filtered.length}</span>{" "}
              {t("reservations.of", { defaultValue: "of" })}{" "}
              <span className="font-bold text-gray-600">{reservations.length}</span>{" "}
              {t("reservations.reservations", { defaultValue: "reservations" })}
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
