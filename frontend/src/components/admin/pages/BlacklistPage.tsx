// src/components/admin/pages/BlacklistPage.tsx
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { UserX, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

type BlacklistEntry = {
  id: number;
  userId: number;
  reason: string;
  addedAt: string;
  expiresAt: string | null;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
};

type SearchUser = {
  id: number;
  name: string | null;
  email: string;
  userType: string;
  role: string;
};

export function BlacklistPage() {
  const { t } = useTranslation("admin");

  const [blacklistedGuests, setBlacklistedGuests] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal & form state
  const [showModal, setShowModal] = useState(false);
  const [modalUserId, setModalUserId] = useState("");
  const [modalReason, setModalReason] = useState("");
  const [modalExpiresAt, setModalExpiresAt] = useState("");
  const [isPermanent, setIsPermanent] = useState(true); // 🔥 permanent vs temporary

  // Autocomplete state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);

  // ----------------------------------------------------------------------
  // LOAD BLACKLIST
  // ----------------------------------------------------------------------
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("http://localhost:3000/blacklist");
        if (!res.ok) throw new Error("Failed to load blacklist");
        const data = await res.json();
        setBlacklistedGuests(data);
      } catch (err: any) {
        console.error("Failed to load blacklist:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // ----------------------------------------------------------------------
  // USER SEARCH (ID / EMAIL / NAME)
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (!showModal) return;
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await fetch(
          `http://localhost:3000/users/search?query=${encodeURIComponent(
            searchQuery.trim()
          )}`
        );
        if (!res.ok) throw new Error("Failed to search users");

        const data: SearchUser[] = await res.json();
        const filtered = data.filter((u) => u.role !== "ADMIN");
        setSearchResults(filtered);
      } catch (err) {
        console.error("User search failed:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery, showModal]);

  function handleSelectUser(user: SearchUser) {
    setSelectedUser(user);
    setModalUserId(String(user.id));
    setSearchResults([]);
  }

  // ----------------------------------------------------------------------
  // REMOVE
  // ----------------------------------------------------------------------
  async function handleRemove(userId: number) {
    const confirm = window.confirm(
      t("blacklist.confirmRemove", "Remove this user from blacklist?")
    );
    if (!confirm) return;

    try {
      const res = await fetch(`http://localhost:3000/blacklist/remove/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to remove user");
      }

      setBlacklistedGuests((prev) => prev.filter((e) => e.userId !== userId));
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to remove user.");
    }
  }

  // ----------------------------------------------------------------------
  // ADD
  // ----------------------------------------------------------------------
  async function handleAddSubmit() {
    if (!modalUserId || !modalReason) {
      alert(t("blacklist.validation.required", "User and reason are required."));
      return;
    }

    if (!isPermanent && !modalExpiresAt) {
      alert(
        t(
          "blacklist.validation.expiryRequired",
          "Please select an expiry date for a temporary block."
        )
      );
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/blacklist/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: Number(modalUserId),
          reason: modalReason,
          expiresAt: isPermanent ? null : modalExpiresAt,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add user");

      setBlacklistedGuests((prev) => [data, ...prev]);

      // reset
      setShowModal(false);
      setModalUserId("");
      setModalReason("");
      setModalExpiresAt("");
      setIsPermanent(true);
      setSearchQuery("");
      setSelectedUser(null);
      setSearchResults([]);
    } catch (err: any) {
      alert(err.message);
    }
  }

  function openModal() {
    setShowModal(true);
    setSearchQuery("");
    setSelectedUser(null);
    setModalUserId("");
    setModalReason("");
    setModalExpiresAt("");
    setIsPermanent(true);
    setSearchResults([]);
  }

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-red-500 p-2 rounded-lg">
            <UserX className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="text-red-900 mb-1">{t("blacklist.rulesTitle")}</h4>
            <p className="text-sm text-red-700">
              {t("blacklist.rulesDescription")}
            </p>
          </div>
        </div>
      </div>

      {/* Blacklist table card */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-900 text-lg font-semibold">
              {t("blacklist.title", { count: blacklistedGuests.length })}
            </h3>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={openModal}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("blacklist.addToBlacklist")}
            </Button>
          </div>

          {error && (
            <div className="text-red-600 bg-red-50 border border-red-200 p-2 rounded">
              {error}
            </div>
          )}

          {loading && (
            <p className="text-sm text-gray-600">
              {t("blacklist.loading", "Loading blacklist...")}
            </p>
          )}

          {!loading && blacklistedGuests.length === 0 && (
            <p className="text-sm text-gray-600">
              {t("blacklist.empty", "There are no blacklisted users.")}
            </p>
          )}

          {!loading && blacklistedGuests.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-2 text-left">
                      {t("tables.guestName")}
                    </th>
                    <th className="py-3 px-2 text-left">E-mail</th>
                    <th className="py-3 px-2 text-left">
                      {t("blacklist.reason")}
                    </th>
                    <th className="py-3 px-2 text-left">
                      {t("blacklist.addedDate")}
                    </th>
                    <th className="py-3 px-2 text-left">
                      {t("blacklist.expiryDate")}
                    </th>
                    <th className="py-3 px-2 text-left">
                      {t("tables.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {blacklistedGuests.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-2">
                        {entry.user?.name || "Unknown"}
                      </td>
                      <td className="py-3 px-2">{entry.user?.email}</td>
                      <td className="py-3 px-2">{entry.reason}</td>
                      <td className="py-3 px-2">
                        {entry.addedAt.slice(0, 10)}
                      </td>
                      <td className="py-3 px-2">
                        {entry.expiresAt
                          ? entry.expiresAt.slice(0, 10)
                          : t("blacklist.permanentShort", "Permanent")}
                      </td>
                      <td className="py-3 px-2">
                        <Button
                          className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleRemove(entry.userId)}
                        >
                          {t("blacklist.remove")}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[420px]">
            <h2 className="text-lg font-semibold mb-4">
              {t("blacklist.addToBlacklist")}
            </h2>

            {/* Search */}
            <div className="mb-4">
              <label className="text-sm text-gray-700">
                {t("blacklist.searchUser", "Search user by ID, e-mail or name")}
              </label>
              <input
                type="text"
                className="w-full border px-3 py-2 rounded-md mt-1"
                placeholder="e.g. 12, john@example.com, John"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchLoading && (
                <p className="text-xs text-gray-500 mt-1">
                  {t("blacklist.searching", "Searching...")}
                </p>
              )}
            </div>

            {/* Results */}
            {searchResults.length > 0 && (
              <div className="border rounded-md mb-4 max-h-40 overflow-y-auto">
                {searchResults.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectUser(u)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {u.name || "Unnamed user"}
                      </p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                      {u.userType}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Selected user info */}
            {selectedUser && (
              <div className="mb-4 p-3 bg-gray-50 border rounded-md">
                <p className="font-medium text-sm">
                  {selectedUser.name || "Unnamed user"}
                </p>
                <p className="text-xs text-gray-600">{selectedUser.email}</p>
                <p className="text-xs text-gray-500">
                  ID: {selectedUser.id} • {selectedUser.userType}
                </p>
              </div>
            )}

            {/* Block type: permanent vs temporary */}
            <div className="mb-3">
              <label className="text-sm text-gray-700">
                {t("blacklist.blockType", "Block type")}
              </label>
              <div className="flex gap-4 mt-1 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={isPermanent}
                    onChange={() => setIsPermanent(true)}
                  />
                  {t("blacklist.permanent", "Permanent block")}
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!isPermanent}
                    onChange={() => setIsPermanent(false)}
                  />
                  {t("blacklist.temporary", "Temporary (until date)")}
                </label>
              </div>
            </div>

            {/* Reason */}
            <div className="mb-3">
              <label className="text-sm text-gray-700">
                {t("blacklist.reason")}
              </label>
              <input
                type="text"
                className="w-full border px-3 py-2 rounded-md mt-1"
                value={modalReason}
                onChange={(e) => setModalReason(e.target.value)}
                placeholder={t(
                  "blacklist.reasonPlaceholder",
                  "Enter reason"
                )}
              />
            </div>

            {/* Expiry date */}
            <div className="mb-3">
              <label className="text-sm text-gray-700">
                {t("blacklist.expiryDate")}
              </label>
              <input
                type="date"
                className="w-full border px-3 py-2 rounded-md mt-1"
                value={modalExpiresAt}
                onChange={(e) => setModalExpiresAt(e.target.value)}
                disabled={isPermanent}
              />
              {isPermanent && (
                <p className="text-xs text-gray-500 mt-1">
                  {t(
                    "blacklist.permanentHint",
                    "For permanent blocks, the expiry date is not required."
                  )}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleAddSubmit}
                disabled={!modalUserId}
              >
                {t("common.save")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
