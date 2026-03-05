import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Plus, Eye, Edit, LayoutGrid, Map as MapIcon, X, Users, BedDouble, Wifi, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getRooms, type Room } from "../../../api/rooms";

/* ────────────────────────────────────────────────────────────
 *  Floor-plan spatial layout for Kat 2 (all 3-digit 2XX rooms)
 *  Each entry: [roomNumber, col, row, colSpan, rowSpan]
 *  Grid: ~26 cols × 26 rows mirroring the real U-shape building
 * ──────────────────────────────────────────────────────────── */
type CellDef = [number, number, number, number, number];

const FLOOR_LAYOUT: CellDef[] = [
  // ── TOP WING — upper row (facing outward) ──
  [234, 2, 0, 2, 2],
  [232, 4, 0, 2, 2],
  [230, 6, 0, 3, 2],   // double room — wider
  [224, 12, 0, 2, 2],
  [222, 14, 0, 2, 2],
  [220, 16, 0, 2, 2],

  // ── TOP WING — lower row (facing inward) ──
  [233, 3, 3, 2, 2],
  [231, 5, 3, 2, 2],
  [229, 7, 3, 2, 2],
  [228, 9, 3, 2, 2],
  [237, 11, 3, 2, 2],
  [236, 13, 3, 2, 2],
  [225, 15, 3, 2, 2],
  [223, 17, 3, 2, 2],
  [221, 19, 3, 2, 2],
  [219, 21, 3, 2, 2],

  // ── LEFT WING — outer column (facing left) ──
  [235, 0, 3, 2, 2],
  [226, 0, 5, 2, 2],
  [238, 0, 7, 2, 2],
  [240, 0, 9, 2, 2],
  [242, 0, 11, 2, 3],  // double room — taller
  [244, 0, 14, 2, 2],
  [246, 0, 16, 2, 2],
  [248, 0, 18, 2, 2],
  [250, 0, 20, 2, 2],

  // ── LEFT WING — inner column (facing right) ──
  [227, 3, 6, 2, 2],
  [239, 3, 8, 2, 2],
  [241, 3, 10, 2, 2],
  [243, 3, 12, 2, 2],
  [245, 3, 14, 2, 2],
  [247, 3, 16, 2, 2],
  [249, 3, 18, 2, 2],
  [251, 3, 20, 2, 2],

  // ── RIGHT WING — inner column (facing left) ──
  [217, 21, 5, 2, 2],
  [216, 21, 7, 2, 2],
  [214, 21, 9, 2, 2],
  [212, 21, 11, 2, 2],
  [211, 21, 13, 2, 2],
  [209, 21, 15, 2, 2],
  [207, 21, 17, 2, 2],
  [205, 21, 19, 2, 2],
  [203, 21, 21, 2, 2],
  [201, 21, 23, 2, 2],

  // ── RIGHT WING — outer column (facing right) ──
  [215, 24, 6, 2, 2],
  [213, 24, 8, 2, 2],
  [210, 24, 10, 2, 2],
  [208, 24, 12, 2, 2],
  [206, 24, 14, 2, 2],
  [204, 24, 16, 2, 2],
];

/* ────────────────────────────────────────────────────────────
 *  Status configuration
 * ──────────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  AVAILABLE: {
    label: "Available",
    labelTR: "Müsait",
    bg: "#ecfdf5",
    bgHover: "#d1fae5",
    border: "#86efac",
    text: "#15803d",
    dot: "#22c55e",
    badgeBg: "bg-green-50",
    badgeText: "text-green-700",
    badgeBorder: "border-green-200",
  },
  OCCUPIED: {
    label: "Occupied",
    labelTR: "Dolu",
    bg: "#fef2f2",
    bgHover: "#fee2e2",
    border: "#fca5a5",
    text: "#b91c1c",
    dot: "#ef4444",
    badgeBg: "bg-red-50",
    badgeText: "text-red-700",
    badgeBorder: "border-red-200",
  },
  MAINTENANCE: {
    label: "Maintenance",
    labelTR: "Bakımda",
    bg: "#fffbeb",
    bgHover: "#fef3c7",
    border: "#fcd34d",
    text: "#a16207",
    dot: "#f59e0b",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
    badgeBorder: "border-amber-200",
  },
} as const;

type ViewMode = "floorplan" | "grid";

/* ════════════════════════════════════════════════════════════
 *  MAIN COMPONENT
 * ════════════════════════════════════════════════════════════ */
export function RoomsPage() {
  const { t } = useTranslation("admin");

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("floorplan");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getRooms();
        if (data.length === 0) {
          const demoIds = [201,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251];
          const statuses: Room["status"][] = ["AVAILABLE","OCCUPIED","MAINTENANCE"];
          const fakeRooms: Room[] = demoIds.map((n) => ({
            id: String(n),
            name: String(n),
            type: n === 230 || n === 242 ? "DOUBLE" : "SINGLE",
            status: statuses[Math.floor(Math.random() * 2.3)],
            capacity: n === 230 || n === 242 ? 2 : 1,
            price: n === 230 || n === 242 ? 450 : 300,
            amenities: "Wi-Fi, TV, Mini-bar",
          }));
          setRooms(fakeRooms);
          return;
        }
        setRooms(data);
      } catch (err: any) {
        setError(err.message || "Failed to load rooms.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const roomMap = new Map(rooms.map((r) => [r.name, r]));

  const counts = rooms.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const closeDrawer = useCallback(() => setSelectedRoom(null), []);

  const mapStatusLabel = (status: Room["status"]) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.AVAILABLE;
    return {
      label: t(`rooms.status.${status.toLowerCase()}`, cfg.label),
      className: `${cfg.badgeBg} ${cfg.badgeText} border ${cfg.badgeBorder}`,
    };
  };

  /* ── Floor Plan SVG ────────────────────────────────────── */
  const CELL = 28;
  const COLS = 26;
  const ROWS = 26;
  const W = COLS * CELL;
  const H = ROWS * CELL;

  const renderFloorPlan = () => (
    <div className="flex gap-0">
      {/* SVG map container */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6 overflow-auto">
        <svg
          viewBox={`-12 -12 ${W + 24} ${H + 24}`}
          className="w-full block mx-auto"
          style={{ maxWidth: 760 }}
        >
          {/* Building outline */}
          <rect
            x={-6} y={-6} width={W + 12} height={H + 12}
            rx={10} fill="none" stroke="#e2e8f0" strokeWidth={1.2}
            strokeDasharray="8 5"
          />

          {/* Center courtyard */}
          <rect
            x={6 * CELL} y={7 * CELL}
            width={14 * CELL} height={12 * CELL}
            rx={8} fill="#f8fafc" stroke="#e5e7eb" strokeWidth={0.8}
          />
          <text
            x={13 * CELL} y={12.6 * CELL}
            textAnchor="middle" fontSize={10} fill="#94a3b8"
            fontWeight={500} letterSpacing={3}
          >
            AVLU
          </text>
          <text
            x={13 * CELL} y={13.8 * CELL}
            textAnchor="middle" fontSize={8} fill="#cbd5e1"
            letterSpacing={1}
          >
            COURTYARD
          </text>

          {/* Corridor center lines */}
          <line x1={2 * CELL} y1={2.5 * CELL} x2={23 * CELL} y2={2.5 * CELL} stroke="#f1f5f9" strokeWidth={CELL * 0.6} />
          <line x1={2.5 * CELL} y1={3 * CELL} x2={2.5 * CELL} y2={22 * CELL} stroke="#f1f5f9" strokeWidth={CELL * 0.6} />
          <line x1={23.5 * CELL} y1={3 * CELL} x2={23.5 * CELL} y2={25 * CELL} stroke="#f1f5f9" strokeWidth={CELL * 0.6} />

          {/* Corridor label */}
          <text x={13 * CELL} y={2.7 * CELL} textAnchor="middle" fontSize={7} fill="#cbd5e1" letterSpacing={4} fontWeight={500}>
            KORİDOR
          </text>

          {/* Room cells */}
          {FLOOR_LAYOUT.map(([num, col, row, w, h]) => {
            const room = roomMap.get(String(num));
            if (!room) return null;

            const status = room.status as keyof typeof STATUS_CONFIG;
            const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.AVAILABLE;
            const isHovered = hoveredRoom === String(num);
            const isSelected = selectedRoom?.name === String(num);
            const active = isHovered || isSelected;

            const x = col * CELL;
            const y = row * CELL;
            const rw = w * CELL - 3;
            const rh = h * CELL - 3;

            return (
              <g
                key={num}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredRoom(String(num))}
                onMouseLeave={() => setHoveredRoom(null)}
                onClick={() => setSelectedRoom(room)}
              >
                {/* Shadow on hover */}
                {active && (
                  <rect
                    x={x + 3} y={y + 4} width={rw} height={rh} rx={5}
                    fill="rgba(0,0,0,0.06)"
                  />
                )}
                {/* Room rectangle */}
                <rect
                  x={x + 1.5} y={y + 1.5} width={rw} height={rh} rx={5}
                  fill={active ? cfg.bgHover : cfg.bg}
                  stroke={active ? cfg.text : cfg.border}
                  strokeWidth={isSelected ? 2 : active ? 1.5 : 0.8}
                  style={{ transition: "all 0.15s ease" }}
                />
                {/* Room number */}
                <text
                  x={x + 1.5 + rw / 2}
                  y={y + 1.5 + rh / 2 + (room.type === "DOUBLE" ? -2 : 1)}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={rw < 52 ? 10 : 11.5}
                  fontWeight={active ? 700 : 600}
                  fill={cfg.text}
                  style={{ transition: "all 0.12s ease", pointerEvents: "none" }}
                >
                  {num}
                </text>
                {/* Status dot */}
                <circle
                  cx={x + rw - 4} cy={y + 8} r={3}
                  fill={cfg.dot}
                  opacity={active ? 1 : 0.7}
                  style={{ transition: "opacity 0.15s" }}
                />
                {/* Double room badge */}
                {room.type === "DOUBLE" && (
                  <text
                    x={x + 1.5 + rw / 2} y={y + rh - 5}
                    textAnchor="middle" fontSize={7}
                    fill={cfg.text} fontWeight={500} opacity={0.6}
                    style={{ pointerEvents: "none" }}
                  >
                    DOUBLE
                  </text>
                )}
              </g>
            );
          })}

          {/* Floor label */}
          <text x={W / 2} y={H + 8} textAnchor="middle" fontSize={9} fill="#94a3b8" fontWeight={600} letterSpacing={2}>
            KAT 2 — EDU EĞİTİM OTELİ
          </text>
        </svg>
      </div>

      {/* Detail drawer */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          width: selectedRoom ? 320 : 0,
          minWidth: selectedRoom ? 320 : 0,
          marginLeft: selectedRoom ? 16 : 0,
        }}
      >
        {selectedRoom && <RoomDetailDrawer room={selectedRoom} onClose={closeDrawer} t={t} />}
      </div>
    </div>
  );

  /* ── Card Grid View ────────────────────────────────────── */
  const renderGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {rooms.map((room) => {
        const status = mapStatusLabel(room.status);
        return (
          <Card
            key={room.id}
            className="border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedRoom(room)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-gray-900 font-medium text-[15px]">
                    {t("rooms.roomLabel", { number: room.name })}
                  </h4>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {room.type === "DOUBLE" ? "Double Room" : "Single Room"}
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.className}`}>
                  {status.label}
                </span>
              </div>

              <div className="space-y-1.5 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{t("rooms.capacity")}</span>
                  <span className="text-gray-800">
                    {room.capacity} {room.capacity === 1 ? t("rooms.guestSingular") : t("rooms.guestPlural")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{t("rooms.price")}</span>
                  <span className="text-gray-800">₺{room.price}/{t("rooms.perNight")}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 text-xs h-8">
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  {t("commonTable.view")}
                </Button>
                <Button className="flex-1 bg-[#0066cc] hover:bg-[#0052a3] text-white text-xs h-8" disabled>
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  {t("common.edit")}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  /* ── Main Render ───────────────────────────────────────── */
  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h2 className="text-gray-900 text-xl">{t("pages.rooms.title")}</h2>
        <Button className="bg-[#0066cc] hover:bg-[#0052a3] text-white" disabled>
          <Plus className="h-4 w-4 mr-2" />
          {t("rooms.addNewRoom")}
        </Button>
      </div>

      {/* Stats bar + view toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Status summary */}
        <div className="flex items-center gap-4">
          {(["AVAILABLE", "OCCUPIED", "MAINTENANCE"] as const).map((s) => {
            const cfg = STATUS_CONFIG[s];
            const count = counts[s] ?? 0;
            return (
              <div
                key={s}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
                style={{
                  background: cfg.bg,
                  borderColor: cfg.border,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: cfg.dot }}
                />
                <span className="text-xs font-medium" style={{ color: cfg.text }}>
                  {cfg.label}
                </span>
                <span className="text-xs font-bold" style={{ color: cfg.text }}>
                  {count}
                </span>
              </div>
            );
          })}
          <span className="text-xs text-gray-400 ml-1">
            {rooms.length} {t("rooms.totalRooms", "total rooms")}
          </span>
        </div>

        {/* View toggle */}
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("floorplan")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === "floorplan"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <MapIcon className="h-3.5 w-3.5" />
            Floor Plan
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === "grid"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Card View
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-sm text-gray-400">
          {t("rooms.loading", "Loading rooms...")}
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <BedDouble className="h-10 w-10 mb-3 text-gray-300" />
          <p className="text-sm">{t("rooms.empty", "No rooms found.")}</p>
          <p className="text-xs text-gray-300 mt-1">Add rooms to see the floor plan</p>
        </div>
      ) : viewMode === "floorplan" ? (
        renderFloorPlan()
      ) : (
        renderGrid()
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
 *  Room Detail Drawer (slides in from right)
 * ════════════════════════════════════════════════════════════ */
function RoomDetailDrawer({
  room,
  onClose,
  t,
}: {
  room: Room;
  onClose: () => void;
  t: (key: string, fallback?: string | Record<string, any>) => string;
}) {
  const status = room.status as keyof typeof STATUS_CONFIG;
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.AVAILABLE;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Room {room.name}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">Kat 2 · EDU Eğitim Oteli</p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
        >
          <X className="h-3.5 w-3.5 text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-auto px-5 py-4 space-y-4">
        {/* Status badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border"
          style={{
            background: cfg.bg,
            borderColor: cfg.border,
            color: cfg.text,
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: cfg.dot }}
          />
          {cfg.label}
        </div>

        {/* Info rows */}
        <div className="space-y-0">
          {[
            { icon: <BedDouble className="h-4 w-4" />, label: "Room Type", value: room.type === "DOUBLE" ? "Double Room" : "Single Room" },
            { icon: <Users className="h-4 w-4" />, label: t("rooms.capacity", "Capacity"), value: `${room.capacity} ${room.capacity > 1 ? "guests" : "guest"}` },
            { icon: <span className="text-sm font-medium">₺</span>, label: t("rooms.price", "Price"), value: `₺${room.price} / ${t("rooms.perNight", "night")}` },
            { icon: <Wifi className="h-4 w-4" />, label: t("rooms.amenities", "Amenities"), value: room.amenities },
          ].map(({ icon, label, value }) => (
            <div
              key={label}
              className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0"
            >
              <div className="flex items-center gap-2 text-gray-400">
                {icon}
                <span className="text-xs">{label}</span>
              </div>
              <span className="text-xs font-medium text-gray-700 text-right max-w-[160px]">
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Quick occupancy indicator */}
        {room.status === "OCCUPIED" && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-3">
            <p className="text-xs text-red-600 font-medium">Currently Occupied</p>
            <p className="text-xs text-red-400 mt-0.5">View calendar for reservation details</p>
          </div>
        )}

        {room.status === "MAINTENANCE" && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
            <p className="text-xs text-amber-600 font-medium">Under Maintenance</p>
            <p className="text-xs text-amber-400 mt-0.5">Room unavailable for reservations</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 py-4 border-t border-gray-100 space-y-2">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0066cc] hover:bg-[#0052a3] text-white text-xs font-semibold transition-colors">
          <Eye className="h-3.5 w-3.5" />
          View Room Calendar
          <ChevronRight className="h-3.5 w-3.5 ml-auto" />
        </button>
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200 transition-colors">
          <Edit className="h-3.5 w-3.5" />
          Edit Room Details
        </button>
      </div>
    </div>
  );
}