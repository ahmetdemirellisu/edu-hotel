// src/components/admin/pages/RoomsPage.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  LayoutGrid, Map as MapIcon, X, Users, BedDouble, Wifi,
  ChevronRight, ChevronLeft, Calendar,
} from "lucide-react";
import { useTranslation } from "react-i18next";

/* ════════════════════════════════════════════════════════════
   Types
   ════════════════════════════════════════════════════════════ */
type RoomData = {
  id: number; name: string; type: string; price: number; capacity: number;
  amenities: string; baseStatus: string; status: string;
  reservation?: {
    id: number; guestName: string; checkIn: string; checkOut: string;
    guests: number; paymentStatus: string;
  } | null;
};

type Counts = { available: number; occupied: number; maintenance: number; reserved: number; total: number };

/* ════════════════════════════════════════════════════════════
   Floor plan layout — matches real Kat 2 evacuation plan

   The building is a U-shape:
   - TOP WING: rooms along the top (234-220 upper, 233-219 lower)
   - LEFT WING: rooms going down the left side (235-250 outer, 227-251 inner)
   - RIGHT WING: rooms going down the right side (217-201 inner, 215-204 outer)

   Grid: 30 cols x 28 rows, CELL = 26px
   Format: [roomNumber, col, row, colSpan, rowSpan]
   ════════════════════════════════════════════════════════════ */
type Cell = [number, number, number, number, number];

const LAYOUT: Cell[] = [
  // ═══ TOP WING — upper row (rooms face outward/up) ═══
  // Left group: 234, 232, 230 (230 is regular, NOT double)
  [234, 3, 0, 2, 2],
  [232, 5, 0, 2, 2],
  [230, 7, 0, 2, 2],
  // Gap for service area (2055)
  // Right group: 224, 222, 220
  [224, 14, 0, 2, 2],
  [222, 16, 0, 2, 2],
  [220, 18, 0, 2, 2],

  // ═══ TOP WING — lower row (rooms face inward/down, along corridor) ═══
  [233, 4, 3, 2, 2],
  [231, 6, 3, 2, 2],
  [229, 8, 3, 2, 2],
  [228, 10, 3, 2, 2],
  [237, 12, 3, 2, 2],
  [236, 14, 3, 2, 2],
  [225, 16, 3, 2, 2],
  [223, 18, 3, 2, 2],
  [221, 20, 3, 2, 2],
  [219, 22, 3, 2, 2],

  // ═══ LEFT WING — outer column (rooms face left/outward) ═══
  [235, 0, 3, 2, 2],
  [226, 0, 5, 2, 2],
  // gap for 2036/2035 service
  [238, 0, 8, 2, 2],
  [240, 0, 10, 2, 2],
  [242, 0, 12, 2, 3], // ★ DOUBLE room — taller
  [244, 0, 15, 2, 2],
  [246, 0, 17, 2, 2],
  [248, 0, 19, 2, 2],
  [250, 0, 21, 2, 2],

  // ═══ LEFT WING — inner column (rooms face right/inward) ═══
  [227, 3, 6, 2, 2],
  [239, 3, 9, 2, 2],
  [241, 3, 11, 2, 2],
  [243, 3, 13, 2, 2],
  [245, 3, 15, 2, 2],
  [247, 3, 17, 2, 2],
  [249, 3, 19, 2, 2],
  [251, 3, 21, 2, 2],

  // ═══ RIGHT WING — inner column (rooms face left/inward) ═══
  [217, 22, 5, 2, 2],
  [216, 22, 7, 2, 2],
  // gap for 2090 service
  [215, 22, 9, 2, 2],
  [213, 22, 11, 2, 2],
  [212, 22, 13, 2, 2],
  [211, 22, 15, 2, 2],
  [209, 22, 17, 2, 2],
  [207, 22, 19, 2, 2],
  [205, 22, 21, 2, 2],
  [203, 22, 23, 2, 2],
  [201, 22, 25, 2, 2],

  // ═══ RIGHT WING — outer column (rooms face right/outward) ═══
  [214, 25, 9, 2, 2],
  [210, 25, 11, 2, 3], // ★ DOUBLE room — taller
  [208, 25, 14, 2, 2],
  [206, 25, 16, 2, 2],
  [204, 25, 18, 2, 2],
];

/* ════════════════════════════════════════════════════════════
   Status config — 4 distinct visual styles
   ════════════════════════════════════════════════════════════ */
const STATUS = {
  AVAILABLE: {
    bg: "#f0fdf4", bgH: "#dcfce7", border: "#86efac",
    text: "#166534", dot: "#22c55e", pillBg: "bg-emerald-50", pillText: "text-emerald-700", pillBorder: "border-emerald-200",
  },
  OCCUPIED: {
    bg: "#fef2f2", bgH: "#fee2e2", border: "#fca5a5",
    text: "#991b1b", dot: "#ef4444", pillBg: "bg-red-50", pillText: "text-red-700", pillBorder: "border-red-200",
  },
  MAINTENANCE: {
    bg: "#fffbeb", bgH: "#fef3c7", border: "#fcd34d",
    text: "#92400e", dot: "#f59e0b", pillBg: "bg-amber-50", pillText: "text-amber-700", pillBorder: "border-amber-200",
  },
  RESERVED: {
    bg: "#eff6ff", bgH: "#dbeafe", border: "#93c5fd",
    text: "#1e40af", dot: "#3b82f6", pillBg: "bg-blue-50", pillText: "text-blue-700", pillBorder: "border-blue-200",
  },
} as const;

type StatusKey = keyof typeof STATUS;

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════ */
export function RoomsPage() {
  const { t, i18n } = useTranslation("admin");

  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [counts, setCounts] = useState<Counts>({ available: 0, occupied: 0, maintenance: 0, reserved: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"floor" | "grid">("floor");
  const [selected, setSelected] = useState<RoomData | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const statusLabel = (s: StatusKey) => {
    const map: Record<StatusKey, string> = {
      AVAILABLE: t("rooms.statusAvailable", "Available"),
      OCCUPIED: t("rooms.statusOccupied", "Occupied"),
      MAINTENANCE: t("rooms.statusMaintenance", "Maintenance"),
      RESERVED: t("rooms.statusReserved", "Reserved"),
    };
    return map[s] || s;
  };

  const load = useCallback(async (d: string) => {
    try {
      setLoading(true); setError(null);
      const res = await fetch(`/ehp/api/rooms/availability?date=${d}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setRooms(data.rooms); setCounts(data.counts);
    } catch {
      // Fallback
      try {
        const res = await fetch("/ehp/api/rooms");
        if (res.ok) {
          const arr = await res.json();
          setRooms(arr.map((r: any) => ({ ...r, baseStatus: r.status, reservation: null })));
          setCounts({ available: arr.length, occupied: 0, maintenance: 0, reserved: 0, total: arr.length });
        }
      } catch {}
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(date); }, [date, load]);

  const roomMap = new Map(rooms.map(r => [r.name, r]));
  const goDay = (n: number) => { const d = new Date(date); d.setDate(d.getDate() + n); setDate(d.toISOString().slice(0, 10)); };
  const isToday = date === new Date().toISOString().slice(0, 10);
  const locale = i18n.language === "tr" ? "tr-TR" : "en-GB";
  const fmtDate = (s: string) => new Date(s + "T12:00:00").toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric", year: "numeric" });

  /* ── SVG Floor Plan ─────────────────────── */
  const C = 26; // cell size
  const SVG_W = 28 * C;
  const SVG_H = 28 * C;

  const FloorPlan = () => (
    <div className="flex gap-0">
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-5 overflow-auto">
        <svg viewBox={`-10 -10 ${SVG_W + 20} ${SVG_H + 20}`} className="w-full mx-auto block" style={{ maxWidth: 800 }}>
          {/* Building outline */}
          <rect x={-4} y={-4} width={SVG_W + 8} height={SVG_H + 8} rx={12} fill="none" stroke="#e2e8f0" strokeWidth={1} strokeDasharray="6 4" />

          {/* Corridors */}
          <rect x={2.5 * C} y={2.2 * C} width={21 * C} height={C * 0.6} rx={3} fill="#f8fafc" />
          <rect x={2.2 * C} y={2.5 * C} width={C * 0.6} height={20.5 * C} rx={3} fill="#f8fafc" />
          <rect x={24 * C} y={4 * C} width={C * 0.6} height={22 * C} rx={3} fill="#f8fafc" />
          <text x={13 * C} y={2.65 * C} textAnchor="middle" fontSize={7} fill="#cbd5e1" letterSpacing={4} fontWeight={600}>KORİDOR</text>

          {/* Service area between top wing groups */}
          <rect x={9.5 * C} y={0} width={4 * C} height={2 * C} rx={4} fill="#f1f5f9" stroke="#e2e8f0" strokeWidth={0.5} />
          <text x={11.5 * C} y={C + 2} textAnchor="middle" fontSize={7} fill="#94a3b8" fontWeight={500}>2055</text>

          {/* Courtyard */}
          <rect x={6 * C} y={7 * C} width={15 * C} height={14 * C} rx={8} fill="#fafbfc" stroke="#e5e7eb" strokeWidth={0.7} />
          <text x={13.5 * C} y={13.5 * C} textAnchor="middle" fontSize={11} fill="#94a3b8" fontWeight={600} letterSpacing={4}>AVLU</text>
          <text x={13.5 * C} y={15 * C} textAnchor="middle" fontSize={8} fill="#cbd5e1" letterSpacing={2}>COURTYARD</text>

          {/* Teras labels */}
          {[
            [1 * C, -6, "TERAS"], [20 * C, -6, "TERAS"],
            [-8, 20 * C, "TERAS"], [SVG_W - 10, 14 * C, "TERAS"],
          ].map(([x, y, text], i) => (
            <text key={i} x={x as number} y={y as number} fontSize={6} fill="#d1d5db" fontWeight={500} letterSpacing={2}>{text as string}</text>
          ))}

          {/* Room cells */}
          {LAYOUT.map(([num, col, row, w, h]) => {
            const room = roomMap.get(String(num));
            if (!room) return null;
            const st = (room.status as StatusKey) || "AVAILABLE";
            const cfg = STATUS[st] || STATUS.AVAILABLE;
            const isH = hovered === String(num);
            const isS = selected?.name === String(num);
            const act = isH || isS;
            const x = col * C;
            const y = row * C;
            const rw = w * C - 2;
            const rh = h * C - 2;
            const dbl = room.type === "DOUBLE";

            return (
              <g key={num} style={{ cursor: "pointer" }}
                onMouseEnter={() => setHovered(String(num))}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(room)}>
                {/* Shadow */}
                {act && <rect x={x + 2} y={y + 3} width={rw} height={rh} rx={5} fill="rgba(0,0,0,0.05)" />}
                {/* Room rect */}
                <rect x={x + 1} y={y + 1} width={rw} height={rh} rx={5}
                  fill={act ? cfg.bgH : cfg.bg}
                  stroke={act ? cfg.text : cfg.border}
                  strokeWidth={isS ? 2.5 : act ? 1.5 : 0.7}
                  style={{ transition: "all 0.15s ease" }} />
                {/* Room number */}
                <text x={x + 1 + rw / 2} y={y + 1 + rh / 2 + (dbl ? -3 : 1)}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={11} fontWeight={act ? 700 : 600} fill={cfg.text}
                  style={{ pointerEvents: "none", transition: "all 0.1s" }}>
                  {num}
                </text>
                {/* Status dot */}
                <circle cx={x + rw - 3} cy={y + 7} r={2.5} fill={cfg.dot} opacity={act ? 1 : 0.65} />
                {/* Double label */}
                {dbl && (
                  <text x={x + 1 + rw / 2} y={y + rh - 4} textAnchor="middle"
                    fontSize={6} fill={cfg.text} fontWeight={600} opacity={0.5}
                    style={{ pointerEvents: "none" }}>DOUBLE</text>
                )}
                {/* Hover tooltip for occupied rooms */}
                {room.reservation && act && (
                  <foreignObject x={x - 30} y={y + rh + 3} width={rw + 60} height={32}>
                    <div style={{
                      background: "rgba(15,23,42,0.9)", color: "#fff", fontSize: 9,
                      padding: "4px 8px", borderRadius: 6, textAlign: "center",
                      whiteSpace: "nowrap", fontWeight: 500, backdropFilter: "blur(4px)",
                    }}>
                      {room.reservation.guestName} · #{room.reservation.id}
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          })}

          {/* Floor label */}
          <text x={SVG_W / 2} y={SVG_H + 6} textAnchor="middle" fontSize={8} fill="#94a3b8" fontWeight={600} letterSpacing={3}>
            KAT 2 — EDU EĞİTİM OTELİ
          </text>
        </svg>
      </div>

      {/* Detail drawer */}
      <div className="overflow-hidden transition-all duration-300"
        style={{ width: selected ? 320 : 0, minWidth: selected ? 320 : 0, marginLeft: selected ? 12 : 0 }}>
        {selected && <Drawer room={selected} date={date} onClose={() => setSelected(null)} />}
      </div>
    </div>
  );

  /* ── Grid View ──────────────────────────── */
  const Grid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {rooms.map(room => {
        const cfg = STATUS[(room.status as StatusKey)] || STATUS.AVAILABLE;
        const st = (room.status as StatusKey) || "AVAILABLE";
        return (
          <div key={room.id} onClick={() => setSelected(room)}
            className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-900">{room.name}</h4>
              <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${cfg.pillBg} ${cfg.pillText} ${cfg.pillBorder}`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />{statusLabel(st)}
              </span>
            </div>
            <div className="text-[11px] text-gray-500 space-y-0.5">
              <p>
                {room.type === "DOUBLE" ? t("rooms.grid.double", "Double") : t("rooms.grid.single", "Single")} · {t("rooms.grid.guest", { count: room.capacity, defaultValue: room.capacity > 1 ? `${room.capacity} guests` : `${room.capacity} guest` })}
              </p>
              <p>₺{room.price}{t("rooms.grid.perNight", "/night")}</p>
            </div>
            {room.reservation && (
              <div className="mt-2 bg-red-50 border border-red-100 rounded-lg p-2 text-[10px]">
                <p className="font-semibold text-red-700">{room.reservation.guestName}</p>
                <p className="text-red-500">#{room.reservation.id}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  /* ── Render ─────────────────────────────── */
  return (
    <div className="space-y-5">
      {/* Title */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 tracking-tight">{t("pages.rooms.title", "Room Management")}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{t("rooms.roomsCount", { count: counts.total, defaultValue: `${counts.total} rooms` })} · {fmtDate(date)}</p>
      </div>

      {/* Controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Date nav */}
        <div className="flex items-center gap-1.5">
          <button onClick={() => goDay(-1)} className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors">
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 h-9">
            <Calendar className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="bg-transparent text-sm font-medium text-gray-800 outline-none w-[120px]" />
          </div>
          <button onClick={() => goDay(1)} className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors">
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
          {!isToday && (
            <button onClick={() => setDate(new Date().toISOString().slice(0, 10))}
              className="px-3 h-8 rounded-lg bg-[#003366] text-white text-xs font-semibold hover:bg-[#002244] transition-colors">
              {t("rooms.today", "Today")}
            </button>
          )}
        </div>

        {/* Status pills */}
        <div className="flex items-center gap-2">
          {(["AVAILABLE", "OCCUPIED", "MAINTENANCE", "RESERVED"] as StatusKey[]).map(s => {
            const cfg = STATUS[s];
            const c = counts[s.toLowerCase() as keyof Counts] ?? 0;
            return (
              <div key={s} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold"
                style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.text }}>
                <span className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
                {statusLabel(s)} <span className="font-bold">{c}</span>
              </div>
            );
          })}
        </div>

        {/* View toggle */}
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {([["floor", MapIcon, t("rooms.viewFloor", "Floor Plan")], ["grid", LayoutGrid, t("rooms.viewGrid", "Cards")]] as const).map(([key, Icon, label]) => (
            <button key={key} onClick={() => setView(key as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                view === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>
              <Icon className="h-3.5 w-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</div>}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <BedDouble className="h-10 w-10 mb-3 text-gray-300" />
          <p className="text-sm">{t("rooms.noRooms", "No rooms found.")}</p>
        </div>
      ) : view === "floor" ? <FloorPlan /> : <Grid />}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Room Detail Drawer
   ════════════════════════════════════════════════════════════ */
function Drawer({ room, date, onClose }: { room: RoomData; date: string; onClose: () => void }) {
  const { t } = useTranslation("admin");
  const cfg = STATUS[(room.status as keyof typeof STATUS)] || STATUS.AVAILABLE;
  const [newStatus, setNewStatus] = useState(room.baseStatus);
  const [saving, setSaving] = useState(false);

  const statusLabel = (s: keyof typeof STATUS) => {
    const map: Record<keyof typeof STATUS, string> = {
      AVAILABLE: t("rooms.statusAvailable", "Available"),
      OCCUPIED: t("rooms.statusOccupied", "Occupied"),
      MAINTENANCE: t("rooms.statusMaintenance", "Maintenance"),
      RESERVED: t("rooms.statusReserved", "Reserved"),
    };
    return map[s] || s;
  };

  const save = async () => {
    try {
      setSaving(true);
      const r = await fetch(`/ehp/api/rooms/${room.id}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (r.ok) window.location.reload();
      else { const d = await r.json(); alert(d.error || "Failed"); }
    } catch { alert("Failed"); } finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl h-full flex flex-col overflow-hidden"
      style={{ animation: "adminFadeIn 0.2s ease-out" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-base font-bold text-gray-900">{t("rooms.roomLabel", { number: room.name, defaultValue: `Room ${room.name}` })}</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">{t("rooms.drawer.floor", "Floor 2")} · {date}</p>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors">
          <X className="h-3.5 w-3.5 text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-auto px-5 py-4 space-y-4">
        {/* Status */}
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border"
          style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.text }}>
          <span className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />{statusLabel(room.status as keyof typeof STATUS)}
        </span>

        {/* Room info */}
        <div>
          {[
            { icon: <BedDouble className="h-4 w-4" />, l: t("rooms.drawer.type", "Type"), v: room.type === "DOUBLE" ? t("rooms.drawer.doubleRoom", "Double Room") : t("rooms.drawer.singleRoom", "Single Room") },
            { icon: <Users className="h-4 w-4" />, l: t("rooms.capacity", "Capacity"), v: t("rooms.drawer.guest", { count: room.capacity, defaultValue: room.capacity > 1 ? `${room.capacity} guests` : `${room.capacity} guest` }) },
            { icon: <span className="text-sm font-bold">₺</span>, l: t("rooms.price", "Price"), v: `₺${room.price}${t("rooms.drawer.perNight", "/night")}` },
            { icon: <Wifi className="h-4 w-4" />, l: t("rooms.amenities", "Amenities"), v: room.amenities || "—" },
          ].map(({ icon, l, v }) => (
            <div key={l} className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2 text-gray-400 text-xs">{icon}{l}</div>
              <span className="text-xs font-medium text-gray-700 text-right max-w-[150px]">{v}</span>
            </div>
          ))}
        </div>

        {/* Reservation info */}
        {room.reservation && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3.5">
            <p className="text-xs font-bold text-red-700 mb-1">{t("rooms.drawer.occupiedTitle", "Occupied")}</p>
            <p className="text-xs text-red-600">{room.reservation.guestName}</p>
            <p className="text-[10px] text-red-500 mt-1">
              #{room.reservation.id} · {new Date(room.reservation.checkIn).toLocaleDateString("en-GB")} → {new Date(room.reservation.checkOut).toLocaleDateString("en-GB")} · {t("rooms.drawer.guest", { count: room.reservation.guests, defaultValue: room.reservation.guests > 1 ? `${room.reservation.guests} guests` : `${room.reservation.guests} guest` })}
            </p>
          </div>
        )}

        {room.status === "MAINTENANCE" && !room.reservation && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-amber-700">{t("rooms.drawer.maintenanceTitle", "Under Maintenance")}</p>
            <p className="text-[10px] text-amber-600 mt-0.5">{t("rooms.drawer.maintenanceDesc", "Room is unavailable for booking.")}</p>
          </div>
        )}

        {room.status === "RESERVED" && !room.reservation && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-blue-700">{t("rooms.drawer.reservedTitle", "Reserved for Special Guests")}</p>
            <p className="text-[10px] text-blue-600 mt-0.5">{t("rooms.drawer.reservedDesc", "This room is permanently reserved and cannot be booked through the system.")}</p>
          </div>
        )}

        {/* Admin: change status */}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{t("rooms.drawer.changeStatus", "Change Base Status")}</p>
          <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
            className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="AVAILABLE">{t("rooms.drawer.optAvailable", "Available")}</option>
            <option value="MAINTENANCE">{t("rooms.drawer.optMaintenance", "Maintenance")}</option>
            <option value="RESERVED">{t("rooms.drawer.optReserved", "Reserved (Special Guests)")}</option>
          </select>
          <button onClick={save} disabled={saving || newStatus === room.baseStatus}
            className="mt-2 w-full h-9 rounded-xl bg-[#003366] text-white text-xs font-bold hover:bg-[#002244] disabled:opacity-40 transition-all">
            {saving ? t("rooms.drawer.saving", "Saving...") : t("rooms.drawer.updateStatus", "Update Status")}
          </button>
        </div>
      </div>
    </div>
  );
}
