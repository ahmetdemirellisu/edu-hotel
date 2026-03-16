// src/components/admin/pages/GuestsPage.tsx
import React, { useEffect, useState } from "react";
import { Input } from "../../ui/input";
import { useTranslation } from "react-i18next";
import { Search, Eye, ShieldX, ShieldCheck, Users, X, Mail, Calendar, AlertCircle } from "lucide-react";
import { getAdminGuests, blacklistUser, unblacklistUser, type AdminGuest, type UserType } from "../../../api/users";

type BlacklistFilter = "all" | "blacklisted" | "active";

export function GuestsPage() {
  const { t } = useTranslation("admin");
  const [guests, setGuests] = useState<AdminGuest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<UserType | "ALL">("ALL");
  const [blacklistFilter, setBlacklistFilter] = useState<BlacklistFilter>("all");
  const [selectedGuest, setSelectedGuest] = useState<AdminGuest | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true); setError(null);
        const data = await getAdminGuests({ type: typeFilter, search: search.trim() || undefined, blacklisted: blacklistFilter === "all" ? "all" : blacklistFilter === "blacklisted" ? "true" : "false" });
        setGuests(data);
      } catch (err: any) { setError(err.message || "Failed to load guests."); }
      finally { setLoading(false); }
    })();
  }, [search, typeFilter, blacklistFilter]);

  const formatUserType = (ut: UserType) => {
    const map: Record<string, { label: string; bg: string; text: string }> = {
      STUDENT: { label: t("guests.types.student", "Student"), bg: "bg-sky-50", text: "text-sky-700" },
      STAFF: { label: t("guests.types.staff", "Staff"), bg: "bg-violet-50", text: "text-violet-700" },
      SPECIAL_GUEST: { label: t("guests.types.specialGuest", "Special guest"), bg: "bg-amber-50", text: "text-amber-700" },
      OTHER: { label: t("guests.types.other", "Other"), bg: "bg-gray-50", text: "text-gray-600" },
    };
    return map[ut] || map.OTHER;
  };

  const handleBlacklist = async (guest: AdminGuest) => {
    const reason = window.prompt(t("guests.blacklistReasonPrompt", "Please enter a reason for blacklisting:")) || "";
    if (!reason.trim()) return;
    try { setActionLoadingId(guest.id); const info = await blacklistUser(guest.id, reason.trim()); setGuests(prev => prev.map(g => g.id === guest.id ? { ...g, blacklist: info } : g)); }
    catch (err: any) { alert(err.message || "Failed."); } finally { setActionLoadingId(null); }
  };

  const handleUnblacklist = async (guest: AdminGuest) => {
    if (!window.confirm(t("guests.confirmUnblacklist", "Remove this user from the blacklist?"))) return;
    try { setActionLoadingId(guest.id); await unblacklistUser(guest.id); setGuests(prev => prev.map(g => g.id === guest.id ? { ...g, blacklist: null } : g)); }
    catch (err: any) { alert(err.message || "Failed."); } finally { setActionLoadingId(null); }
  };

  const totalCount = guests.length;
  const blacklistedCount = guests.filter(g => g.blacklist).length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 tracking-tight">{t("pages.guests.title", "Guests")}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{t("guests.subtitle", { count: totalCount, blacklisted: blacklistedCount, defaultValue: `${totalCount} guests · ${blacklistedCount} blacklisted` })}</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="flex items-center h-9 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-300 transition-all">
              <div className="flex items-center justify-center w-9 h-9 flex-shrink-0">
                <Search className="h-3.5 w-3.5 text-gray-400" />
              </div>
              <input type="text" placeholder={t("guests.searchPlaceholderSimple", "Search guests...")} value={search} onChange={e => setSearch(e.target.value)}
                className="flex-1 h-full bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none pr-3" />
            </div>
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="ALL">{t("guests.filterAllTypes", "All Types")}</option>
            <option value="STUDENT">{t("guests.filterStudent", "Student")}</option>
            <option value="STAFF">{t("guests.filterStaff", "Staff")}</option>
            <option value="SPECIAL_GUEST">{t("guests.filterSpecialGuest", "Special Guest")}</option>
            <option value="OTHER">{t("guests.filterOther", "Other")}</option>
          </select>
          <select value={blacklistFilter} onChange={e => setBlacklistFilter(e.target.value as any)} className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="all">{t("guests.filterAllStatuses", "All Statuses")}</option>
            <option value="active">{t("guests.filterActive", "Active")}</option>
            <option value="blacklisted">{t("guests.filterBlacklisted", "Blacklisted")}</option>
          </select>
        </div>
        {error && <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2 flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div>}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : guests.length === 0 ? (
          <div className="p-12 text-center"><Users className="h-8 w-8 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-500">{t("guests.noGuests", "No guests found.")}</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                {[
                  t("tables.id", "ID"),
                  t("tables.name", "Name"),
                  t("tables.email", "Email"),
                  t("tables.guestType", "Guest type"),
                  t("guests.columns.reservations", "Reservations"),
                  t("guests.columns.status", "Status"),
                  t("tables.actions", "Actions"),
                ].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider first:pl-6 last:pr-6">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {guests.map(g => {
                  const ut = formatUserType(g.userType);
                  return (
                    <tr key={g.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors group">
                      <td className="py-3.5 pl-6 pr-4 text-xs font-mono text-gray-500">{g.id}</td>
                      <td className="py-3.5 px-4 text-[13px] font-medium text-gray-800">{g.name || t("tables.unknownGuest", "Unknown guest")}</td>
                      <td className="py-3.5 px-4 text-xs text-gray-600">{g.email}</td>
                      <td className="py-3.5 px-4"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ut.bg} ${ut.text}`}>{ut.label}</span></td>
                      <td className="py-3.5 px-4 text-xs text-gray-600">{g.reservations.length}</td>
                      <td className="py-3.5 px-4">
                        {g.blacklist
                          ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700">{t("guests.status.blacklisted", "Blacklisted")}</span>
                          : <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">{t("guests.status.active", "Active")}</span>}
                      </td>
                      <td className="py-3.5 pr-6 px-4">
                        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setSelectedGuest(g)} className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors" title={t("commonTable.view", "View")}><Eye className="h-3.5 w-3.5" /></button>
                          {g.blacklist ? (
                            <button onClick={() => handleUnblacklist(g)} disabled={actionLoadingId === g.id} className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-emerald-600 transition-colors disabled:opacity-40" title={t("guests.actions.removeFromBlacklist", "Remove from blacklist")}><ShieldCheck className="h-3.5 w-3.5" /></button>
                          ) : (
                            <button onClick={() => handleBlacklist(g)} disabled={actionLoadingId === g.id} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 transition-colors disabled:opacity-40" title={t("guests.actions.addToBlacklist", "Add to blacklist")}><ShieldX className="h-3.5 w-3.5" /></button>
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
      </div>

      {/* Detail Modal */}
      {selectedGuest && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSelectedGuest(null)}>
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()} style={{ animation: "adminFadeIn 0.2s ease-out" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedGuest.name || t("tables.unknownGuest", "Unknown guest")}</h3>
                <p className="text-xs text-gray-400">{selectedGuest.email}</p>
              </div>
              <button onClick={() => setSelectedGuest(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"><X className="h-4 w-4 text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="flex items-center gap-3">
                {(() => { const ut = formatUserType(selectedGuest.userType); return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ut.bg} ${ut.text}`}>{ut.label}</span>; })()}
                {selectedGuest.blacklist
                  ? <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700">{t("guests.status.blacklisted", "Blacklisted")}</span>
                  : <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">{t("guests.status.active", "Active")}</span>}
              </div>
              {selectedGuest.blacklist && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-red-700">{t("guests.blacklistReasonSection", "Blacklist Reason")}</p>
                  <p className="text-sm text-red-600 mt-0.5">{selectedGuest.blacklist.reason}</p>
                </div>
              )}
              <div>
                <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{t("guests.reservationHistoryTitle", { count: selectedGuest.reservations.length, defaultValue: `Reservation History (${selectedGuest.reservations.length})` })}</h4>
                {selectedGuest.reservations.length === 0 ? <p className="text-sm text-gray-400">{t("guests.noReservationsSimple", "No reservations.")}</p> : (
                  <div className="space-y-1.5">
                    {selectedGuest.reservations.map(r => (
                      <div key={r.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-gray-500">#{r.id}</span>
                          <span className="text-xs text-gray-700">{r.checkIn?.slice(0,10)} → {r.checkOut?.slice(0,10)}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-gray-500">{r.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button onClick={() => setSelectedGuest(null)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">{t("guests.close", "Close")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
