// src/components/admin/pages/PaymentsPage.tsx
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { DollarSign, Clock, TrendingUp, Eye, Download } from "lucide-react";
import { useTranslation } from "react-i18next";

export function PaymentsPage() {
  const { t } = useTranslation("admin");

  const payments = [
    { reservationId: "RES-004", guest: "Zeynep Arslan", amount: 360, status: "Paid",    date: "2025-11-27" },
    { reservationId: "RES-005", guest: "Can Özdemir",   amount: 720, status: "Paid",    date: "2025-11-28" },
    { reservationId: "RES-006", guest: "Selin Yıldız",  amount: 1800,status: "Paid",    date: "2025-11-25" },
    { reservationId: "RES-001", guest: "Ahmet Yılmaz",  amount: 360, status: "Pending", date: "2025-12-05" },
    { reservationId: "RES-002", guest: "Elif Demir",    amount: 900, status: "Paid",    date: "2025-11-26" },
    { reservationId: "RES-008", guest: "Deniz Kara",    amount: 360, status: "Pending", date: "2025-12-12" }
  ];

  return (
    <div className="space-y-6">
      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-500 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {t("payments.totalRevenue")}
                </p>
                <p className="text-2xl text-gray-900">$4,500</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-orange-500 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {t("payments.pendingPayments")}
                </p>
                <p className="text-2xl text-gray-900">$720</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {t("payments.thisMonth")}
                </p>
                <p className="text-2xl text-gray-900">$3,240</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">
              {t("pages.payments.title")}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-sm text-gray-600">
                    {t("tables.reservationId")}
                  </th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">
                    {t("tables.guestName")}
                  </th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">
                    {t("payments.amount")}
                  </th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">
                    {t("payments.paymentStatus")}
                  </th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">
                    {t("tables.date")}
                  </th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">
                    {t("tables.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-2 text-sm text-gray-900">
                      {payment.reservationId}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-900">
                      {payment.guest}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-900">
                      ${payment.amount}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          payment.status === "Paid"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600">
                      {payment.date}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <button
                          className="text-[#0066cc] hover:text-[#0052a3]"
                          title={t("payments.viewReceipt")}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-700"
                          title={t("payments.downloadReceipt")}
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        {payment.status === "Pending" && (
                          <Button className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 text-white">
                            {t("payments.approvePayment")}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
