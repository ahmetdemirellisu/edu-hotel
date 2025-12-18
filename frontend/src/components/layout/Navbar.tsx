import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  Globe, 
  Bell, 
  User, 
  LogOut, 
  LayoutDashboard 
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"; // Ensure path matches your project structure

export function Navbar() {
  const { t, i18n } = useTranslation();

  const currentLang = i18n.language?.toUpperCase() === "TR" ? "TR" : "EN";

  const switchLanguage = (val: string) => {
    const next = val.toLowerCase();
    i18n.changeLanguage(next);
  };

  return (
    <header className="bg-[#003366] text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 relative">
        <div className="flex items-center justify-between">
          
          {/* Left: Sabancı Logo Branding */}
          <div className="flex items-center gap-4">
            <div className="border-2 border-white px-3 py-1">
              <div className="text-xs font-medium">Sabancı</div>
              <div className="text-xs font-medium">Üniversitesi</div>
            </div>
          </div>

          {/* Center: Main Title (Absolute Centered) */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <h1 className="text-2xl tracking-wider whitespace-nowrap font-bold">
              E D U &nbsp;&nbsp; H O T E L
            </h1>
          </div>

          {/* Right: Navigation & Actions */}
          <div className="flex items-center gap-6">
            <Link 
              to="/dashboard" 
              className="hover:text-gray-300 transition-colors flex items-center gap-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="text-sm hidden md:inline">
                {t("nav.dashboard", "Dashboard")}
              </span>
            </Link>


            {/* Styled Language Switcher without the Globe */}
            <Select value={currentLang} onValueChange={switchLanguage}>
              <SelectTrigger className="w-16 h-8 bg-transparent border-white text-white hover:bg-white/10 font-medium">
                {/* Globe icon removed from here */}
                <SelectValue placeholder={currentLang} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EN">EN</SelectItem>
                <SelectItem value="TR">TR</SelectItem>
              </SelectContent>
            </Select>
            {/* Notification Bell */}
            <button
              type="button"
              className="relative hover:text-gray-300 transition-colors"
              aria-label={t("nav.notifications", "Notifications")}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                3
              </span>
            </button>

            {/* Profile */}
            <Link 
              to="/profile" 
              className="hover:text-gray-300 transition-colors" 
              aria-label={t("nav.profile", "Profile")}
            >
              <User className="h-5 w-5" />
            </Link>

          </div>
        </div>
      </div>
    </header>
  );
}