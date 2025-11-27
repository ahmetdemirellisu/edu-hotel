import { Navbar } from "./layout/Navbar";
import { Footer } from "./layout/Footer";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Wifi, Coffee, Tv, Wind, Users as GuestsIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function BookRoomPage() {
  const { t } = useTranslation();

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("1");

  const rooms = [
    {
      id: 1,
      name: t("dashboard.rooms.single"),
      price: 120,
      capacity: 1,
      image: "bedroom single",
      description: t("dashboard.rooms.singleDesc"),
      amenities: ["Wifi", "TV", "AC", "Coffee"],
      available: true,
    },
    {
      id: 2,
      name: t("dashboard.rooms.double"),
      price: 180,
      capacity: 2,
      image: "bedroom double",
      description: t("dashboard.rooms.doubleDesc"),
      amenities: ["Wifi", "TV", "AC", "Coffee"],
      available: true,
    },
  ];

  const icons = { Wifi, TV: Tv, AC: Wind, Coffee };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <h1 className="mb-6">{t("dashboard.search.title")}</h1>

        {/* Search */}
        <div className="p-6 bg-white rounded-xl shadow mb-10">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label>{t("dashboard.search.checkIn")}</label>
              <input type="date" className="w-full border p-2"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)} />
            </div>

            <div>
              <label>{t("dashboard.search.checkOut")}</label>
              <input type="date" className="w-full border p-2"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)} />
            </div>

            <div>
              <label>{t("dashboard.search.guests")}</label>
              <select className="w-full border p-2"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}>
                <option>1</option><option>2</option><option>3</option>
              </select>
            </div>

            <Button className="bg-[#003366] text-white">
              {t("dashboard.search.button")}
            </Button>
          </div>
        </div>

        {/* Rooms */}
        <div className="grid grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Card key={room.id} className="shadow">
              <div className="aspect-video bg-gray-200">
                <img className="w-full h-full object-cover"
                     src={`https://source.unsplash.com/800x600/?${room.image}`} />
              </div>

              <CardContent>
                <h3 className="text-lg font-semibold">{room.name}</h3>
                <p className="text-sm text-gray-600">{room.description}</p>

                <div className="flex gap-3 my-3">
                  <GuestsIcon className="h-4 w-4" />
                  <span>{t("dashboard.roomsSection.capacity", { count: room.capacity })}</span>
                </div>

                <div className="flex gap-3">
                  {room.amenities.map((a) => {
                    const Icon = icons[a];
                    return (
                      <div key={a} className="flex items-center gap-1 text-gray-600">
                        <Icon className="h-4 w-4" />
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center mt-4">
                  <p className="font-semibold">${room.price}</p>
                  <Button className="bg-[#003366] text-white">
                    {t("dashboard.roomsSection.bookNow")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
