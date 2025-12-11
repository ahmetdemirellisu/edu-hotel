// src/components/admin/pages/RoomsPage.tsx
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Plus, Eye, Edit } from "lucide-react";
import { useTranslation } from "react-i18next";

export function RoomsPage() {
  const { t } = useTranslation("admin");

  const rooms = [
    {
      number: "101",
      type: "Single",
      capacity: 1,
      status: "Occupied",
      price: 120,
      amenities: "WiFi, TV, AC"
    },
    {
      number: "102",
      type: "Single",
      capacity: 1,
      status: "Available",
      price: 120,
      amenities: "WiFi, TV, AC"
    },
    {
      number: "103",
      type: "Single",
      capacity: 1,
      status: "Maintenance",
      price: 120,
      amenities: "WiFi, TV, AC"
    },
    {
      number: "201",
      type: "Double",
      capacity: 2,
      status: "Occupied",
      price: 180,
      amenities: "WiFi, TV, AC, Coffee"
    },
    {
      number: "202",
      type: "Double",
      capacity: 2,
      status: "Available",
      price: 180,
      amenities: "WiFi, TV, AC, Coffee"
    },
    {
      number: "203",
      type: "Double",
      capacity: 2,
      status: "Occupied",
      price: 180,
      amenities: "WiFi, TV, AC, Coffee"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-gray-900 text-xl">
          {t("pages.rooms.title")}
        </h2>
        <Button className="bg-[#0066cc] hover:bg-[#0052a3] text-white">
          <Plus className="h-4 w-4 mr-2" />
          {t("rooms.addNewRoom")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <Card
            key={room.number}
            className="border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-gray-900 mb-1">
                    {t("rooms.roomLabel", { number: room.number })}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {t("rooms.typeLabel", { type: room.type })}
                  </p>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full ${
                    room.status === "Available"
                      ? "bg-green-100 text-green-700"
                      : room.status === "Occupied"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {room.status}
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
                    ${room.price}/{t("rooms.perNight")}
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
                <Button className="flex-1 bg-[#0066cc] hover:bg-[#0052a3] text-white">
                  <Edit className="h-4 w-4 mr-2" />
                  {t("common.edit")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
