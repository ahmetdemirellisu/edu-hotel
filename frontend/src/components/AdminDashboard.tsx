import { useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  Bed,
  Users,
  CreditCard,
  UserX,
  FileText,
  Shield,
  Settings,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Download,
  Filter,
  TrendingUp,
  Clock,
  DollarSign,
  Home,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Link } from "react-router-dom";

type PageType = 
  | "dashboard" 
  | "reservations" 
  | "calendar" 
  | "rooms" 
  | "guests" 
  | "payments" 
  | "blacklist" 
  | "reports" 
  | "admin-users" 
  | "settings";

export function AdminDashboard() {
  const [activePage, setActivePage] = useState<PageType>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [language, setLanguage] = useState<"EN" | "TR">("EN");

  const menuItems = [
    { id: "dashboard" as PageType, label: "Dashboard", icon: LayoutDashboard },
    { id: "reservations" as PageType, label: "Reservations", icon: Calendar, badge: 8 },
    { id: "calendar" as PageType, label: "Calendar", icon: Calendar },
    { id: "rooms" as PageType, label: "Rooms", icon: Bed },
    { id: "guests" as PageType, label: "Guests", icon: Users },
    { id: "payments" as PageType, label: "Payments", icon: CreditCard },
    { id: "blacklist" as PageType, label: "Blacklist", icon: UserX },
    { id: "reports" as PageType, label: "Reports", icon: FileText },
    { id: "admin-users" as PageType, label: "Admin Users", icon: Shield },
    { id: "settings" as PageType, label: "Settings", icon: Settings },
  ];

  const pageTitles: Record<PageType, string> = {
    dashboard: "Dashboard Overview",
    reservations: "Reservation Management",
    calendar: "Calendar View",
    rooms: "Room Management",
    guests: "Guest Management",
    payments: "Payment Management",
    blacklist: "Blacklist Management",
    reports: "Reports & Analytics",
    "admin-users": "Admin User Management",
    settings: "System Settings",
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarCollapsed ? "w-20" : "w-64"
        } bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shadow-sm`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200 px-4">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2">
              <div className="bg-[#0066cc] p-2 rounded-lg">
                <Home className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-gray-900">EDU HOTEL</h2>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            </div>
          ) : (
            <div className="bg-[#0066cc] p-2 rounded-lg">
              <Home className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors relative ${
                  isActive
                    ? "bg-blue-50 text-[#0066cc] border-r-4 border-[#0066cc]"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="text-sm">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="h-12 border-t border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          )}
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-gray-900 text-xl">{pageTitles[activePage]}</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search..."
                className="pl-10 w-64"
              />
            </div>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setLanguage("EN")}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  language === "EN"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("TR")}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  language === "TR"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                TR
              </button>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  3
                </span>
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {[
                      { text: "New reservation request from Ahmet Yılmaz", time: "5 min ago" },
                      { text: "Payment received for Room 201", time: "1 hour ago" },
                      { text: "Check-out scheduled for Room 103", time: "2 hours ago" },
                    ].map((notif, idx) => (
                      <div key={idx} className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                        <p className="text-sm text-gray-900">{notif.text}</p>
                        <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
              >
                <div className="w-8 h-8 bg-[#0066cc] rounded-full flex items-center justify-center text-white">
                  AD
                </div>
                <div className="text-left">
                  <p className="text-sm text-gray-900">Admin User</p>
                  <p className="text-xs text-gray-500">Super Admin</p>
                </div>
              </button>
              {showProfile && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-2">
                    <button className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm text-gray-700">
                      Profile Settings
                    </button>
                    <button className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm text-gray-700">
                      Change Password
                    </button>
                    <Link
                      to="/"
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm text-red-600 block"
                    >
                      Logout
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {activePage === "dashboard" && <DashboardPage />}
          {activePage === "reservations" && <ReservationsPage />}
          {activePage === "calendar" && <CalendarPage />}
          {activePage === "rooms" && <RoomsPage />}
          {activePage === "guests" && <GuestsPage />}
          {activePage === "payments" && <PaymentsPage />}
          {activePage === "blacklist" && <BlacklistPage />}
          {activePage === "reports" && <ReportsPage />}
          {activePage === "admin-users" && <AdminUsersPage />}
          {activePage === "settings" && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}

// Dashboard Page Component
function DashboardPage() {
  const kpiCards = [
    { label: "Pending Reservations", value: "8", icon: Clock, color: "bg-yellow-500", change: "+2" },
    { label: "Approved Reservations", value: "24", icon: CheckCircle, color: "bg-green-500", change: "+5" },
    { label: "Guests Currently Staying", value: "15", icon: Users, color: "bg-blue-500", change: "-3" },
    { label: "Available Rooms", value: "12", icon: Bed, color: "bg-purple-500", change: "0" },
  ];

  const quickActions = [
    { label: "Create Reservation", icon: Plus, color: "bg-[#0066cc]" },
    { label: "View Calendar", icon: Calendar, color: "bg-green-600" },
    { label: "Add Room", icon: Bed, color: "bg-purple-600" },
    { label: "Report Center", icon: FileText, color: "bg-orange-600" },
  ];

  const latestReservations = [
    { id: "RES-001", guest: "Ahmet Yılmaz", checkIn: "2025-12-05", checkOut: "2025-12-08", status: "Pending", payment: "Pending" },
    { id: "RES-002", guest: "Elif Demir", checkIn: "2025-12-10", checkOut: "2025-12-15", status: "Approved", payment: "Paid" },
    { id: "RES-003", guest: "Mehmet Kaya", checkIn: "2025-12-01", checkOut: "2025-12-03", status: "Approved", payment: "Paid" },
    { id: "RES-004", guest: "Zeynep Arslan", checkIn: "2025-11-27", checkOut: "2025-11-30", status: "Checked-In", payment: "Paid" },
    { id: "RES-005", guest: "Can Özdemir", checkIn: "2025-11-28", checkOut: "2025-12-02", status: "Checked-In", payment: "Paid" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card key={idx} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">{card.label}</p>
                    <p className="text-3xl text-gray-900 mb-1">{card.value}</p>
                    <p className="text-xs text-gray-500">
                      <span className={card.change.startsWith("+") ? "text-green-600" : card.change.startsWith("-") ? "text-red-600" : "text-gray-600"}>
                        {card.change}
                      </span>{" "}
                      from yesterday
                    </p>
                  </div>
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {quickActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <button
                  key={idx}
                  className={`${action.color} text-white p-4 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-3`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm">{action.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Latest Reservations and Occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Reservations Table */}
        <Card className="border-gray-200 shadow-sm lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900">Latest Reservations</h3>
              <button className="text-sm text-[#0066cc] hover:underline">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-sm text-gray-600">Guest Name</th>
                    <th className="text-left py-3 px-2 text-sm text-gray-600">Check-In</th>
                    <th className="text-left py-3 px-2 text-sm text-gray-600">Check-Out</th>
                    <th className="text-left py-3 px-2 text-sm text-gray-600">Status</th>
                    <th className="text-left py-3 px-2 text-sm text-gray-600">Payment</th>
                    <th className="text-left py-3 px-2 text-sm text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {latestReservations.map((res, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2 text-sm text-gray-900">{res.guest}</td>
                      <td className="py-3 px-2 text-sm text-gray-600">{res.checkIn}</td>
                      <td className="py-3 px-2 text-sm text-gray-600">{res.checkOut}</td>
                      <td className="py-3 px-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            res.status === "Pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : res.status === "Approved"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {res.status}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            res.payment === "Pending"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {res.payment}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <button className="text-[#0066cc] hover:underline text-sm">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Rooms Occupancy Widget */}
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-gray-900 mb-4">Room Occupancy</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Occupancy Rate</span>
                  <span className="text-sm text-gray-900">62.5%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-[#0066cc] h-2 rounded-full" style={{ width: "62.5%" }}></div>
                </div>
              </div>
              <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Occupied</span>
                  <span className="text-sm text-gray-900">15 rooms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Available</span>
                  <span className="text-sm text-gray-900">9 rooms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Maintenance</span>
                  <span className="text-sm text-gray-900">0 rooms</span>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-900 mb-1">Expected Check-ins Today</p>
                  <p className="text-2xl text-[#0066cc]">3</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Reservations Page Component
function ReservationsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [guestTypeFilter, setGuestTypeFilter] = useState("all");

  const reservations = [
    { id: "RES-001", guest: "Ahmet Yılmaz", guestType: "Student", checkIn: "2025-12-05", checkOut: "2025-12-08", room: "Unassigned", status: "Pending", payment: "Pending" },
    { id: "RES-002", guest: "Elif Demir", guestType: "Personnel", checkIn: "2025-12-10", checkOut: "2025-12-15", room: "201", status: "Approved", payment: "Paid" },
    { id: "RES-003", guest: "Mehmet Kaya", guestType: "Visitor", checkIn: "2025-12-01", checkOut: "2025-12-03", room: "105", status: "Approved", payment: "Paid" },
    { id: "RES-004", guest: "Zeynep Arslan", guestType: "Student", checkIn: "2025-11-27", checkOut: "2025-11-30", room: "101", status: "Checked-In", payment: "Paid" },
    { id: "RES-005", guest: "Can Özdemir", guestType: "Personnel", checkIn: "2025-11-28", checkOut: "2025-12-02", room: "201", status: "Checked-In", payment: "Paid" },
    { id: "RES-006", guest: "Selin Yıldız", guestType: "Visitor", checkIn: "2025-11-25", checkOut: "2025-12-05", room: "203", status: "Checked-In", payment: "Paid" },
    { id: "RES-007", guest: "Arda Çelik", guestType: "Student", checkIn: "2025-10-15", checkOut: "2025-10-18", room: "102", status: "Completed", payment: "Paid" },
    { id: "RES-008", guest: "Deniz Kara", guestType: "Personnel", checkIn: "2025-12-12", checkOut: "2025-12-14", room: "Unassigned", status: "Pending", payment: "Pending" },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input type="text" placeholder="Guest name or ID..." className="pl-10" />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066cc]"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Guest Type</label>
              <select
                value={guestTypeFilter}
                onChange={(e) => setGuestTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066cc]"
              >
                <option value="all">All Types</option>
                <option value="student">Student</option>
                <option value="personnel">Personnel</option>
                <option value="visitor">Visitor</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Date Range</label>
              <Input type="date" />
            </div>
            <div className="flex items-end">
              <Button className="w-full bg-[#0066cc] hover:bg-[#0052a3] text-white">
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reservations Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">All Reservations ({reservations.length})</h3>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Reservation
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Reservation ID</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Guest Name</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Guest Type</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Check-In</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Check-Out</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Room</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Status</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Payment</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((res) => (
                  <tr key={res.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm text-gray-900">{res.id}</td>
                    <td className="py-3 px-2 text-sm text-gray-900">{res.guest}</td>
                    <td className="py-3 px-2 text-sm text-gray-600">{res.guestType}</td>
                    <td className="py-3 px-2 text-sm text-gray-600">{res.checkIn}</td>
                    <td className="py-3 px-2 text-sm text-gray-600">{res.checkOut}</td>
                    <td className="py-3 px-2 text-sm text-gray-900">{res.room}</td>
                    <td className="py-3 px-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          res.status === "Pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : res.status === "Approved"
                            ? "bg-green-100 text-green-700"
                            : res.status === "Checked-In"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {res.status}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          res.payment === "Pending"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {res.payment}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        {res.status === "Pending" && (
                          <>
                            <button className="text-green-600 hover:text-green-700" title="Approve">
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-700" title="Reject">
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button className="text-[#0066cc] hover:text-[#0052a3]" title="View">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-700" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        {res.room === "Unassigned" && (
                          <Button className="text-xs px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white">
                            Assign Room
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Calendar Page Component
function CalendarPage() {
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
    { room: "101", start: 0, duration: 3, status: "confirmed", guest: "Zeynep Arslan" },
    { room: "201", start: 1, duration: 4, status: "confirmed", guest: "Can Özdemir" },
    { room: "203", start: 0, duration: 10, status: "confirmed", guest: "Selin Yıldız" },
    { room: "102", start: 4, duration: 3, status: "pending", guest: "Ahmet Yılmaz" },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">Room Occupancy Calendar</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                <span className="text-gray-600">Pending</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-gray-600">Confirmed</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-gray-600">Checked-In</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-gray-600">Canceled</span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Header with dates */}
              <div className="flex border-b border-gray-200">
                <div className="w-32 flex-shrink-0 p-3 text-sm text-gray-900 border-r border-gray-200">
                  Room
                </div>
                {dates.map((date, idx) => (
                  <div key={idx} className="flex-1 min-w-[100px] p-3 text-center text-sm text-gray-600 border-r border-gray-200">
                    {date}
                  </div>
                ))}
              </div>
              {/* Rooms with bookings */}
              {rooms.map((room) => {
                const roomBookings = bookings.filter((b) => b.room === room.number);
                return (
                  <div key={room.number} className="flex border-b border-gray-100">
                    <div className="w-32 flex-shrink-0 p-3 border-r border-gray-200">
                      <p className="text-sm text-gray-900">{room.number}</p>
                      <p className="text-xs text-gray-500">{room.type}</p>
                    </div>
                    <div className="flex-1 relative" style={{ height: "60px" }}>
                      <div className="grid grid-cols-7 h-full">
                        {dates.map((_, idx) => (
                          <div key={idx} className="border-r border-gray-100"></div>
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

// Rooms Page Component
function RoomsPage() {
  const rooms = [
    { number: "101", type: "Single", capacity: 1, status: "Occupied", price: 120, amenities: "WiFi, TV, AC" },
    { number: "102", type: "Single", capacity: 1, status: "Available", price: 120, amenities: "WiFi, TV, AC" },
    { number: "103", type: "Single", capacity: 1, status: "Maintenance", price: 120, amenities: "WiFi, TV, AC" },
    { number: "201", type: "Double", capacity: 2, status: "Occupied", price: 180, amenities: "WiFi, TV, AC, Coffee" },
    { number: "202", type: "Double", capacity: 2, status: "Available", price: 180, amenities: "WiFi, TV, AC, Coffee" },
    { number: "203", type: "Double", capacity: 2, status: "Occupied", price: 180, amenities: "WiFi, TV, AC, Coffee" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-gray-900 text-xl">Room Management</h2>
        <Button className="bg-[#0066cc] hover:bg-[#0052a3] text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add New Room
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <Card key={room.number} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-gray-900 mb-1">Room {room.number}</h4>
                  <p className="text-sm text-gray-600">{room.type} Room</p>
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
                  <span className="text-gray-600">Capacity:</span>
                  <span className="text-gray-900">{room.capacity} {room.capacity === 1 ? "Guest" : "Guests"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Price:</span>
                  <span className="text-gray-900">${room.price}/night</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Amenities:</span>
                  <p className="text-gray-900 mt-1">{room.amenities}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button className="flex-1 bg-[#0066cc] hover:bg-[#0052a3] text-white">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Guests Page Component
function GuestsPage() {
  const guests = [
    { name: "Zeynep Arslan", type: "Student", reservationId: "RES-004", checkIn: "2025-11-27", checkOut: "2025-11-30", status: "Checked-In" },
    { name: "Can Özdemir", type: "Personnel", reservationId: "RES-005", checkIn: "2025-11-28", checkOut: "2025-12-02", status: "Checked-In" },
    { name: "Selin Yıldız", type: "Visitor", reservationId: "RES-006", checkIn: "2025-11-25", checkOut: "2025-12-05", status: "Checked-In" },
    { name: "Ahmet Yılmaz", type: "Student", reservationId: "RES-001", checkIn: "2025-12-05", checkOut: "2025-12-08", status: "Pending" },
    { name: "Elif Demir", type: "Personnel", reservationId: "RES-002", checkIn: "2025-12-10", checkOut: "2025-12-15", status: "Approved" },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">Guest Management</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input type="text" placeholder="Search guests..." className="pl-10 w-64" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Guest Name</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Guest Type</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Reservation ID</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Check-In</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Check-Out</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Status</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((guest, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm text-gray-900">{guest.name}</td>
                    <td className="py-3 px-2 text-sm text-gray-600">{guest.type}</td>
                    <td className="py-3 px-2 text-sm text-gray-900">{guest.reservationId}</td>
                    <td className="py-3 px-2 text-sm text-gray-600">{guest.checkIn}</td>
                    <td className="py-3 px-2 text-sm text-gray-600">{guest.checkOut}</td>
                    <td className="py-3 px-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          guest.status === "Pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : guest.status === "Approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {guest.status}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <button className="text-[#0066cc] hover:text-[#0052a3]" title="View">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-700" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Payments Page Component
function PaymentsPage() {
  const payments = [
    { reservationId: "RES-004", guest: "Zeynep Arslan", amount: 360, status: "Paid", date: "2025-11-27" },
    { reservationId: "RES-005", guest: "Can Özdemir", amount: 720, status: "Paid", date: "2025-11-28" },
    { reservationId: "RES-006", guest: "Selin Yıldız", amount: 1800, status: "Paid", date: "2025-11-25" },
    { reservationId: "RES-001", guest: "Ahmet Yılmaz", amount: 360, status: "Pending", date: "2025-12-05" },
    { reservationId: "RES-002", guest: "Elif Demir", amount: 900, status: "Paid", date: "2025-11-26" },
    { reservationId: "RES-008", guest: "Deniz Kara", amount: 360, status: "Pending", date: "2025-12-12" },
  ];

  return (
    <div className="space-y-6">
      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-500 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl text-gray-900">$4,500</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-orange-500 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Payments</p>
                <p className="text-2xl text-gray-900">$720</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl text-gray-900">$3,240</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">Payment Management</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Reservation ID</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Guest Name</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Amount</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Payment Status</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Date</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm text-gray-900">{payment.reservationId}</td>
                    <td className="py-3 px-2 text-sm text-gray-900">{payment.guest}</td>
                    <td className="py-3 px-2 text-sm text-gray-900">${payment.amount}</td>
                    <td className="py-3 px-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          payment.status === "Paid"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600">{payment.date}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <button className="text-[#0066cc] hover:text-[#0052a3]" title="View Receipt">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-700" title="Download Receipt">
                          <Download className="h-4 w-4" />
                        </button>
                        {payment.status === "Pending" && (
                          <Button className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 text-white">
                            Approve
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Blacklist Page Component
function BlacklistPage() {
  const blacklistedGuests = [
    { name: "John Doe", nationalId: "12345678901", reason: "Unpaid bills", addedDate: "2024-10-15", expiryDate: "2025-10-15" },
    { name: "Jane Smith", nationalId: "98765432109", reason: "Property damage", addedDate: "2024-11-20", expiryDate: "2026-11-20" },
  ];

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-red-500 p-2 rounded-lg">
            <UserX className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="text-red-900 mb-1">Blacklist Rules</h4>
            <p className="text-sm text-red-700">
              Guests on the blacklist cannot make new reservations. Review each case carefully before adding or removing individuals.
            </p>
          </div>
        </div>
      </div>

      {/* Blacklist Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">Blacklisted Guests ({blacklistedGuests.length})</h3>
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add to Blacklist
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Guest Name</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">National ID / Passport</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Reason</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Added Date</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Expiry Date</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blacklistedGuests.map((guest, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm text-gray-900">{guest.name}</td>
                    <td className="py-3 px-2 text-sm text-gray-600">{guest.nationalId}</td>
                    <td className="py-3 px-2 text-sm text-gray-600">{guest.reason}</td>
                    <td className="py-3 px-2 text-sm text-gray-600">{guest.addedDate}</td>
                    <td className="py-3 px-2 text-sm text-gray-600">{guest.expiryDate}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <button className="text-gray-600 hover:text-gray-700" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        <Button className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 text-white">
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Reports Page Component
function ReportsPage() {
  const reportTypes = [
    { name: "Daily Report", description: "Daily operations and occupancy", icon: FileText },
    { name: "Monthly Report", description: "Monthly revenue and statistics", icon: Calendar },
    { name: "Room Occupancy Report", description: "Room utilization analysis", icon: Bed },
    { name: "Revenue Report", description: "Financial performance summary", icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-gray-900 mb-6">Generate Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {reportTypes.map((report, idx) => {
              const Icon = report.icon;
              return (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-lg p-6 hover:border-[#0066cc] hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-[#0066cc] p-3 rounded-lg">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-gray-900 mb-1">{report.name}</h4>
                      <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                      <Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700">
                        <Download className="h-4 w-4 mr-2" />
                        Generate
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Report Options */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-gray-900 mb-4">Report Options</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Date Range</label>
                <div className="flex gap-2">
                  <Input type="date" />
                  <Input type="date" />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Format</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066cc]">
                  <option value="pdf">PDF</option>
                  <option value="xlsx">Excel (XLSX)</option>
                  <option value="docx">Word (DOCX)</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button className="w-full bg-[#0066cc] hover:bg-[#0052a3] text-white">
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Admin Users Page Component
function AdminUsersPage() {
  const adminUsers = [
    { name: "Admin User", email: "admin@sabanciuniv.edu", role: "Super Admin", lastLogin: "2025-12-02 10:30", status: "Active" },
    { name: "Reservation Admin", email: "res.admin@sabanciuniv.edu", role: "Reservation Admin", lastLogin: "2025-12-02 09:15", status: "Active" },
    { name: "Finance Admin", email: "finance@sabanciuniv.edu", role: "Finance Admin", lastLogin: "2025-12-01 16:45", status: "Active" },
    { name: "John Viewer", email: "viewer@sabanciuniv.edu", role: "Viewer", lastLogin: "2025-11-30 14:20", status: "Inactive" },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">Admin User Management</h3>
            <Button className="bg-[#0066cc] hover:bg-[#0052a3] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add New Admin
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Name</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Email</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Role</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Last Login</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Status</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((user, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm text-gray-900">{user.name}</td>
                    <td className="py-3 px-2 text-sm text-gray-600">{user.email}</td>
                    <td className="py-3 px-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600">{user.lastLogin}</td>
                    <td className="py-3 px-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          user.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <button className="text-gray-600 hover:text-gray-700" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        <Button className="text-xs px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white">
                          Disable
                        </Button>
                        <Button className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white">
                          Reset Password
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Settings Page Component
function SettingsPage() {
  return (
    <div className="space-y-6">
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-gray-900 mb-6">System Settings</h3>
          <div className="space-y-6">
            <div>
              <h4 className="text-gray-900 mb-3">General Settings</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Hotel Name</label>
                  <Input type="text" defaultValue="EDU HOTEL" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Contact Email</label>
                  <Input type="email" defaultValue="hotel@sabanciuniv.edu" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Contact Phone</label>
                  <Input type="tel" defaultValue="+90 (216) 483 9000" />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-gray-900 mb-3">Booking Settings</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-900">Auto-approve reservations</p>
                    <p className="text-xs text-gray-500">Automatically approve new reservation requests</p>
                  </div>
                  <button className="bg-gray-300 relative inline-flex h-6 w-11 items-center rounded-full">
                    <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                  </button>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Minimum booking advance (hours)</label>
                  <Input type="number" defaultValue="24" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Maximum booking duration (days)</label>
                  <Input type="number" defaultValue="30" />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <Button className="bg-[#0066cc] hover:bg-[#0052a3] text-white">
                Save Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
