import { useEffect, useState } from "react";
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { useTranslation } from "react-i18next";
import { Clock, Eye, Download, CheckCircle, XCircle, User } from "lucide-react";

export function PaymentsPage() {
  const { t } = useTranslation("admin");
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/admin/pending-payments");
      const data = await response.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching payments:", error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleApprove = async (id: number) => {
    if (!window.confirm(t("payments.confirmApprove", "Confirm approval?"))) return;
    try {
      const res = await fetch(`http://localhost:3000/admin/approve-payment/${id}`, { method: "POST" });
      if (res.ok) setPayments(prev => prev.filter((p) => p.id !== id));
    } catch (error) { console.error("Approval error:", error); }
  };

  const handleReject = async (id: number) => {
    if (!window.confirm(t("payments.confirmReject", "Reject this payment?"))) return;
    try {
      const res = await fetch(`http://localhost:3000/admin/reject-payment/${id}`, { 
        method: "POST",
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        setPayments(prev => prev.filter((p) => p.id !== id));
      } else {
        alert("Failed to update status in database.");
      }
    } catch (error) { 
      console.error("Rejection error:", error); 
    }
  };

  const handleDownload = (id: number) => {
    const url = `http://localhost:3000/view-pending/${id}_payment.pdf`;
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Receipt_${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-orange-500 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">
                {t("payments.verificationQueue", "Verification Queue")}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {payments.length} {t("payments.pendingCount", "Receipts Pending")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table Card */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-gray-900 font-bold mb-4">
            {t("pages.payments.title", "Receipt Verification Table")}
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-3 px-2 text-sm text-gray-600 font-semibold">Res. ID</th>
                  <th className="py-3 px-2 text-sm text-gray-600 font-semibold">User ID</th>
                  <th className="py-3 px-2 text-sm text-gray-600 font-semibold">{t("tables.name")}</th>
                  <th className="py-3 px-2 text-sm text-gray-600 font-semibold">{t("tables.email")}</th>
                  <th className="py-3 px-2 text-sm text-gray-600 font-semibold">{t("tables.file", "File")}</th>
                  <th className="py-3 px-2 text-sm text-gray-600 font-semibold text-right">{t("tables.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-10 text-sm text-gray-500">{t("common.loading", "Loading...")}</td></tr>
                ) : payments.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-sm text-gray-500">{t("payments.empty", "No pending receipts.")}</td></tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-2 text-sm font-mono text-gray-600">
                        #{payment.id}
                      </td>
                      <td className="py-4 px-2 text-sm text-gray-500">
                        UID-{payment.user?.id || "—"}
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">
                            {/* FIXED: Changed username to name to match GuestsPage logic */}
                            {payment.user?.name || `${payment.user?.firstName} ${payment.user?.lastName}` || t("tables.unknownGuest")}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-sm text-gray-600">
                        {payment.user?.email || "—"}
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex flex-col gap-1">
                          <a 
                            href={`http://localhost:3000/view-pending/${payment.id}_payment.pdf`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-[#0066cc] hover:underline flex items-center gap-1 text-xs font-medium"
                          >
                            <Eye className="h-3 w-3" /> {t("commonTable.preview", "Preview")}
                          </a>
                          <button 
                            onClick={() => handleDownload(payment.id)} 
                            className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-xs"
                          >
                            <Download className="h-3 w-3" /> {t("common.download", "Download")}
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            onClick={() => handleApprove(payment.id)} 
                            className="bg-green-600 hover:bg-green-700 text-white h-8 px-3 text-xs flex items-center gap-1"
                          >
                            <CheckCircle className="h-3 w-3" /> {t("payments.actions.approve", "Approve")}
                          </Button>
                          <Button 
                            onClick={() => handleReject(payment.id)} 
                            variant="destructive" 
                            className="h-8 px-3 text-xs flex items-center gap-1"
                          >
                            <XCircle className="h-3 w-3" /> {t("payments.actions.reject", "Reject")}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}