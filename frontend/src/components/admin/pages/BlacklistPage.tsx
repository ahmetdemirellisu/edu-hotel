// src/components/admin/pages/BlacklistPage.tsx
import React, { useEffect, useState } from "react";
import { Button } from "../../ui/button";
import { UserX, Plus, ShieldAlert, Search, X, CheckCircle } from "lucide-react";
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
      try { setLoading(true); setError(null); const res = await fetch("/api/blacklist"); if (!res.ok) throw new Error("Failed"); setBlacklistedGuests(await res.json()); }
      catch (err: any) { setError(err.message); } finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (!showModal || searchQuery.trim().length < 2) { setSearchResults([]); return; }
    const timeout = setTimeout(async () => {
      try { setSearchLoading(true); const res = await fetch(`/api/users/search?query=${encodeURIComponent(searchQuery.trim())}`); if (!res.ok) throw new Error("Failed"); setSearchResults((await res.json()).filter((u: SearchUser) => u.role !== "ADMIN")); }
      catch {} finally { setSearchLoading(false); }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, showModal]);

  const handleSelectUser = (user: SearchUser) => { setSelectedUser(user); setModalUserId(String(user.id)); setSearchResults([]); };

  const handleRemove = async (userId: number) => {
    if (!window.confirm(t("blacklist.confirmRemove", "Remove this user from blacklist?"))) return;
    try { const res = await fetch(`/api/blacklist/remove/${userId}`, { method: "DELETE" }); if (!res.ok) throw new Error("Failed"); setBlacklistedGuests(prev => prev.filter(e => e.userId !== userId)); }
    catch (err: any) { alert(err.message); }
  };

  const handleAddSubmit = async () => {
    if (!modalUserId || !modalReason) { alert(t("blacklist.validation.required", "User and reason are required.")); return; }
    if (!isPermanent && !modalExpiresAt) { alert(t("blacklist.validation.expiryRequired", "Please select an expiry date for a temporary block.")); return; }
    try {
      const res = await fetch("/api/blacklist/add", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: Number(modalUserId), reason: modalReason, expiresAt: isPermanent ? null : modalExpiresAt }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "Failed");
      setBlacklistedGuests(prev => [data, ...prev]); setShowModal(false); resetModal();
    } catch (err: any) { alert(err.message); }
  };

  const resetModal = () => { setModalUserId(""); setModalReason(""); setModalExpiresAt(""); setIsPermanent(true); setSearchQuery(""); setSelectedUser(null); setSearchResults([]); };
  const openModal = () => { setShowModal(true); resetModal(); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">{t("pages.blacklist.title", "Blacklist Management")}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{t("blacklist.blockedUsers", { count: blacklistedGuests.length, defaultValue: `${blacklistedGuests.length} blocked users` })}</p>
        </div>
        <button onClick={openModal} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all">
          <Plus className="h-4 w-4" />{t("blacklist.addToBlacklist", "Add to Blacklist")}
        </button>
      </div>

      {/* Warning */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-800">{t("blacklist.rulesTitle", "Blacklist Rules")}</p>
          <p className="text-xs text-red-600 mt-0.5">{t("blacklist.rulesDescription", "Use the blacklist only for serious violations such as unpaid bills, fraud, or property damage. Always follow legal and data protection requirements.")}</p>
        </div>
      </div>

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</div>}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : blacklistedGuests.length === 0 ? (
          <div className="p-12 text-center"><UserX className="h-8 w-8 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-500">{t("blacklist.empty", "There are no blacklisted users.")}</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                {[
                  t("blacklist.colUser", "User"),
                  t("blacklist.colEmail", "Email"),
                  t("blacklist.colReason", "Reason"),
                  t("blacklist.colAdded", "Added"),
                  t("blacklist.colExpires", "Expires"),
                  t("blacklist.colActions", "Actions"),
                ].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider first:pl-6 last:pr-6">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {blacklistedGuests.map(entry => (
                  <tr key={entry.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors group">
                    <td className="py-3.5 pl-6 pr-4 text-[13px] font-medium text-gray-800">{entry.user?.name || t("blacklist.unknown", "Unknown")}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">{entry.user?.email}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-600 max-w-[200px] truncate">{entry.reason}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">{entry.addedAt.slice(0, 10)}</td>
                    <td className="py-3.5 px-4">
                      {entry.expiresAt
                        ? <span className="text-xs text-gray-600">{entry.expiresAt.slice(0, 10)}</span>
                        : <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{t("blacklist.permanentShort", "Permanent")}</span>}
                    </td>
                    <td className="py-3.5 pr-6 px-4">
                      <button onClick={() => handleRemove(entry.userId)} className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-emerald-600 transition-colors opacity-60 group-hover:opacity-100" title={t("blacklist.remove", "Remove from blacklist")}>
                        <CheckCircle className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()} style={{ animation: "adminFadeIn 0.2s ease-out" }}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">{t("blacklist.addToBlacklist", "Add to Blacklist")}</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"><X className="h-4 w-4 text-gray-500" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">{t("blacklist.searchUser", "Search user by ID, e-mail or name")}</label>
                <div className="flex items-center h-9 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-red-500/20 focus-within:border-red-300">
                  <div className="flex items-center justify-center w-9 h-9 flex-shrink-0">
                    <Search className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                  <input type="text" placeholder={t("blacklist.searchPlaceholder", "ID, email, or name...")} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="flex-1 h-full bg-transparent text-sm outline-none pr-3" />
                </div>
                {searchLoading && <p className="text-[10px] text-gray-400 mt-1">{t("blacklist.searching", "Searching...")}</p>}
                {searchResults.length > 0 && (
                  <div className="border border-gray-200 rounded-xl mt-2 max-h-32 overflow-y-auto">
                    {searchResults.map(u => (
                      <button key={u.id} onClick={() => handleSelectUser(u)} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex justify-between items-center text-sm transition-colors">
                        <div><p className="font-medium text-gray-800">{u.name || t("blacklist.unnamed", "Unnamed")}</p><p className="text-[10px] text-gray-400">{u.email}</p></div>
                        <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">{u.userType}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedUser && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                  <p className="text-sm font-medium text-gray-800">{selectedUser.name || t("blacklist.unnamed", "Unnamed")}</p>
                  <p className="text-[10px] text-gray-500">{selectedUser.email} · {t("blacklist.userId", "User ID")}: {selectedUser.id}</p>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">{t("blacklist.blockType", "Block type")}</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" checked={isPermanent} onChange={() => setIsPermanent(true)} className="accent-red-600" />{t("blacklist.permanent", "Permanent block")}</label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" checked={!isPermanent} onChange={() => setIsPermanent(false)} className="accent-red-600" />{t("blacklist.temporary", "Temporary (until date)")}</label>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">{t("blacklist.reasonLabel", "Reason")}</label>
                <input type="text" value={modalReason} onChange={e => setModalReason(e.target.value)} placeholder={t("blacklist.reasonPlaceholder", "Enter reason")}
                  className="w-full px-3 h-9 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300" />
              </div>
              {!isPermanent && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">{t("blacklist.expiryDateLabel", "Expiry Date")}</label>
                  <input type="date" value={modalExpiresAt} onChange={e => setModalExpiresAt(e.target.value)}
                    className="w-full px-3 h-9 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300" />
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">{t("common.cancel", "Cancel")}</button>
              <button onClick={handleAddSubmit} disabled={!modalUserId} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2">
                <UserX className="h-4 w-4" />{t("blacklist.blockUser", "Block User")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
