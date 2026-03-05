// src/components/admin/pages/ReservationsPage.tsx
import { useState, useEffect, useMemo } from "react";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import {
  Search,
  CheckCircle,
  XCircle,
  Eye,
  X,
  ChevronDown,
  CreditCard,
  Clock,
  AlertCircle,
  Users,
  Calendar,
  MapPin,
  FileText,
  Hash,
  Mail,
  Phone,
  User,
  Bed,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  getAdminReservations,
  approveReservation,
  rejectReservation,
  type Reservation,
  type ReservationStatus,
} from "../../../api/reservations";
import { getRooms, type Room } from "../../../api/rooms";

type AdminReservation = Reservation & {
  user?: { id: number; email: string; name?: string | null };
  room?: { id: number; name: string; type: string } | null;
};

function formatId(id: number) { return `#${id}`; }
function formatDateOnly(iso: string) { return iso?.slice(0, 10) || "—"; }
function safe(v?: string | null) { return (typeof v === "string" && v.trim()) || "—"; }
function joinName(first?: string | null, last?: string | null) {
  return `${(first || "").trim()} ${(last || "").trim()}`.trim() || "—";
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PENDING:           { label: "Pending",          bg: "bg-amber-50",   text: "text-amber-700",   dot: "#f59e0b" },
  APPROVED:          { label: "Approved",         bg: "bg-emerald-50", text: "text-emerald-700", dot: "#22c55e" },
  REJECTED:          { label: "Rejected",         bg: "bg-red-50",     text: "text-red-700",     dot: "#ef4444" },
  CANCELLED:         { label: "Cancelled",        bg: "bg-gray-100",   text: "text-gray-600",    dot: "#9ca3af" },
  REFUND_REQUESTED:  { label: "Refund Req.",      bg: "bg-orange-50",  text: "text-orange-700",  dot: "#f97316" },
  REFUNDED:          { label: "Refunded",         bg: "bg-indigo-50",  text: "text-indigo-700",  dot: "#6366f1" },
};

const PAYMENT_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  NONE:                  { label: "—",              bg: "",              text: "text-gray-400" },
  PENDING_VERIFICATION:  { label: "Pending",        bg: "bg-blue-50",    text: "text-blue-700" },
  APPROVED:              { label: "Paid",            bg: "bg-emerald-50", text: "text-emerald-700" },
  REJECTED:              { label: "Rejected",        bg: "bg-red-50",     text: "text-red-700" },
};

const ACCOM_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  PERSONAL:  { label: "Personal",  bg: "bg-sky-50",    text: "text-sky-700" },
  CORPORATE: { label: "Corporate", bg: "bg-violet-50", text: "text-violet-700" },
  EDUCATION: { label: "Education", bg: "bg-teal-50",   text: "text-teal-700" },
};

export function ReservationsPage() {
  const { t } = useTranslation("admin");

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminReservation | null>(null);

  // Room assignment modal
  const [approveModalId, setApproveModalId] = useState<number | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<number | undefined>(undefined);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [resData, roomData] = await Promise.all([
          getAdminReservations(),
          getRooms(),
        ]);
        setReservations(resData as AdminReservation[]);
        setRooms(roomData);
      } catch (err: any) {
        setError(err.message || "Failed to load data.");
      } finally { setLoading(false); }
    })();
  }, []);

  const filteredReservations = useMemo(() => {
    return reservations.filter((res) => {
      if (statusFilter !== "all" && res.status !== statusFilter.toUpperCase()) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const name = joinName((res as any).firstName, (res as any).lastName).toLowerCase();
        const email = ((res as any).contactEmail || res.user?.email || "").toLowerCase();
        const phone = ((res as any).phone || "").toLowerCase();
        const id = String(res.id);
        if (!name.includes(term) && !email.includes(term) && !phone.includes(term) && !id.includes(term)) return false;
      }
      return true;
    });
  }, [reservations, statusFilter, searchTerm]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: reservations.length };
    reservations.forEach(r => { c[r.status] = (c[r.status] || 0) + 1; });
    return c;
  }, [reservations]);

  const handleApproveClick = (id: number) => {
    setApproveModalId(id);
    setSelectedRoomId(undefined);
  };

  const handleApproveConfirm = async () => {
    if (!approveModalId) return;
    try {
      setActionLoadingId(approveModalId);
      setError(null);
      const updated = await approveReservation(approveModalId, selectedRoomId);
      setReservations(prev => prev.map(r => r.id === approveModalId ? { ...r, ...updated } as AdminReservation : r));
      setApproveModalId(null);
    } catch (err: any) {
      setError(err.message || "Failed to approve.");
    } finally { setActionLoadingId(null); }
  };

  const handleReject = async (id: number) => {
    const reason = window.prompt(t("reservations.rejectReasonPrompt", "Enter rejection reason (optional):")) || undefined;
    try {
      setActionLoadingId(id);
      setError(null);
      const updated = await rejectReservation(id, reason);
      setReservations(prev => prev.map(r => r.id === id ? { ...r, ...updated } as AdminReservation : r));
    } catch (err: any) {
      setError(err.message || "Failed to reject.");
    } finally { setActionLoadingId(null); }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
        {cfg.label}
      </span>
    );
  };

  const PaymentBadge = ({ status }: { status: string }) => {
    const cfg = PAYMENT_CONFIG[status] || PAYMENT_CONFIG.NONE;
    if (status === "NONE") return <span className="text-[10px] text-gray-400">—</span>;
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>;
  };

  const filterTabs = [
    { key: "all", label: "All" },
    { key: "PENDING", label: "Pending" },
    { key: "APPROVED", label: "Approved" },
    { key: "REJECTED", label: "Rejected" },
    { key: "CANCELLED", label: "Cancelled" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">{t("pages.reservations.title", "Reservations")}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{reservations.length} total reservations</p>
        </div>
      </div>

      {/* Filter tabs + Search */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1 flex-shrink-0">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === tab.key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                {counts[tab.key === "all" ? "all" : tab.key] > 0 && (
                  <span className={`ml-1.5 text-[10px] ${statusFilter === tab.key ? "text-blue-600" : "text-gray-400"}`}>
                    {counts[tab.key === "all" ? "all" : tab.key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1">
            <div className="flex items-center h-9 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-300 transition-all">
              <div className="flex items-center justify-center w-9 h-9 flex-shrink-0">
                <Search className="h-3.5 w-3.5 text-gray-400" />
              </div>
              <input type="text" placeholder="Search by name, email, phone, or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 h-full bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none pr-3" />
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700"><X className="h-3.5 w-3.5" /></button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">{t("reservations.empty", "No reservations found.")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {["ID", "Guest", "Type", "Check-in", "Check-out", "Status", "Payment", "Room", "Actions"].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider first:pl-6 last:pr-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((res) => {
                  const name = joinName((res as any).firstName, (res as any).lastName);
                  const email = safe((res as any).contactEmail || res.user?.email);
                  const accom = ACCOM_CONFIG[res.accommodationType] || ACCOM_CONFIG.PERSONAL;
                  const checkInDisplay = formatDateOnly(res.checkIn);
                  const checkInTime = (res as any).checkInTime;
                  const ps = (res as any).paymentStatus || "NONE";

                  return (
                    <tr key={res.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors group">
                      <td className="py-3.5 pl-6 pr-4 text-xs font-mono text-gray-500">{formatId(res.id)}</td>
                      <td className="py-3.5 px-4">
                        <p className="text-[13px] font-medium text-gray-800 leading-tight">{name}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{email}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${accom.bg} ${accom.text}`}>{accom.label}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-xs text-gray-700">{checkInDisplay}</p>
                        {checkInTime && <p className="text-[10px] text-gray-400">{checkInTime}</p>}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-700">{formatDateOnly(res.checkOut)}</td>
                      <td className="py-3.5 px-4"><StatusBadge status={res.status} /></td>
                      <td className="py-3.5 px-4"><PaymentBadge status={ps} /></td>
                      <td className="py-3.5 px-4">
                        {res.room ? (
                          <span className="text-xs font-medium text-gray-700 bg-gray-50 px-2 py-0.5 rounded">{res.room.name}</span>
                        ) : (
                          <span className="text-[10px] text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 pr-6 px-4">
                        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          {res.status === "PENDING" && (
                            <>
                              <button
                                className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-emerald-600 transition-colors disabled:opacity-40"
                                title="Approve"
                                onClick={() => handleApproveClick(res.id)}
                                disabled={actionLoadingId === res.id}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                              </button>
                              <button
                                className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 transition-colors disabled:opacity-40"
                                title="Reject"
                                onClick={() => handleReject(res.id)}
                                disabled={actionLoadingId === res.id}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
                            title="View Details"
                            onClick={() => setSelected(res)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {/* Footer count */}
        {!loading && filteredReservations.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-50 text-[11px] text-gray-400">
            Showing {filteredReservations.length} of {reservations.length} reservations
          </div>
        )}
      </div>

      {/* ═══ APPROVE MODAL (with room assignment) ═══ */}
      {approveModalId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setApproveModalId(null)}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()} style={{ animation: "adminFadeIn 0.2s ease-out" }}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Approve Reservation {formatId(approveModalId)}</h3>
              <p className="text-xs text-gray-500 mt-0.5">Optionally assign a room before approving.</p>
            </div>
            <div className="px-6 py-5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Assign Room (Optional)</label>
              <select
                value={selectedRoomId ?? ""}
                onChange={e => setSelectedRoomId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 bg-gray-50"
              >
                <option value="">No room assignment (assign later)</option>
                {rooms
                  .filter(r => r.status === "AVAILABLE")
                  .map(r => (
                    <option key={r.id} value={r.id}>
                      Room {r.name} — {r.type} ({r.capacity} guest{r.capacity > 1 ? "s" : ""})
                    </option>
                  ))}
              </select>
              <p className="text-[10px] text-gray-400 mt-2">
                Only available rooms are shown. The system will check for double-booking conflicts.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setApproveModalId(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveConfirm}
                disabled={actionLoadingId === approveModalId}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                {actionLoadingId === approveModalId ? "Approving..." : "Approve Reservation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DETAIL MODAL ═══ */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()} style={{ animation: "adminFadeIn 0.2s ease-out" }}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-mono text-gray-400">{formatId(selected.id)}</span>
                  <StatusBadge status={selected.status} />
                  <PaymentBadge status={(selected as any).paymentStatus || "NONE"} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {joinName((selected as any).firstName, (selected as any).lastName)}
                </h3>
              </div>
              <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors" onClick={() => setSelected(null)}>
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Guest Info */}
                <div>
                  <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Guest Information</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-sm text-gray-700"><User className="h-3.5 w-3.5 text-gray-400" />{joinName((selected as any).firstName, (selected as any).lastName)}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-700"><Mail className="h-3.5 w-3.5 text-gray-400" />{safe((selected as any).contactEmail)}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-700"><Phone className="h-3.5 w-3.5 text-gray-400" />{safe((selected as any).phone)}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-700"><Users className="h-3.5 w-3.5 text-gray-400" />{selected.guests} guest{selected.guests > 1 ? "s" : ""}</div>
                  </div>
                </div>

                {/* Stay Details */}
                <div>
                  <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Stay Details</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-sm text-gray-700"><Calendar className="h-3.5 w-3.5 text-gray-400" />{formatDateOnly(selected.checkIn)} → {formatDateOnly(selected.checkOut)}</div>
                    {(selected as any).checkInTime && <div className="flex items-center gap-2 text-sm text-gray-700"><Clock className="h-3.5 w-3.5 text-gray-400" />Check-in: {(selected as any).checkInTime}</div>}
                    {selected.room && <div className="flex items-center gap-2 text-sm text-gray-700"><MapPin className="h-3.5 w-3.5 text-gray-400" />Room {selected.room.name} ({selected.room.type})</div>}
                    <div className="flex items-center gap-2 text-sm text-gray-700"><Hash className="h-3.5 w-3.5 text-gray-400" />{selected.accommodationType} / {selected.invoiceType}</div>
                  </div>
                </div>

                {/* Billing & Event */}
                <div>
                  <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Billing & Event</h4>
                  <div className="space-y-2.5">
                    {(selected as any).eventType && <div className="flex items-center gap-2 text-sm text-gray-700"><FileText className="h-3.5 w-3.5 text-gray-400" />Event: {(selected as any).eventType}</div>}
                    {selected.eventCode && <div className="flex items-center gap-2 text-sm text-gray-700"><Hash className="h-3.5 w-3.5 text-gray-400" />Code: {selected.eventCode}</div>}
                    {(selected as any).freeAccommodation && <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium"><CheckCircle className="h-3.5 w-3.5" />Free Accommodation</div>}
                    {selected.invoiceType === "INDIVIDUAL" && (selected as any).nationalId && (
                      <div className="flex items-center gap-2 text-sm text-gray-700"><Hash className="h-3.5 w-3.5 text-gray-400" />TC: {(selected as any).nationalId}</div>
                    )}
                    {selected.invoiceType === "CORPORATE" && (selected as any).taxNumber && (
                      <div className="flex items-center gap-2 text-sm text-gray-700"><Hash className="h-3.5 w-3.5 text-gray-400" />Tax: {(selected as any).taxNumber}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional guests */}
              {Array.isArray((selected as any).guestList) && (selected as any).guestList.length > 0 && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Additional Guests</h4>
                  <div className="flex flex-wrap gap-2">
                    {(selected as any).guestList.map((g: any, idx: number) => (
                      <span key={idx} className="text-xs bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg text-gray-700">
                        {safe(g?.firstName)} {safe(g?.lastName)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Note */}
              {(selected as any).note && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Note</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 whitespace-pre-wrap">{(selected as any).note}</p>
                </div>
              )}

              {/* Created at */}
              <p className="text-[10px] text-gray-400 mt-4">Created: {selected.createdAt?.slice(0, 10)}</p>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2 flex-shrink-0">
              {selected.status === "PENDING" && (
                <>
                  <button
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors flex items-center gap-2"
                    onClick={() => { setSelected(null); handleApproveClick(selected.id); }}
                  >
                    <CheckCircle className="h-4 w-4" /> Approve
                  </button>
                  <button
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors flex items-center gap-2"
                    onClick={() => { const id = selected.id; setSelected(null); handleReject(id); }}
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                </>
              )}
              <button
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}