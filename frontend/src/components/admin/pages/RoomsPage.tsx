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
   Floor plan layout — perfectly matches Kat 2 evacuation plan
   ════════════════════════════════════════════════════════════ */
type Cell = [number, number, number, number, number];

const LAYOUT: Cell[] = [
  // Top Outer
  [234, 4, 0, 2, 2], [232, 6, 0, 2, 2], [230, 8, 0, 2, 2],
  [224, 14, 0, 2, 2], [222, 16, 0, 2, 2], [220, 18, 0, 2, 2],
  
  // Top Inner
  [233, 4, 3, 2, 2], [231, 6, 3, 2, 2], [229, 8, 3, 2, 2],
  [228, 10, 3, 2, 2], [237, 12, 3, 2, 2], [236, 14, 3, 2, 2],
  [225, 16, 3, 2, 2], [223, 18, 3, 2, 2], [221, 20, 3, 2, 2], [219, 22, 3, 2, 2],
  
  // Left Outer
  [235, 0, 3, 2, 2], [226, 0, 5, 2, 2],
  [238, 0, 8, 2, 2], [240, 0, 10, 2, 2], [242, 0, 12, 2, 3], // DOUBLE
  [244, 0, 15, 2, 2], [246, 0, 17, 2, 2], [248, 0, 19, 2, 2], [250, 0, 21, 2, 2],
  
  // Left Inner
  [227, 3, 6, 2, 2], [239, 3, 8, 2, 2], [241, 3, 10, 2, 2],
  [243, 3, 12, 2, 2], [245, 3, 14, 2, 2], [247, 3, 16, 2, 2],
  [249, 3, 18, 2, 2], [251, 3, 20, 2, 2],
  
  // Right Outer
  [217, 25, 5, 2, 2], [216, 25, 7, 2, 2],
  [214, 25, 9, 2, 2], [212, 25, 11, 2, 2], [210, 25, 13, 2, 3], // DOUBLE
  [208, 25, 16, 2, 2], [206, 25, 18, 2, 2], [204, 25, 20, 2, 2],
  
  // Right Inner
  [215, 22, 9, 2, 2], [213, 22, 11, 2, 2], [211, 22, 13, 2, 2],
  [209, 22, 15, 2, 2], [207, 22, 17, 2, 2], [205, 22, 19, 2, 2],
  [203, 22, 21, 2, 2], [201, 22, 23, 2, 2],
];

/* ════════════════════════════════════════════════════════════
   Status config (Upgraded palettes)
   ════════════════════════════════════════════════════════════ */
const STATUS = {
  AVAILABLE: {
    bg: "#f0fdf4", bgH: "#dcfce7", border: "#bbf7d0",
    text: "#15803d", dot: "#22c55e", pillBg: "bg-emerald-50", pillText: "text-emerald-700", pillBorder: "border-emerald-200",
    gradientFrom: "#22c55e", gradientTo: "#16a34a", accent: "#4ade80"
  },
  OCCUPIED: {
    bg: "#fef2f2", bgH: "#fee2e2", border: "#fecaca",
    text: "#b91c1c", dot: "#ef4444", pillBg: "bg-red-50", pillText: "text-red-700", pillBorder: "border-red-200",
    gradientFrom: "#ef4444", gradientTo: "#dc2626", accent: "#f87171"
  },
  MAINTENANCE: {
    bg: "#fffbeb", bgH: "#fef3c7", border: "#fde68a",
    text: "#b45309", dot: "#f59e0b", pillBg: "bg-amber-50", pillText: "text-amber-700", pillBorder: "border-amber-200",
    gradientFrom: "#f59e0b", gradientTo: "#d97706", accent: "#fbbf24"
  },
  RESERVED: {
    bg: "#eff6ff", bgH: "#dbeafe", border: "#bfdbfe",
    text: "#1d4ed8", dot: "#3b82f6", pillBg: "bg-blue-50", pillText: "text-blue-700", pillBorder: "border-blue-200",
    gradientFrom: "#3b82f6", gradientTo: "#2563eb", accent: "#60a5fa"
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
      AVAILABLE:   t("rooms.statusAvailable", "Available"),
      OCCUPIED:    t("rooms.statusOccupied", "Occupied"),
      MAINTENANCE: t("rooms.statusMaintenance", "Maintenance"),
      RESERVED:    t("rooms.statusReserved", "Reserved"),
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

  /* ── Enhanced SVG Floor Plan ─────────────────────── */
  const C = 28;
  const SVG_W = 28 * C;
  const SVG_H = 28 * C;

  const FloorPlan = () => (
    <div className="flex gap-0">
      <div className="flex-1 bg-[#f8fafc] rounded-3xl border border-gray-200 shadow-inner p-2 sm:p-6 overflow-auto relative">
        <svg viewBox={`-20 -20 ${SVG_W + 40} ${SVG_H + 40}`} className="w-full mx-auto block drop-shadow-sm" style={{ maxWidth: 880 }}>
          <defs>
            <filter id="shadow-building" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="16" stdDeviation="24" floodColor="#0f172a" floodOpacity="0.06" />
            </filter>
            <filter id="shadow-room" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0f172a" floodOpacity="0.12" />
            </filter>
            <filter id="shadow-tree" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#064e3b" floodOpacity="0.15" />
            </filter>
            <pattern id="dot-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#cbd5e1" opacity="0.4" />
            </pattern>
            <pattern id="terrace-hatch" width="12" height="12" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="12" stroke="#e2e8f0" strokeWidth="1.5" />
            </pattern>
            <pattern id="service-hatch" width="8" height="8" patternTransform="rotate(-45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#cbd5e1" strokeWidth="1" opacity="0.5" />
            </pattern>
          </defs>

          {/* Blueprint background grid */}
          <rect x={-30} y={-30} width={SVG_W + 60} height={SVG_H + 60} fill="url(#dot-grid)" rx={16} />

          {/* Main Building Base */}
          <rect x={-8} y={-8} width={SVG_W + 16} height={SVG_H + 16} rx={24} fill="#ffffff" filter="url(#shadow-building)" stroke="#f1f5f9" strokeWidth={2} />

          {/* Terraces */}
          <g>
            <rect x={1.5*C} y={-4*C} width={8*C} height={3.5*C} fill="url(#terrace-hatch)" rx={8} />
            <rect x={22.5*C} y={-4*C} width={6*C} height={3.5*C} fill="url(#terrace-hatch)" rx={8} />
            <rect x={-5*C} y={20*C} width={4.5*C} height={6*C} fill="url(#terrace-hatch)" rx={8} />
            <rect x={27.5*C} y={13*C} width={4.5*C} height={6*C} fill="url(#terrace-hatch)" rx={8} />
            <text x={5.5*C} y={-2*C} textAnchor="middle" fontSize={8} fill="#94a3b8" fontWeight={700} letterSpacing={3}>TERAS</text>
            <text x={25.5*C} y={-2*C} textAnchor="middle" fontSize={8} fill="#94a3b8" fontWeight={700} letterSpacing={3}>TERAS</text>
            <text x={-2.75*C} y={23*C} textAnchor="middle" fontSize={8} fill="#94a3b8" fontWeight={700} letterSpacing={3}>TERAS</text>
            <text x={29.75*C} y={16*C} textAnchor="middle" fontSize={8} fill="#94a3b8" fontWeight={700} letterSpacing={3}>TERAS</text>
          </g>

          {/* Central Courtyard (AVLU) */}
          <g>
            <rect x={5.5*C} y={5.5*C} width={16*C} height={17*C} rx={16} fill="#f0fdf4" stroke="#dcfce7" strokeWidth={2} />
            <circle cx={13.5*C} cy={14*C} r={7*C} fill="#ffffff" opacity={0.6} />
            <circle cx={13.5*C} cy={14*C} r={4.5*C} fill="#f1f5f9" stroke="#e2e8f0" strokeWidth={1} />
            <text x={13.5*C} y={13.8*C} textAnchor="middle" fontSize={14} fill="#64748b" fontWeight={800} letterSpacing={6}>AVLU</text>
            <text x={13.5*C} y={15*C} textAnchor="middle" fontSize={9} fill="#94a3b8" letterSpacing={4} fontWeight={600}>COURTYARD</text>
            <g filter="url(#shadow-tree)">
              <circle cx={7.5*C} cy={7.5*C} r={1.8*C} fill="#86efac" opacity={0.9} />
              <circle cx={7.5*C} cy={7.5*C} r={1.2*C} fill="#4ade80" />
              <circle cx={19.5*C} cy={8.5*C} r={2.2*C} fill="#86efac" opacity={0.9} />
              <circle cx={19.5*C} cy={8.5*C} r={1.4*C} fill="#4ade80" />
              <circle cx={8.5*C} cy={20.5*C} r={2*C} fill="#86efac" opacity={0.9} />
              <circle cx={8.5*C} cy={20.5*C} r={1.3*C} fill="#4ade80" />
              <circle cx={18.5*C} cy={21*C} r={1.6*C} fill="#86efac" opacity={0.9} />
              <circle cx={18.5*C} cy={21*C} r={1*C} fill="#4ade80" />
            </g>
          </g>

          {/* Corridors */}
          <g>
            <rect x={2.2*C} y={2.2*C} width={22.6*C} height={C*0.7} rx={6} fill="#f1f5f9" stroke="#e2e8f0" strokeWidth={1} />
            <rect x={2.2*C} y={2.2*C} width={C*0.7} height={21*C} rx={6} fill="#f1f5f9" stroke="#e2e8f0" strokeWidth={1} />
            <rect x={24.1*C} y={2.2*C} width={C*0.7} height={23.5*C} rx={6} fill="#f1f5f9" stroke="#e2e8f0" strokeWidth={1} />
            <text x={13.5*C} y={2.75*C} textAnchor="middle" fontSize={8} fill="#cbd5e1" letterSpacing={6} fontWeight={700}>KORİDOR</text>
          </g>

          {/* Service area 2055 */}
          <rect x={10.5*C} y={-0.5*C} width={3*C} height={2.5*C} rx={6} fill="url(#service-hatch)" stroke="#cbd5e1" strokeWidth={1} />
          <rect x={10.5*C} y={-0.5*C} width={3*C} height={2.5*C} rx={6} fill="#ffffff" opacity={0.7} />
          <text x={12*C} y={1*C} textAnchor="middle" fontSize={8} fill="#94a3b8" fontWeight={700}>2055</text>

          {/* Room Cells */}
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
            const rw = w * C - 3;
            const rh = h * C - 3;
            const dbl = room.type === "DOUBLE";

            return (
              <g key={num} style={{ cursor: "pointer" }}
                onMouseEnter={() => setHovered(String(num))}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(room)}>
                {act && <rect x={x+1} y={y+1} width={rw} height={rh} rx={8} fill="#fff" filter="url(#shadow-room)" />}
                <rect x={x+1} y={y+1} width={rw} height={rh} rx={8}
                  fill={act ? cfg.bgH : cfg.bg}
                  stroke={isS ? cfg.dot : cfg.border}
                  strokeWidth={isS ? 2.5 : 1}
                  style={{ transition: "all 0.2s ease" }} />
                <path
                  d={`M ${x+1} ${y+7} Q ${x+1} ${y+1} ${x+7} ${y+1} L ${x+rw-6} ${y+1} Q ${x+rw} ${y+1} ${x+rw} ${y+7} L ${x+rw} ${y+5} L ${x+1} ${y+5} Z`}
                  fill={cfg.accent} opacity={act ? 1 : 0.6} />
                <text x={x+1+rw/2} y={y+1+rh/2+(dbl ? -4 : 1)}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={act ? 13 : 12} fontWeight={800} fill={cfg.text}
                  style={{ pointerEvents: "none", transition: "all 0.2s ease" }}>
                  {num}
                </text>
                <circle cx={x+rw-6} cy={y+8} r={3.5} fill={cfg.dot} opacity={act ? 1 : 0.8} />
                {isS && <circle cx={x+rw-6} cy={y+8} r={6} fill="none" stroke={cfg.dot} strokeWidth={1.5} opacity={0.5} className="animate-ping" />}
                {dbl && (
                  <text x={x+1+rw/2} y={y+rh-6} textAnchor="middle"
                    fontSize={6.5} fill={cfg.text} fontWeight={800} letterSpacing={1} opacity={0.6}
                    style={{ pointerEvents: "none" }}>DOUBLE</text>
                )}
                {room.reservation && act && (
                  <foreignObject x={x-40} y={y+rh+6} width={rw+80} height={40} style={{ pointerEvents: "none", zIndex: 10 }}>
                    <div style={{
                      background: "rgba(15,23,42,0.85)", color: "#fff", fontSize: 10,
                      padding: "6px 10px", borderRadius: 8, textAlign: "center",
                      whiteSpace: "nowrap", fontWeight: 600, backdropFilter: "blur(8px)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.1)"
                    }}>
                      <span className="block text-[#94a3b8] text-[8px] uppercase tracking-wider mb-0.5">Guest</span>
                      {room.reservation.guestName}
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          })}

          {/* Floor Label */}
          <text x={SVG_W/2} y={SVG_H+20} textAnchor="middle" fontSize={10} fill="#64748b" fontWeight={800} letterSpacing={6}>
            KAT 2 — EDU EĞİTİM OTELİ
          </text>
        </svg>
      </div>

      {/* Detail drawer */}
      <div className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ width: selected ? 340 : 0, minWidth: selected ? 340 : 0, marginLeft: selected ? 16 : 0 }}>
        {selected && <Drawer room={selected} date={date} onClose={() => setSelected(null)} />}
      </div>
    </div>
  );

  /* ── Grid View ──────────────────────────── */
  const Grid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {rooms.map(room => {
        const cfg = STATUS[(room.status as StatusKey)] || STATUS.AVAILABLE;
        const st = (room.status as StatusKey) || "AVAILABLE";
        return (
          <div key={room.id} onClick={() => setSelected(room)}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden group hover:-translate-y-1">
            {/* Gradient bar */}
            <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${cfg.gradientFrom}, ${cfg.gradientTo})` }} />
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-extrabold text-gray-900">Room {room.name}</h4>
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.pillBg} ${cfg.pillText} ${cfg.pillBorder}`}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />{statusLabel(st)}
                </span>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <p className="font-medium flex items-center gap-1.5">
                  <BedDouble className="h-3.5 w-3.5 text-gray-400" />
                  {room.type === "DOUBLE" ? t("rooms.grid.double", "Double") : t("rooms.grid.single", "Single")} 
                  <span className="text-gray-300">•</span> 
                  {t("rooms.grid.guest", { count: room.capacity, defaultValue: room.capacity > 1 ? `${room.capacity} guests` : `${room.capacity} guest` })}
                </p>
                <p className="text-gray-500 font-semibold pl-5">₺{room.price}<span className="text-gray-400 font-normal">{t("rooms.grid.perNight", "/night")}</span></p>
              </div>
              {room.reservation && (
                <div className="mt-3 bg-red-50 border border-red-100 rounded-xl p-3 text-[11px]">
                  <p className="font-bold text-red-700 truncate">{room.reservation.guestName}</p>
                  <p className="text-red-400 font-mono mt-0.5">#{room.reservation.id}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  /* ── Render ─────────────────────────────── */
  return (
    <div className="space-y-6">
      <style>{`
        @keyframes roomIn { from { opacity:0; transform: translateX(12px); } to { opacity:1; transform: translateX(0); } }
      `}</style>

      {/* Title */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#003366] to-[#0055aa] flex items-center justify-center shadow-md">
          <MapIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t("pages.rooms.title", "Room Management")}</h2>
          <p className="text-sm font-medium text-slate-500 mt-0.5">{t("rooms.roomsCount", { count: counts.total, defaultValue: `${counts.total} rooms` })} · <span className="text-slate-400">{fmtDate(date)}</span></p>
        </div>
      </div>

      {/* Controls bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Date nav */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => goDay(-1)}
              className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-center transition-colors shadow-sm"
            >
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </button>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 h-10 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-300 transition-all">
              <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-800 outline-none w-[125px] cursor-pointer" />
            </div>
            <button
              onClick={() => goDay(1)}
              className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-center transition-colors shadow-sm"
            >
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </button>
            {!isToday && (
              <button
                onClick={() => setDate(new Date().toISOString().slice(0, 10))}
                className="ml-1 px-4 h-10 rounded-xl bg-gradient-to-r from-[#003366] to-[#0055aa] text-white text-xs font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                {t("rooms.today", "Today")}
              </button>
            )}
          </div>

          {/* Status pills — beautiful legend */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {(["AVAILABLE", "OCCUPIED", "MAINTENANCE", "RESERVED"] as StatusKey[]).map(s => {
              const cfg = STATUS[s];
              const c = counts[s.toLowerCase() as keyof Counts] ?? 0;
              return (
                <div
                  key={s}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-[11px] font-bold shadow-sm ${cfg.pillBg} ${cfg.pillText} ${cfg.pillBorder}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: cfg.dot }} />
                  {statusLabel(s)}
                  <span className="font-black ml-1 text-sm bg-white/50 px-1.5 rounded-md">{c}</span>
                </div>
              );
            })}
          </div>

          {/* View toggle */}
          <div className="flex bg-slate-100 rounded-xl p-1 shadow-inner">
            {([["floor", MapIcon, t("rooms.viewFloor", "Floor Plan")], ["grid", LayoutGrid, t("rooms.viewGrid", "Cards")]] as const).map(([key, Icon, label]) => (
              <button key={key} onClick={() => setView(key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                  view === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}>
                <Icon className="h-4 w-4" />{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 shadow-sm flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center"><X className="h-4 w-4 text-red-600" /></div>
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-80 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#003366] rounded-full animate-spin mb-4" />
          <p className="text-sm text-slate-500 font-bold tracking-wide">LOADING ARCHITECTURE...</p>
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-80 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4"><BedDouble className="h-8 w-8 text-slate-300" /></div>
          <p className="text-base font-bold text-slate-600">{t("rooms.noRooms", "No rooms found.")}</p>
        </div>
      ) : view === "floor" ? <FloorPlan /> : <Grid />}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Room Detail Drawer (Enhanced UI)
   ════════════════════════════════════════════════════════════ */
function Drawer({ room, date, onClose }: { room: RoomData; date: string; onClose: () => void }) {
  const { t } = useTranslation("admin");
  const cfg = STATUS[(room.status as keyof typeof STATUS)] || STATUS.AVAILABLE;
  const [newStatus, setNewStatus] = useState(room.baseStatus);
  const [saving, setSaving] = useState(false);

  const statusLabel = (s: keyof typeof STATUS) => {
    const map: Record<keyof typeof STATUS, string> = {
      AVAILABLE:   t("rooms.statusAvailable", "Available"),
      OCCUPIED:    t("rooms.statusOccupied", "Occupied"),
      MAINTENANCE: t("rooms.statusMaintenance", "Maintenance"),
      RESERVED:    t("rooms.statusReserved", "Reserved"),
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
    <div
      className="bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-900/10 h-full flex flex-col overflow-hidden"
      style={{ animation: "roomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      {/* Gradient header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${cfg.gradientFrom}15, ${cfg.gradientTo}05)` }} />
        <div className="absolute bottom-0 left-0 w-full h-1" style={{ background: cfg.dot }} />
        <div className="relative flex items-start justify-between px-6 py-5 border-b border-slate-100/50">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${cfg.pillBg} ${cfg.pillText} ${cfg.pillBorder}`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                {statusLabel(room.status as keyof typeof STATUS)}
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t("rooms.roomLabel", { number: room.name, defaultValue: `Room ${room.name}` })}</h3>
            <p className="text-xs font-medium text-slate-500 mt-1">{t("rooms.drawer.floor", "Floor 2")} <span className="mx-1 text-slate-300">•</span> {date}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-50 hover:scale-105 active:scale-95 flex items-center justify-center transition-all shadow-sm">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-5 space-y-5">
        {/* Room info */}
        <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
          {[
            { icon: <BedDouble className="h-4 w-4" />, l: t("rooms.drawer.type", "Type"), v: room.type === "DOUBLE" ? t("rooms.drawer.doubleRoom", "Double Room") : t("rooms.drawer.singleRoom", "Single Room") },
            { icon: <Users className="h-4 w-4" />, l: t("rooms.capacity", "Capacity"), v: t("rooms.drawer.guest", { count: room.capacity, defaultValue: room.capacity > 1 ? `${room.capacity} guests` : `${room.capacity} guest` }) },
            { icon: <span className="text-sm font-extrabold">₺</span>, l: t("rooms.price", "Price"), v: <span className="text-slate-900 font-bold">₺{room.price}<span className="text-slate-400 font-medium text-[10px] ml-1">{t("rooms.drawer.perNight", "/night")}</span></span> },
            { icon: <Wifi className="h-4 w-4" />, l: t("rooms.amenities", "Amenities"), v: room.amenities || "—" },
          ].map(({ icon, l, v }, i) => (
            <div key={l} className={`flex items-center justify-between px-4 py-3 ${i !== 3 ? 'border-b border-slate-100' : ''}`}>
              <div className="flex items-center gap-2.5 text-slate-500 text-xs font-bold">{icon}{l}</div>
              <span className="text-xs font-semibold text-slate-700 text-right">{v}</span>
            </div>
          ))}
        </div>

        {/* Reservation info */}
        {room.reservation && (
          <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">{t("rooms.drawer.occupiedTitle", "Currently Occupied")}</p>
            <p className="text-base font-bold text-red-900">{room.reservation.guestName}</p>
            <div className="mt-2 pt-2 border-t border-red-100/50 flex flex-col gap-1">
              <p className="text-[11px] text-red-700 font-medium flex justify-between">
                <span>Ref:</span> <span className="font-mono bg-red-100 px-1.5 rounded text-red-800">#{room.reservation.id}</span>
              </p>
              <p className="text-[11px] text-red-700 font-medium flex justify-between">
                <span>Dates:</span> <span>{new Date(room.reservation.checkIn).toLocaleDateString("en-GB")} → {new Date(room.reservation.checkOut).toLocaleDateString("en-GB")}</span>
              </p>
            </div>
          </div>
        )}

        {room.status === "MAINTENANCE" && !room.reservation && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">{t("rooms.drawer.maintenanceTitle", "Under Maintenance")}</p>
            <p className="text-xs text-amber-800 font-medium leading-relaxed">{t("rooms.drawer.maintenanceDesc", "This room has been blocked off for maintenance and is unavailable for booking.")}</p>
          </div>
        )}

        {/* Admin: change status */}
        <div className="pt-3">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{t("rooms.drawer.changeStatus", "Change Base Status")}</label>
          <select
            value={newStatus}
            onChange={e => setNewStatus(e.target.value)}
            className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all shadow-sm appearance-none cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: `right 12px center`, backgroundRepeat: `no-repeat`, backgroundSize: `16px` }}
          >
            <option value="AVAILABLE">{t("rooms.drawer.optAvailable", "Available")}</option>
            <option value="MAINTENANCE">{t("rooms.drawer.optMaintenance", "Maintenance")}</option>
            <option value="RESERVED">{t("rooms.drawer.optReserved", "Reserved (Special Guests)")}</option>
          </select>
          <button
            onClick={save}
            disabled={saving || newStatus === room.baseStatus}
            className="mt-3 w-full h-11 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-md hover:shadow-xl hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900 disabled:shadow-none transition-all duration-200 hover:-translate-y-0.5"
          >
            {saving ? t("rooms.drawer.saving", "Saving Updates...") : t("rooms.drawer.updateStatus", "Update Room Status")}
          </button>
        </div>
      </div>
    </div>
  );
}