import { useEffect, useState, useCallback } from "react";
import {
  X, Users, BedDouble, Wifi, ChevronRight, ChevronLeft,
  Calendar, LayoutGrid, Map as MapIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

type RoomAvailability = {
  id: number;
  name: string;
  type: string;
  price: number;
  capacity: number;
  amenities: string;
  baseStatus: string;
  status: string;
  reservation?: {
    id: number;
    guestName: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    paymentStatus: string;
  } | null;
};

type AvailabilityResponse = {
  rooms: RoomAvailability[];
  counts: { available: number; occupied: number; maintenance: number; reserved: number; total: number };
  date: string;
};

type CellDef = [number, number, number, number, number];

const FLOOR_LAYOUT: CellDef[] = [
  [234, 2, 0, 2, 2], [232, 4, 0, 2, 2], [230, 6, 0, 2, 2],
  [224, 12, 0, 2, 2], [222, 14, 0, 2, 2], [220, 16, 0, 2, 2],
  [233, 3, 3, 2, 2], [231, 5, 3, 2, 2], [229, 7, 3, 2, 2], [228, 9, 3, 2, 2],
  [237, 11, 3, 2, 2], [236, 13, 3, 2, 2], [225, 15, 3, 2, 2], [223, 17, 3, 2, 2],
  [221, 19, 3, 2, 2], [219, 21, 3, 2, 2],
  [235, 0, 3, 2, 2], [226, 0, 5, 2, 2], [238, 0, 7, 2, 2], [240, 0, 9, 2, 2],
  [242, 0, 11, 2, 3], [244, 0, 14, 2, 2], [246, 0, 16, 2, 2],
  [248, 0, 18, 2, 2], [250, 0, 20, 2, 2],
  [227, 3, 6, 2, 2], [239, 3, 8, 2, 2], [241, 3, 10, 2, 2], [243, 3, 12, 2, 2],
  [245, 3, 14, 2, 2], [247, 3, 16, 2, 2], [249, 3, 18, 2, 2], [251, 3, 20, 2, 2],
  [217, 21, 5, 2, 2], [216, 21, 7, 2, 2], [214, 21, 9, 2, 2], [212, 21, 11, 2, 2],
  [211, 21, 13, 2, 2], [209, 21, 15, 2, 2], [207, 21, 17, 2, 2], [205, 21, 19, 2, 2],
  [203, 21, 21, 2, 2], [201, 21, 23, 2, 2],
  [215, 24, 6, 2, 2], [213, 24, 8, 2, 2], [210, 24, 10, 2, 3],
  [208, 24, 13, 2, 2], [206, 24, 15, 2, 2], [204, 24, 17, 2, 2],
];

const STATUS_CONFIG = {
  AVAILABLE:   { label: "Available",   bg: "#ecfdf5", bgHover: "#d1fae5", border: "#86efac", text: "#15803d", dot: "#22c55e" },
  OCCUPIED:    { label: "Occupied",    bg: "#fef2f2", bgHover: "#fee2e2", border: "#fca5a5", text: "#b91c1c", dot: "#ef4444" },
  MAINTENANCE: { label: "Maintenance", bg: "#fffbeb", bgHover: "#fef3c7", border: "#fcd34d", text: "#a16207", dot: "#f59e0b" },
  RESERVED:    { label: "Reserved",    bg: "#eff6ff", bgHover: "#dbeafe", border: "#93c5fd", text: "#1d4ed8", dot: "#3b82f6" },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;
type ViewMode = "floorplan" | "grid";

const CELL = 28;
const W = 26 * CELL;
const H = 26 * CELL;

export function RoomsPage() {
  const { t } = useTranslation("admin");
  const [rooms, setRooms] = useState<RoomAvailability[]>([]);
  const [counts, setCounts] = useState({ available: 0, occupied: 0, maintenance: 0, reserved: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("floorplan");
  const [selectedRoom, setSelectedRoom] = useState<RoomAvailability | null>(null);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  const loadAvailability = useCallback(async (date: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`http://localhost:3000/rooms/availability?date=${date}`);
      if (!res.ok) throw new Error("Failed to load room availability");
      const data: AvailabilityResponse = await res.json();
      setRooms(data.rooms);
      setCounts(data.counts);
    } catch (err: any) {
      setError(err.message);
      try {
        const res = await fetch("http://localhost:3000/rooms");
        if (res.ok) {
          const d = await res.json();
          setRooms(d.map((r: any) => ({ ...r, baseStatus: r.status, reservation: null })));
        }
      } catch {}
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAvailability(selectedDate); }, [selectedDate, loadAvailability]);

  const roomMap = new Map(rooms.map(r => [r.name, r]));
  const isToday = selectedDate === new Date().toISOString().slice(0, 10);

  const goDay = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const fmtDate = (s: string) =>
    new Date(s + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
    });

  const closeDrawer = useCallback(() => setSelectedRoom(null), []);

  const renderFloorPlan = () => (
    <div className="flex gap-4">
      <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6 overflow-auto">
        <svg viewBox={`-12 -12 ${W + 24} ${H + 24}`} className="w-full block mx-auto" style={{ maxWidth: 780 }}>
          <rect x={-6} y={-6} width={W + 12} height={H + 12} rx={10}
            fill="none" stroke="#e2e8f0" strokeWidth={1.2} strokeDasharray="8 5" />
          <rect x={6 * CELL} y={7 * CELL} width={14 * CELL} height={12 * CELL}
            rx={8} fill="#f8fafc" stroke="#e5e7eb" strokeWidth={0.8} />
          <text x={13 * CELL} y={12.6 * CELL} textAnchor="middle" fontSize={10}
            fill="#94a3b8" fontWeight={500} letterSpacing={3}>AVLU</text>
          <text x={13 * CELL} y={13.8 * CELL} textAnchor="middle" fontSize={8}
            fill="#cbd5e1" letterSpacing={1}>COURTYARD</text>
          <line x1={2 * CELL} y1={2.5 * CELL} x2={23 * CELL} y2={2.5 * CELL}
            stroke="#f1f5f9" strokeWidth={CELL * 0.6} />
          <line x1={2.5 * CELL} y1={3 * CELL} x2={2.5 * CELL} y2={22 * CELL}
            stroke="#f1f5f9" strokeWidth={CELL * 0.6} />
          <line x1={23.5 * CELL} y1={3 * CELL} x2={23.5 * CELL} y2={25 * CELL}
            stroke="#f1f5f9" strokeWidth={CELL * 0.6} />
          <text x={13 * CELL} y={2.7 * CELL} textAnchor="middle" fontSize={7}
            fill="#cbd5e1" letterSpacing={4} fontWeight={500}>KORİDOR</text>

          {FLOOR_LAYOUT.map(([num, col, row, w, h]) => {
            const room = roomMap.get(String(num));
            if (!room) return null;
            const st = room.status as StatusKey;
            const cfg = STATUS_CONFIG[st] || STATUS_CONFIG.AVAILABLE;
            const hov = hoveredRoom === String(num);
            const sel = selectedRoom?.name === String(num);
            const act = hov || sel;
            const x = col * CELL, y = row * CELL;
            const rw = w * CELL - 3, rh = h * CELL - 3;
            const dbl = room.type === "DOUBLE";
            return (
              <g key={num} style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredRoom(String(num))}
                onMouseLeave={() => setHoveredRoom(null)}
                onClick={() => setSelectedRoom(room)}>
                {act && <rect x={x + 3} y={y + 4} width={rw} height={rh} rx={5} fill="rgba(0,0,0,0.06)" />}
                <rect x={x + 1.5} y={y + 1.5} width={rw} height={rh} rx={5}
                  fill={act ? cfg.bgHover : cfg.bg}
                  stroke={act ? cfg.text : cfg.border}
                  strokeWidth={sel ? 2 : act ? 1.5 : 0.8}
                  style={{ transition: "all 0.15s ease" }} />
                <text x={x + 1.5 + rw / 2} y={y + 1.5 + rh / 2 + (dbl ? -2 : 1)}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={rw < 52 ? 10 : 11.5} fontWeight={act ? 700 : 600}
                  fill={cfg.text} style={{ transition: "all 0.12s", pointerEvents: "none" }}>
                  {num}
                </text>
                <circle cx={x + rw - 4} cy={y + 8} r={3} fill={cfg.dot} opacity={act ? 1 : 0.7} />
                {dbl && (
                  <text x={x + 1.5 + rw / 2} y={y + rh - 5} textAnchor="middle"
                    fontSize={7} fill={cfg.text} fontWeight={500} opacity={0.6}
                    style={{ pointerEvents: "none" }}>DOUBLE</text>
                )}
                {room.reservation && act && (
                  <foreignObject x={x - 20} y={y + rh + 4} width={rw + 40} height={30}>
                    <div style={{
                      background: "rgba(0,0,0,0.85)", color: "#fff", fontSize: 9,
                      padding: "3px 6px", borderRadius: 4, textAlign: "center", whiteSpace: "nowrap",
                    }}>
                      {room.reservation.guestName} · #{room.reservation.id}
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          })}

          <text x={W / 2} y={H + 8} textAnchor="middle" fontSize={9}
            fill="#94a3b8" fontWeight={600} letterSpacing={2}>
            KAT 2 — EDU EĞİTİM OTELİ
          </text>
        </svg>
      </div>

      <div className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ width: selectedRoom ? 320 : 0, minWidth: selectedRoom ? 320 : 0 }}>
        {selectedRoom && <RoomDrawer room={selectedRoom} date={selectedDate} onClose={closeDrawer} />}
      </div>
    </div>
  );

  const renderGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {rooms.map(room => {
        const cfg = STATUS_CONFIG[room.status as StatusKey] || STATUS_CONFIG.AVAILABLE;
        return (
          <div key={room.id}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all cursor-pointer"
            onClick={() => setSelectedRoom(room)}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-[15px] font-semibold text-gray-900">Room {room.name}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{room.type === "DOUBLE" ? "Double" : "Single"}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                {cfg.label}
              </span>
            </div>
            <div className="space-y-1.5 mb-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Capacity</span>
                <span className="text-gray-800">{room.capacity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Price</span>
                <span className="text-gray-800">&#8378;{room.price}/night</span>
              </div>
            </div>
            {room.reservation && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-2.5 text-xs">
                <p className="font-semibold text-red-700">{room.reservation.guestName}</p>
                <p className="text-red-500 mt-0.5">#{room.reservation.id}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
          {t("pages.rooms.title", "Room Management")}
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">{counts.total} rooms · {fmtDate(selectedDate)}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Date nav */}
        <div className="flex items-center gap-2">
          <button onClick={() => goDay(-1)}
            className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center">
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 h-9">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm font-medium text-gray-800 outline-none w-32" />
          </div>
          <button onClick={() => goDay(1)}
            className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center">
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
          {!isToday && (
            <button onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
              className="px-3 h-8 rounded-lg bg-[#003366] text-white text-xs font-semibold hover:bg-[#002244]">
              Today
            </button>
          )}
        </div>

        {/* Status legend */}
        <div className="flex flex-wrap items-center gap-2">
          {(["AVAILABLE", "OCCUPIED", "MAINTENANCE", "RESERVED"] as const).map(s => {
            const cfg = STATUS_CONFIG[s];
            const c = counts[s.toLowerCase() as keyof typeof counts] ?? 0;
            return (
              <div key={s} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border"
                style={{ background: cfg.bg, borderColor: cfg.border }}>
                <span className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
                <span className="text-[11px] font-semibold" style={{ color: cfg.text }}>{cfg.label}</span>
                <span className="text-[11px] font-bold" style={{ color: cfg.text }}>{c}</span>
              </div>
            );
          })}
        </div>

        {/* View toggle */}
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button onClick={() => setViewMode("floorplan")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === "floorplan" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            <MapIcon className="h-3.5 w-3.5" /> Floor Plan
          </button>
          <button onClick={() => setViewMode("grid")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            <LayoutGrid className="h-3.5 w-3.5" /> Card View
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <BedDouble className="h-10 w-10 mb-3 text-gray-300" />
          <p className="text-sm">No rooms found.</p>
        </div>
      ) : viewMode === "floorplan" ? renderFloorPlan() : renderGrid()}
    </div>
  );
}

function RoomDrawer({ room, date, onClose }: { room: RoomAvailability; date: string; onClose: () => void }) {
  const st = room.status as StatusKey;
  const cfg = STATUS_CONFIG[st] || STATUS_CONFIG.AVAILABLE;
  const [newStatus, setNewStatus] = useState(room.baseStatus);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    try {
      setSaving(true);
      const r = await fetch(`http://localhost:3000/rooms/${room.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (r.ok) window.location.reload();
      else { const d = await r.json(); alert(d.error || "Failed"); }
    } catch { alert("Failed to update status."); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg h-full flex flex-col overflow-hidden"
      style={{ animation: "adminFadeIn 0.2s ease-out" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Room {room.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">Kat 2 · {date}</p>
        </div>
        <button onClick={onClose}
          className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center">
          <X className="h-3.5 w-3.5 text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-auto px-5 py-4 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border"
          style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.text }}>
          <span className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
          {cfg.label}
        </div>

        <div>
          {[
            { icon: <BedDouble className="h-4 w-4" />, l: "Type",      v: room.type === "DOUBLE" ? "Double Room" : "Single Room" },
            { icon: <Users className="h-4 w-4" />,    l: "Capacity",  v: `${room.capacity} guest${room.capacity > 1 ? "s" : ""}` },
            { icon: <span className="text-sm font-medium">&#8378;</span>, l: "Price", v: `\u20ba${room.price}/night` },
            { icon: <Wifi className="h-4 w-4" />,     l: "Amenities", v: room.amenities },
          ].map(({ icon, l, v }) => (
            <div key={l} className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2 text-gray-400">{icon}<span className="text-xs">{l}</span></div>
              <span className="text-xs font-medium text-gray-700 text-right max-w-[160px]">{v}</span>
            </div>
          ))}
        </div>

        {room.reservation && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3.5">
            <p className="text-xs font-semibold text-red-700 mb-1">Currently Occupied</p>
            <p className="text-xs text-red-600">{room.reservation.guestName}</p>
            <p className="text-[10px] text-red-500 mt-1">
              #{room.reservation.id} · {new Date(room.reservation.checkIn).toLocaleDateString("en-GB")} →{" "}
              {new Date(room.reservation.checkOut).toLocaleDateString("en-GB")} ·{" "}
              {room.reservation.guests} guest{room.reservation.guests > 1 ? "s" : ""}
            </p>
          </div>
        )}
        {room.status === "MAINTENANCE" && !room.reservation && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
            <p className="text-xs text-amber-600 font-medium">Under Maintenance</p>
          </div>
        )}
        {room.status === "RESERVED" && !room.reservation && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-xs text-blue-600 font-medium">Reserved for Special Guests</p>
            <p className="text-[10px] text-blue-500 mt-0.5">Permanently reserved.</p>
          </div>
        )}

        <div className="pt-2">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Change Base Status</p>
          <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
            className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="AVAILABLE">Available</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="RESERVED">Reserved (Special Guests)</option>
          </select>
          <button onClick={save} disabled={saving || newStatus === room.baseStatus}
            className="mt-2 w-full h-9 rounded-xl bg-[#003366] text-white text-xs font-semibold hover:bg-[#002244] disabled:opacity-40 transition-all">
            {saving ? "Saving..." : "Update Status"}
          </button>
        </div>
      </div>
    </div>
  );
}
