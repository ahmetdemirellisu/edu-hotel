// src/components/admin/pages/BlacklistPage.tsx
import React, { useEffect, useState } from "react";
import { UserX, Plus, ShieldAlert, Search, X, CheckCircle, AlertTriangle, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";

type BlacklistEntry = { id: number; userId: number; reason: string; addedAt: string; expiresAt: string | null; user: { id: number; name: string | null; email: string } };
type SearchUser = { id: number; name: string | null; email: string; userType: string; role: string };

export function BlacklistPage() {
  const { t } = useTranslation("admin");
  const [blacklistedGuests, setBlacklistedGuests] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalUserId, setModalUserId] = useState("");
  const [modalReason, setModalReason] = useState("");
  const [modalExpiresAt, setModalExpiresAt] = useState("");
  const [isPermanent, setIsPermanent] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);

  useEffect(() => {
    (async () => {
      try { setLoading(true); setError(null); const res = await fetch("/ehp/api/blacklist"); if (!res.ok) throw new Error("Failed"); setBlacklistedGuests(await res.json()); }
      catch (err: any) { setError(err.message); } finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (!showModal || searchQuery.trim().length < 2) { setSearchResults([]); return; }
    const timeout = setTimeout(async () => {
      try { setSearchLoading(true); const res = await fetch(`/ehp/api/users/search?query=${encodeURIComponent(searchQuery.trim())}`); if (!res.ok) throw new Error("Failed"); setSearchResults((await res.json()).filter((u: SearchUser) => u.role !== "ADMIN")); }
      catch {} finally { setSearchLoading(false); }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, showModal]);

  const handleSelectUser = (user: SearchUser) => { setSelectedUser(user); setModalUserId(String(user.id)); setSearchResults([]); };

  const handleRemove = async (userId: number) => {
    if (!window.confirm(t("blacklist.confirmRemove", "Remove this user from blacklist?"))) return;
    try { const res = await fetch(`/ehp/api/blacklist/remove/${userId}`, { method: "DELETE" }); if (!res.ok) throw new Error("Failed"); setBlacklistedGuests(prev => prev.filter(e => e.userId !== userId)); }
    catch (err: any) { alert(err.message); }
  };

  const handleAddSubmit = async () => {
    if (!modalUserId || !modalReason) { alert(t("blacklist.validation.required", "User and reason are required.")); return; }
    if (!isPermanent && !modalExpiresAt) { alert(t("blacklist.validation.expiryRequired", "Please select an expiry date for a temporary block.")); return; }
    try {
      const res = await fetch("/ehp/api/blacklist/add", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: Number(modalUserId), reason: modalReason, expiresAt: isPermanent ? null : modalExpiresAt }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "Failed");
      setBlacklistedGuests(prev => [data, ...prev]); setShowModal(false); resetModal();
    } catch (err: any) { alert(err.message); }
  };

  const resetModal = () => { setModalUserId(""); setModalReason(""); setModalExpiresAt(""); setIsPermanent(true); setSearchQuery(""); setSelectedUser(null); setSearchResults([]); };
  const openModal = () => { setShowModal(true); resetModal(); };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes blIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .bl-card { animation: blIn 0.35s ease-out both; }
      `}</style>

      {/* ── Page Header ───────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        style={{ animation: "blIn 0.3s ease-out" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#003366] to-[#0055aa] flex items-center justify-center shadow-md">
            <UserX className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-[28px] font-semibold text-[#003366] tracking-tight leading-tight">
              {t("pages.blacklist.title", "Blacklist Management")}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {t("blacklist.blockedUsers", { count: blacklistedGuests.length, defaultValue: `${blacklistedGuests.length} blocked users` })}
            </p>
          </div>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150"
          style={{ background: "linear-gradient(135deg, #dc2626, #b91c1c)" }}
        >
          <Plus className="h-4 w-4" />{t("blacklist.addToBlacklist", "Add to Blacklist")}
        </button>
      </div>

      {/* ── Warning Banner ───────────────────────── */}
      <div
        className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm"
        style={{ animation: "blIn 0.35s ease-out" }}
      >
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 shadow-sm">
          <ShieldAlert className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-red-800">{t("blacklist.rulesTitle", "Restricted Users — Handle with Care")}</p>
          <p className="text-xs text-red-600 mt-0.5 leading-relaxed">{t("blacklist.rulesDescription", "Use the blacklist only for serious violations such as unpaid bills, fraud, or property damage. Always follow legal and data protection requirements.")}</p>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2 shadow-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />{error}
        </div>
      )}

      {/* ── Blacklist Cards / States ─────────────── */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,51,102,0.04)" }}
            >
              <div className="h-px bg-gray-100" />
              <div className="p-5 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded-lg w-36" />
                    <div className="h-3 bg-gray-100 rounded-lg w-48" />
                    <div className="h-3 bg-gray-100 rounded-lg w-64" />
                  </div>
                  <div className="h-8 bg-gray-100 rounded-xl w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : blacklistedGuests.length === 0 ? (
        <div
          className="bg-white rounded-2xl border border-gray-100 p-16 text-center"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,51,102,0.04)" }}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <CheckCircle className="h-8 w-8 text-emerald-400" />
          </div>
          <p className="text-base font-semibold text-gray-600">{t("blacklist.empty", "No blocked users")}</p>
          <p className="text-sm text-gray-400 mt-1">The blacklist is currently empty.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {blacklistedGuests.map((entry, idx) => (
            <div
              key={entry.id}
              className="bl-card bg-white rounded-2xl border border-red-100 hover:border-red-200 hover:shadow-md transition-all duration-200 overflow-hidden"
              style={{
                animationDelay: `${idx * 0.05}s`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,51,102,0.04)",
              }}
            >
              <div className="h-1 bg-gradient-to-r from-red-400 via-red-500 to-orange-400" />
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center flex-shrink-0 shadow-md">
                    <span className="text-sm font-bold text-white">{getInitials(entry.user?.name)}</span>
                  </div>

                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-[14px] font-bold text-gray-900">{entry.user?.name || t("blacklist.unknown", "Unknown")}</h3>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        Blocked
                      </span>
                      {!entry.expiresAt && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                          {t("blacklist.permanentShort", "Permanent")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{entry.user?.email}</p>

                    {/* Reason */}
                    <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-2">
                      <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide mb-0.5">Reason</p>
                      <p className="text-xs text-red-700 leading-relaxed">{entry.reason}</p>
                    </div>

                    {/* Dates */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span>Added: <span className="font-semibold text-gray-700">{entry.addedAt.slice(0, 10)}</span></span>
                      </div>
                      {entry.expiresAt ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-600">
                          <Calendar className="h-3 w-3 text-amber-400" />
                          <span>Expires: <span className="font-semibold">{entry.expiresAt.slice(0, 10)}</span></span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => handleRemove(entry.userId)}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-all duration-150"
                    title={t("blacklist.remove", "Remove from blacklist")}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    {t("blacklist.remove", "Remove")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add to Blacklist Modal ───────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
            style={{ animation: "blIn 0.2s ease-out", boxShadow: "0 25px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.05)" }}
          >
            {/* Modal header */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-700" />
              <div className="relative px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                    <UserX className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{t("blacklist.addToBlacklist", "Add to Blacklist")}</h3>
                    <p className="text-xs text-red-200 mt-0.5">Block a user from making reservations</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* User Search */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{t("blacklist.searchUser", "Search user by ID, e-mail or name")}</label>
                <div className="flex items-center h-10 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-red-500/20 focus-within:border-red-300 transition-all">
                  <div className="flex items-center justify-center w-10 h-10 flex-shrink-0">
                    <Search className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder={t("blacklist.searchPlaceholder", "ID, email, or name...")}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="flex-1 h-full bg-transparent text-sm text-gray-700 outline-none pr-3"
                  />
                </div>
                {searchLoading && <p className="text-[10px] text-gray-400 mt-1">{t("blacklist.searching", "Searching...")}</p>}
                {searchResults.length > 0 && (
                  <div className="border border-gray-200 rounded-xl mt-2 max-h-36 overflow-y-auto shadow-sm">
                    {searchResults.map(u => (
                      <button key={u.id} onClick={() => handleSelectUser(u)} className="w-full text-left px-3 py-2.5 hover:bg-gray-50 flex justify-between items-center text-sm transition-colors border-b border-gray-50 last:border-0">
                        <div>
                          <p className="font-semibold text-gray-800">{u.name || t("blacklist.unnamed", "Unnamed")}</p>
                          <p className="text-[10px] text-gray-400">{u.email}</p>
                        </div>
                        <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-500 font-medium">{u.userType}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected user card */}
              {selectedUser && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">{getInitials(selectedUser.name)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-800">{selectedUser.name || t("blacklist.unnamed", "Unnamed")}</p>
                    <p className="text-[10px] text-red-600">{selectedUser.email} · ID: {selectedUser.id}</p>
                  </div>
                </div>
              )}

              {/* Block type */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">{t("blacklist.blockType", "Block type")}</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all duration-150 ${isPermanent ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50 hover:bg-gray-100"}`}>
                    <input type="radio" checked={isPermanent} onChange={() => setIsPermanent(true)} className="accent-red-600" />
                    <div>
                      <p className="text-xs font-bold text-gray-800">{t("blacklist.permanent", "Permanent")}</p>
                      <p className="text-[10px] text-gray-500">No expiry date</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all duration-150 ${!isPermanent ? "border-amber-300 bg-amber-50" : "border-gray-200 bg-gray-50 hover:bg-gray-100"}`}>
                    <input type="radio" checked={!isPermanent} onChange={() => setIsPermanent(false)} className="accent-red-600" />
                    <div>
                      <p className="text-xs font-bold text-gray-800">{t("blacklist.temporary", "Temporary")}</p>
                      <p className="text-[10px] text-gray-500">Until a date</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{t("blacklist.reasonLabel", "Reason")}</label>
                <textarea
                  value={modalReason}
                  onChange={e => setModalReason(e.target.value)}
                  placeholder={t("blacklist.reasonPlaceholder", "Describe the reason for blocking this user...")}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300 resize-none transition-all"
                />
              </div>

              {/* Expiry date */}
              {!isPermanent && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{t("blacklist.expiryDateLabel", "Expiry Date")}</label>
                  <input
                    type="date"
                    value={modalExpiresAt}
                    onChange={e => setModalExpiresAt(e.target.value)}
                    className="w-full px-3 h-10 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300 transition-all"
                  />
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-white transition-colors"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                onClick={handleAddSubmit}
                disabled={!modalUserId}
                className="px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-150 hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #dc2626, #b91c1c)" }}
              >
                <UserX className="h-4 w-4" />{t("blacklist.blockUser", "Block User")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
