// src/components/admin/pages/ReservationsPage.tsx
import { useState, useEffect } from "react";
import { Card, CardContent } from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import {
  Search,
  Filter,
  Plus,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  getAdminReservations,
  approveReservation,
  rejectReservation,
  type Reservation,
  type ReservationStatus,
} from "../../../api/reservations";

type AdminReservation = Reservation & {
  user?: {
    id: number;
    email: string;
    name?: string | null;
  };
  room?: {
    id: number;
    name: string;
    type: string;
  } | null;
};

export function ReservationsPage() {
  const { t } = useTranslation("admin");

  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected" | "canceled"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 🔄 Load all reservations once
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAdminReservations();
        setReservations(data as AdminReservation[]);
      } catch (err: any) {
        setError(err.message || "Failed to load reservations.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatId = (id: number) => `RES-${id.toString().padStart(3, "0")}`;

  const formatDate = (iso: string) => iso.slice(0, 10);

  const mapStatusBadge = (status: ReservationStatus) => {
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
      case "REJECTED":
        return {
          label: t("reservations.statusLabels.rejected", "Rejected"),
          className: "bg-red-100 text-red-700",
        };
      case "CANCELLED":
        return {
          label: t("reservations.statusLabels.canceled", "Canceled"),
          className: "bg-gray-100 text-gray-700",
        };
      case "REFUND_REQUESTED":
        return {
          label: t(
            "reservations.statusLabels.refundRequested",
            "Refund requested"
          ),
          className: "bg-orange-100 text-orange-700",
        };
      case "REFUNDED":
        return {
          label: t("reservations.statusLabels.refunded", "Refunded"),
          className: "bg-blue-100 text-blue-700",
        };
      default:
        return {
          label: status,
          className: "bg-gray-100 text-gray-700",
        };
    }
  };

  const mapGuestType = (accommodationType: string) => {
    switch (accommodationType) {
      case "PERSONAL":
        return t("reservations.guestTypes.personal", "Personal");
      case "CORPORATE":
        return t("reservations.guestTypes.corporate", "Corporate");
      case "EDUCATION":
        return t("reservations.guestTypes.education", "Education");
      default:
        return accommodationType;
    }
  };

  const filteredReservations = reservations.filter((res) => {
    // Status filter (pending/approved/etc.)
    if (statusFilter === "pending" && res.status !== "PENDING") return false;
    if (statusFilter === "approved" && res.status !== "APPROVED") return false;
    if (statusFilter === "rejected" && res.status !== "REJECTED") return false;
    if (statusFilter === "canceled" && res.status !== "CANCELLED") return false;

    // Simple search on guest name / email / event code
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const guestName = (res.user?.name || "").toLowerCase();
      const email = (res.user?.email || "").toLowerCase();
      const code = (res.eventCode || "").toLowerCase();
      if (
        !guestName.includes(term) &&
        !email.includes(term) &&
        !code.includes(term)
      ) {
        return false;
      }
    }

    return true;
  });

  const totalCount = reservations.length;
  const pendingCount = reservations.filter(
    (r) => r.status === "PENDING"
  ).length;

  const handleApprove = async (id: number) => {
    try {
      setActionLoadingId(id);
      setError(null);
      const updated = await approveReservation(id);
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updated } : r))
      );
    } catch (err: any) {
      setError(err.message || "Failed to approve reservation.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: number) => {
    const reason =
      window.prompt(
        t(
          "reservations.rejectReasonPrompt",
          "Please enter a reason for rejection (optional):"
        )
      ) || undefined;

    try {
      setActionLoadingId(id);
      setError(null);
      const updated = await rejectReservation(id, reason);
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updated } : r))
      );
    } catch (err: any) {
      setError(err.message || "Failed to reject reservation.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">
                {t("reservations.search")}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={t("reservations.searchPlaceholder")}
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Status filter (now real) */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">
                {t("reservations.status")}
              </label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as
                      | "all"
                      | "pending"
                      | "approved"
                      | "rejected"
                      | "canceled"
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066cc]"
              >
                <option value="all">
                  {t("reservations.filters.allStatus")}
                </option>
                <option value="pending">
                  {t("reservations.filters.pending")}
                </option>
                <option value="approved">
                  {t("reservations.filters.approved")}
                </option>
                <option value="rejected">
                  {t("reservations.filters.rejected")}
                </option>
                <option value="canceled">
                  {t("reservations.filters.canceled")}
                </option>
              </select>
            </div>

            {/* Guest type filter — mapped to accommodationType */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">
                {t("reservations.guestType")}
              </label>
              <select
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-400"
                title={t(
                  "reservations.guestTypeDisabledHint",
                  "Guest type is derived from accommodation type (personal / corporate / education)."
                )}
              >
                <option>{t("reservations.filters.allTypes")}</option>
              </select>
            </div>

            {/* Date filter placeholder (UI only for now) */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">
                {t("reservations.dateRange")}
              </label>
              <Input type="date" disabled className="bg-gray-50" />
            </div>

            <div className="flex items-end">
              <Button
                className="w-full bg-[#0066cc] hover:bg-[#0052a3] text-white"
                disabled
              >
                <Filter className="h-4 w-4 mr-2" />
                {t("reservations.applyFilters")}
              </Button>
            </div>
          </div>

          {/* Small summary row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span>
              {t("reservations.summary.total", {
                count: totalCount,
              })}
            </span>
            <span className="text-yellow-700">
              {t("reservations.summary.pending", { count: pendingCount })}
            </span>
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reservations Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">
              {t("reservations.allReservations", {
                count: filteredReservations.length,
              })}
            </h3>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled
              title={t(
                "reservations.createReservationDisabledHint",
                "Admin-created reservations will be implemented later."
              )}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("reservations.createReservation")}
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-gray-600">
              {t("reservations.loading", "Loading reservations...")}
            </p>
          ) : filteredReservations.length === 0 ? (
            <p className="text-sm text-gray-600">
              {t(
                "reservations.empty",
                "No reservations found for the selected filters."
              )}
            </p>
          ) : (
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
                      {t("tables.guestType")}
                    </th>
                    <th className="text-left py-3 px-2 text-sm text-gray-600">
                      {t("tables.checkIn")}
                    </th>
                    <th className="text-left py-3 px-2 text-sm text-gray-600">
                      {t("tables.checkOut")}
                    </th>
                    <th className="text-left py-3 px-2 text-sm text-gray-600">
                      {t("tables.room")}
                    </th>
                    <th className="text-left py-3 px-2 text-sm text-gray-600">
                      {t("tables.status")}
                    </th>
                    <th className="text-left py-3 px-2 text-sm text-gray-600">
                      {t("tables.payment")}
                    </th>
                    <th className="text-left py-3 px-2 text-sm text-gray-600">
                      {t("tables.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map((res) => {
                    const badge = mapStatusBadge(res.status);
                    const guestName =
                      res.user?.name || res.user?.email || "—";
                    const guestType = mapGuestType(res.accommodationType);
                    const roomName = res.room?.name || "Unassigned";

                    return (
                      <tr
                        key={res.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-2 text-sm text-gray-900">
                          {formatId(res.id)}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-900">
                          {guestName}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">
                          {guestType}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">
                          {formatDate(res.checkIn)}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">
                          {formatDate(res.checkOut)}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-900">
                          {roomName}
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                            {/* Payment tracking not implemented yet */}
                            {t("tables.paymentNotTracked", "N/A")}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            {res.status === "PENDING" && (
                              <>
                                <button
                                  className="text-green-600 hover:text-green-700 disabled:opacity-50"
                                  title={t("reservations.approve")}
                                  onClick={() => handleApprove(res.id)}
                                  disabled={
                                    actionLoadingId === res.id || loading
                                  }
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button
                                  className="text-red-600 hover:text-red-700 disabled:opacity-50"
                                  title={t("reservations.reject")}
                                  onClick={() => handleReject(res.id)}
                                  disabled={
                                    actionLoadingId === res.id || loading
                                  }
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </>
                            )}
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
                            {!res.roomId && res.status === "APPROVED" && (
                              <Button
                                className="text-xs px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white"
                                disabled
                              >
                                {t("reservations.assignRoom")}
                              </Button>
                            )}
                          </div>
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
    </div>
  );
}
