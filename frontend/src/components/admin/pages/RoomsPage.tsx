import { useEffect, useState } from "react";
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Plus, Eye, Edit } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getRooms, type Room } from "../../../api/rooms";

export function RoomsPage() {
  const { t } = useTranslation("admin");

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getRooms();
        setRooms(data);
      } catch (err: any) {
        setError(err.message || "Failed to load rooms.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const mapStatusLabel = (status: Room["status"]) => {
    switch (status) {
      case "AVAILABLE":
        return {
          label: t("rooms.status.available", "Available"),
          className: "bg-green-100 text-green-700",
        };
      case "OCCUPIED":
        return {
          label: t("rooms.status.occupied", "Occupied"),
          className: "bg-blue-100 text-blue-700",
        };
      case "MAINTENANCE":
        return {
          label: t("rooms.status.maintenance", "Maintenance"),
          className: "bg-orange-100 text-orange-700",
        };
      default:
        return { label: status, className: "bg-gray-100 text-gray-700" };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-gray-900 text-xl">
          {t("pages.rooms.title")}
        </h2>
        <Button className="bg-[#0066cc] hover:bg-[#0052a3] text-white" disabled>
          <Plus className="h-4 w-4 mr-2" />
          {t("rooms.addNewRoom")}
        </Button>
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-600">
          {t("rooms.loading", "Loading rooms...")}
        </p>
      ) : rooms.length === 0 ? (
        <p className="text-sm text-gray-600">
          {t("rooms.empty", "No rooms found.")}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => {
            const status = mapStatusLabel(room.status);
            return (
              <Card
                key={room.id}
                className="border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-gray-900 mb-1">
                        {t("rooms.roomLabel", { number: room.name })}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {t("rooms.typeLabel", { type: room.type })}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-3 py-1 rounded-full ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {t("rooms.capacity")}
                      </span>
                      <span className="text-gray-900">
                        {room.capacity}{" "}
                        {room.capacity === 1
                          ? t("rooms.guestSingular")
                          : t("rooms.guestPlural")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {t("rooms.price")}
                      </span>
                      <span className="text-gray-900">
                        ₺{room.price}/{t("rooms.perNight")}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">
                        {t("rooms.amenities")}
                      </span>
                      <p className="text-gray-900 mt-1">
                        {room.amenities}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700">
                      <Eye className="h-4 w-4 mr-2" />
                      {t("commonTable.view")}
                    </Button>
                    <Button className="flex-1 bg-[#0066cc] hover:bg-[#0052a3] text-white" disabled>
                      <Edit className="h-4 w-4 mr-2" />
                      {t("common.edit")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
