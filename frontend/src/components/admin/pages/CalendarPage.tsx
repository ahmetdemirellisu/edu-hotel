// src/components/admin/pages/CalendarPage.tsx
import { Card, CardContent } from "../../ui/card";
import { useTranslation } from "react-i18next";

export function CalendarPage() {
  const { t } = useTranslation("admin");

  const rooms = [
    { number: "101", type: "Single" },
    { number: "102", type: "Single" },
    { number: "103", type: "Single" },
    { number: "201", type: "Double" },
    { number: "202", type: "Double" },
    { number: "203", type: "Double" },
  ];

  const dates = ["Dec 1", "Dec 2", "Dec 3", "Dec 4", "Dec 5", "Dec 6", "Dec 7"];

  const bookings = [
    {
      room: "101",
      start: 0,
      duration: 3,
      status: "confirmed",
      guest: "Zeynep Arslan",
    },
    {
      room: "201",
      start: 1,
      duration: 4,
      status: "confirmed",
      guest: "Can Özdemir",
    },
    {
      room: "203",
      start: 0,
      duration: 10,
      status: "confirmed",
      guest: "Selin Yıldız",
    },
    {
      room: "102",
      start: 4,
      duration: 3,
      status: "pending",
      guest: "Ahmet Yılmaz",
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">
              {t("pages.calendar.roomOccupancyCalendar")}
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 bg-yellow-400 rounded" />
                <span className="text-gray-600">
                  {t("pages.calendar.legend.pending")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 bg-green-500 rounded" />
                <span className="text-gray-600">
                  {t("pages.calendar.legend.confirmed")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 bg-blue-500 rounded" />
                <span className="text-gray-600">
                  {t("pages.calendar.legend.checkedIn")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 bg-red-500 rounded" />
                <span className="text-gray-600">
                  {t("pages.calendar.legend.canceled")}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Header with dates */}
              <div className="flex border-b border-gray-200">
                <div className="w-32 flex-shrink-0 p-3 text-sm text-gray-900 border-r border-gray-200">
                  {t("pages.calendar.room")}
                </div>
                {dates.map((date, idx) => (
                  <div
                    key={idx}
                    className="flex-1 min-w-[100px] p-3 text-center text-sm text-gray-600 border-r border-gray-200"
                  >
                    {date}
                  </div>
                ))}
              </div>

              {/* Rooms with bookings */}
              {rooms.map((room) => {
                const roomBookings = bookings.filter(
                  (b) => b.room === room.number
                );
                return (
                  <div
                    key={room.number}
                    className="flex border-b border-gray-100"
                  >
                    <div className="w-32 flex-shrink-0 p-3 border-r border-gray-200">
                      <p className="text-sm text-gray-900">{room.number}</p>
                      <p className="text-xs text-gray-500">{room.type}</p>
                    </div>
                    <div className="flex-1 relative" style={{ height: "60px" }}>
                      <div className="grid grid-cols-7 h-full">
                        {dates.map((_, idx) => (
                          <div
                            key={idx}
                            className="border-r border-gray-100"
                          />
                        ))}
                      </div>
                      {roomBookings.map((booking, idx) => (
                        <div
                          key={idx}
                          className={`absolute top-2 rounded px-2 py-1 text-xs text-white cursor-pointer hover:opacity-80 ${
                            booking.status === "pending"
                              ? "bg-yellow-400"
                              : booking.status === "confirmed"
                              ? "bg-green-500"
                              : "bg-blue-500"
                          }`}
                          style={{
                            left: `${(booking.start / 7) * 100}%`,
                            width: `${(booking.duration / 7) * 100}%`,
                          }}
                          title={booking.guest}
                        >
                          {booking.guest}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
