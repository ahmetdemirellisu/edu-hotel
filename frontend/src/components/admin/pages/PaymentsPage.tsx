// src/components/admin/pages/PaymentsPage.tsx
import { useEffect, useState } from "react";
import { Button } from "../../ui/button";
import { useTranslation } from "react-i18next";
import {
  Clock,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  CreditCard,
  AlertCircle,
  FileText,
  X,
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
      const response = await fetch("http://localhost:9004/admin/pending-payments");
      const data = await response.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load payments.");
      setPayments([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPayments(); }, []);

  const handleApprove = async (id: number) => {
    if (!window.confirm("Confirm payment approval?")) return;
    try {
      const res = await fetch(`http://localhost:9004/admin/approve-payment/${id}`, { method: "POST" });
      if (res.ok) setPayments(prev => prev.filter(p => p.id !== id));
      else { const d = await res.json().catch(() => ({})); alert(d.error || "Failed to approve."); }
    } catch (err) { console.error("Approval error:", err); }
  };

  const handleReject = async (id: number) => {
    const reason = window.prompt("Enter rejection reason (optional):") || undefined;
    try {
      const res = await fetch(`http://localhost:9004/admin/reject-payment/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) setPayments(prev => prev.filter(p => p.id !== id));
      else alert("Failed to reject payment.");
    } catch (err) { console.error("Rejection error:", err); }
  };

  const receiptCandidates = (id: number) => [`${id}_payment.pdf`, `${id}_payment.png`, `${id}_payment.jpg`, `${id}_payment.jpeg`];

  const openReceipt = async (id: number) => {
    for (const name of receiptCandidates(id)) {
      const url = `http://localhost:9004/view-pending/${name}`;
      try { const res = await fetch(url, { method: "HEAD" }); if (res.ok) { window.open(url, "_blank"); return; } } catch {}
    }
    alert("Receipt file not found.");
  };

  const downloadReceipt = async (id: number) => {
    for (const name of receiptCandidates(id)) {
      const url = `http://localhost:9004/view-pending/${name}`;
      try {
        const res = await fetch(url, { method: "HEAD" });
        if (res.ok) { const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); return; }
      } catch {}
    }
    alert("Receipt file not found.");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">{t("pages.payments.title", "Payment Verification")}</h2>
          <p className="text-sm text-gray-500 mt-0.5">Review and verify uploaded payment receipts</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4" style={{ borderLeft: "3px solid #f59e0b" }}>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><Clock className="h-5 w-5 text-amber-600" /></div>
          <div><p className="text-[13px] text-gray-500">Pending Verification</p><p className="text-2xl font-bold text-gray-900">{payments.length}</p></div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4" style={{ borderLeft: "3px solid #22c55e" }}>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><CheckCircle className="h-5 w-5 text-emerald-600" /></div>
          <div><p className="text-[13px] text-gray-500">Approved Today</p><p className="text-2xl font-bold text-gray-900">—</p></div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4" style={{ borderLeft: "3px solid #ef4444" }}>
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center"><XCircle className="h-5 w-5 text-red-600" /></div>
          <div><p className="text-[13px] text-gray-500">Rejected Today</p><p className="text-2xl font-bold text-gray-900">—</p></div>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />{error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">No pending receipts</p>
            <p className="text-xs text-gray-400 mt-1">All payment receipts have been processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {["Reservation", "User", "Guest Name", "Email", "Receipt", "Actions"].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider first:pl-6 last:pr-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map(payment => (
                  <tr key={payment.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors group">
                    <td className="py-3.5 pl-6 pr-4 text-xs font-mono text-gray-500">#{payment.id}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">{payment.user?.id || "—"}</td>
                    <td className="py-3.5 px-4">
                      <p className="text-[13px] font-medium text-gray-800">
                        {payment.user?.name || `${payment.user?.firstName ?? ""} ${payment.user?.lastName ?? ""}`.trim() || "Unknown"}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">{payment.user?.email || "—"}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openReceipt(payment.id)} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                          <Eye className="h-3 w-3" /> Preview
                        </button>
                        <button onClick={() => downloadReceipt(payment.id)} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                          <Download className="h-3 w-3" /> Download
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 pr-6 px-4">
                      <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleApprove(payment.id)} className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-emerald-600 transition-colors" title="Approve">
                          <CheckCircle className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleReject(payment.id)} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 transition-colors" title="Reject">
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}