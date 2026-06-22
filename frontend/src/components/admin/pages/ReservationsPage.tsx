// src/components/admin/pages/ReservationsPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  CheckCircle,
  XCircle,
  Eye,
  X,
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
  CalendarDays,
  Shield,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  getAdminReservations,
  approveReservation,
  rejectReservation,
  assignRoom,
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

export function ReservationsPage() {
  const { t } = useTranslation("admin");

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminReservation | null>(null);

  // Approve modal with price + admin note
  const [approveModalId, setApproveModalId] = useState<number | null>(null);
  const [priceInput, setPriceInput] = useState<string>("");
  const [approveAdminNote, setApproveAdminNote] = useState<string>("");

  // Admin note input for the assignment modal
  const [assignAdminNote, setAssignAdminNote] = useState<string>("");

  // Room assignment modal (multi-select)
  const [assignModalId, setAssignModalId] = useState<number | null>(null);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([]);

  // Page-level rooms list for resolving roomIds -> names in table/detail view
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  useEffect(() => {
    getRooms().then(setAllRooms).catch(() => setAllRooms([]));
  }, []);
  const roomNameById = useMemo(() => {
    const m = new Map<number, string>();
    allRooms.forEach(r => m.set(r.id, r.name));
    return m;
  }, [allRooms]);
  const resolveRoomNames = (res: AdminReservation): string[] => {
    const ids = Array.isArray((res as any).roomIds) && (res as any).roomIds.length > 0
      ? (res as any).roomIds as number[]
      : (res.roomId ? [res.roomId] : []);
    return ids.map(id => roomNameById.get(id) || `#${id}`);
  };

  const assignReservation = useMemo(
    () => reservations.find((r) => r.id === assignModalId) || null,
    [assignModalId, reservations]
  );
  const selectedCapacity = useMemo(
    () =>
      availableRooms
        .filter((r) => selectedRoomIds.includes(r.id))
        .reduce((sum, r) => sum + (r.capacity || 1), 0),
    [availableRooms, selectedRoomIds]
  );

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const resData = await getAdminReservations();
        setReservations(resData as AdminReservation[]);
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
    setPriceInput("");
    setApproveAdminNote("");
  };

  const handleApproveConfirm = async () => {
    if (!approveModalId) return;
    const parsedPrice = parseFloat(priceInput.trim());
    if (!priceInput.trim() || isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error(t("reservations.approveModal.priceRequired", { defaultValue: "Please enter a valid price greater than 0." }));
      return;
    }
    try {
      setActionLoadingId(approveModalId);
      setError(null);
      const updated = await approveReservation(approveModalId, parsedPrice, approveAdminNote);
      setReservations(prev => prev.map(r => r.id === approveModalId ? { ...r, ...updated } as AdminReservation : r));
      setApproveModalId(null);
      toast.success(t("reservations.toasts.approved", { id: `#${approveModalId}` }));
    } catch (err: any) {
      toast.error(err.message || "Failed to approve.");
      setError(err.message || "Failed to approve.");
    } finally { setActionLoadingId(null); }
  };

  const handleReject = async (id: number) => {
    const reason = window.prompt(t("reservations.rejectReasonPrompt")) || undefined;
    try {
      setActionLoadingId(id);
      setError(null);
      const updated = await rejectReservation(id, reason);
      setReservations(prev => prev.map(r => r.id === id ? { ...r, ...updated } as AdminReservation : r));
      toast.success(t("reservations.toasts.rejected", { id: `#${id}` }));
    } catch (err: any) {
      toast.error(err.message || "Failed to reject.");
      setError(err.message || "Failed to reject.");
    } finally { setActionLoadingId(null); }
  };

  const handleAssignClick = async (id: number) => {
    setAssignModalId(id);
    setSelectedRoomIds([]);
    setAssignAdminNote("");
    setRoomsLoading(true);
    try {
      const all = await getRooms();
      // Filter to rooms that aren't in maintenance
      setAvailableRooms(all.filter(r => r.status !== "MAINTENANCE"));
    } catch { setAvailableRooms([]); }
    finally { setRoomsLoading(false); }
  };

  const toggleRoomSelection = (roomId: number) => {
    setSelectedRoomIds(prev =>
      prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
    );
  };

  const closeAssignModal = () => {
    setAssignModalId(null);
    setSelectedRoomIds([]);
    setAssignAdminNote("");
  };

  const handleAssignConfirm = async () => {
    if (!assignModalId || selectedRoomIds.length === 0) return;
    try {
      setActionLoadingId(assignModalId);
      const updated = await assignRoom(assignModalId, selectedRoomIds, assignAdminNote);
      setReservations(prev => prev.map(r => r.id === assignModalId ? { ...r, ...updated } as AdminReservation : r));
      const assignedId = assignModalId;
      closeAssignModal();
      toast.success(t("reservations.toasts.roomAssigned", { id: `#${assignedId}`, defaultValue: `Room(s) assigned to #${assignedId}` }));
    } catch (err: any) {
      toast.error(err.message || "Failed to assign room.");
    } finally { setActionLoadingId(null); }
  };

  const getStatusLabel = (status: string): string => {
    const map: Record<string, string> = {
      PENDING: t("reservations.statusLabels.pending"),
      APPROVED: t("reservations.statusLabels.approved"),
      REJECTED: t("reservations.statusLabels.rejected"),
      CANCELLED: t("reservations.statusLabels.canceled"),
      REFUND_REQUESTED: t("reservations.statusLabels.refundRequested"),
      REFUNDED: t("reservations.statusLabels.refunded"),
    };
    return map[status] || status;
  };

  const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string; border: string }> = {
    PENDING:          { bg: "bg-amber-50",   text: "text-amber-700",   dot: "#f59e0b", border: "border-amber-200" },
    APPROVED:         { bg: "bg-emerald-50", text: "text-emerald-700", dot: "#22c55e", border: "border-emerald-200" },
    REJECTED:         { bg: "bg-red-50",     text: "text-red-700",     dot: "#ef4444", border: "border-red-200" },
    CANCELLED:        { bg: "bg-gray-100",   text: "text-gray-600",    dot: "#9ca3af", border: "border-gray-200" },
    REFUND_REQUESTED: { bg: "bg-orange-50",  text: "text-orange-700",  dot: "#f97316", border: "border-orange-200" },
    REFUNDED:         { bg: "bg-indigo-50",  text: "text-indigo-700",  dot: "#6366f1", border: "border-indigo-200" },
  };

  const PAYMENT_STYLE: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    NONE:                 { label: "—",                              bg: "",              text: "text-gray-400", dot: "" },
    PENDING_VERIFICATION: { label: t("tables.paymentPending"),       bg: "bg-blue-50",    text: "text-blue-700", dot: "#3b82f6" },
    APPROVED:             { label: t("tables.paymentPaid"),          bg: "bg-emerald-50", text: "text-emerald-700", dot: "#22c55e" },
    REJECTED:             { label: t("tables.paymentRejected"),      bg: "bg-red-50",     text: "text-red-700",   dot: "#ef4444" },
  };

  const getEventTypeLabel = (type: string): string => {
    const map: Record<string, string> = {
      CONFERENCE: t("reservations.eventTypes.conference"),
      SEMINAR:    t("reservations.eventTypes.seminar"),
      WORKSHOP:   t("reservations.eventTypes.workshop"),
      TRAINING:   t("reservations.eventTypes.training"),
      MEETING:    t("reservations.eventTypes.meeting"),
      OTHER:      t("reservations.eventTypes.other"),
    };
    return map[(type || "").toUpperCase()] || type;
  };

  const getAccomLabel = (type: string): string => {
    const map: Record<string, string> = {
      PERSONAL: t("reservations.guestTypes.personal"),
      CORPORATE: t("reservations.guestTypes.corporate"),
      EDUCATION: t("reservations.guestTypes.education"),
    };
    return map[type] || type;
  };

  const ACCOM_STYLE: Record<string, { bg: string; text: string }> = {
    PERSONAL:  { bg: "bg-sky-50",    text: "text-sky-700" },
    CORPORATE: { bg: "bg-violet-50", text: "text-violet-700" },
    EDUCATION: { bg: "bg-teal-50",   text: "text-teal-700" },
  };

  const filterTabs = [
    { key: "all",       label: t("reservations.filterAll"),             color: "" },
    { key: "PENDING",   label: t("reservations.filters.pending"),       color: "#f59e0b" },
    { key: "APPROVED",  label: t("reservations.filters.approved"),      color: "#22c55e" },
    { key: "REJECTED",  label: t("reservations.filters.rejected"),      color: "#ef4444" },
    { key: "CANCELLED", label: t("reservations.filters.canceled"),      color: "#9ca3af" },
  ];

  const AVATAR_COLORS = [
    { from: "#3b82f6", to: "#1d4ed8" },
    { from: "#8b5cf6", to: "#6d28d9" },
    { from: "#10b981", to: "#047857" },
    { from: "#f59e0b", to: "#ea580c" },
    { from: "#f43f5e", to: "#be123c" },
    { from: "#14b8a6", to: "#0f766e" },
    { from: "#0ea5e9", to: "#0369a1" },
    { from: "#6366f1", to: "#4338ca" },
  ];

  const getInitials = (name: string) => {
    if (!name || name === "—") return "?";
    const parts = name.trim().split(" ");
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const style = STATUS_STYLE[status] || STATUS_STYLE.PENDING;
    const isPending = status === "PENDING";
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${style.bg} ${style.text} ${style.border}`}>
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isPending ? "animate-pulse" : ""}`} style={{ background: style.dot }} />
        {getStatusLabel(status)}
      </span>
    );
  };

  const PaymentBadge = ({ status }: { status: string }) => {
    const cfg = PAYMENT_STYLE[status] || PAYMENT_STYLE.NONE;
    if (status === "NONE") return <span className="text-[10px] text-gray-400">—</span>;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
        {cfg.label}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes resIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Header ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
            style={{ background: "linear-gradient(to bottom right, #003366, #0055aa)" }}
          >
            <CalendarDays className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t("pages.reservations.title")}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{t("reservations.totalCount", { count: reservations.length })}</p>
          </div>
        </div>
      </div>

      {/* ── Filter tabs + Search ─────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1 flex-shrink-0 flex-wrap">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center gap-1.5 ${
                  statusFilter === tab.key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.color && (
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: tab.color }} />
                )}
                {tab.label}
                {(counts[tab.key === "all" ? "all" : tab.key] ?? 0) > 0 && (
                  <span className={`text-[10px] font-bold ${statusFilter === tab.key ? "text-blue-600" : "text-gray-400"}`}>
                    {counts[tab.key === "all" ? "all" : tab.key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1">
            <div className="flex items-center h-10 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-300 transition-all">
              <div className="flex items-center justify-center w-10 h-10 flex-shrink-0">
                <Search className="h-3.5 w-3.5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t("reservations.searchByAll")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 h-full bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none pr-3"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="flex items-center justify-center w-8 h-8 mr-1 rounded-lg hover:bg-gray-200 transition-colors">
                  <X className="h-3.5 w-3.5 text-gray-400" />
                </button>
              )}
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

      {/* ── Table ────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-200 rounded w-32" />
                  <div className="h-2.5 bg-gray-100 rounded w-48" />
                </div>
                <div className="h-5 bg-gray-100 rounded-full w-16" />
                <div className="h-5 bg-gray-100 rounded-full w-16" />
                <div className="h-7 bg-gray-100 rounded-xl w-24" />
              </div>
            ))}
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="p-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <FileText className="h-7 w-7 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-500">{t("reservations.empty")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {[
                    t("tables.guestName"),
                    t("reservations.tableColResType"),
                    t("tables.checkIn"),
                    t("tables.checkOut"),
                    t("tables.status"),
                    t("tables.payment"),
                    t("tables.room"),
                    t("tables.actions"),
                  ].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest first:pl-6 last:pr-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((res) => {
                  const name = joinName((res as any).firstName, (res as any).lastName);
                  const email = safe((res as any).contactEmail || res.user?.email);
                  const accomStyle = ACCOM_STYLE[res.accommodationType] || ACCOM_STYLE.PERSONAL;
                  const accomLabel = getAccomLabel(res.accommodationType);
                  const checkInDisplay = formatDateOnly(res.checkIn);
                  const checkInTime = (res as any).checkInTime;
                  const ps = (res as any).paymentStatus || "NONE";
                  const initials = getInitials(name);
                  const avatarColor = AVATAR_COLORS[res.userId % AVATAR_COLORS.length];

                  return (
                    <tr key={res.id} className="border-b border-gray-50 last:border-b-0 hover:bg-blue-50/20 transition-colors duration-150 group">
                      <td className="py-3.5 pl-6 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                            style={{ background: `linear-gradient(135deg, ${avatarColor.from}, ${avatarColor.to})` }}>
                            <span className="text-[10px] font-bold text-white">{initials}</span>
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-gray-800 leading-tight">{name}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${accomStyle.bg} ${accomStyle.text}`}>{accomLabel}</span>
                        {(res as any).eventType && (
                          <span className="block mt-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 w-fit">
                            {getEventTypeLabel((res as any).eventType)}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-xs font-semibold text-gray-700">{checkInDisplay}</p>
                        {checkInTime && <p className="text-[10px] text-gray-400">{checkInTime}</p>}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-gray-700">{formatDateOnly(res.checkOut)}</td>
                      <td className="py-3.5 px-4"><StatusBadge status={res.status} /></td>
                      <td className="py-3.5 px-4"><PaymentBadge status={ps} /></td>
                      <td className="py-3.5 px-4">
                        {(() => {
                          const names = resolveRoomNames(res);
                          if (names.length === 0) return <span className="text-[10px] text-gray-400">—</span>;
                          if (names.length === 1) {
                            return (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg">
                                <Bed className="h-3 w-3 text-gray-400" />
                                {names[0]}
                              </span>
                            );
                          }
                          return (
                            <span
                              title={names.join(", ")}
                              className="inline-flex items-center gap-1 text-xs font-bold text-gray-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg"
                            >
                              <Bed className="h-3 w-3 text-blue-500" />
                              {names[0]} <span className="text-blue-600">+{names.length - 1}</span>
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-3.5 pr-6 px-4">
                        <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity duration-150">
                          {res.status === "PENDING" && (
                            <>
                              <button
                                className="h-7 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1 text-emerald-700 text-[10px] font-bold transition-all disabled:opacity-40"
                                title={t("common.approve")}
                                onClick={() => handleApproveClick(res.id)}
                                disabled={actionLoadingId === res.id}
                              >
                                <CheckCircle className="h-3 w-3" />
                                {t("common.approve")}
                              </button>
                              <button
                                className="h-7 px-2.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 flex items-center gap-1 text-red-700 text-[10px] font-bold transition-all disabled:opacity-40"
                                title={t("common.reject")}
                                onClick={() => handleReject(res.id)}
                                disabled={actionLoadingId === res.id}
                              >
                                <XCircle className="h-3 w-3" />
                                {t("common.reject")}
                              </button>
                            </>
                          )}
                          {res.status === "APPROVED" && !res.roomId && (
                            <button
                              className="h-7 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center gap-1 text-blue-700 text-[10px] font-bold transition-all disabled:opacity-40"
                              title={t("reservations.assignRoom", "Assign Room")}
                              onClick={() => handleAssignClick(res.id)}
                              disabled={actionLoadingId === res.id}
                            >
                              <Bed className="h-3 w-3" />
                              {t("reservations.assignRoom", "Assign Room")}
                            </button>
                          )}
                          <button
                            className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 transition-colors"
                            title={t("commonTable.view")}
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
          <div className="px-6 py-3 border-t border-gray-50 text-[11px] text-gray-400 font-medium">
            {t("reservations.showingCount", { shown: filteredReservations.length, total: reservations.length })}
          </div>
        )}
      </div>

      {/* ════ APPROVE MODAL (with price) ════ */}
      {approveModalId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setApproveModalId(null)}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()} style={{ animation: "resIn 0.2s ease-out" }}>
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">{t("reservations.approveModal.title", { id: formatId(approveModalId) })}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{t("reservations.approveModal.desc")}</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">{t("reservations.approveModal.priceLabel")}</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={t("reservations.approveModal.pricePlaceholder")}
                  value={priceInput}
                  onChange={e => setPriceInput(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 bg-gray-50 transition-all"
                />
                <p className="text-[10px] text-gray-400 mt-2">{t("reservations.approveModal.priceHint")}</p>
                {priceInput.trim() && (isNaN(parseFloat(priceInput)) || parseFloat(priceInput) <= 0) && (
                  <p className="text-[11px] text-red-500 font-semibold mt-1">
                    {t("reservations.approveModal.priceRequired", { defaultValue: "Enter a valid price greater than 0." })}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                  {t("reservations.approveModal.adminNoteLabel", { defaultValue: "Admin note (optional)" })}
                </label>
                <textarea
                  rows={3}
                  placeholder={t("reservations.approveModal.adminNotePlaceholder", { defaultValue: "Visible to the guest in the approval and confirmation emails." })}
                  value={approveAdminNote}
                  onChange={e => setApproveAdminNote(e.target.value)}
                  maxLength={500}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 bg-gray-50 transition-all resize-none"
                />
                <p className="text-[10px] text-gray-400 mt-1 text-right">{approveAdminNote.length} / 500</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-2">
              <button onClick={() => setApproveModalId(null)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-white transition-colors">
                {t("common.cancel")}
              </button>
              <button
                onClick={handleApproveConfirm}
                disabled={actionLoadingId === approveModalId || !priceInput.trim() || isNaN(parseFloat(priceInput)) || parseFloat(priceInput) <= 0}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-150"
              >
                <CheckCircle className="h-4 w-4" />
                {actionLoadingId === approveModalId ? t("reservations.approveModal.approving") : t("reservations.approveModal.approveBtn")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ DETAIL MODAL ════ */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()} style={{ animation: "resIn 0.2s ease-out" }}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${AVATAR_COLORS[selected.id % AVATAR_COLORS.length].from}, ${AVATAR_COLORS[selected.id % AVATAR_COLORS.length].to})` }}>
                  <span className="text-sm font-bold text-white">{getInitials(joinName((selected as any).firstName, (selected as any).lastName))}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-gray-400">{formatId(selected.id)}</span>
                    <StatusBadge status={selected.status} />
                    <PaymentBadge status={(selected as any).paymentStatus || "NONE"} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {joinName((selected as any).firstName, (selected as any).lastName)}
                  </h3>
                </div>
              </div>
              <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors" onClick={() => setSelected(null)}>
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Guest Info */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{t("reservations.detail.guestInfo")}</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-sm text-gray-700"><User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />{joinName((selected as any).firstName, (selected as any).lastName)}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-700"><Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />{safe((selected as any).contactEmail)}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-700"><Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />{safe((selected as any).phone)}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Users className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      {t(`reservations.detail.guest_${selected.guests === 1 ? "one" : "other"}`, { count: selected.guests })}
                    </div>
                  </div>
                </div>

                {/* Stay Details */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{t("reservations.detail.stayDetails")}</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-sm text-gray-700"><Calendar className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />{formatDateOnly(selected.checkIn)} → {formatDateOnly(selected.checkOut)}</div>
                    {(selected as any).checkInTime && <div className="flex items-center gap-2 text-sm text-gray-700"><Clock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />{t("reservations.detail.checkInLabel")}: {(selected as any).checkInTime}</div>}
                    {(() => {
                      const names = resolveRoomNames(selected);
                      if (names.length === 0) return null;
                      if (names.length === 1 && selected.room) {
                        return <div className="flex items-center gap-2 text-sm text-gray-700"><MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />{t("tables.room")} {selected.room.name} ({selected.room.type})</div>;
                      }
                      return (
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <span>{t("tables.room")}: {names.join(", ")}</span>
                        </div>
                      );
                    })()}
                    <div className="flex items-center gap-2 text-sm text-gray-700"><Hash className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />{getAccomLabel(selected.accommodationType)} / {selected.invoiceType === "INDIVIDUAL" ? t("reservations.invoiceTypes.individual") : t("reservations.invoiceTypes.corporate")}</div>
                  </div>
                </div>

                {/* Billing & Event */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{t("reservations.detail.billingEvent")}</h4>
                  <div className="space-y-2.5">
                    {(selected as any).eventType && <div className="flex items-center gap-2 text-sm text-gray-700"><FileText className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />{t("reservations.detail.eventLabel")}: {getEventTypeLabel((selected as any).eventType)}</div>}
                    {selected.eventCode && <div className="flex items-center gap-2 text-sm text-gray-700"><Hash className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />{t("reservations.detail.codeLabel")}: {selected.eventCode}</div>}
                    {(selected as any).freeAccommodation && <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium"><CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />{t("reservations.detail.freeAccommodation")}</div>}
                    {selected.invoiceType === "INDIVIDUAL" && (selected as any).nationalId && (
                      <div className="flex items-center gap-2 text-sm text-gray-700"><Hash className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />{t("reservations.detail.tcLabel")}: {(selected as any).nationalId}</div>
                    )}
                    {selected.invoiceType === "CORPORATE" && (selected as any).taxNumber && (
                      <div className="flex items-center gap-2 text-sm text-gray-700"><Hash className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />{t("reservations.detail.taxLabel")}: {(selected as any).taxNumber}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional guests */}
              {Array.isArray((selected as any).guestList) && (selected as any).guestList.length > 0 && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t("reservations.detail.additionalGuests")}</h4>
                  <div className="flex flex-wrap gap-2">
                    {(selected as any).guestList.map((g: any, idx: number) => (
                      <span key={idx} className="text-xs bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg text-gray-700 font-medium">
                        {safe(g?.firstName)} {safe(g?.lastName)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Identity documents (per-guest) */}
              {(() => {
                const docs = ((selected as any).identityDocuments || []) as Array<{
                  id: number; guestIndex: number; fileName: string; mimeType: string; sizeBytes: number; uploadedAt: string;
                }>;
                const legacy = (selected as any).identityDoc as string | null | undefined;
                if (docs.length === 0 && !legacy) return null;

                // Resolve guest name by index: 0 = primary; 1..N from guestList[i-1]
                const primaryName = joinName((selected as any).firstName, (selected as any).lastName);
                const gl: Array<{ firstName?: string; lastName?: string }> = Array.isArray((selected as any).guestList)
                  ? (selected as any).guestList
                  : [];
                const labelFor = (idx: number) => {
                  if (idx === 0) return primaryName !== "—" ? `Guest 1 — ${primaryName}` : "Guest 1";
                  const entry = gl[idx - 1];
                  const nm = entry ? joinName(entry.firstName, entry.lastName) : "—";
                  return nm !== "—" ? `Guest ${idx + 1} — ${nm}` : `Guest ${idx + 1}`;
                };

                const API_BASE = (import.meta as any).env?.VITE_API_URL || "/ehp/api";
                // /view-identity is mounted at the express root, alongside /reservations etc.
                // VITE_API_URL points at the express root in dev/prod, so the file URL is:
                const fileUrlFor = (fileName: string) => {
                  const token = sessionStorage.getItem("adminToken");
                  // The view route is admin-guarded via Authorization header. Use fetch + blob to download,
                  // since <a href> can't send an Authorization header.
                  return async () => {
                    try {
                      const res = await fetch(`${API_BASE.replace(/\/$/, "")}/view-identity/${encodeURIComponent(fileName)}`, {
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                      });
                      if (!res.ok) throw new Error("Failed to fetch document");
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      window.open(url, "_blank", "noopener,noreferrer");
                      setTimeout(() => URL.revokeObjectURL(url), 60_000);
                    } catch (e) {
                      toast.error("Failed to open document.");
                    }
                  };
                };

                return (
                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                      {t("reservations.detail.identityDocuments", { defaultValue: "Identity Documents" })}
                    </h4>

                    {docs.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {docs.map(d => (
                          <button
                            key={d.id}
                            onClick={fileUrlFor(d.fileName)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 transition-all text-left"
                          >
                            <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-semibold text-gray-800 truncate">{labelFor(d.guestIndex)}</p>
                              <p className="text-[10px] text-gray-400 truncate">{d.fileName}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {docs.length === 0 && legacy && (
                      <button
                        onClick={fileUrlFor(legacy)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-all text-left w-full sm:w-1/2"
                      >
                        <FileText className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-amber-800 truncate">
                            {t("reservations.detail.legacyIdentityDoc", { defaultValue: "Legacy ID document (single)" })}
                          </p>
                          <p className="text-[10px] text-amber-700/80 truncate">{legacy}</p>
                        </div>
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Guest note */}
              {(selected as any).note && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    {t("reservations.detail.guestNote", { defaultValue: "Guest's note" })}
                  </h4>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 whitespace-pre-wrap leading-relaxed">{(selected as any).note}</p>
                </div>
              )}

              {/* Admin note */}
              {(selected as any).adminNote && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <h4 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Shield className="h-3 w-3" />
                    {t("reservations.detail.adminNote", { defaultValue: "Admin note" })}
                  </h4>
                  <p className="text-sm text-gray-700 bg-blue-50/60 border border-blue-100 rounded-xl p-3 whitespace-pre-wrap leading-relaxed">
                    {(selected as any).adminNote}
                  </p>
                </div>
              )}

              <p className="text-[10px] text-gray-400 mt-4">{t("reservations.detail.created")}: {selected.createdAt?.slice(0, 10)}</p>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-2 flex-shrink-0">
              {selected.status === "PENDING" && (
                <>
                  <button
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-sm font-bold shadow-sm hover:shadow-md transition-all duration-150 flex items-center gap-2"
                    onClick={() => { setSelected(null); handleApproveClick(selected.id); }}
                  >
                    <CheckCircle className="h-4 w-4" /> {t("common.approve")}
                  </button>
                  <button
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-bold shadow-sm hover:shadow-md transition-all duration-150 flex items-center gap-2"
                    onClick={() => { const id = selected.id; setSelected(null); handleReject(id); }}
                  >
                    <XCircle className="h-4 w-4" /> {t("common.reject")}
                  </button>
                </>
              )}
              <button
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-white transition-colors"
                onClick={() => setSelected(null)}
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Room Assignment Modal (multi-select) ──────────────── */}
      {assignModalId !== null && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          onClick={closeAssignModal}
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/50 flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t("reservations.assignRoom", "Assign Room(s)")}</h3>
                {assignReservation && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t("reservations.assignModal.forReservation", { defaultValue: "For reservation" })} #{assignReservation.id} · {assignReservation.guests} {t("reservations.assignModal.guests", { defaultValue: "guest(s)" })} · {formatDateOnly(assignReservation.checkIn)} → {formatDateOnly(assignReservation.checkOut)}
                  </p>
                )}
              </div>
              <button onClick={closeAssignModal} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Selection summary */}
            {assignReservation && !roomsLoading && availableRooms.length > 0 && (
              <div className="px-6 py-3 bg-blue-50/40 border-b border-blue-100 flex items-center justify-between flex-shrink-0">
                <div className="text-xs">
                  <span className="font-semibold text-gray-700">
                    {selectedRoomIds.length} {t("reservations.assignModal.roomsSelected", { defaultValue: "room(s) selected" })}
                  </span>
                  <span className="text-gray-500 ml-2">
                    · {t("reservations.assignModal.capacity", { defaultValue: "Capacity" })}: {selectedCapacity} / {assignReservation.guests}
                  </span>
                </div>
                {selectedCapacity < assignReservation.guests && selectedRoomIds.length > 0 && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                    {t("reservations.assignModal.capacityShort", { defaultValue: "Under capacity" })}
                  </span>
                )}
                {selectedCapacity >= assignReservation.guests && selectedRoomIds.length > 0 && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                    {t("reservations.assignModal.capacityOk", { defaultValue: "OK" })}
                  </span>
                )}
              </div>
            )}

            <div className="p-6 overflow-y-auto flex-1">
              {roomsLoading ? (
                <p className="text-sm text-gray-500 text-center py-8">{t("common.loading", "Loading...")}</p>
              ) : availableRooms.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">{t("reservations.noAvailableRooms", "No available rooms found.")}</p>
              ) : (
                <div className="space-y-2">
                  {availableRooms.map(room => {
                    const isSelected = selectedRoomIds.includes(room.id);
                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => toggleRoomSelection(room.id)}
                        disabled={actionLoadingId === assignModalId}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left disabled:opacity-40 ${
                          isSelected
                            ? "border-blue-400 bg-blue-50 shadow-sm"
                            : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"
                          }`}
                        >
                          {isSelected && <CheckCircle className="h-3.5 w-3.5 text-white" />}
                        </span>
                        <Bed className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{room.name}</p>
                          <p className="text-[11px] text-gray-400">{room.type} · {t("reservations.capacity", "Capacity")}: {room.capacity}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Admin note input */}
            {!roomsLoading && availableRooms.length > 0 && (
              <div className="px-6 pb-4 flex-shrink-0">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  {t("reservations.assignModal.adminNoteLabel", { defaultValue: "Admin note (optional)" })}
                </label>
                <textarea
                  rows={2}
                  placeholder={t("reservations.assignModal.adminNotePlaceholder", { defaultValue: "Optional note for the guest, sent with the assignment email." })}
                  value={assignAdminNote}
                  onChange={e => setAssignAdminNote(e.target.value)}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 bg-gray-50 transition-all resize-none"
                />
                <p className="text-[10px] text-gray-400 mt-1 text-right">{assignAdminNote.length} / 500</p>
              </div>
            )}

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-2 flex-shrink-0">
              <button
                onClick={closeAssignModal}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-white transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleAssignConfirm}
                disabled={
                  actionLoadingId === assignModalId ||
                  selectedRoomIds.length === 0 ||
                  (assignReservation ? selectedCapacity < assignReservation.guests : false)
                }
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-150"
              >
                <Bed className="h-4 w-4" />
                {actionLoadingId === assignModalId
                  ? t("reservations.assignModal.assigning", { defaultValue: "Assigning..." })
                  : t("reservations.assignModal.confirmBtn", { defaultValue: "Assign Selected" })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
