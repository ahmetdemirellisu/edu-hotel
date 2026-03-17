// src/components/admin/pages/GuestsPage.tsx
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Eye, ShieldX, ShieldCheck, Users, X, AlertCircle, UserCheck } from "lucide-react";
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
    const map: Record<string, { label: string; bg: string; text: string; gradient: string }> = {
      STUDENT:       { label: t("guests.types.student", "Student"),       bg: "bg-sky-50",    text: "text-sky-700",    gradient: "from-sky-400 to-sky-600" },
      STAFF:         { label: t("guests.types.staff", "Staff"),           bg: "bg-violet-50", text: "text-violet-700", gradient: "from-violet-400 to-violet-600" },
      SPECIAL_GUEST: { label: t("guests.types.specialGuest", "Special"),  bg: "bg-amber-50",  text: "text-amber-700",  gradient: "from-amber-400 to-orange-500" },
      OTHER:         { label: t("guests.types.other", "Other"),           bg: "bg-gray-50",   text: "text-gray-600",   gradient: "from-gray-400 to-gray-500" },
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

  const getInitials = (name: string) => {
    if (!name || name === "Unknown guest") return "?";
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  };

  const TYPE_TABS: Array<{ key: UserType | "ALL"; label: string }> = [
    { key: "ALL",           label: t("guests.filterAllTypes", "All") },
    { key: "STUDENT",       label: t("guests.filterStudent", "Student") },
    { key: "STAFF",         label: t("guests.filterStaff", "Staff") },
    { key: "SPECIAL_GUEST", label: t("guests.filterSpecialGuest", "Special Guest") },
  ];

  const AVATAR_GRADIENTS = [
    "from-blue-500 to-blue-700",
    "from-violet-500 to-violet-700",
    "from-emerald-500 to-emerald-700",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-rose-700",
    "from-teal-500 to-teal-700",
    "from-sky-500 to-sky-700",
    "from-indigo-500 to-indigo-700",
  ];

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes guestIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .guest-card { animation: guestIn 0.35s ease-out both; }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      {/* ── Page Header ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" style={{ animation: "guestIn 0.3s ease-out" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#003366] to-[#0055aa] flex items-center justify-center shadow-lg">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-[28px] font-semibold text-[#003366] tracking-tight leading-tight">
              {t("pages.guests.title", "Guests")}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {t("guests.subtitle", { count: totalCount, blacklisted: blacklistedCount, defaultValue: `${totalCount} guests · ${blacklistedCount} blacklisted` })}
            </p>
          </div>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-gray-100 shadow-sm rounded-xl px-3.5 py-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-gray-600">{totalCount - blacklistedCount} active</span>
          </div>
          {blacklistedCount > 0 && (
            <div className="flex items-center gap-1.5 bg-white border border-red-100 shadow-sm rounded-xl px-3.5 py-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs font-semibold text-red-600">{blacklistedCount} blocked</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Search + Filters ─────────────────────── */}
      <div
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,51,102,0.04)", animation: "guestIn 0.35s ease-out" }}
      >
        {/* Top gradient accent */}
        <div className="h-px bg-gradient-to-r from-[#003366] via-[#0055aa] to-[#c9a84c]" />

        <div className="p-4 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <div className="flex items-center h-11 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#003366]/10 focus-within:border-[#003366]/40 transition-all duration-150">
              <div className="flex items-center justify-center w-11 h-11 flex-shrink-0">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t("guests.searchPlaceholderSimple", "Search guests by name or email...")}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 h-full bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none pr-4"
              />
              {search && (
                <button onClick={() => setSearch("")} className="flex items-center justify-center w-8 h-8 mr-1 rounded-lg hover:bg-gray-200 transition-colors">
                  <X className="h-3.5 w-3.5 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Type filter tabs + Blacklist filter */}
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1 border border-gray-100">
              {TYPE_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setTypeFilter(tab.key)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    typeFilter === tab.key
                      ? "bg-white text-[#003366] shadow-sm border border-gray-100"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1 border border-gray-100">
              {([
                { key: "all",         label: t("guests.filterAllStatuses", "All") },
                { key: "active",      label: t("guests.filterActive", "Active") },
                { key: "blacklisted", label: t("guests.filterBlacklisted", "Blacklisted") },
              ] as { key: BlacklistFilter; label: string }[]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setBlacklistFilter(tab.key)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    blacklistFilter === tab.key
                      ? tab.key === "blacklisted"
                        ? "bg-red-600 text-white shadow-sm"
                        : "bg-white text-[#003366] shadow-sm border border-gray-100"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                  {tab.key === "blacklisted" && blacklistedCount > 0 && (
                    <span className={`ml-1.5 text-[10px] font-bold ${blacklistFilter === "blacklisted" ? "text-red-100" : "text-red-500"}`}>{blacklistedCount}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
            </div>
          )}
        </div>
      </div>

      {/* ── Guest Grid ───────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,51,102,0.04)" }}>
              <div className="h-px bg-gray-100" />
              <div className="p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-gray-200" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 bg-gray-200 rounded-lg w-28" />
                    <div className="h-3 bg-gray-100 rounded-lg w-36" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-1.5">
                    <div className="h-5 bg-gray-100 rounded-full w-16" />
                    <div className="h-5 bg-gray-100 rounded-full w-14" />
                  </div>
                  <div className="h-8 bg-gray-100 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : guests.length === 0 ? (
        <div
          className="bg-white rounded-2xl border border-gray-100 p-16 text-center"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,51,102,0.04)" }}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Users className="h-8 w-8 text-gray-300" />
          </div>
          <p className="text-base font-semibold text-gray-600">{t("guests.noGuests", "No guests found.")}</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {guests.map((g, idx) => {
            const ut = formatUserType(g.userType);
            const initials = getInitials(g.name || "");
            const avatarGradient = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
            const isBlacklisted = !!g.blacklist;

            return (
              <div
                key={g.id}
                className={`guest-card bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden hover:-translate-y-0.5 ${isBlacklisted ? "border-red-200" : "border-gray-100"}`}
                style={{
                  animationDelay: `${(idx % 9) * 0.05}s`,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,51,102,0.04)",
                }}
              >
                {/* Top accent bar */}
                {isBlacklisted ? (
                  <div className="h-1 bg-gradient-to-r from-red-400 to-red-600" />
                ) : (
                  <div className={`h-1 bg-gradient-to-r ${avatarGradient}`} />
                )}

                <div className="p-5">
                  {/* Avatar + Name */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${isBlacklisted ? "from-red-400 to-red-600" : avatarGradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
                      <span className="text-sm font-bold text-white">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14px] font-bold text-gray-900 truncate">
                        {g.name || t("tables.unknownGuest", "Unknown guest")}
                      </h3>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">{g.email}</p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className={`inline-flex items-center text-[10px] font-semibold px-2.5 py-1 rounded-full ${ut.bg} ${ut.text}`}>
                      {ut.label}
                    </span>
                    {isBlacklisted ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        {t("guests.status.blacklisted", "Blacklisted")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {t("guests.status.active", "Active")}
                      </span>
                    )}
                  </div>

                  {/* Reservation count */}
                  <div className="flex items-center gap-1.5 mb-4">
                    <UserCheck className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-700">{g.reservations.length}</span> reservation{g.reservations.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Blacklist reason */}
                  {isBlacklisted && g.blacklist?.reason && (
                    <div className="mb-3 bg-red-50 border border-red-100 rounded-xl p-2.5">
                      <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide mb-0.5">Reason</p>
                      <p className="text-xs text-red-600 truncate">{g.blacklist.reason}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedGuest(g)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-semibold transition-all duration-150"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {t("commonTable.view", "View")}
                    </button>
                    {g.blacklist ? (
                      <button
                        onClick={() => handleUnblacklist(g)}
                        disabled={actionLoadingId === g.id}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-all duration-150 border border-emerald-200 disabled:opacity-40"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {t("guests.actions.removeFromBlacklist", "Unblock")}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBlacklist(g)}
                        disabled={actionLoadingId === g.id}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-all duration-150 border border-red-200 disabled:opacity-40"
                      >
                        <ShieldX className="h-3.5 w-3.5" />
                        {t("guests.actions.addToBlacklist", "Blacklist")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Detail Modal ─────────────────────────── */}
      {selectedGuest && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedGuest(null)}
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[80vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
            style={{ animation: "guestIn 0.2s ease-out", boxShadow: "0 25px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.05)" }}
          >
            {/* Modal header */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/50">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${AVATAR_GRADIENTS[0]} flex items-center justify-center shadow-md flex-shrink-0`}>
                <span className="text-sm font-bold text-white">{getInitials(selectedGuest.name || "")}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">{selectedGuest.name || t("tables.unknownGuest", "Unknown guest")}</h3>
                <p className="text-xs text-gray-400">{selectedGuest.email}</p>
              </div>
              <button
                onClick={() => setSelectedGuest(null)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                {(() => { const ut = formatUserType(selectedGuest.userType); return <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${ut.bg} ${ut.text}`}>{ut.label}</span>; })()}
                {selectedGuest.blacklist
                  ? <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />{t("guests.status.blacklisted", "Blacklisted")}</span>
                  : <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{t("guests.status.active", "Active")}</span>}
              </div>

              {selectedGuest.blacklist && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5">
                  <p className="text-xs font-bold text-red-700 uppercase tracking-wide">{t("guests.blacklistReasonSection", "Blacklist Reason")}</p>
                  <p className="text-sm text-red-600 mt-1">{selectedGuest.blacklist.reason}</p>
                </div>
              )}

              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  {t("guests.reservationHistoryTitle", { count: selectedGuest.reservations.length, defaultValue: `Reservation History (${selectedGuest.reservations.length})` })}
                </h4>
                {selectedGuest.reservations.length === 0 ? (
                  <p className="text-sm text-gray-400">{t("guests.noReservationsSimple", "No reservations.")}</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedGuest.reservations.map(r => (
                      <div key={r.id} className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-xl px-3 py-2.5 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-semibold text-gray-500">#{r.id}</span>
                          <span className="text-xs text-gray-700 font-medium">{r.checkIn?.slice(0,10)} → {r.checkOut?.slice(0,10)}</span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{r.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-2">
              <button
                onClick={() => setSelectedGuest(null)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-white transition-colors"
              >
                {t("guests.close", "Close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
