import { Home, Calendar, User, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function Navbar() {
  const { t, i18n } = useTranslation();

  return (
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

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <Link to="/main" className="flex items-center gap-2 hover:text-gray-300">
              <Home className="h-4 w-4" />
              <span>{t("main.nav.home")}</span>
            </Link>

            <Link to="/book-room" className="flex items-center gap-2 hover:text-gray-300">
              <Calendar className="h-4 w-4" />
              <span>{t("main.nav.reservations")}</span>
            </Link>

            <button className="flex items-center gap-2 hover:text-gray-300">
              <User className="h-4 w-4" />
              <span>{t("main.nav.profile")}</span>
            </button>

            <Link to="/" className="flex items-center gap-2 hover:text-gray-300">
              <LogOut className="h-4 w-4" />
              <span>{t("main.nav.logout")}</span>
            </Link>

            {/* Language Switcher */}
            <select
              className="bg-transparent border px-2 py-1 rounded"
              defaultValue={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
            >
              <option value="en">EN</option>
              <option value="tr">TR</option>
            </select>
          </nav>
        </div>
      </div>
    </header>
  );
}
