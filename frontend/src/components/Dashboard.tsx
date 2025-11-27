import { Search, Home, Bell, User, Wifi, Coffee, Tv, Wind, LogOut, Calendar, Users as GuestsIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useState } from "react";

export function Dashboard() {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("1");

  const rooms = [
    {
      id: 1,
      name: "Single Room",
      price: 120,
      capacity: 1,
      image: "bedroom single",
      amenities: ["Wifi", "TV", "AC", "Coffee"],
      description: "Comfortable single room perfect for solo travelers",
      available: true,
    },
    {
      id: 2,
      name: "Single Room",
      price: 120,
      capacity: 1,
      image: "bedroom single modern",
      amenities: ["Wifi", "TV", "AC", "Coffee"],
      description: "Comfortable single room perfect for solo travelers",
      available: true,
    },
    {
      id: 3,
      name: "Single Room",
      price: 120,
      capacity: 1,
      image: "bedroom single hotel",
      amenities: ["Wifi", "TV", "AC", "Coffee"],
      description: "Comfortable single room perfect for solo travelers",
      available: false,
    },
    {
      id: 4,
      name: "Double Room",
      price: 180,
      capacity: 2,
      image: "bedroom double",
      amenities: ["Wifi", "TV", "AC", "Coffee"],
      description: "Spacious double room with modern amenities for two guests",
      available: true,
    },
    {
      id: 5,
      name: "Double Room",
      price: 180,
      capacity: 2,
      image: "bedroom double hotel",
      amenities: ["Wifi", "TV", "AC", "Coffee"],
      description: "Spacious double room with modern amenities for two guests",
      available: true,
    },
    {
      id: 6,
      name: "Double Room",
      price: 180,
      capacity: 2,
      image: "bedroom double modern",
      amenities: ["Wifi", "TV", "AC", "Coffee"],
      description: "Spacious double room with modern amenities for two guests",
      available: true,
    },
  ];

  const amenityIcons: { [key: string]: any } = {
    Wifi: Wifi,
    TV: Tv,
    AC: Wind,
    Coffee: Coffee,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="bg-[#003366] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="border-2 border-white px-3 py-1">
                <div className="text-sm">Sabancı</div>
                <div className="text-sm">Üniversitesi</div>
              </div>
            </div>
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className="text-white tracking-widest">E D U   H O T E L</h1>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <button className="hover:text-gray-300 transition-colors relative">
                <Bell className="h-5 w-5" />
              </button>
              <button className="hover:text-gray-300 transition-colors">
                <User className="h-5 w-5" />
              </button>
              <Link to="/" className="hover:text-gray-300 transition-colors">
                <LogOut className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 py-4">
            <a href="#" className="text-[#003366] hover:text-[#002244] transition-colors flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span>Book a Room</span>
            </a>
            <a href="#" className="text-gray-600 hover:text-[#003366] transition-colors">
              My Bookings
            </a>
            <a href="#" className="text-gray-600 hover:text-[#003366] transition-colors">
              Services
            </a>
            <a href="#" className="text-gray-600 hover:text-[#003366] transition-colors">
              Contact
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <Card className="border-gray-200 mb-8">
          <CardContent className="p-6">
            <h2 className="text-gray-900 mb-6">Find Your Perfect Room</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkIn">Check In</Label>
                <Input
                  id="checkIn"
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOut">Check Out</Label>
                <Input
                  id="checkOut"
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guests">Guests</Label>
                <select
                  id="guests"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003366]"
                >
                  <option value="1">1 Guest</option>
                  <option value="2">2 Guests</option>
                  <option value="3">3 Guests</option>
                  <option value="4">4+ Guests</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button className="w-full bg-[#003366] hover:bg-[#002244] text-white">
                  Search Rooms
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Welcome Message */}
        <div className="mb-6">
          <h3 className="text-gray-900 mb-2">Available Rooms</h3>
          <p className="text-gray-600">Choose from our selection of comfortable and well-equipped rooms</p>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Card key={room.id} className={`border-gray-200 overflow-hidden ${!room.available ? 'opacity-60' : ''}`}>
              <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 relative">
                <img
                  src={`https://source.unsplash.com/800x600/?${room.image.replace(/ /g, ',')}`}
                  alt={room.name}
                  className="w-full h-full object-cover"
                />
                {!room.available && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs">
                    Booked
                  </div>
                )}
              </div>
              <CardContent className="p-6">
                <div className="mb-4">
                  <h4 className="text-gray-900 mb-2">{room.name}</h4>
                  <p className="text-gray-600 text-sm mb-3">{room.description}</p>
                  <div className="flex items-center gap-2 text-gray-600 text-sm mb-3">
                    <GuestsIcon className="h-4 w-4" />
                    <span>Up to {room.capacity} {room.capacity === 1 ? 'Guest' : 'Guests'}</span>
                  </div>
                  <div className="flex gap-3 mb-4">
                    {room.amenities.map((amenity) => {
                      const Icon = amenityIcons[amenity];
                      return (
                        <div key={amenity} className="flex items-center gap-1 text-gray-600 text-sm">
                          <Icon className="h-4 w-4" />
                          <span>{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-900">${room.price}</span>
                    <span className="text-gray-600 text-sm"> / night</span>
                  </div>
                  <Button 
                    className="bg-[#003366] hover:bg-[#002244] text-white"
                    disabled={!room.available}
                  >
                    {room.available ? 'Book Now' : 'Unavailable'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="bg-[#003366] p-3 rounded-lg inline-block mb-4">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-gray-900 mb-2">Flexible Booking</h4>
              <p className="text-gray-600 text-sm">Free cancellation up to 24 hours before check-in</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="bg-[#003366] p-3 rounded-lg inline-block mb-4">
                <Wifi className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-gray-900 mb-2">Free Amenities</h4>
              <p className="text-gray-600 text-sm">Complimentary WiFi, breakfast, and parking for all guests</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="bg-[#003366] p-3 rounded-lg inline-block mb-4">
                <User className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-gray-900 mb-2">24/7 Support</h4>
              <p className="text-gray-600 text-sm">Our team is always available to assist you</p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#003366] text-white py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="border-2 border-white px-3 py-1 inline-block mb-4">
                <div className="text-sm">Sabancı</div>
                <div className="text-sm">Üniversitesi</div>
              </div>
              <p className="text-sm text-gray-300 mt-4">
                Orta Mahalle, Üniversite Caddesi No: 27<br />
                Tuzla, İstanbul 34956 Turkey
              </p>
            </div>
            <div>
              <h3 className="mb-4 text-sm">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Rooms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Services</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm">Policies</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Cancellation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm">Contact</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>Phone: +90 (216) 483 9000</li>
                <li>Email: hotel@sabanciuniv.edu</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-blue-800 pt-8 text-center text-sm text-gray-300">
            <p>&copy; 2025 Edu Hotel Management System - Sabancı University. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}