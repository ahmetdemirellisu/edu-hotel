// src/components/admin/pages/PaymentsPage.tsx
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { adminFetch } from "../../../api/adminFetch";
import {
  Clock,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  CreditCard,
  AlertCircle,
  Receipt,
  RefreshCw,
} from "lucide-react";

export function PaymentsPage() {
  const { t } = useTranslation("admin");
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminFetch("/ehp/api/admin/pending-payments");
      if (!response.ok) {
        const d = await response.json().catch(() => ({}));
        throw new Error(d.error || `Server error ${response.status}`);
      }
      const data = await response.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load payments.");
      setPayments([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPayments(); }, []);

  const handleApprove = async (id: number) => {
    if (!window.confirm(t("payments.confirmApproval", "Confirm payment approval?"))) return;
    try {
      const res = await adminFetch(`/ehp/api/admin/approve-payment/${id}`, { method: "POST" });
      if (res.ok) setPayments(prev => prev.filter(p => p.id !== id));
      else { const d = await res.json().catch(() => ({})); alert(d.error || "Failed to approve."); }
    } catch (err) { console.error("Approval error:", err); }
  };

  const handleReject = async (id: number) => {
    const reason = window.prompt(t("payments.rejectReasonPrompt", "Enter rejection reason (optional):")) || undefined;
    try {
      const res = await adminFetch(`/ehp/api/admin/reject-payment/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) setPayments(prev => prev.filter(p => p.id !== id));
      else alert(t("payments.rejectFailed", "Failed to reject payment."));
    } catch (err) { console.error("Rejection error:", err); }
  };

  const receiptCandidates = (id: number) => [`${id}_payment.pdf`, `${id}_payment.png`, `${id}_payment.jpg`, `${id}_payment.jpeg`];

  const openReceipt = async (id: number) => {
    for (const name of receiptCandidates(id)) {
      const url = `/ehp/api/view-pending/${name}`;
      try {
        const res = await adminFetch(url);
        if (res.ok) {
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, "_blank");
          return;
        }
      } catch {}
    }
    alert(t("payments.receiptNotFound", "Receipt file not found."));
  };

  const downloadReceipt = async (id: number) => {
    for (const name of receiptCandidates(id)) {
      const url = `/ehp/api/view-pending/${name}`;
      try {
        const res = await adminFetch(url);
        if (res.ok) {
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = name;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(blobUrl);
          return;
        }
      } catch {}
    }
    alert(t("payments.receiptNotFound", "Receipt file not found."));
  };

  const getInitials = (name: string) => {
    if (!name || name === "Unknown guest") return "?";
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  };

  const AVATAR_GRADIENTS = [
    "from-blue-500 to-blue-700",
    "from-violet-500 to-violet-700",
    "from-emerald-500 to-emerald-700",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-rose-700",
    "from-teal-500 to-teal-700",
  ];

  /* ── Skeleton Card ─────────────────────────── */
  const SkeletonCard = () => (
    <div
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,51,102,0.04)" }}
    >
      <div className="h-px bg-gray-100" />
      <div className="p-5 animate-pulse">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-200 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded-lg w-32" />
            <div className="h-3 bg-gray-100 rounded-lg w-48" />
            <div className="h-3 bg-gray-100 rounded-lg w-24" />
          </div>
          <div className="h-8 bg-gray-200 rounded-xl w-20" />
        </div>
        <div className="mt-4 flex gap-2">
          <div className="h-9 bg-gray-200 rounded-xl flex-1" />
          <div className="h-9 bg-gray-100 rounded-xl flex-1" />
          <div className="h-9 bg-gray-100 rounded-xl w-28" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes payIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .pay-card { animation: payIn 0.35s ease-out both; }
      `}</style>

      {/* ── Page Header ───────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        style={{ animation: "payIn 0.3s ease-out" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#003366] to-[#0055aa] flex items-center justify-center shadow-md">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-[28px] font-semibold text-[#003366] tracking-tight leading-tight">
                {t("pages.payments.title", "Payment Verification")}
              </h1>
              {!loading && payments.length > 0 && (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[11px] font-bold shadow-sm">
                  {payments.length}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{t("payments.subtitle", "Review and verify uploaded payment receipts")}</p>
          </div>
        </div>
        <button
          onClick={fetchPayments}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-sm font-semibold shadow-sm transition-all duration-150"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* ── Summary Cards ────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: t("payments.pendingVerification", "Pending Verification"),
            value: loading ? "—" : payments.length,
            icon: Clock,
            gradient: "from-amber-400 to-orange-500",
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
          },
          {
            label: t("payments.approvedToday", "Approved Today"),
            value: "—",
            icon: CheckCircle,
            gradient: "from-emerald-400 to-green-500",
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
          },
          {
            label: t("payments.rejectedToday", "Rejected Today"),
            value: "—",
            icon: XCircle,
            gradient: "from-red-400 to-red-600",
            iconBg: "bg-red-50",
            iconColor: "text-red-600",
          },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="pay-card bg-white rounded-2xl border border-gray-100 overflow-hidden relative"
              style={{ animationDelay: `${idx * 0.07}s`, boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,51,102,0.04)" }}
            >
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} rounded-t-2xl`} />
              <div className="flex items-center gap-4 p-5 mt-1">
                <div className={`w-11 h-11 rounded-2xl ${card.iconBg} flex items-center justify-center shadow-sm`}>
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">{card.label}</p>
                  <p className="text-2xl font-extrabold text-gray-900 leading-tight mt-0.5">{card.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Error ────────────────────────────────── */}
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2 shadow-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
        </div>
      )}

      {/* ── Payment Cards / States ───────────────── */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : payments.length === 0 ? (
        /* Empty State */
        <div
          className="bg-white rounded-2xl border border-gray-100 p-16 text-center"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,51,102,0.04)" }}
        >
          <div className="relative inline-block mb-5">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">{t("payments.noReceipts", "All payments processed!")}</h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">{t("payments.noReceiptsDesc", "All payment receipts have been processed. Check back later for new submissions.")}</p>
          <div className="mt-6 inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-semibold border border-emerald-100">
            <CheckCircle className="h-4 w-4" />
            Up to date
          </div>
        </div>
      ) : (
        /* Payment Cards */
        <div className="space-y-4">
          {payments.map((payment, idx) => {
            const guestName = payment.user?.name || `${payment.user?.firstName ?? ""} ${payment.user?.lastName ?? ""}`.trim() || t("tables.unknownGuest", "Unknown guest");
            const initials = getInitials(guestName);
            const avatarGradient = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];

            return (
              <div
                key={payment.id}
                className="pay-card bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden"
                style={{ animationDelay: `${idx * 0.06}s`, boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,51,102,0.04)" }}
              >
                {/* Top accent stripe */}
                <div className="h-1 bg-gradient-to-r from-amber-300 via-orange-400 to-amber-300" />

                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
                      <span className="text-sm font-bold text-white">{initials}</span>
                    </div>

                    {/* Guest Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[15px] font-bold text-gray-900">{guestName}</h3>
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          {t("payments.pendingVerification", "Pending")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{payment.user?.email || "—"}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {t("payments.colReservation", "Reservation")} <span className="font-mono font-semibold text-gray-600">#{payment.id}</span>
                        {payment.user?.id && <span className="ml-2">· User ID: {payment.user.id}</span>}
                      </p>
                    </div>

                    {/* Receipt Preview button */}
                    <button
                      onClick={() => openReceipt(payment.id)}
                      className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-semibold transition-colors border border-gray-200"
                    >
                      <Receipt className="h-3.5 w-3.5" />
                      {t("payments.preview", "Receipt")}
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gray-50 my-4" />

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleApprove(payment.id)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-sm hover:shadow-md transition-all duration-150 hover:-translate-y-0.5"
                      style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}
                    >
                      <CheckCircle className="h-4 w-4" />
                      {t("common.approve", "Approve")}
                    </button>
                    <button
                      onClick={() => handleReject(payment.id)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-sm hover:shadow-md transition-all duration-150 hover:-translate-y-0.5"
                      style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)" }}
                    >
                      <XCircle className="h-4 w-4" />
                      {t("common.reject", "Reject")}
                    </button>
                    <button
                      onClick={() => openReceipt(payment.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-sm font-semibold transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      {t("payments.preview", "Preview")}
                    </button>
                    <button
                      onClick={() => downloadReceipt(payment.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-sm font-semibold transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      {t("payments.download", "Download")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
