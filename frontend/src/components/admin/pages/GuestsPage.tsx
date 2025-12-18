// src/components/admin/pages/GuestsPage.tsx
import { useEffect, useState } from "react";
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { useTranslation } from "react-i18next";
import { Search, Eye, ShieldX, ShieldCheck } from "lucide-react";
import {
  getAdminGuests,
  blacklistUser,
  unblacklistUser,
  type AdminGuest,
  type UserType,
} from "../../../api/users";

type BlacklistFilter = "all" | "blacklisted" | "active";

export function GuestsPage() {
  const { t } = useTranslation("admin");

  const [guests, setGuests] = useState<AdminGuest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<UserType | "ALL">("ALL");
  const [blacklistFilter, setBlacklistFilter] =
    useState<BlacklistFilter>("all");

  const [selectedGuest, setSelectedGuest] = useState<AdminGuest | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // ---------------------------------------------------------
  // LOAD GUESTS
  // ---------------------------------------------------------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAdminGuests({
          type: typeFilter,
          search: search.trim() || undefined,
          blacklisted:
            blacklistFilter === "all"
              ? "all"
              : blacklistFilter === "blacklisted"
              ? "true"
              : "false",
        });
        setGuests(data);
      } catch (err: any) {
        setError(err.message || "Failed to load guests.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search, typeFilter, blacklistFilter]);

  const formatUserType = (ut: UserType) => {
    switch (ut) {
      case "STUDENT":
        return t("guests.types.student", "Student");
      case "STAFF":
        return t("guests.types.staff", "Staff");
      case "SPECIAL_GUEST":
        return t("guests.types.specialGuest", "Special guest");
      case "OTHER":
      default:
        return t("guests.types.other", "Other");
    }
  };

  const statusBadge = (g: AdminGuest) => {
    if (g.blacklist) {
      return {
        label: t("guests.status.blacklisted", "Blacklisted"),
        className: "bg-red-100 text-red-700",
      };
    }
    return {
      label: t("guests.status.active", "Active"),
      className: "bg-green-100 text-green-700",
    };
  };

  const totalReservations = (g: AdminGuest) => g.reservations.length;

  const lastReservationDate = (g: AdminGuest) =>
    g.reservations[0]?.checkIn?.slice(0, 10) || "—";

  // ---------------------------------------------------------
  // BLACKLIST / UNBLACKLIST
  // ---------------------------------------------------------
  const handleBlacklist = async (guest: AdminGuest) => {
    const reason =
      window.prompt(
        t(
          "guests.blacklistReasonPrompt",
          "Please enter a reason for blacklisting:"
        )
      ) || "";
    if (!reason.trim()) return;

    try {
      setActionLoadingId(guest.id);
      const info = await blacklistUser(guest.id, reason.trim());
      setGuests((prev) =>
        prev.map((g) =>
          g.id === guest.id ? { ...g, blacklist: info } : g
        )
      );
    } catch (err: any) {
      alert(err.message || "Failed to blacklist user.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUnblacklist = async (guest: AdminGuest) => {
    const confirm = window.confirm(
      t(
        "guests.confirmUnblacklist",
        "Remove this user from the blacklist?"
      )
    );
    if (!confirm) return;

    try {
      setActionLoadingId(guest.id);
      await unblacklistUser(guest.id);
      setGuests((prev) =>
        prev.map((g) =>
          g.id === guest.id ? { ...g, blacklist: null } : g
        )
      );
    } catch (err: any) {
      alert(err.message || "Failed to remove user from blacklist.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------
  const totalCount = guests.length;
  const blacklistedCount = guests.filter((g) => g.blacklist).length;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">
                {t("tables.name")}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t(
                    "guests.searchPlaceholder",
                    "Search guests..."
                  )}
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* User type filter */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">
                {t("guests.filters.type", "Guest type")}
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066cc]"
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(e.target.value as UserType | "ALL")
                }
              >
                <option value="ALL">
                  {t("guests.filters.allTypes", "All types")}
                </option>
                <option value="STUDENT">
                  {t("guests.types.student", "Student")}
                </option>
                <option value="STAFF">
                  {t("guests.types.staff", "Staff")}
                </option>
                <option value="SPECIAL_GUEST">
                  {t("guests.types.specialGuest", "Special guest")}
                </option>
                <option value="OTHER">
                  {t("guests.types.other", "Other")}
                </option>
              </select>
            </div>

            {/* Blacklist filter */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">
                {t("guests.filters.blacklist", "Status")}
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066cc]"
                value={blacklistFilter}
                onChange={(e) =>
                  setBlacklistFilter(e.target.value as BlacklistFilter)
                }
              >
                <option value="all">
                  {t("guests.filters.allStatuses", "All")}
                </option>
                <option value="active">
                  {t("guests.status.active", "Active")}
                </option>
                <option value="blacklisted">
                  {t("guests.status.blacklisted", "Blacklisted")}
                </option>
              </select>
            </div>

            {/* Summary */}
            <div className="flex items-end">
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                  {t("guests.summary.total", { count: totalCount })}
                </p>
                <p className="text-red-700">
                  {t("guests.summary.blacklisted", {
                    count: blacklistedCount,
                  })}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guests table */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-gray-900 mb-4">
            {t("pages.guests.title")}
          </h3>

          {loading ? (
            <p className="text-sm text-gray-600">
              {t("guests.loading", "Loading guests...")}
            </p>
          ) : guests.length === 0 ? (
            <p className="text-sm text-gray-600">
              {t("guests.empty", "No guests found for the selected filters.")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-2 text-left text-sm text-gray-600">
                      ID
                    </th>
                    <th className="py-3 px-2 text-left text-sm text-gray-600">
                      {t("tables.name")}
                    </th>
                    <th className="py-3 px-2 text-left text-sm text-gray-600">
                      {t("tables.email")}
                    </th>
                    <th className="py-3 px-2 text-left text-sm text-gray-600">
                      {t("tables.guestType")}
                    </th>
                    <th className="py-3 px-2 text-left text-sm text-gray-600">
                      {t("guests.columns.reservations", "Reservations")}
                    </th>
                    <th className="py-3 px-2 text-left text-sm text-gray-600">
                      {t("guests.columns.lastStay", "Last stay")}
                    </th>
                    <th className="py-3 px-2 text-left text-sm text-gray-600">
                      {t("guests.columns.status", "Status")}
                    </th>
                    <th className="py-3 px-2 text-left text-sm text-gray-600">
                      {t("tables.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map((g) => {
                    const badge = statusBadge(g);
                    const reservationsCount = totalReservations(g);
                    const lastStay = lastReservationDate(g);

                    return (
                      <tr
                        key={g.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-2 text-sm text-gray-600">
                          {g.id}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-900">
                          {g.name || t("tables.unknownGuest")}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">
                          {g.email}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">
                          {formatUserType(g.userType)}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">
                          {reservationsCount}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">
                          {lastStay}
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <button
                              className="text-[#0066cc] hover:text-[#0052a3]"
                              title={t("commonTable.view")}
                              onClick={() => setSelectedGuest(g)}
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {g.blacklist ? (
                              <button
                                className="text-green-600 hover:text-green-700 disabled:opacity-50"
                                title={t(
                                  "guests.actions.removeFromBlacklist",
                                  "Remove from blacklist"
                                )}
                                disabled={
                                  actionLoadingId === g.id || loading
                                }
                                onClick={() => handleUnblacklist(g)}
                              >
                                <ShieldCheck className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                className="text-red-600 hover:text-red-700 disabled:opacity-50"
                                title={t(
                                  "guests.actions.addToBlacklist",
                                  "Add to blacklist"
                                )}
                                disabled={
                                  actionLoadingId === g.id || loading
                                }
                                onClick={() => handleBlacklist(g)}
                              >
                                <ShieldX className="h-4 w-4" />
                              </button>
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

      {/* DETAILS MODAL */}
      {selectedGuest && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              {t("guests.details.title", "Guest details")}
            </h2>

            <div className="mb-4 space-y-1 text-sm text-gray-700">
              <p>
                <strong>{t("tables.name")}:</strong>{" "}
                {selectedGuest.name || t("tables.unknownGuest")}
              </p>
              <p>
                <strong>{t("tables.email")}:</strong> {selectedGuest.email}
              </p>
              <p>
                <strong>{t("tables.guestType")}:</strong>{" "}
                {formatUserType(selectedGuest.userType)}
              </p>
              <p>
                <strong>{t("guests.columns.status")}:</strong>{" "}
                {selectedGuest.blacklist
                  ? t("guests.status.blacklisted", "Blacklisted")
                  : t("guests.status.active", "Active")}
              </p>
            </div>

            <h3 className="text-md font-semibold mb-2">
              {t(
                "guests.details.reservations",
                "Reservation history"
              )}
            </h3>

            {selectedGuest.reservations.length === 0 ? (
              <p className="text-sm text-gray-600">
                {t(
                  "guests.details.noReservations",
                  "This guest has no reservations."
                )}
              </p>
            ) : (
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-2 px-2 text-left">
                        {t("tables.reservationId")}
                      </th>
                      <th className="py-2 px-2 text-left">
                        {t("tables.checkIn")}
                      </th>
                      <th className="py-2 px-2 text-left">
                        {t("tables.checkOut")}
                      </th>
                      <th className="py-2 px-2 text-left">
                        {t("tables.status")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedGuest.reservations.map((r) => (
                      <tr key={r.id} className="border-b border-gray-100">
                        <td className="py-2 px-2">RES-{r.id}</td>
                        <td className="py-2 px-2">
                          {r.checkIn.slice(0, 10)}
                        </td>
                        <td className="py-2 px-2">
                          {r.checkOut.slice(0, 10)}
                        </td>
                        <td className="py-2 px-2">{r.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button onClick={() => setSelectedGuest(null)}>
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
