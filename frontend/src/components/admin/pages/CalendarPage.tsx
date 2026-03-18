// src/components/admin/pages/CalendarPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getRooms, type Room } from "../../../api/rooms";
import {
  getAdminReservations,
  type ReservationStatus,
  type Reservation,
} from "../../../api/reservations";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

type AdminReservation = Reservation & {
  room?: {
    id: number;
    name: string;
    type: string;
  } | null;
};

function diffInDays(a: Date, b: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((a.getTime() - b.getTime()) / msPerDay);
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  APPROVED: { bg: "#dcfce7", text: "#166534", border: "#86efac", gradient: "linear-gradient(90deg, #22c55e, #16a34a)" },
  PENDING:  { bg: "#fef9c3", text: "#854d0e", border: "#fde047", gradient: "linear-gradient(90deg, #eab308, #ca8a04)" },
  CANCELLED: { bg: "#f3f4f6", text: "#6b7280", border: "#d1d5db", gradient: "linear-gradient(90deg, #9ca3af, #6b7280)" },
  REJECTED:  { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5", gradient: "linear-gradient(90deg, #ef4444, #dc2626)" },
};

export function CalendarPage() {
  const { t, i18n } = useTranslation("admin");

  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredBooking, setHoveredBooking] = useState<number | null>(null);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [roomData, reservationData] = await Promise.all([
          getRooms(),
          getAdminReservations(),
        ]);
        setRooms(roomData);
        setReservations(reservationData as AdminReservation[]);
      } catch (err: any) {
        setError(err.message || "Failed to load calendar data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const locale = i18n.language === "tr" ? "tr-TR" : "en-US";

  const { daysInMonth, dayLabels, monthLabel } = useMemo(() => {
    const year = month.getFullYear();
    const m = month.getMonth();
    const days = new Date(year, m + 1, 0).getDate();

    const labels = Array.from({ length: days }, (_, i) => {
      const d = new Date(year, m, i + 1);
      const day = d.getDate();
      const weekday = d.toLocaleDateString(locale, { weekday: "narrow" });
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      return { text: `${day}`, weekday, isWeekend, isToday: false };
    });

    // Mark today
    const today = new Date();
    if (today.getFullYear() === year && today.getMonth() === m) {
      const idx = today.getDate() - 1;
      if (labels[idx]) labels[idx].isToday = true;
    }

    const monthText = month.toLocaleDateString(locale, {
      month: "long",
      year: "numeric",
    });

    return { daysInMonth: days, dayLabels: labels, monthLabel: monthText };
  }, [month, locale]);

  const bookingsByRoom = useMemo(() => {
    const monthStart = month;
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);

    const map: Record<number, Array<{
      id: number;
      startIndex: number;
      duration: number;
      status: ReservationStatus;
      guestLabel: string;
      tooltip: string;
    }>> = {};

    reservations
      .filter(
        (r) =>
          ["APPROVED", "PENDING"].includes(r.status) &&
          r.room &&
          r.room.id &&
          new Date(r.checkIn) < monthEnd &&
          new Date(r.checkOut) > monthStart
      )
      .forEach((r) => {
        const roomId = r.room!.id;
        const resCheckIn = new Date(r.checkIn);
        const resCheckOut = new Date(r.checkOut);

        const visibleStart = resCheckIn < monthStart ? monthStart : resCheckIn;
        const visibleEnd = resCheckOut > monthEnd ? monthEnd : resCheckOut;

        const startIndex = diffInDays(visibleStart, monthStart);
        const duration = diffInDays(visibleEnd, visibleStart) || 1;

        const firstName = (r as any).firstName || "";
        const lastName = (r as any).lastName || "";
        const guestName = `${firstName} ${lastName}`.trim();
        const guestLabel = guestName || r.eventCode || `#${r.id}`;

        const checkInStr = resCheckIn.toISOString().slice(0, 10);
        const checkOutStr = resCheckOut.toISOString().slice(0, 10);
        const tooltip = `#${r.id} · ${guestLabel}\n${checkInStr} → ${checkOutStr}\n${r.guests} guest(s) · ${r.status}`;

        if (!map[roomId]) map[roomId] = [];
        map[roomId].push({ id: r.id, startIndex, duration, status: r.status, guestLabel, tooltip });
      });

    return map;
  }, [reservations, month]);

  const goPrevMonth = () => setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const goNextMonth = () => setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const goToday = () => { const now = new Date(); setMonth(new Date(now.getFullYear(), now.getMonth(), 1)); };

  const totalBookings = Object.values(bookingsByRoom).reduce((sum, arr) => sum + arr.length, 0);
  const occupiedRoomCount = Object.keys(bookingsByRoom).length;

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes calIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Header ───────────────────────────────── */}
      <div className="flex items-center gap-3" style={{ animation: "calIn 0.3s ease-out" }}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#003366] to-[#0055aa] flex items-center justify-center shadow-md">
          <Calendar className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-[28px] font-semibold text-[#003366] tracking-tight leading-tight">
            {t("pages.calendar.roomOccupancyCalendar", "Room Occupancy Calendar")}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {monthLabel} · {t("pages.calendar.bookings", { count: totalBookings, defaultValue: `${totalBookings} bookings` })} · {t("pages.calendar.roomsOccupied", { occupied: occupiedRoomCount, total: rooms.length, defaultValue: `${occupiedRoomCount}/${rooms.length} rooms occupied` })}
          </p>
        </div>
      </div>

      {/* ── Calendar Card ────────────────────────── */}
      <div
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        style={{ animation: "calIn 0.35s ease-out" }}
      >
        {/* Calendar toolbar */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/40 flex flex-wrap items-center justify-between gap-3">
          {/* Month display */}
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-extrabold text-gray-900 capitalize tracking-tight">{monthLabel}</h3>
            {/* Legend */}
            <div className="hidden md:flex items-center gap-3">
              {[
                { label: t("pages.calendar.legend.approved", "Approved"), key: "APPROVED" },
                { label: t("pages.calendar.legend.pending", "Pending"),   key: "PENDING" },
              ].map(({ label, key }) => {
                const color = STATUS_COLORS[key];
                return (
                  <div key={key} className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                    <div
                      className="w-3 h-3 rounded-md"
                      style={{ background: color.bg, border: `1.5px solid ${color.border}` }}
                    />
                    {label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={goPrevMonth}
              className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 flex items-center justify-center transition-colors shadow-sm"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={goToday}
              className="px-4 h-9 rounded-xl bg-gradient-to-r from-[#003366] to-[#0055aa] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all duration-150"
            >
              {t("pages.calendar.today", "Today")}
            </button>
            <button
              onClick={goNextMonth}
              className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 flex items-center justify-center transition-colors shadow-sm"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border-b border-red-100 px-6 py-3">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center h-56">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-gray-500 font-medium">Loading calendar…</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <Calendar className="h-7 w-7 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-500">{t("pages.calendar.empty", "No rooms found.")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div style={{ minWidth: `${140 + daysInMonth * 44}px` }}>
              {/* Date header */}
              <div className="flex bg-gray-50/80 border-b border-gray-100 sticky top-0 z-10">
                <div className="w-[140px] flex-shrink-0 px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-r border-gray-100 flex items-center">
                  {t("pages.calendar.room", "Room")}
                </div>
                {dayLabels.map((day, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 min-w-[44px] py-2 text-center border-r border-gray-100 last:border-r-0 transition-colors ${
                      day.isToday ? "bg-blue-50" : day.isWeekend ? "bg-gray-50/60" : ""
                    }`}
                  >
                    <div className={`text-[9px] font-bold uppercase tracking-widest ${day.isWeekend ? "text-rose-400" : "text-gray-400"}`}>
                      {day.weekday}
                    </div>
                    <div className={`mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mx-auto ${
                      day.isToday
                        ? "bg-blue-600 text-white shadow-sm"
                        : day.isWeekend
                          ? "text-rose-500"
                          : "text-gray-700"
                    }`}>
                      {day.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Room rows */}
              {rooms.map((room, rowIdx) => {
                const roomBookings = bookingsByRoom[Number(room.id)] || [];
                const hasBookings = roomBookings.length > 0;
                return (
                  <div
                    key={room.id}
                    className={`flex border-b border-gray-50 last:border-b-0 transition-colors duration-150 ${
                      rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50/20"
                    } hover:bg-blue-50/10`}
                  >
                    {/* Room label */}
                    <div className="w-[140px] flex-shrink-0 px-4 py-2.5 border-r border-gray-100 flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${hasBookings ? "bg-red-400" : "bg-emerald-400"}`} />
                      <div>
                        <p className="text-xs font-bold text-gray-800">{room.name}</p>
                        <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wide">{room.type}</p>
                      </div>
                    </div>

                    {/* Day cells with bookings */}
                    <div className="flex-1 relative" style={{ height: 46 }}>
                      {/* Grid lines */}
                      <div className="grid h-full absolute inset-0" style={{ gridTemplateColumns: `repeat(${daysInMonth}, minmax(44px, 1fr))` }}>
                        {dayLabels.map((day, idx) => (
                          <div
                            key={idx}
                            className={`border-r border-gray-50 last:border-r-0 ${day.isToday ? "bg-blue-50/40" : ""}`}
                          />
                        ))}
                      </div>

                      {/* Booking bars */}
                      {roomBookings.map((booking) => {
                        const colors = STATUS_COLORS[booking.status] || STATUS_COLORS.APPROVED;
                        const isHovered = hoveredBooking === booking.id;
                        const isPending = booking.status === "PENDING";

                        return (
                          <div
                            key={booking.id}
                            className="absolute top-2 rounded-lg px-2 py-0.5 text-[10px] font-semibold cursor-pointer truncate"
                            style={{
                              left: `calc(${(booking.startIndex / daysInMonth) * 100}% + 1px)`,
                              width: `calc(${(booking.duration / daysInMonth) * 100}% - 2px)`,
                              background: isHovered ? colors.gradient : colors.bg,
                              color: isHovered ? "#fff" : colors.text,
                              border: `1.5px solid ${colors.border}`,
                              height: 28,
                              lineHeight: "24px",
                              zIndex: isHovered ? 20 : 10,
                              transform: isHovered ? "scaleY(1.08)" : "scale(1)",
                              transformOrigin: "center",
                              boxShadow: isHovered ? "0 2px 12px rgba(0,0,0,0.15)" : "0 1px 2px rgba(0,0,0,0.05)",
                              transition: "all 0.15s ease",
                              outline: isPending && !isHovered ? `1.5px dashed ${colors.border}` : "none",
                            }}
                            title={booking.tooltip}
                            onMouseEnter={() => setHoveredBooking(booking.id)}
                            onMouseLeave={() => setHoveredBooking(null)}
                          >
                            {booking.guestLabel}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer stats */}
        {!loading && rooms.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/30 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              {t("pages.calendar.legend.approved", "Approved")}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <div className="w-2 h-2 rounded-full bg-amber-400" style={{ border: "1.5px dashed #ca8a04" }} />
              {t("pages.calendar.legend.pending", "Pending")}
            </div>
            <span className="text-xs text-gray-400 ml-auto">{rooms.length} rooms · {totalBookings} active bookings</span>
          </div>
        )}
      </div>
    </div>
  );
}
