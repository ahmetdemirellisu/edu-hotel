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
} from "lucide-react";

import {
  Select as UISelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

/* ═══════════════════════════════════════════════════════════
   Inject animations once
   ═══════════════════════════════════════════════════════════ */
const _style = document.getElementById("dash-anim") ?? (() => {
  const s = document.createElement("style");
  s.id = "dash-anim";
  s.textContent = `
    @keyframes dashFadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes dashSlideIn {
      from { opacity: 0; transform: translateX(-12px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes dashPulse {
      0%, 100% { opacity: 1; }
      50%      { opacity: 0.6; }
    }
    @keyframes dashShimmer {
      0%   { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `;
  document.head.appendChild(s);
  return s;
})();

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

  /* ── Computed stats from real data ──────── */
  const totalReservations = allReservations.length;
  const upcomingStays = allReservations.filter((r) => {
    const checkIn = new Date(r.checkIn);
    return (
      checkIn > new Date() &&
      !["CANCELLED", "REJECTED", "REFUNDED"].includes(r.status)
    );
  }).length;
  const pendingApprovals = allReservations.filter((r) => r.status === "PENDING").length;
  const completedStays = allReservations.filter((r) => {
    const checkOut = new Date(r.checkOut);
    return (
      checkOut < new Date() &&
      ["APPROVED", "PAYMENT_RECEIVED"].includes(r.status)
    );
  }).length;

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB");

  const calculateAmount = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    return nights * 1200;
  };

  /* ── Stagger helper ─────────────────────── */
  const stagger = (i: number): React.CSSProperties => ({
    animation: `dashFadeUp 0.5s ease-out ${0.1 + i * 0.06}s both`,
  });

  /* ── Stats config with accent colors ────── */
  const quickStats = [
    {
      title: t("dashboard.stats.totalReservations", { defaultValue: "Total Reservations" }),
      value: String(totalReservations),
      icon: FileText,
      accent: "#3b82f6",
      bgIcon: "bg-blue-50",
      textIcon: "text-blue-600",
      sub: t("dashboard.stats.totalReservationsSub", { defaultValue: "All time" }),
    },
    {
      title: t("dashboard.stats.upcoming", { defaultValue: "Upcoming Stays" }),
      value: String(upcomingStays),
      icon: CalendarDays,
      accent: "#22c55e",
      bgIcon: "bg-emerald-50",
      textIcon: "text-emerald-600",
      sub: t("dashboard.stats.upcomingSub", { defaultValue: "Next check-in soon" }),
    },
    {
      title: t("dashboard.stats.pending", { defaultValue: "Pending Approvals" }),
      value: String(pendingApprovals),
      icon: Clock,
      accent: "#f59e0b",
      bgIcon: "bg-amber-50",
      textIcon: "text-amber-600",
      sub: t("dashboard.stats.pendingSub", { defaultValue: "Awaiting review" }),
    },
    {
      title: t("dashboard.stats.completed", { defaultValue: "Completed Stays" }),
      value: String(completedStays),
      icon: CheckCircle2,
      accent: "#8b5cf6",
      bgIcon: "bg-violet-50",
      textIcon: "text-violet-600",
      sub: t("dashboard.stats.completedSub", { defaultValue: "This year" }),
    },
  ];

  /* ── Notifications ──────────────────────── */
  const notifications = [
    {
      type: "success",
      title: t("dashboard.notifications.approvedTitle", { defaultValue: "Reservation Approved" }),
      message: t("dashboard.notifications.approvedMsg", {
        defaultValue: "Your reservation has been approved. Please proceed to payment if required.",
      }),
      time: t("dashboard.notifications.time1", { defaultValue: "2 hours ago" }),
      icon: CheckCircle2,
      accent: "#22c55e",
      bg: "bg-emerald-50/50",
      border: "border-emerald-200",
    },
    {
      type: "warning",
      title: t("dashboard.notifications.pendingTitle", { defaultValue: "Pending Review" }),
      message: t("dashboard.notifications.pendingMsg", {
        defaultValue: "Your reservation request is awaiting admin approval.",
      }),
      time: t("dashboard.notifications.time2", { defaultValue: "1 day ago" }),
      icon: Clock,
      accent: "#f59e0b",
      bg: "bg-amber-50/50",
      border: "border-amber-200",
    },
    {
      type: "info",
      title: t("dashboard.notifications.reminderTitle", { defaultValue: "Check-in Reminder" }),
      message: t("dashboard.notifications.reminderMsg", {
        defaultValue: "Check-in is scheduled for 14:00 on your check-in date.",
      }),
      time: t("dashboard.notifications.time3", { defaultValue: "3 days ago" }),
      icon: AlertCircle,
      accent: "#3b82f6",
      bg: "bg-blue-50/50",
      border: "border-blue-200",
    },
  ];

  /* ── Announcements ──────────────────────── */
  const announcements = [
    {
      title: t("dashboard.announcements.a1Title", { defaultValue: "Holiday Season Special Rates" }),
      message: t("dashboard.announcements.a1Msg", {
        defaultValue: "Enjoy special rates for bookings during the holiday season.",
      }),
      date: "Dec 15, 2025",
    },
    {
      title: t("dashboard.announcements.a2Title", { defaultValue: "New Dining Service Available" }),
      message: t("dashboard.announcements.a2Msg", {
        defaultValue: "In-room dining is available from 7 AM to 10 PM daily.",
      }),
      date: "Dec 10, 2025",
    },
  ];

  /* ── Status badge ───────────────────────── */
  const statusBadge = (status: string) => {
    const base = "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide";
    switch (status) {
      case "APPROVED":
        return (
          <span className={`${base} bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200`}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t("dashboard.status.approved", { defaultValue: "Approved" })}
          </span>
        );
      case "PAYMENT_PENDING":
        return (
          <span className={`${base} bg-amber-50 text-amber-700 ring-1 ring-amber-200`}>
            <Clock className="h-3.5 w-3.5" />
            {t("dashboard.status.paymentPending", { defaultValue: "Payment Pending" })}
          </span>
        );
      case "PAYMENT_RECEIVED":
        return (
          <span className={`${base} bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200`}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t("dashboard.status.paymentReceived", { defaultValue: "Payment Received" })}
          </span>
        );
      case "REFUND_REQUESTED":
        return (
          <span className={`${base} bg-orange-50 text-orange-700 ring-1 ring-orange-200`}>
            <AlertCircle className="h-3.5 w-3.5" />
            {t("dashboard.status.refundRequested", { defaultValue: "Refund Requested" })}
          </span>
        );
      case "REFUNDED":
        return (
          <span className={`${base} bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200`}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t("dashboard.status.refunded", { defaultValue: "Refunded" })}
          </span>
        );
      case "CANCELLED":
        return (
          <span className={`${base} bg-gray-50 text-gray-600 ring-1 ring-gray-200`}>
            <AlertCircle className="h-3.5 w-3.5" />
            {t("dashboard.status.cancelled", { defaultValue: "Cancelled" })}
          </span>
        );
      default:
        return (
          <span className={`${base} bg-blue-50 text-blue-700 ring-1 ring-blue-200`}>
            <Clock className="h-3.5 w-3.5" />
            {t("dashboard.status.pending", { defaultValue: "Pending" })}
          </span>
        );
    }
  };

  /* ── Progress steps ─────────────────────── */
  const getProgressStep = (reservation: Reservation | null) => {
    if (!reservation) return 0;
    const s = reservation.status;
    const ps = (reservation as any).paymentStatus;

    if (s === "CANCELLED" || s === "REJECTED" || s === "REFUNDED") return -1;
    if (ps === "APPROVED") return 5;               // Payment confirmed
    if (ps === "PENDING_VERIFICATION") return 4;    // User uploaded receipt, waiting admin
    if (s === "APPROVED") return 3;                 // Admin approved, waiting payment
    if (s === "PENDING") return 1;                  // Submitted, under review
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

  return (
    <div className="min-h-screen bg-[#f8fafb]">
      {/* ═══ HEADER (glassmorphism — matches Login/Signup) ═══ */}
      <header
        className="sticky top-0 z-50 border-b border-white/10"
        style={{
          background: "rgba(0,51,102,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex justify-between items-center">
            {/* Left — logo group */}
            <div className="flex items-center gap-4">
              <Link to="/main" className="flex items-center gap-4">
                <div className="border border-[#c9a84c] px-3 py-1.5 rounded">
                  <div className="text-[11px] font-semibold text-[#c9a84c] leading-tight">
                    Sabancı
                  </div>
                  <div className="text-[10px] text-[#c9a84c]/80 leading-tight">
                    Üniversitesi
                  </div>
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

            {/* Center title (mobile) */}
            <h1 className="sm:hidden text-white text-base font-bold tracking-[4px]">
              EDU HOTEL
            </h1>

            {/* Right — nav items */}
            <div className="flex items-center gap-3 sm:gap-5">
              {/* Language */}
              <UISelect value={currentLang} onValueChange={switchLanguage}>
                <SelectTrigger className="w-[58px] h-8 bg-white/5 border-white/20 text-white text-xs font-semibold hover:bg-white/10 focus:ring-0 rounded-lg">
                  <SelectValue placeholder={currentLang} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EN">EN</SelectItem>
                  <SelectItem value="TR">TR</SelectItem>
                </SelectContent>
              </UISelect>

              {/* Notification bell */}
              <NotificationBell lang={currentLang} />

              {/* User avatar */}
              <Link to="/profile" className="flex items-center gap-2.5 pl-1 group cursor-pointer">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ═══ Welcome ═══════════════════════════════════ */}
        <div className="mb-9" style={stagger(0)}>
          <h1 className="text-[28px] font-semibold text-[#003366] tracking-tight mb-1.5">
            {t("main.welcomeBack", { defaultValue: "Welcome back!" })}
          </h1>
          <p className="text-[15px] text-gray-500">
            {t("dashboard.subtitle", {
              defaultValue:
                "Track your reservation requests, approvals, payments, and notifications in one place.",
            })}
          </p>
        </div>

        {/* ═══ Stats ═════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-9">
          {quickStats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="group bg-white rounded-2xl border border-gray-100 p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default overflow-hidden relative"
                style={{
                  ...stagger(idx + 1),
                  borderLeft: `3px solid ${s.accent}`,
                }}
              >
                {/* Subtle gradient glow on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 85% 30%, ${s.accent}08 0%, transparent 60%)`,
                  }}
                />
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] text-gray-500 font-medium">{s.title}</p>
                    <div className="text-[32px] font-bold text-gray-900 leading-tight mt-1 tracking-tight">
                      {s.value}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1.5 font-medium uppercase tracking-wider">
                      {s.sub}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${s.bgIcon} ${s.textIcon} transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ═══ Main grid ═════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">

          {/* ── Left column (2/3) ─────────────────────── */}
          <div className="lg:col-span-2 space-y-7">

            {/* ── Current Reservation Status ──────────── */}
            <div
              className="rounded-2xl border border-gray-100 overflow-hidden"
              style={{
                ...stagger(5),
                background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,51,102,0.04)",
              }}
            >
              {/* Header with subtle accent line */}
              <div className="px-6 py-5 border-b border-gray-100/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 rounded-full bg-[#003366]" />
                  <h2 className="text-lg font-semibold text-[#003366] tracking-tight">
                    {t("dashboard.activeReservation.title", { defaultValue: "Current Reservation Status" })}
                  </h2>
                </div>
                {activeReservation && (() => {
                  const ps = (activeReservation as any).paymentStatus;
                  if (ps === "APPROVED") {
                    return (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t("dashboard.status.confirmed", { defaultValue: "Confirmed" })}
                      </span>
                    );
                  }
                  if (ps === "PENDING_VERIFICATION") {
                    return (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                        <Clock className="h-3.5 w-3.5" />
                        {t("dashboard.status.paymentPending", { defaultValue: "Payment Pending" })}
                      </span>
                    );
                  }
                  if (ps === "REJECTED") {
                    return (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide bg-red-50 text-red-700 ring-1 ring-red-200">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {t("dashboard.status.paymentRejected", { defaultValue: "Payment Rejected" })}
                      </span>
                    );
                  }
                  return statusBadge(activeReservation.status);
                })()}
              </div>

              <div className="p-6">
                {/* Progress timeline */}
                {activeReservation && currentStep > 0 && (
                  <div className="mb-6 px-2">
                    <div className="flex items-center justify-between relative">
                      {/* Background line */}
                      <div className="absolute top-5 left-6 right-6 h-[2px] bg-gray-100" />
                      {/* Active line */}
                      <div
                        className="absolute top-5 left-6 h-[2px] bg-[#003366] transition-all duration-700 ease-out"
                        style={{ width: `${((Math.min(currentStep, 5) - 1) / 4) * (100 - 8)}%` }}
                      />
                      {progressSteps.map((step, idx) => {
                        const StepIcon = step.icon;
                        const isActive = idx + 1 <= currentStep;
                        const isCurrent = idx + 1 === currentStep;
                        return (
                          <div key={idx} className="relative z-10 flex flex-col items-center gap-2" style={{ flex: 1 }}>
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 ${
                                isActive
                                  ? isCurrent && currentStep === 5
                                    ? "bg-emerald-600 text-white shadow-md"
                                    : "bg-[#003366] text-white shadow-md"
                                  : "bg-gray-100 text-gray-400"
                              } ${isCurrent ? "ring-4 ring-[#003366]/15" : ""}`}
                            >
                              <StepIcon className="h-3.5 w-3.5" strokeWidth={2} />
                            </div>
                            <span
                              className={`text-[10px] font-medium tracking-wide text-center leading-tight ${
                                isActive ? "text-[#003366]" : "text-gray-400"
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Reservation details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                        ? `₺ ${calculateAmount(activeReservation.checkIn, activeReservation.checkOut).toLocaleString()}`
                        : "—",
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50/70 rounded-xl p-4 border border-gray-100/50"
                    >
                      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-1.5">
                        {item.label}
                      </p>
                      <p className="text-sm text-gray-900 font-semibold">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <a
                    href="/reservations"
                    className="group/btn inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 border-2 border-[#003366] text-[#003366] font-medium text-sm
                               hover:bg-[#003366] hover:text-white transition-all duration-300"
                  >
                    {t("dashboard.activeReservation.viewRequests", { defaultValue: "View My Requests" })}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-0.5" />
                  </a>
                  <a
                    href="book-room"
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 bg-[#003366] text-white font-medium text-sm
                               hover:bg-[#002244] hover:shadow-lg transition-all duration-300"
                  >
                    <Plus className="h-4 w-4" />
                    {t("dashboard.activeReservation.createNew", { defaultValue: "Create New Reservation" })}
                  </a>
                  <button
                    disabled={
                      activeReservation?.status !== "APPROVED" ||
                      ["PENDING_VERIFICATION", "APPROVED"].includes((activeReservation as any)?.paymentStatus || "")
                    }
                    onClick={() => navigate("/payment")}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-medium text-sm transition-all duration-300
                      ${
                        activeReservation?.status === "APPROVED" &&
                        !["PENDING_VERIFICATION", "APPROVED"].includes((activeReservation as any)?.paymentStatus || "")
                          ? "bg-[#003366] text-white hover:bg-[#002244] hover:shadow-lg cursor-pointer"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    title={
                      (activeReservation as any)?.paymentStatus === "PENDING_VERIFICATION"
                        ? t("dashboard.activeReservation.paymentSentTip", { defaultValue: "Payment receipt uploaded, awaiting verification." })
                        : (activeReservation as any)?.paymentStatus === "APPROVED"
                        ? t("dashboard.activeReservation.paymentConfirmedTip", { defaultValue: "Payment has been confirmed." })
                        : activeReservation?.status !== "APPROVED"
                        ? t("dashboard.activeReservation.paymentDisabledTip", { defaultValue: "Payment is available only after approval." })
                        : undefined
                    }
                  >
                    {(activeReservation as any)?.paymentStatus === "APPROVED"
                      ? t("dashboard.activeReservation.paymentConfirmed", { defaultValue: "Payment Confirmed" })
                      : (activeReservation as any)?.paymentStatus === "PENDING_VERIFICATION"
                      ? t("dashboard.activeReservation.paymentSent", { defaultValue: "Payment Sent" })
                      : t("dashboard.activeReservation.proceedPayment", { defaultValue: "Proceed to Payment" })}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Quick Actions ────────────────────────── */}
            <div
              className="bg-white rounded-2xl border border-gray-100"
              style={{
                ...stagger(6),
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <div className="px-6 py-5 border-b border-gray-100/80 flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-[#003366]" />
                <h2 className="text-lg font-semibold text-[#003366] tracking-tight">
                  {t("main.quickActions", { defaultValue: "Quick Actions" })}
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Book a Room */}
                <a
                  className="group/qa rounded-2xl p-5 bg-[#003366] text-white transition-all duration-300 hover:bg-[#002244] hover:shadow-lg flex items-center justify-between"
                  href="/book-room"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <Plus className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-sm">
                      {t("main.quick.bookRoom", { defaultValue: "Book a Room" })}
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 opacity-60 group-hover/qa:opacity-100 group-hover/qa:translate-x-0.5 transition-all duration-300" />
                </a>

                {/* My Requests */}
                <a
                  className="group/qa rounded-2xl p-5 border-2 border-[#003366] text-[#003366] transition-all duration-300 hover:bg-[#003366] hover:text-white flex items-center justify-between"
                  href="/reservations"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#003366]/5 group-hover/qa:bg-white/10 flex items-center justify-center transition-colors">
                      <FileText className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-sm">
                      {t("dashboard.quick.viewReservations", { defaultValue: "My Reservation Requests" })}
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 opacity-40 group-hover/qa:opacity-100 group-hover/qa:translate-x-0.5 transition-all duration-300" />
                </a>

                {/* Notifications — Soon */}
                <button
                  className="group/qa rounded-2xl p-5 border border-gray-200 text-gray-600 transition-all duration-300 hover:border-gray-300 hover:bg-gray-50 flex items-center justify-between"
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Bell className="h-5 w-5 text-gray-400" />
                    </div>
                    <span className="font-medium text-sm">
                      {t("dashboard.quick.notifications", { defaultValue: "Notifications" })}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider bg-gray-100 px-2.5 py-1 rounded-full">
                    {t("dashboard.quick.soon", { defaultValue: "Soon" })}
                  </span>
                </button>

                {/* Support — Soon */}
                <button
                  className="group/qa rounded-2xl p-5 border border-gray-200 text-gray-600 transition-all duration-300 hover:border-gray-300 hover:bg-gray-50 flex items-center justify-between"
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-gray-400" />
                    </div>
                    <span className="font-medium text-sm">
                      {t("dashboard.quick.contactSupport", { defaultValue: "Contact Support" })}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider bg-gray-100 px-2.5 py-1 rounded-full">
                    {t("dashboard.quick.soon", { defaultValue: "Soon" })}
                  </span>
                </button>
              </div>
            </div>

            {/* ── Reservation Rules ───────────────────── */}
            <div
              className="bg-white rounded-2xl border border-gray-100"
              style={{
                ...stagger(7),
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <div className="px-6 py-5 border-b border-gray-100/80 flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-amber-400" />
                <h2 className="text-lg font-semibold text-[#003366] tracking-tight">
                  {t("dashboard.rules.title", { defaultValue: "Reservation Rules" })}
                </h2>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full ring-1 ring-amber-200">
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
                    <div key={idx} className="flex gap-3 items-start group">
                      <div className="w-5 h-5 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-amber-600">{idx + 1}</span>
                      </div>
                      <p className="text-[13px] text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors">
                        {rule}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Right column (1/3) ────────────────────── */}
          <div className="lg:col-span-1 space-y-7">

            {/* ── Notifications ────────────────────────── */}
            <div
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
              style={{
                ...stagger(5),
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <div
                className="px-6 py-5 text-white"
                style={{
                  background: "linear-gradient(135deg, #003366 0%, #004d99 100%)",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <Bell className="h-5 w-5 opacity-80" />
                  <h2 className="text-[15px] font-semibold tracking-tight">
                    {t("dashboard.notifications.title", { defaultValue: "Notifications" })}
                  </h2>
                  <span className="ml-auto text-[10px] bg-white/15 px-2.5 py-1 rounded-full font-medium">
                    {notifications.length} new
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {notifications.map((n, idx) => {
                  const Icon = n.icon;
                  return (
                    <div
                      key={idx}
                      className={`rounded-xl p-4 border ${n.border} bg-white hover:${n.bg} transition-colors duration-200 cursor-default`}
                      style={{
                        borderLeft: `3px solid ${n.accent}`,
                        animation: `dashSlideIn 0.4s ease-out ${0.5 + idx * 0.1}s both`,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: `${n.accent}12`, color: n.accent }}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-gray-800 mb-0.5">{n.title}</p>
                          <p className="text-[12px] text-gray-500 leading-relaxed">{n.message}</p>
                          <p className="text-[11px] text-gray-400 mt-2 font-medium">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Announcements ────────────────────────── */}
            <div
              className="bg-white rounded-2xl border border-gray-100"
              style={{
                ...stagger(6),
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <div className="px-6 py-5 border-b border-gray-100/80 flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-[#003366]" />
                <h2 className="text-[15px] font-semibold text-[#003366] tracking-tight">
                  {t("main.announcements.title", { defaultValue: "Announcements" })}
                </h2>
              </div>
              <div className="p-4 space-y-3">
                {announcements.map((a, idx) => (
                  <div
                    key={idx}
                    className="group p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] text-gray-800 font-semibold group-hover:text-[#003366] transition-colors">
                        {a.title}
                      </p>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 mt-0.5 transition-colors" />
                    </div>
                    <p className="text-[12px] text-gray-500 mt-1.5 leading-relaxed">{a.message}</p>
                    <p className="text-[11px] text-gray-400 mt-2 font-medium">{a.date}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Help Card ───────────────────────────── */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                ...stagger(7),
                background: "linear-gradient(135deg, #003366 0%, #004d99 50%, #0059b3 100%)",
                boxShadow: "0 4px 24px rgba(0,51,102,0.25)",
              }}
            >
              <div className="p-6 text-white">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-semibold mb-2 tracking-tight">
                      {t("dashboard.help.title", { defaultValue: "Need Help?" })}
                    </p>
                    <p className="text-[13px] text-blue-100/80 leading-relaxed mb-4">
                      {t("dashboard.help.msg", {
                        defaultValue:
                          "If you have issues with approvals, payment receipts, or cancellations, contact the support team.",
                      })}
                    </p>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 bg-white text-[#003366] text-sm font-semibold
                                 hover:bg-gray-100 transition-all duration-300 hover:shadow-lg"
                    >
                      {t("dashboard.help.cta", { defaultValue: "Contact Support" })}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
