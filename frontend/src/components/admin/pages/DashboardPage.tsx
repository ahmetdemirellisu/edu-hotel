// src/components/admin/pages/DashboardPage.tsx
import { useEffect, useState } from "react";
import { Card, CardContent } from "../../ui/card";
import {
  Plus,
  CheckCircle,
  Users,
  Bed,
  FileText,
  Calendar,
  Clock,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { getAdminReservations } from "../../../api/reservations";

interface AdminReservation {
  id: number;
  checkIn: string;
  checkOut: string;
  status: string;
  createdAt: string;
  user?: {
    name?: string | null;
    email?: string | null;
  };
}

export function DashboardPage() {
  // use the admin namespace
  const { t } = useTranslation("admin");

  const [latestReservations, setLatestReservations] = useState<
    AdminReservation[]
  >([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [reservationsError, setReservationsError] = useState<string | null>(
    null
  );

  // 🔄 load reservations once for the dashboard
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingReservations(true);
        setReservationsError(null);

        const data = (await getAdminReservations()) as AdminReservation[];

        // sort newest → oldest by createdAt, then take top 5
        const sorted = [...data].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        );
        setLatestReservations(sorted.slice(0, 5));
      } catch (err: any) {
        setReservationsError(
          err.message || "Failed to load latest reservations."
        );
      } finally {
        setLoadingReservations(false);
      }
    };

    load();
  }, []);

  const kpiCards = [
    {
      labelKey: "pages.dashboard.pendingReservations",
      value: "8",
      icon: Clock,
      color: "bg-yellow-500",
      change: "+2",
    },
    {
      labelKey: "pages.dashboard.approvedReservations",
      value: "24",
      icon: CheckCircle,
      color: "bg-green-500",
      change: "+5",
    },
    {
      labelKey: "pages.dashboard.guestsStaying",
      value: "15",
      icon: Users,
      color: "bg-blue-500",
      change: "-3",
    },
    {
      labelKey: "pages.dashboard.availableRooms",
      value: "12",
      icon: Bed,
      color: "bg-purple-500",
      change: "0",
    },
  ];

  const quickActions = [
    {
      labelKey: "pages.dashboard.actions.createReservation",
      icon: Plus,
      color: "bg-[#0066cc]",
    },
    {
      labelKey: "pages.dashboard.actions.viewCalendar",
      icon: Calendar,
      color: "bg-green-600",
    },
    {
      labelKey: "pages.dashboard.actions.addRoom",
      icon: Bed,
      color: "bg-purple-600",
    },
    {
      labelKey: "pages.dashboard.actions.reportCenter",
      icon: FileText,
      color: "bg-orange-600",
    },
  ];

  const formatStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return {
          label: t("reservations.statusLabels.pending", "Pending"),
          className: "bg-yellow-100 text-yellow-700",
        };
      case "APPROVED":
        return {
          label: t("reservations.statusLabels.approved", "Approved"),
          className: "bg-green-100 text-green-700",
        };
      case "CHECKED_IN":
      case "CHECKED-IN":
        return {
          label: t("reservations.statusLabels.checkedIn", "Checked-In"),
          className: "bg-blue-100 text-blue-700",
        };
      case "COMPLETED":
        return {
          label: t("reservations.statusLabels.completed", "Completed"),
          className: "bg-gray-100 text-gray-700",
        };
      default:
        return {
          label: status,
          className: "bg-gray-100 text-gray-700",
        };
    }
  };

  const formatDate = (iso: string) => iso.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card
              key={idx}
              className="border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      {t(card.labelKey)}
                    </p>
                    <p className="text-3xl text-gray-900 mb-1">
                      {card.value}
                    </p>
                    <p className="text-xs text-gray-500">
                      <span
                        className={
                          card.change.startsWith("+")
                            ? "text-green-600"
                            : card.change.startsWith("-")
                            ? "text-red-600"
                            : "text-gray-600"
                        }
                      >
                        {card.change}
                      </span>{" "}
                      {t("pages.dashboard.fromYesterday")}
                    </p>
                  </div>
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-gray-900 mb-4">
            {t("pages.dashboard.quickActions")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {quickActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <button
                  key={idx}
                  className={`${action.color} text-white p-4 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-3`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm">{t(action.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Latest Reservations and Occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Reservations Table */}
        <Card className="border-gray-200 shadow-sm lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900">
                {t("pages.dashboard.latestReservations")}
              </h3>
              <button className="text-sm text-[#0066cc] hover:underline">
                {t("commonTable.viewAll")}
              </button>
            </div>

            {reservationsError && (
              <p className="text-sm text-red-700 mb-3">
                {reservationsError}
              </p>
            )}

            {loadingReservations ? (
              <p className="text-sm text-gray-600">
                {t(
                  "pages.dashboard.loadingReservations",
                  "Loading latest reservations..."
                )}
              </p>
            ) : latestReservations.length === 0 ? (
              <p className="text-sm text-gray-600">
                {t(
                  "pages.dashboard.noReservations",
                  "No reservations have been created yet."
                )}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 text-sm text-gray-600">
                        {t("tables.guestName")}
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
                        {t("tables.payment")}
                      </th>
                      <th className="text-left py-3 px-2 text-sm text-gray-600">
                        {t("tables.action")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestReservations.map((res) => {
                      const badge = formatStatusBadge(res.status);
                      const guestName =
                        res.user?.name ||
                        res.user?.email ||
                        t("tables.unknownGuest", "Unknown guest");

                      return (
                        <tr
                          key={res.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-2 text-sm text-gray-900">
                            {guestName}
                          </td>
                          <td className="py-3 px-2 text-sm text-gray-600">
                            {formatDate(res.checkIn)}
                          </td>
                          <td className="py-3 px-2 text-sm text-gray-600">
                            {formatDate(res.checkOut)}
                          </td>
                          <td className="py-3 px-2">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                              {/* No payment tracking yet → treat as N/A */}
                              {t("tables.paymentNotTracked", "N/A")}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <button className="text-[#0066cc] hover:underline text-sm">
                              {t("commonTable.view")}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rooms Occupancy Widget */}
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-gray-900 mb-4">
              {t("pages.dashboard.roomOccupancy")}
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    {t("pages.dashboard.occupancyRate")}
                  </span>
                  <span className="text-sm text-gray-900">62.5%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#0066cc] h-2 rounded-full"
                    style={{ width: "62.5%" }}
                  ></div>
                </div>
              </div>
              <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {t("pages.dashboard.occupied")}
                  </span>
                  <span className="text-sm text-gray-900">15 rooms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {t("pages.dashboard.available")}
                  </span>
                  <span className="text-sm text-gray-900">9 rooms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {t("pages.dashboard.maintenance")}
                  </span>
                  <span className="text-sm text-gray-900">0 rooms</span>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-900 mb-1">
                    {t("pages.dashboard.expectedCheckinsToday")}
                  </p>
                  <p className="text-2xl text-[#0066cc]">3</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
