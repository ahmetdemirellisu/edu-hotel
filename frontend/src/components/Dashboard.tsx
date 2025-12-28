import { Navbar } from "./layout/Navbar";
import { Footer } from "./layout/Footer";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { getMyLatestReservation, type Reservation } from "../api/reservations";
import { useNavigate } from "react-router-dom";



// (Optional) If you already use lucide-react in your project, keep these.
// If not, you can remove icons and the UI still works.
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Plus,
  Bell,
  ArrowRight,
} from "lucide-react";

export function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const userId = Number(localStorage.getItem("userId"));
  const [activeReservation, setActiveReservation] =
    useState<Reservation | null>(null);
  const [loadingReservation, setLoadingReservation] = useState(true);

  useEffect(() => {
    async function loadReservation() {
      if (!userId || isNaN(userId)) {
        setActiveReservation(null);
        setLoadingReservation(false);
        return;
      }


      try {
        const res = await getMyLatestReservation(userId);
        setActiveReservation(res);
      } catch (err) {
        console.error("Failed to load latest reservation", err);
      } finally {
        setLoadingReservation(false);
      }
    }

    loadReservation();
  }, [userId]);
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB");

  const calculateAmount = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);

    const diffMs = end.getTime() - start.getTime();
    const nights = diffMs / (1000 * 60 * 60 * 24);

    return nights * 1200;
  };
  const quickStats = [
    {
      title: t("dashboard.stats.totalReservations", { defaultValue: "Total Reservations" }),
      value: "8",
      icon: FileText,
      tone: "bg-blue-50 text-blue-700",
      sub: t("dashboard.stats.totalReservationsSub", { defaultValue: "All time" }),
    },
    {
      title: t("dashboard.stats.upcoming", { defaultValue: "Upcoming Stays" }),
      value: "2",
      icon: CalendarDays,
      tone: "bg-green-50 text-green-700",
      sub: t("dashboard.stats.upcomingSub", { defaultValue: "Next check-in soon" }),
    },
    {
      title: t("dashboard.stats.pending", { defaultValue: "Pending Approvals" }),
      value: "1",
      icon: Clock,
      tone: "bg-yellow-50 text-yellow-700",
      sub: t("dashboard.stats.pendingSub", { defaultValue: "Awaiting review" }),
    },
    {
      title: t("dashboard.stats.completed", { defaultValue: "Completed Stays" }),
      value: "5",
      icon: CheckCircle2,
      tone: "bg-purple-50 text-purple-700",
      sub: t("dashboard.stats.completedSub", { defaultValue: "This year" }),
    },
  ];

  const notifications = [
    {
      type: "success",
      title: t("dashboard.notifications.approvedTitle", { defaultValue: "Reservation Approved" }),
      message: t("dashboard.notifications.approvedMsg", {
        defaultValue: "Your reservation has been approved. Please proceed to payment if required.",
      }),
      time: t("dashboard.notifications.time1", { defaultValue: "2 hours ago" }),
      icon: CheckCircle2,
    },
    {
      type: "warning",
      title: t("dashboard.notifications.pendingTitle", { defaultValue: "Pending Review" }),
      message: t("dashboard.notifications.pendingMsg", {
        defaultValue: "Your reservation request is awaiting admin approval.",
      }),
      time: t("dashboard.notifications.time2", { defaultValue: "1 day ago" }),
      icon: Clock,
    },
    {
      type: "info",
      title: t("dashboard.notifications.reminderTitle", { defaultValue: "Check-in Reminder" }),
      message: t("dashboard.notifications.reminderMsg", {
        defaultValue: "Check-in is scheduled for 14:00 on your check-in date.",
      }),
      time: t("dashboard.notifications.time3", { defaultValue: "3 days ago" }),
      icon: AlertCircle,
    },
  ];

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

  const statusBadge = (status) => {
    const base = "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "APPROVED":
        return (
          <span className={`${base} bg-green-100 text-green-800`}>
            <CheckCircle2 className="h-4 w-4" />
            {t("dashboard.status.approved", { defaultValue: "Approved" })}
          </span>
        );
      case "PAYMENT_PENDING":
        return (
          <span className={`${base} bg-yellow-100 text-yellow-800`}>
            <Clock className="h-4 w-4" />
            {t("dashboard.status.paymentPending", { defaultValue: "Payment Pending" })}
          </span>
        );
      case "PAYMENT_RECEIVED":
        return (
          <span className={`${base} bg-emerald-100 text-emerald-800`}>
            <CheckCircle2 className="h-4 w-4" />
            {t("dashboard.status.paymentReceived", { defaultValue: "Payment Received" })}
          </span>
        );
      case "REFUND_REQUESTED":
        return (
          <span className={`${base} bg-orange-100 text-orange-800`}>
            <AlertCircle className="h-4 w-4" />
            {t("dashboard.status.refundRequested", { defaultValue: "Refund Requested" })}
          </span>
        );
      case "REFUNDED":
        return (
          <span className={`${base} bg-indigo-100 text-indigo-800`}>
            <CheckCircle2 className="h-4 w-4" />
            {t("dashboard.status.refunded", { defaultValue: "Refunded" })}
          </span>
        );
      case "CANCELLED":
        return (
          <span className={`${base} bg-gray-100 text-gray-800`}>
            <AlertCircle className="h-4 w-4" />
            {t("dashboard.status.cancelled", { defaultValue: "Cancelled" })}
          </span>
        );
      default:
        return (
          <span className={`${base} bg-blue-100 text-blue-800`}>
            <Clock className="h-4 w-4" />
            {t("dashboard.status.pending", { defaultValue: "Pending" })}
          </span>
        );
    }
  };

  const noticeTone = (type) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-900";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-900";
      default:
        return "bg-blue-50 border-blue-200 text-blue-900";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl text-[#003366] mb-2">
            {t("main.welcomeBack", { defaultValue: "Welcome back!" })}
          </h1>
          <p className="text-gray-600">
            {t("dashboard.subtitle", {
              defaultValue:
                "Track your reservation requests, approvals, payments, and notifications in one place.",
            })}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {quickStats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl shadow hover:shadow-lg transition-shadow p-5 border border-gray-100"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-600">{s.title}</p>
                    <div className="text-3xl font-semibold text-gray-900 mt-1">{s.value}</div>
                    <p className="text-xs text-gray-500 mt-1">{s.sub}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${s.tone}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left (2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Active Reservation Status (requirement-driven) */}
            <div className="bg-white rounded-2xl shadow border border-gray-100">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl text-[#003366]">
                  {t("dashboard.activeReservation.title", { defaultValue: "Current Reservation Status" })}
                </h2>
                {activeReservation && statusBadge(activeReservation.status)}
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">
                      {t("dashboard.activeReservation.reservationId", { defaultValue: "Reservation ID" })}
                    </p>
                    <p className="text-sm text-gray-900 font-medium">{activeReservation?.id}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">
                      {t("dashboard.activeReservation.dates", { defaultValue: "Dates" })}
                    </p>
                    <p className="text-sm text-gray-900 font-medium">
                      {activeReservation &&
                        `${formatDate(activeReservation.checkIn)} → ${formatDate(activeReservation.checkOut)}`}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">
                      {t("dashboard.activeReservation.amount", { defaultValue: "Amount" })}
                    </p>
                    <p className="text-sm text-gray-900 font-medium">
                      {activeReservation
                        ? `₺ ${calculateAmount(
                            activeReservation.checkIn,
                            activeReservation.checkOut
                          ).toLocaleString()}`
                        : "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <a
                    href="/reservations"
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 border-2 border-[#003366] text-[#003366] hover:bg-blue-50 transition"
                  >
                    {t("dashboard.activeReservation.viewRequests", { defaultValue: "View My Requests" })}
                    <ArrowRight className="h-4 w-4" />
                  </a>

                  <a
                    href="/book-room"
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 bg-[#003366] text-white hover:opacity-95 transition"
                  >
                    <Plus className="h-5 w-5" />
                    {t("dashboard.activeReservation.createNew", { defaultValue: "Create New Reservation" })}
                  </a>

                  {/* If you have a /payment route later, wire it here.
                      Keeping it disabled to avoid breaking navigation. */}
                  <button
                    disabled={activeReservation?.status !== "APPROVED"}
                    onClick={() => navigate("/payment")}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-medium transition
                      ${
                        activeReservation?.status === "APPROVED"
                          ? "bg-[#003366] text-white hover:opacity-95 cursor-pointer"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    title={
                      activeReservation?.status !== "APPROVED"
                        ? t("dashboard.activeReservation.paymentDisabledTip", {
                            defaultValue: "Payment is available only after approval.",
                          })
                        : undefined
                    }
                  >
                    {t("dashboard.activeReservation.proceedPayment", {
                      defaultValue: "Proceed to Payment",
                    })}
                  </button>

                </div>
              </div>
            </div>

            {/* Quick Actions (keeps your working /book-room) */}
            <div className="bg-white rounded-2xl shadow border border-gray-100">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-xl text-[#003366]">
                  {t("main.quickActions", { defaultValue: "Quick Actions" })}
                </h2>
              </div>

              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a
                  className="rounded-2xl p-6 bg-[#003366] text-white hover:opacity-95 transition flex items-center justify-between"
                  href="/book-room"
                >
                  <div className="flex items-center gap-3">
                    <Plus className="h-6 w-6" />
                    <span className="font-medium">
                      {t("main.quick.bookRoom", { defaultValue: "Book a Room" })}
                    </span>
                  </div>
                  <ArrowRight className="h-5 w-5 opacity-90" />
                </a>

                <a
                  className="rounded-2xl p-6 border-2 border-[#003366] text-[#003366] hover:bg-blue-50 transition flex items-center justify-between"
                  href="/reservations"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6" />
                    <span className="font-medium">
                      {t("dashboard.quick.viewReservations", { defaultValue: "My Reservation Requests" })}
                    </span>
                  </div>
                  <ArrowRight className="h-5 w-5" />
                </a>

                {/* These two are requirement-friendly (support + notifications),
                    but keep them as safe buttons if routes are not implemented. */}
                <button
                  className="rounded-2xl p-6 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition flex items-center justify-between"
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="h-6 w-6" />
                    <span className="font-medium">
                      {t("dashboard.quick.notifications", { defaultValue: "Notifications" })}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {t("dashboard.quick.soon", { defaultValue: "Soon" })}
                  </span>
                </button>

                <button
                  className="rounded-2xl p-6 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition flex items-center justify-between"
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-6 w-6" />
                    <span className="font-medium">
                      {t("dashboard.quick.contactSupport", { defaultValue: "Contact Support" })}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {t("dashboard.quick.soon", { defaultValue: "Soon" })}
                  </span>
                </button>
              </div>
            </div>

            {/* Rules / Constraints (explicitly from requirements) */}
            <div className="bg-white rounded-2xl shadow border border-gray-100">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-xl text-[#003366]">
                  {t("dashboard.rules.title", { defaultValue: "Reservation Rules (Important)" })}
                </h2>
              </div>
              <div className="p-6">
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex gap-3">
                    <span className="mt-0.5">•</span>
                    <span>
                      {t("dashboard.rules.r1", {
                        defaultValue: "Sunday check-in is not allowed.",
                      })}
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-0.5">•</span>
                    <span>
                      {t("dashboard.rules.r2", {
                        defaultValue: "You can request reservations up to 30 days ahead.",
                      })}
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-0.5">•</span>
                    <span>
                      {t("dashboard.rules.r3", {
                        defaultValue: "Individual stays cannot exceed 5 consecutive days (unless authorized).",
                      })}
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-0.5">•</span>
                    <span>
                      {t("dashboard.rules.r4", {
                        defaultValue: "Saturday check-in & Sunday check-out combinations may be restricted by the system.",
                      })}
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-0.5">•</span>
                    <span>
                      {t("dashboard.rules.r5", {
                        defaultValue:
                          "Room selection is not available to users; rooms are assigned by the hotel/admin workflow.",
                      })}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right (1 col) */}
          <div className="lg:col-span-1 space-y-8">
            {/* Notifications */}
            <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 bg-gradient-to-r from-[#003366] to-[#0066cc] text-white">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  <h2 className="text-lg">
                    {t("dashboard.notifications.title", { defaultValue: "Notifications" })}
                  </h2>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {notifications.map((n, idx) => {
                  const Icon = n.icon;
                  return (
                    <div
                      key={idx}
                      className={`border rounded-xl p-4 ${noticeTone(n.type)}`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold mb-1">{n.title}</p>
                          <p className="text-xs opacity-90">{n.message}</p>
                          <p className="text-xs opacity-70 mt-2">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Announcements */}
            <div className="bg-white rounded-2xl shadow border border-gray-100">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-xl text-[#003366]">
                  {t("main.announcements.title", { defaultValue: "Announcements" })}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {announcements.map((a, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition cursor-pointer"
                  >
                    <p className="text-sm text-gray-900 font-semibold mb-2">{a.title}</p>
                    <p className="text-xs text-gray-600 mb-2">{a.message}</p>
                    <p className="text-xs text-gray-400">{a.date}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Help / Support card */}
            <div className="rounded-2xl shadow border border-gray-100 bg-gradient-to-br from-[#003366] to-[#0066cc] text-white p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 flex-shrink-0" />
                <div>
                  <p className="text-lg font-semibold mb-2">
                    {t("dashboard.help.title", { defaultValue: "Need Help?" })}
                  </p>
                  <p className="text-sm text-blue-100 mb-4">
                    {t("dashboard.help.msg", {
                      defaultValue:
                        "If you have issues with approvals, payment receipts, or cancellations, contact the support team.",
                    })}
                  </p>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-xl px-4 py-2 bg-white text-[#003366] hover:bg-gray-100 transition"
                  >
                    {t("dashboard.help.cta", { defaultValue: "Contact Support" })}
                  </button>
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
