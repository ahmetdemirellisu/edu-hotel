// src/components/admin/pages/GuestsPage.tsx
import { Card, CardContent } from "../../ui/card";
import { Input } from "../../ui/input";
import { Search, Eye, Edit } from "lucide-react";
import { useTranslation } from "react-i18next";

export function GuestsPage() {
  const { t } = useTranslation("admin");

  const guests = [
    {
      name: "Zeynep Arslan",
      type: "Student",
      reservationId: "RES-004",
      checkIn: "2025-11-27",
      checkOut: "2025-11-30",
      status: "Checked-In"
    },
    {
      name: "Can Özdemir",
      type: "Personnel",
      reservationId: "RES-005",
      checkIn: "2025-11-28",
      checkOut: "2025-12-02",
      status: "Checked-In"
    },
    {
      name: "Selin Yıldız",
      type: "Visitor",
      reservationId: "RES-006",
      checkIn: "2025-11-25",
      checkOut: "2025-12-05",
      status: "Checked-In"
    },
    {
      name: "Ahmet Yılmaz",
      type: "Student",
      reservationId: "RES-001",
      checkIn: "2025-12-05",
      checkOut: "2025-12-08",
      status: "Pending"
    },
    {
      name: "Elif Demir",
      type: "Personnel",
      reservationId: "RES-002",
      checkIn: "2025-12-10",
      checkOut: "2025-12-15",
      status: "Approved"
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">
              {t("pages.guests.title")}
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder={t("guests.searchPlaceholder")}
                className="pl-10 w-64"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-sm text-gray-600">
                    {t("tables.guestName")}
                  </th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">
                    {t("tables.guestType")}
                  </th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">
                    {t("tables.reservationId")}
                  </th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">
                    {t("tables.checkIn")}
                  </th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">
                    {t("tables.checkOut")}
                  </th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">
                    {t("tables.status")}
                  </th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">
                    {t("tables.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {guests.map((guest, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-2 text-sm text-gray-900">
                      {guest.name}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600">
                      {guest.type}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-900">
                      {guest.reservationId}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600">
                      {guest.checkIn}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600">
                      {guest.checkOut}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          guest.status === "Pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : guest.status === "Approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {guest.status}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <button
                          className="text-[#0066cc] hover:text-[#0052a3]"
                          title={t("commonTable.view")}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="text-gray-600 hover:text-gray-700"
                          title={t("common.edit")}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
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
