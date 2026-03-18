import React from "react";
import campusBg from "@/assets/campus.png";
import { DashboardHero } from "./DashboardHero";
import { Footer } from "./layout/Footer";
import { NotificationBell } from "./NotificationBell";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { getMyLatestReservation, getUserReservations, type Reservation } from "../api/reservations";
import { useNavigate, Link } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Plus,
  Bell,
  ArrowRight,
  ChevronRight,
  Sparkles,
  User,
  Building2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import {
  Select as UISelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

/* ── Inject keyframes once ─────────────────────────────── */
void (document.getElementById("dashboard-anim") ?? (() => {
  const s = document.createElement("style");
  s.id = "dashboard-anim";
  s.textContent = `
    @keyframes dashAurora1 {
      0%   { transform: translate(0,0) scale(1); }
      33%  { transform: translate(30px,-20px) scale(1.08); }
      66%  { transform: translate(-20px,15px) scale(0.95); }
      100% { transform: translate(0,0) scale(1); }
    }
    @keyframes dashAurora2 {
      0%   { transform: translate(0,0) scale(1); }
      33%  { transform: translate(-40px,20px) scale(1.05); }
      66%  { transform: translate(25px,-10px) scale(0.98); }
      100% { transform: translate(0,0) scale(1); }
    }
    @keyframes dashAurora3 {
      0%   { transform: translate(0,0) rotate(0deg); }
      50%  { transform: translate(10px,-15px) rotate(10deg); }
      100% { transform: translate(0,0) rotate(0deg); }
    }
    @keyframes dashGoldShimmer {
      0%   { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes dashPulse {
      0%, 100% { opacity: 0.6; transform: scale(1); }
      50%       { opacity: 1;   transform: scale(1.3); }
    }
    @keyframes dashFloatA {
      0%, 100% { transform: translateY(0px) rotate(12deg); }
      50%       { transform: translateY(-8px) rotate(16deg); }
    }
    @keyframes dashFloatB {
      0%, 100% { transform: translateY(0px) rotate(-8deg); }
      50%       { transform: translateY(10px) rotate(-12deg); }
    }
    @keyframes dashFloatC {
      0%, 100% { transform: translate(0,0) rotate(30deg); }
      50%       { transform: translate(6px,-6px) rotate(36deg); }
    }
    @keyframes dashProgressBar {
      from { width: 0%; }
    }
    @keyframes campusPan {
      0%   { background-position-x: 0%; }
      50%  { background-position-x: 100%; }
      100% { background-position-x: 0%; }
    }
    @keyframes dashCardTilt {
      0%   { transform: perspective(800px) rotateX(0deg) rotateY(0deg); }
    }
    .dash-stat-pill {
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    .dash-tilt-card {
      transition: transform 0.15s ease, box-shadow 0.3s ease;
      transform-style: preserve-3d;
    }
    .dash-quick-action {
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
    }
    .dash-quick-action:hover {
      transform: translateY(-5px);
    }
  `;
  document.head.appendChild(s);
  return s;
})());

/* ── Motion variants ─────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const slideLeft = {
  hidden: { opacity: 0, x: -20 },
  visible: (i = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" as const },
  }),
};


export function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const userId = Number(localStorage.getItem("userId"));
  const userName = localStorage.getItem("userName") || "User";

  const currentLang = i18n.language?.toUpperCase() === "TR" ? "TR" : "EN";
  const switchLanguage = (val: string) => i18n.changeLanguage(val.toLowerCase());

  const [activeReservation, setActiveReservation] = useState<Reservation | null>(null);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [loadingReservation, setLoadingReservation] = useState(true);

  // 3-D tilt state for reservation card
  const [tilt, setTilt] = useState({ rotX: 0, rotY: 0 });
  const tiltRef = React.useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = tiltRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rotX: -y * 8, rotY: x * 10 });
  };
  const handleMouseLeave = () => setTilt({ rotX: 0, rotY: 0 });

  useEffect(() => {
    async function loadData() {
      if (!userId || isNaN(userId)) {
        setActiveReservation(null);
        setAllReservations([]);
        setLoadingReservation(false);
        return;
      }
      try {
        const [latest, all] = await Promise.all([
          getMyLatestReservation(userId),
          getUserReservations(userId),
        ]);
        setActiveReservation(latest);
        setAllReservations(all);
      } catch (err) {
        console.error("Failed to load reservations", err);
      } finally {
        setLoadingReservation(false);
      }
    }
    loadData();
  }, [userId]);

  /* ── Computed stats ──────────────────────────────────────────── */
  const totalReservations = allReservations.length;
  const upcomingStays = allReservations.filter((r) => {
    const checkIn = new Date(r.checkIn);
    return checkIn > new Date() && !["CANCELLED", "REJECTED", "REFUNDED"].includes(r.status);
  }).length;
  const pendingApprovals = allReservations.filter((r) => r.status === "PENDING").length;
  const completedStays = allReservations.filter((r) => {
    const checkOut = new Date(r.checkOut);
    return checkOut < new Date() && ["APPROVED", "PAYMENT_RECEIVED"].includes(r.status);
  }).length;

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB");

  /* ── Stats config ────────────────────────────────────────────── */
  const quickStats = [
    {
      title: t("dashboard.stats.totalReservations", { defaultValue: "Total Reservations" }),
      value: String(totalReservations),
      icon: FileText,
      accent: "#3b82f6",
      gradient: "from-blue-500 to-blue-600",
      bgSoft: "bg-blue-50",
      textSoft: "text-blue-600",
      sub: t("dashboard.stats.totalReservationsSub", { defaultValue: "All time" }),
    },
    {
      title: t("dashboard.stats.upcoming", { defaultValue: "Upcoming Stays" }),
      value: String(upcomingStays),
      icon: CalendarDays,
      accent: "#10b981",
      gradient: "from-emerald-500 to-emerald-600",
      bgSoft: "bg-emerald-50",
      textSoft: "text-emerald-600",
      sub: t("dashboard.stats.upcomingSub", { defaultValue: "Next check-in soon" }),
    },
    {
      title: t("dashboard.stats.pending", { defaultValue: "Pending Approvals" }),
      value: String(pendingApprovals),
      icon: Clock,
      accent: "#f59e0b",
      gradient: "from-amber-500 to-amber-600",
      bgSoft: "bg-amber-50",
      textSoft: "text-amber-600",
      sub: t("dashboard.stats.pendingSub", { defaultValue: "Awaiting review" }),
    },
    {
      title: t("dashboard.stats.completed", { defaultValue: "Completed Stays" }),
      value: String(completedStays),
      icon: CheckCircle2,
      accent: "#8b5cf6",
      gradient: "from-violet-500 to-violet-600",
      bgSoft: "bg-violet-50",
      textSoft: "text-violet-600",
      sub: t("dashboard.stats.completedSub", { defaultValue: "This year" }),
    },
  ];

  /* ── Notifications (static) ──────────────────────────────────── */
  const notifications = [
    {
      type: "success",
      title: t("dashboard.notifications.approvedTitle", { defaultValue: "Reservation Approved" }),
      message: t("dashboard.notifications.approvedMsg", { defaultValue: "Your reservation has been approved. Please proceed to payment if required." }),
      time: t("dashboard.notifications.time1", { defaultValue: "2 hours ago" }),
      icon: CheckCircle2,
      accent: "#10b981",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    },
    {
      type: "warning",
      title: t("dashboard.notifications.pendingTitle", { defaultValue: "Pending Review" }),
      message: t("dashboard.notifications.pendingMsg", { defaultValue: "Your reservation request is awaiting admin approval." }),
      time: t("dashboard.notifications.time2", { defaultValue: "1 day ago" }),
      icon: Clock,
      accent: "#f59e0b",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
    {
      type: "info",
      title: t("dashboard.notifications.reminderTitle", { defaultValue: "Check-in Reminder" }),
      message: t("dashboard.notifications.reminderMsg", { defaultValue: "Check-in is scheduled for 14:00 on your check-in date." }),
      time: t("dashboard.notifications.time3", { defaultValue: "3 days ago" }),
      icon: AlertCircle,
      accent: "#3b82f6",
      bg: "bg-blue-50",
      border: "border-blue-200",
    },
  ];

  /* ── Announcements ───────────────────────────────────────────── */
  const announcements = [
    {
      title: t("dashboard.announcements.a1Title", { defaultValue: "Holiday Season Special Rates" }),
      message: t("dashboard.announcements.a1Msg", { defaultValue: "Enjoy special rates for bookings during the holiday season." }),
      date: "Dec 15, 2025",
    },
    {
      title: t("dashboard.announcements.a2Title", { defaultValue: "New Dining Service Available" }),
      message: t("dashboard.announcements.a2Msg", { defaultValue: "In-room dining is available from 7 AM to 10 PM daily." }),
      date: "Dec 10, 2025",
    },
  ];

  /* ── Status badge ────────────────────────────────────────────── */
  const statusBadge = (status: string) => {
    const base = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide";
    switch (status) {
      case "APPROVED":
        return <span className={`${base} bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200`}><CheckCircle2 className="h-3.5 w-3.5" />{t("dashboard.status.approved", { defaultValue: "Approved" })}</span>;
      case "PAYMENT_PENDING":
        return <span className={`${base} bg-amber-50 text-amber-700 ring-1 ring-amber-200`}><Clock className="h-3.5 w-3.5" />{t("dashboard.status.paymentPending", { defaultValue: "Payment Pending" })}</span>;
      case "PAYMENT_RECEIVED":
        return <span className={`${base} bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200`}><CheckCircle2 className="h-3.5 w-3.5" />{t("dashboard.status.paymentReceived", { defaultValue: "Payment Received" })}</span>;
      case "REFUND_REQUESTED":
        return <span className={`${base} bg-orange-50 text-orange-700 ring-1 ring-orange-200`}><AlertCircle className="h-3.5 w-3.5" />{t("dashboard.status.refundRequested", { defaultValue: "Refund Requested" })}</span>;
      case "REFUNDED":
        return <span className={`${base} bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200`}><CheckCircle2 className="h-3.5 w-3.5" />{t("dashboard.status.refunded", { defaultValue: "Refunded" })}</span>;
      case "CANCELLED":
        return <span className={`${base} bg-gray-100 text-gray-600 ring-1 ring-gray-200`}><AlertCircle className="h-3.5 w-3.5" />{t("dashboard.status.cancelled", { defaultValue: "Cancelled" })}</span>;
      default:
        return <span className={`${base} bg-blue-50 text-blue-700 ring-1 ring-blue-200`}><Clock className="h-3.5 w-3.5" />{t("dashboard.status.pending", { defaultValue: "Pending" })}</span>;
    }
  };

  /* ── Progress steps ──────────────────────────────────────────── */
  const getProgressStep = (reservation: Reservation | null) => {
    if (!reservation) return 0;
    const s = reservation.status;
    const ps = (reservation as any).paymentStatus;
    if (s === "CANCELLED" || s === "REJECTED" || s === "REFUNDED") return -1;
    if (ps === "APPROVED") return 5;
    if (ps === "PENDING_VERIFICATION") return 4;
    if (s === "APPROVED") return 3;
    return 1;
  };

  const progressSteps = [
    { label: t("dashboard.progress.submitted", { defaultValue: "Submitted" }), icon: FileText },
    { label: t("dashboard.progress.underReview", { defaultValue: "Under Review" }), icon: Clock },
    { label: t("dashboard.progress.approved", { defaultValue: "Approved" }), icon: CheckCircle2 },
    { label: t("dashboard.progress.paymentSent", { defaultValue: "Payment Sent" }), icon: Sparkles },
    { label: t("dashboard.progress.confirmed", { defaultValue: "Confirmed" }), icon: CheckCircle2 },
  ];

  const currentStep = getProgressStep(activeReservation);

  /* ── Reservation card gradient by status ────────────────────── */
  const getReservationGradient = () => {
    if (!activeReservation) return "linear-gradient(145deg, #ffffff 0%, #f7fafd 100%)";
    const s = activeReservation.status;
    const ps = (activeReservation as any).paymentStatus;
    if (s === "APPROVED" && ps === "APPROVED") return "linear-gradient(145deg, #f0fdf4 0%, #dcfce7 40%, #f7fff9 100%)";
    if (s === "APPROVED") return "linear-gradient(145deg, #f0fdf4 0%, #f7fafd 100%)";
    if (s === "PENDING") return "linear-gradient(145deg, #fffbf0 0%, #fef9ec 40%, #fffdf7 100%)";
    if (s === "REJECTED" || s === "CANCELLED") return "linear-gradient(145deg, #fff8f8 0%, #fef2f2 40%, #fffbfb 100%)";
    return "linear-gradient(145deg, #ffffff 0%, #f7fafd 100%)";
  };

  const getReservationBorderAccent = () => {
    if (!activeReservation) return "#003366";
    const s = activeReservation.status;
    if (s === "APPROVED") return "#10b981";
    if (s === "PENDING") return "#f59e0b";
    if (s === "REJECTED" || s === "CANCELLED") return "#ef4444";
    return "#003366";
  };

  return (
    <div className="min-h-screen relative">

      {/* ── Animated campus panorama ── */}
      <div
        className="fixed inset-0 z-[-2] min-h-screen w-full bg-[#001428]"
        style={{
          backgroundImage: `url(${campusBg})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "0% 50%",
          transform: "scale(1.05)",
          transformOrigin: "center center",
          animation: "campusPan 90s ease-in-out infinite",
        }}
      />

      {/* ── Dark navy overlay ── */}
      <div className="fixed inset-0 z-[-1] bg-gradient-to-br from-[#001428]/95 via-[#002244]/85 to-[#001428]/95" />

      {/* ═══ HEADER ══════════════════════════════════════════════ */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-50 border-b border-white/10"
        style={{
          background: "rgba(0,28,60,0.96)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.06), 0 6px 28px rgba(0,20,50,0.35)",
        }}
      >
        {/* gradient border bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "1.5px",
            background: "linear-gradient(90deg, transparent, #c9a84c 30%, #4da6ff 60%, #c9a84c 80%, transparent)",
            opacity: 0.6,
          }}
        />
        <div className="max-w-7xl mx-auto px-6 py-3.5">
          <div className="flex justify-between items-center">
            {/* Left — logo */}
            <Link to="/main" className="flex items-center gap-4 group">
              <motion.div
                whileHover={{ scale: 1.04 }}
                className="border border-[#c9a84c]/60 px-3 py-1.5 rounded transition-all duration-300 group-hover:border-[#c9a84c] group-hover:shadow-[0_0_14px_rgba(201,168,76,0.25)]"
                style={{ background: "rgba(201,168,76,0.08)" }}
              >
                <div className="text-[11px] font-bold text-[#c9a84c] leading-tight tracking-wider uppercase">Sabancı</div>
                <div className="text-[9px] text-[#c9a84c]/70 leading-tight tracking-widest">Üniversitesi</div>
              </motion.div>
              <div className="w-px h-8 bg-white/10 hidden sm:block" />
              <div className="hidden sm:flex items-center gap-2.5">
                <Building2 className="h-4 w-4 text-[#c9a84c]/70" strokeWidth={1.5} />
                <h1 className="text-white text-base font-light tracking-[8px] uppercase" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  EDU HOTEL
                </h1>
              </div>
            </Link>

            {/* Center — mobile */}
            <h1 className="sm:hidden text-white text-sm font-light tracking-[5px] uppercase">EDU HOTEL</h1>

            {/* Right — nav */}
            <div className="flex items-center gap-3 sm:gap-4">
              <UISelect value={currentLang} onValueChange={switchLanguage}>
                <SelectTrigger className="w-[58px] h-8 bg-white/6 border-white/15 text-white text-xs font-semibold hover:bg-white/12 focus:ring-0 rounded-lg">
                  <SelectValue placeholder={currentLang} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EN">EN</SelectItem>
                  <SelectItem value="TR">TR</SelectItem>
                </SelectContent>
              </UISelect>

              <NotificationBell lang={currentLang} />

              <Link to="/profile" className="flex items-center gap-2.5 group">
                <motion.div
                  whileHover={{ scale: 1.07, boxShadow: "0 0 14px rgba(255,255,255,0.12)" }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.14)" }}
                >
                  <User className="h-4 w-4 text-white/70" />
                </motion.div>
                <span className="text-xs text-white/60 group-hover:text-white/90 font-medium hidden md:block max-w-[100px] truncate transition-colors duration-200">
                  {userName}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ═══ HERO WELCOME ════════════════════════════════════════ */}
        <DashboardHero
          userName={userName}
          totalReservations={totalReservations}
          upcomingStays={upcomingStays}
          pendingApprovals={pendingApprovals}
          loading={loadingReservation}
        />

        {/* ═══ STATS ═══════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-9">
          {quickStats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={idx}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={idx + 1}
                whileHover={{ y: -5, boxShadow: "0 20px 48px rgba(0,0,0,0.12)" }}
                className="group relative bg-white rounded-2xl p-5 cursor-default overflow-hidden"
                style={{
                  borderTop: `3px solid ${s.accent}`,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 6px 18px rgba(0,0,0,0.05)",
                  transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease",
                }}
              >
                {/* Glow on hover */}
                <motion.div
                  className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle at 85% 15%, ${s.accent}12 0%, transparent 65%)` }}
                />
                <div className="relative flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-400 font-semibold tracking-wider uppercase truncate">{s.title}</p>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.35 + idx * 0.08, type: "spring", stiffness: 220 }}
                      className="text-[32px] font-bold text-gray-900 leading-tight mt-1 tracking-tight"
                    >
                      {loadingReservation ? (
                        <div className="w-8 h-7 bg-gray-100 rounded-lg animate-pulse mt-1" />
                      ) : s.value}
                    </motion.div>
                    <p className="text-[10px] text-gray-400 mt-1.5 font-semibold uppercase tracking-widest">{s.sub}</p>
                  </div>
                  <motion.div
                    whileHover={{ rotate: 10, scale: 1.12 }}
                    transition={{ type: "spring", stiffness: 350 }}
                    className={`p-2.5 rounded-xl ${s.bgSoft} ${s.textSoft} flex-shrink-0`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ═══ MAIN GRID ═══════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">

          {/* ── Left column (2/3) ─────────────────────────────── */}
          <div className="lg:col-span-2 space-y-7">

            {/* ── Current Reservation ────────────────────────── */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={5}
              ref={tiltRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="rounded-2xl overflow-hidden dash-tilt-card"
              style={{
                background: getReservationGradient(),
                boxShadow: "0 2px 4px rgba(0,0,0,0.04), 0 12px 36px rgba(0,51,102,0.08)",
                border: `1px solid rgba(0,51,102,0.07)`,
                borderLeft: `4px solid ${getReservationBorderAccent()}`,
                transform: `perspective(900px) rotateX(${tilt.rotX}deg) rotateY(${tilt.rotY}deg)`,
                transition: "transform 0.15s ease, box-shadow 0.3s ease",
              }}
            >
              {/* Card header */}
              <div className="px-6 py-5 border-b border-black/[0.04] flex items-center justify-between bg-white/40">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ scaleY: [1, 1.25, 1] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-1 h-6 rounded-full"
                    style={{ background: getReservationBorderAccent() }}
                  />
                  <h2 className="text-base font-semibold text-[#003366] tracking-tight">
                    {t("dashboard.activeReservation.title", { defaultValue: "Current Reservation Status" })}
                  </h2>
                </div>
                {activeReservation && (() => {
                  const ps = (activeReservation as any).paymentStatus;
                  if (ps === "APPROVED") return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {t("dashboard.status.confirmed", { defaultValue: "Confirmed" })}
                    </span>
                  );
                  if (ps === "PENDING_VERIFICATION") return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                      <Clock className="h-3.5 w-3.5" />
                      {t("dashboard.status.paymentPending", { defaultValue: "Payment Pending" })}
                    </span>
                  );
                  if (ps === "REJECTED") return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 ring-1 ring-red-200">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {t("dashboard.status.paymentRejected", { defaultValue: "Payment Rejected" })}
                    </span>
                  );
                  return statusBadge(activeReservation.status);
                })()}
              </div>

              <div className="p-6">
                {/* Progress timeline */}
                {activeReservation && currentStep > 0 && (
                  <div className="mb-8 px-1">
                    <div className="flex items-start justify-between relative">
                      <div className="absolute top-[18px] left-[18px] right-[18px] h-[2px] bg-gray-100 rounded-full" />
                      <motion.div
                        className="absolute top-[18px] left-[18px] h-[2px] rounded-full"
                        style={{ background: `linear-gradient(90deg, ${getReservationBorderAccent()}, ${getReservationBorderAccent()}aa)` }}
                        initial={{ width: "0%" }}
                        animate={{ width: `${((Math.min(currentStep, 5) - 1) / 4) * 91}%` }}
                        transition={{ duration: 1.1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      />
                      {progressSteps.map((step, idx) => {
                        const StepIcon = step.icon;
                        const isActive = idx + 1 <= currentStep;
                        const isCurrent = idx + 1 === currentStep;
                        return (
                          <div key={idx} className="relative z-10 flex flex-col items-center gap-2" style={{ flex: 1 }}>
                            <motion.div
                              initial={{ scale: 0.4, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.35 + idx * 0.11, type: "spring", stiffness: 280 }}
                              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 ${
                                isActive
                                  ? currentStep === 5 ? "bg-emerald-600 text-white" : "bg-[#003366] text-white"
                                  : "bg-white border-2 border-gray-200 text-gray-400"
                              } ${isCurrent ? "ring-4 ring-[#003366]/15 shadow-lg" : ""}`}
                              style={isActive ? { boxShadow: `0 4px 14px ${getReservationBorderAccent()}40` } : {}}
                            >
                              <StepIcon className="h-3.5 w-3.5" strokeWidth={2} />
                            </motion.div>
                            <span className={`text-[10px] font-semibold tracking-wide text-center leading-tight ${isActive ? "text-[#003366]" : "text-gray-400"}`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Reservation detail chips */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                  {[
                    {
                      label: t("dashboard.activeReservation.reservationId", { defaultValue: "Reservation ID" }),
                      value: activeReservation?.id ? `#${activeReservation.id}` : "—",
                    },
                    {
                      label: t("dashboard.activeReservation.dates", { defaultValue: "Dates" }),
                      value: activeReservation
                        ? `${formatDate(activeReservation.checkIn)} → ${formatDate(activeReservation.checkOut)}`
                        : "—",
                    },
                    {
                      label: t("dashboard.activeReservation.amount", { defaultValue: "Amount" }),
                      value: activeReservation
                        ? ((activeReservation as any).price != null
                            ? `₺ ${(activeReservation as any).price.toLocaleString()}`
                            : t("dashboard.activeReservation.priceNotSet", { defaultValue: "To be determined" }))
                        : "—",
                    },
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.65 + idx * 0.08, ease: "easeOut" }}
                      className="rounded-xl p-4"
                      style={{
                        background: "linear-gradient(135deg, rgba(248,250,252,0.9) 0%, rgba(241,245,249,0.7) 100%)",
                        border: "1px solid rgba(0,51,102,0.07)",
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">{item.label}</p>
                      <p className="text-sm text-gray-900 font-semibold">{item.value}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.a
                    href="reservations"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    className="group/btn inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 border-2 border-[#003366]/20 text-[#003366] font-semibold text-sm hover:border-[#003366] hover:bg-[#003366] hover:text-white transition-all duration-300"
                  >
                    {t("dashboard.activeReservation.viewRequests", { defaultValue: "View My Requests" })}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                  </motion.a>

                  <motion.a
                    href="book-room"
                    whileHover={{ scale: 1.02, y: -1, boxShadow: "0 10px 28px rgba(0,51,102,0.3)" }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 bg-[#003366] text-white font-semibold text-sm transition-all duration-300"
                    style={{ boxShadow: "0 4px 14px rgba(0,51,102,0.22)" }}
                  >
                    <Plus className="h-4 w-4" />
                    {t("dashboard.activeReservation.createNew", { defaultValue: "Create New Reservation" })}
                  </motion.a>

                  <motion.button
                    whileHover={
                      activeReservation?.status === "APPROVED" &&
                      !["PENDING_VERIFICATION", "APPROVED"].includes((activeReservation as any)?.paymentStatus || "")
                        ? { scale: 1.02, y: -1, boxShadow: "0 10px 28px rgba(0,51,102,0.3)" }
                        : {}
                    }
                    whileTap={{ scale: 0.97 }}
                    disabled={
                      activeReservation?.status !== "APPROVED" ||
                      (activeReservation as any)?.price == null ||
                      ["PENDING_VERIFICATION", "APPROVED"].includes((activeReservation as any)?.paymentStatus || "")
                    }
                    onClick={() => navigate("/payment")}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold text-sm transition-all duration-300 ${
                      activeReservation?.status === "APPROVED" &&
                      (activeReservation as any)?.price != null &&
                      !["PENDING_VERIFICATION", "APPROVED"].includes((activeReservation as any)?.paymentStatus || "")
                        ? "bg-[#003366] text-white cursor-pointer"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {(activeReservation as any)?.paymentStatus === "APPROVED"
                      ? t("dashboard.activeReservation.paymentConfirmed", { defaultValue: "Payment Confirmed" })
                      : (activeReservation as any)?.paymentStatus === "PENDING_VERIFICATION"
                      ? t("dashboard.activeReservation.paymentSent", { defaultValue: "Payment Sent" })
                      : (activeReservation as any)?.price == null && activeReservation?.status === "APPROVED"
                      ? t("dashboard.activeReservation.awaitingPrice", { defaultValue: "Awaiting Price" })
                      : t("dashboard.activeReservation.proceedPayment", { defaultValue: "Proceed to Payment" })}
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* ── Quick Actions ──────────────────────────────── */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={6}
              className="bg-white rounded-2xl overflow-hidden"
              style={{
                boxShadow: "0 2px 4px rgba(0,0,0,0.04), 0 6px 18px rgba(0,0,0,0.05)",
                border: "1px solid rgba(0,51,102,0.06)",
              }}
            >
              <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-[#003366]" />
                <h2 className="text-base font-semibold text-[#003366] tracking-tight">
                  {t("main.quickActions", { defaultValue: "Quick Actions" })}
                </h2>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Book a Room */}
                <motion.a
                  href="book-room"
                  whileHover={{ y: -5, boxShadow: "0 20px 48px rgba(0,51,102,0.3)" }}
                  whileTap={{ scale: 0.97 }}
                  className="dash-quick-action group/qa relative rounded-2xl p-5 text-white flex items-center justify-between overflow-hidden cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, #000e22 0%, #002952 50%, #004d80 100%)",
                    boxShadow: "0 6px 20px rgba(0,51,102,0.22)",
                  }}
                >
                  {/* Hover sheen */}
                  <div className="absolute inset-0 opacity-0 group-hover/qa:opacity-100 transition-opacity duration-400"
                    style={{ background: "radial-gradient(circle at 80% 40%, rgba(201,168,76,0.1) 0%, transparent 60%)" }}
                  />
                  {/* Micro grid */}
                  <div className="absolute inset-0 opacity-[0.03]"
                    style={{
                      backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                      backgroundSize: "18px 18px",
                    }}
                  />
                  <div className="relative flex items-center gap-3">
                    <motion.div
                      whileHover={{ rotate: 90, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"
                    >
                      <Plus className="h-5 w-5" />
                    </motion.div>
                    <span className="font-semibold text-sm">{t("main.quick.bookRoom", { defaultValue: "Book a Room" })}</span>
                  </div>
                  <ArrowRight className="relative h-4 w-4 opacity-40 group-hover/qa:opacity-100 group-hover/qa:translate-x-1.5 transition-all duration-300" />
                </motion.a>

                {/* My Requests */}
                <motion.a
                  href="reservations"
                  whileHover={{ y: -5, boxShadow: "0 20px 48px rgba(0,51,102,0.13)" }}
                  whileTap={{ scale: 0.97 }}
                  className="dash-quick-action group/qa rounded-2xl p-5 flex items-center justify-between cursor-pointer"
                  style={{
                    border: "2px solid rgba(0,51,102,0.12)",
                    background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      whileHover={{ rotate: -5, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="w-10 h-10 rounded-xl bg-[#003366]/6 flex items-center justify-center group-hover/qa:bg-[#003366]/10 transition-colors"
                    >
                      <FileText className="h-5 w-5 text-[#003366]" />
                    </motion.div>
                    <span className="font-semibold text-sm text-[#003366]">
                      {t("dashboard.quick.viewReservations", { defaultValue: "My Reservation Requests" })}
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#003366]/25 group-hover/qa:text-[#003366] group-hover/qa:translate-x-1.5 transition-all duration-300" />
                </motion.a>

                {/* Notifications */}
                <motion.a
                  href="notifications"
                  whileHover={{ y: -5, boxShadow: "0 20px 48px rgba(0,51,102,0.13)" }}
                  whileTap={{ scale: 0.97 }}
                  className="dash-quick-action group/qa rounded-2xl p-5 flex items-center justify-between cursor-pointer"
                  style={{
                    border: "2px solid rgba(0,51,102,0.12)",
                    background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      whileHover={{ rotate: -5, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="w-10 h-10 rounded-xl bg-[#003366]/6 flex items-center justify-center group-hover/qa:bg-[#003366]/10 transition-colors"
                    >
                      <Bell className="h-5 w-5 text-[#003366]" />
                    </motion.div>
                    <span className="font-semibold text-sm text-[#003366]">
                      {t("dashboard.quick.notifications", { defaultValue: "Notifications" })}
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#003366]/25 group-hover/qa:text-[#003366] group-hover/qa:translate-x-1.5 transition-all duration-300" />
                </motion.a>

                {/* Contact Support */}
                <motion.a
                  href="contact"
                  whileHover={{ y: -5, boxShadow: "0 20px 48px rgba(0,51,102,0.13)" }}
                  whileTap={{ scale: 0.97 }}
                  className="dash-quick-action group/qa rounded-2xl p-5 flex items-center justify-between cursor-pointer"
                  style={{
                    border: "2px solid rgba(0,51,102,0.12)",
                    background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      whileHover={{ rotate: -5, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="w-10 h-10 rounded-xl bg-[#003366]/6 flex items-center justify-center group-hover/qa:bg-[#003366]/10 transition-colors"
                    >
                      <AlertCircle className="h-5 w-5 text-[#003366]" />
                    </motion.div>
                    <span className="font-semibold text-sm text-[#003366]">
                      {t("dashboard.quick.contactSupport", { defaultValue: "Contact Support" })}
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#003366]/25 group-hover/qa:text-[#003366] group-hover/qa:translate-x-1.5 transition-all duration-300" />
                </motion.a>
              </div>
            </motion.div>

            {/* ── Reservation Rules ──────────────────────────── */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={7}
              className="bg-white rounded-2xl overflow-hidden"
              style={{
                boxShadow: "0 2px 4px rgba(0,0,0,0.04), 0 6px 18px rgba(0,0,0,0.05)",
                border: "1px solid rgba(0,51,102,0.06)",
              }}
            >
              <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-amber-400" />
                <h2 className="text-base font-semibold text-[#003366] tracking-tight">
                  {t("dashboard.rules.title", { defaultValue: "Reservation Rules" })}
                </h2>
                <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full ring-1 ring-amber-200">
                  {t("dashboard.rules.important", { defaultValue: "Important" })}
                </span>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {[
                    t("dashboard.rules.r1", { defaultValue: "Sunday check-in is not allowed." }),
                    t("dashboard.rules.r2", { defaultValue: "You can request reservations up to 30 days ahead." }),
                    t("dashboard.rules.r3", { defaultValue: "Individual stays cannot exceed 5 consecutive days (unless authorized)." }),
                    t("dashboard.rules.r4", { defaultValue: "Saturday check-in & Sunday check-out combinations may be restricted by the system." }),
                    t("dashboard.rules.r5", { defaultValue: "Room selection is not available to users; rooms are assigned by the hotel/admin workflow." }),
                  ].map((rule, idx) => (
                    <motion.div
                      key={idx}
                      variants={slideLeft}
                      initial="hidden"
                      animate="visible"
                      custom={idx}
                      className="flex gap-3 items-start group"
                    >
                      <div className="w-5 h-5 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-amber-600">{idx + 1}</span>
                      </div>
                      <p className="text-[13px] text-gray-500 leading-relaxed group-hover:text-gray-700 transition-colors duration-200">{rule}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── Right column (1/3) ────────────────────────────── */}
          <div className="lg:col-span-1 space-y-7">

            {/* ── Notifications panel ───────────────────────── */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={5}
              className="rounded-2xl overflow-hidden"
              style={{
                boxShadow: "0 2px 4px rgba(0,0,0,0.04), 0 6px 18px rgba(0,0,0,0.05)",
                border: "1px solid rgba(0,51,102,0.07)",
              }}
            >
              <div
                className="px-5 py-4 text-white relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, #000e22 0%, #002952 50%, #004d80 100%)" }}
              >
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10"
                  style={{ background: "radial-gradient(circle, #c9a84c, transparent)", transform: "translate(30%, -30%)" }}
                />
                <div className="relative flex items-center gap-2.5">
                  <Bell className="h-4 w-4 opacity-70" />
                  <h2 className="text-[14px] font-semibold tracking-tight">
                    {t("dashboard.notifications.title", { defaultValue: "Notifications" })}
                  </h2>
                  <span className="ml-auto text-[10px] bg-white/15 px-2.5 py-1 rounded-full font-bold">
                    {notifications.length} new
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-2.5 bg-white">
                <AnimatePresence>
                  {notifications.map((n, idx) => {
                    const Icon = n.icon;
                    return (
                      <motion.div
                        key={idx}
                        variants={slideLeft}
                        initial="hidden"
                        animate="visible"
                        custom={idx}
                        whileHover={{ x: 4, transition: { duration: 0.15 } }}
                        className={`rounded-xl p-4 border ${n.border} cursor-default`}
                        style={{
                          background: `${n.bg.replace("bg-", "")}`,
                          borderLeft: `3px solid ${n.accent}`,
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: `${n.accent}16`, color: n.accent }}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-gray-800 mb-0.5">{n.title}</p>
                            <p className="text-[12px] text-gray-500 leading-relaxed">{n.message}</p>
                            <p className="text-[11px] text-gray-400 mt-1.5 font-medium">{n.time}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* ── Announcements ──────────────────────────────── */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={6}
              className="bg-white rounded-2xl overflow-hidden"
              style={{
                boxShadow: "0 2px 4px rgba(0,0,0,0.04), 0 6px 18px rgba(0,0,0,0.05)",
                border: "1px solid rgba(0,51,102,0.06)",
              }}
            >
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-1 h-5 rounded-full bg-[#c9a84c]" />
                <h2 className="text-[14px] font-semibold text-[#003366] tracking-tight">
                  {t("main.announcements.title", { defaultValue: "Announcements" })}
                </h2>
              </div>
              <div className="p-4 space-y-2.5">
                {announcements.map((a, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ x: 4, backgroundColor: "rgba(248,250,252,1)" }}
                    transition={{ duration: 0.15 }}
                    className="group p-4 rounded-xl border border-gray-100 cursor-pointer transition-colors duration-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] text-gray-800 font-semibold group-hover:text-[#003366] transition-colors">{a.title}</p>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[#003366] flex-shrink-0 mt-0.5 transition-all group-hover:translate-x-0.5" />
                    </div>
                    <p className="text-[12px] text-gray-500 mt-1.5 leading-relaxed">{a.message}</p>
                    <p className="text-[11px] text-gray-400 mt-2 font-medium">{a.date}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* ── Help Card ──────────────────────────────────── */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={7}
              className="rounded-2xl overflow-hidden relative"
              style={{
                background: "linear-gradient(145deg, #000e22 0%, #002952 45%, #004080 100%)",
                boxShadow: "0 12px 40px rgba(0,41,82,0.35)",
              }}
            >
              {/* Decorative glow */}
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-12"
                style={{ background: "radial-gradient(circle, #c9a84c, transparent)" }}
              />
              <div className="absolute bottom-0 left-0 w-full h-px opacity-15"
                style={{ background: "linear-gradient(90deg, transparent, #c9a84c, transparent)" }}
              />

              <div className="relative p-6 text-white">
                <div className="flex items-start gap-4">
                  <motion.div
                    animate={{ rotate: [0, 6, -6, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.22)" }}
                  >
                    <AlertCircle className="h-5 w-5 text-[#c9a84c]" />
                  </motion.div>
                  <div>
                    <p className="text-[15px] font-semibold mb-2 tracking-tight">
                      {t("dashboard.help.title", { defaultValue: "Need Help?" })}
                    </p>
                    <p className="text-[12px] text-blue-200/60 leading-relaxed mb-4">
                      {t("dashboard.help.msg", { defaultValue: "If you have issues with approvals, payment receipts, or cancellations, contact the support team." })}
                    </p>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05, boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}
                      whileTap={{ scale: 0.96 }}
                      className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[#001f40] text-sm font-bold transition-all duration-300"
                      style={{
                        background: "linear-gradient(135deg, #f0d080, #c9a84c)",
                      }}
                    >
                      {t("dashboard.help.cta", { defaultValue: "Contact Support" })}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
