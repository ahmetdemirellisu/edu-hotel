import {
  Home,
  Calendar,
  User,
  LogOut,
  Bell,
  CheckCircle,
  AlertCircle,
  Bed,
  Sparkles,
  Wrench,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { useTranslation } from "react-i18next";

export function MainPage() {
  const { t, i18n } = useTranslation();

  const stats = [
    {
      title: t("main.stats.upcoming"),
      value: "3",
      icon: Calendar,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: t("main.stats.past"),
      value: "12",
      icon: CheckCircle,
      color: "bg-green-50 text-green-600",
    },
    {
      title: t("main.stats.notifications"),
      value: "5",
      icon: Bell,
      color: "bg-yellow-50 text-yellow-600",
    },
    {
      title: t("main.stats.accountStatus"),
      value: t("main.stats.active"),
      icon: AlertCircle,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  const announcements = [
    {
      title: t("main.announcements.holidayTitle"),
      date: "Dec 15, 2025",
      message: t("main.announcements.holidayMsg"),
    },
    {
      title: t("main.announcements.diningTitle"),
      date: "Dec 10, 2025",
      message: t("main.announcements.diningMsg"),
    },
    {
      title: t("main.announcements.maintenanceTitle"),
      date: "Dec 8, 2025",
      message: t("main.announcements.maintenanceMsg"),
    },
  ];

  const quickActions = [
    {
      title: t("main.quick.bookRoom"),
      icon: Bed,
      color: "bg-[#003366] hover:bg-[#002244] text-white",
      link: "/book-room",

    },
    {
      title: t("main.quick.cleaning"),
      icon: Sparkles,
      color: "bg-white hover:bg-gray-50 text-[#003366] border-2 border-[#003366]",
    },
    {
      title: t("main.quick.reportIssue"),
      icon: Wrench,
      color: "bg-white hover:bg-gray-50 text-[#003366] border-2 border-[#003366]",
    },
    {
      title: t("main.quick.contactSupport"),
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

            {/* Navigation Links + Language Switcher */}
            <nav className="flex items-center gap-6">
              <Link
                to="/user-dashboard"
                className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>{t("main.nav.home")}</span>
              </Link>

              <Link
                to="/dashboard"
                className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
              >
                <Calendar className="h-4 w-4" />
                <span>{t("main.nav.reservations")}</span>
              </Link>

              <button className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors">
                <User className="h-4 w-4" />
                <span>{t("main.nav.profile")}</span>
              </button>

              <Link
                to="/"
                className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>{t("main.nav.logout")}</span>
              </Link>

              {/* 🌐 Language Switcher */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => i18n.changeLanguage("en")}
                  className={`px-2 py-1 rounded ${
                    i18n.language === "en"
                      ? "bg-white text-[#003366]"
                      : "hover:text-gray-300"
                  }`}
                >
                  EN
                </button>

                <button
                  onClick={() => i18n.changeLanguage("tr")}
                  className={`px-2 py-1 rounded ${
                    i18n.language === "tr"
                      ? "bg-white text-[#003366]"
                      : "hover:text-gray-300"
                  }`}
                >
                  TR
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-gray-900 mb-2">{t("main.welcomeBack")}</h1>
        </div>

        {/* Quick Actions & Announcements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <Card className="border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-8">
              <h3 className="text-gray-900 mb-6">{t("main.quickActions")}</h3>
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

          {/* Announcements */}
          <Card className="border-gray-200 rounded-2xl shadow-sm">
            <CardContent className="p-8">
              <h3 className="text-gray-900 mb-6">
                {t("main.announcements.title")}
              </h3>
              <div className="space-y-4">
                {announcements.map((announcement, index) => (
                  <div
                    key={index}
                    className="bg-blue-50 p-4 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-gray-900 text-sm">
                        {announcement.title}
                      </h4>
                      <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </div>
                    <p className="text-gray-600 text-xs mb-2">
                      {announcement.message}
                    </p>
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
                {t("footer.address.line1")}
                <br />
                {t("footer.address.line2")}
              </p>
            </div>

            <div>
              <h4 className="mb-3 text-sm">{t("footer.quickLinks")}</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>{t("footer.about")}</li>
                <li>{t("footer.services")}</li>
                <li>{t("footer.privacy")}</li>
                <li>{t("footer.terms")}</li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-sm">{t("footer.contactTitle")}</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>{t("footer.phone")}</li>
                <li>{t("footer.emailAddress")}</li>
                <li>{t("footer.support")}</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-blue-800 pt-6 text-center text-sm text-gray-300">
            <p>{t("footer.rightsEduHotel")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
