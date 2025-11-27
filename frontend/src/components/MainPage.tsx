import { Home, Calendar, User, LogOut, Bell, CheckCircle, Clock, AlertCircle, Bed, Sparkles, Wrench, MessageSquare, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";

export function MainPage() {
  const stats = [
    {
      title: "Upcoming Reservations",
      value: "3",
      icon: Calendar,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Past Reservations",
      value: "12",
      icon: CheckCircle,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Notifications",
      value: "5",
      icon: Bell,
      color: "bg-yellow-50 text-yellow-600",
    },
    {
      title: "Account Status",
      value: "Active",
      icon: AlertCircle,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  const upcomingReservations = [
    {
      date: "Dec 22, 2025",
      room: "Single Room 101",
      duration: "3 nights",
      status: "Confirmed",
    },
    {
      date: "Jan 5, 2026",
      room: "Double Room 205",
      duration: "2 nights",
      status: "Confirmed",
    },
    {
      date: "Jan 18, 2026",
      room: "Single Room 103",
      duration: "1 night",
      status: "Pending",
    },
  ];

  const announcements = [
    {
      title: "Holiday Season Special Rates",
      date: "Dec 15, 2025",
      message: "Enjoy special discounted rates for bookings during the holiday season.",
    },
    {
      title: "New Dining Service Available",
      date: "Dec 10, 2025",
      message: "We now offer in-room dining service from 7 AM to 10 PM daily.",
    },
    {
      title: "Maintenance Notice",
      date: "Dec 8, 2025",
      message: "Pool will be under maintenance on Dec 20-21. Thank you for your understanding.",
    },
  ];

  const quickActions = [
    {
      title: "Book a Room",
      icon: Bed,
      color: "bg-[#003366] hover:bg-[#002244] text-white",
      link: "/dashboard",
    },
    {
      title: "Request Cleaning",
      icon: Sparkles,
      color: "bg-white hover:bg-gray-50 text-[#003366] border-2 border-[#003366]",
    },
    {
      title: "Report an Issue",
      icon: Wrench,
      color: "bg-white hover:bg-gray-50 text-[#003366] border-2 border-[#003366]",
    },
    {
      title: "Contact Support Staff",
      icon: MessageSquare,
      color: "bg-white hover:bg-gray-50 text-[#003366] border-2 border-[#003366]",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Top Navigation Bar */}
      <header className="bg-[#003366] text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="border-2 border-white px-3 py-1">
                <div className="text-xs">Sabancı</div>
                <div className="text-xs">Üniversitesi</div>
              </div>
              <span className="tracking-wider">EDU HOTEL</span>
            </div>

            {/* Navigation Links */}
            <nav className="flex items-center gap-6">
              <Link to="/user-dashboard" className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors">
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
              <Link to="/dashboard" className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors">
                <Calendar className="h-4 w-4" />
                <span>Reservations</span>
              </Link>
              <button className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors">
                <User className="h-4 w-4" />
                <span>My Profile</span>
              </button>
              <Link to="/" className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-gray-900 mb-2">Welcome back!</h1>
        </div>

        {/* Quick Actions and Announcements in two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions Section */}
          <Card className="border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-8">
              <h3 className="text-gray-900 mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  const content = (
                    <>
                      <Icon className="h-5 w-5 mb-2" />
                      <span className="text-sm">{action.title}</span>
                    </>
                  );

                  return action.link ? (
                    <Link
                      key={index}
                      to={action.link}
                      className={`${action.color} p-6 rounded-xl flex flex-col items-center justify-center text-center transition-all`}
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      key={index}
                      className={`${action.color} p-6 rounded-xl flex flex-col items-center justify-center text-center transition-all`}
                    >
                      {content}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Announcements Section */}
          <Card className="border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-8">
              <h3 className="text-gray-900 mb-6">Announcements</h3>
              <div className="space-y-4">
                {announcements.map((announcement, index) => (
                  <div
                    key={index}
                    className="bg-blue-50 p-4 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-gray-900 text-sm">{announcement.title}</h4>
                      <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </div>
                    <p className="text-gray-600 text-xs mb-2">{announcement.message}</p>
                    <p className="text-gray-500 text-xs">{announcement.date}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#003366] text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            <div>
              <div className="border-2 border-white px-3 py-1 inline-block mb-3">
                <div className="text-xs">Sabancı</div>
                <div className="text-xs">Üniversitesi</div>
              </div>
              <p className="text-sm text-gray-300">
                Orta Mahalle, Üniversite Caddesi No: 27<br />
                Tuzla, İstanbul 34956 Turkey
              </p>
            </div>
            <div>
              <h4 className="mb-3 text-sm">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Services</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>Phone: +90 (216) 483 9000</li>
                <li>Email: hotel@sabanciuniv.edu</li>
                <li>Support: support@sabanciuniv.edu</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-blue-800 pt-6 text-center text-sm text-gray-300">
            <p>&copy; 2025 Edu Hotel Management System - Sabancı University. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}