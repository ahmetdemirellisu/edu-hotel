import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import backgroundImage from "figma:asset/9bf36aafa693f4a63cbdf015b397abd2911f2e4f.png";
import { Footer } from "./layout/Footer";
// Import Select components
import {
  Select as UISelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"; 

// Backend URL
const API_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:3000";

export function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Language state logic from Navbar
  const currentLang = i18n.language?.toUpperCase() === "TR" ? "TR" : "EN";
  const switchLanguage = (val: string) => {
    i18n.changeLanguage(val.toLowerCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: identifier,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("login.errors.loginFailed"));
        setLoading(false);
        return;
      }

      localStorage.setItem("authToken", data.token);
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("userId", String(data.user.id));
        localStorage.setItem("userEmail", data.user.email ?? "");
        localStorage.setItem("userName", data.user.name ?? "");
      }

      navigate("/main");
      setLoading(false);
    } catch (err) {
      console.error("Login error:", err);
      setError(t("login.errors.network"));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="bg-[#003366] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 relative">
          <div className="flex justify-between items-center">
            {/* Left logo */}
            <div className="flex items-center">
              <div className="border-2 border-white px-3 py-1">
                <div className="text-xs font-medium">Sabancı</div>
                <div className="text-xs font-medium">Üniversitesi</div>
              </div>
            </div>

            {/* Center title */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className="text-2xl tracking-wider whitespace-nowrap font-bold">
                E D U &nbsp;&nbsp; H O T E L
              </h1>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm hover:text-gray-300 transition-colors hidden md:inline">
                {t("header.mySU")}
              </a>

              <button className="hover:text-gray-300 transition-colors">
                <Search className="h-5 w-5" />
              </button>

              {/* 🌐 Stylish Language Switcher */}
              <UISelect value={currentLang} onValueChange={switchLanguage}>
                <SelectTrigger className="w-16 h-8 bg-transparent border-white text-white hover:bg-white/10 font-medium focus:ring-0">
                  <SelectValue placeholder={currentLang} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EN">EN</SelectItem>
                  <SelectItem value="TR">TR</SelectItem>
                </SelectContent>
              </UISelect>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />

        <div className="relative z-10">
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <Card className="border-gray-200 shadow-xl">
                <CardContent className="space-y-6 pt-6">
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <Label>{t("login.loginWith")}</Label>
                      <select
                        value={loginMethod}
                        onChange={(e) => setLoginMethod(e.target.value as "email" | "phone")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003366]"
                      >
                        <option value="email">{t("login.email")}</option>
                        <option value="phone">{t("login.phone")}</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        {loginMethod === "email" ? t("login.emailAddress") : t("login.phoneNumber")}
                      </Label>
                      <Input
                        type={loginMethod === "email" ? "email" : "tel"}
                        placeholder={loginMethod === "email" ? t("login.enterEmail") : t("login.enterPhone")}
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="border-gray-300"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t("login.password")}</Label>
                      <Input
                        type="password"
                        placeholder={t("login.enterPassword")}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border-gray-300"
                        required
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-red-600 text-center font-medium">
                        {error}
                      </p>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-[#003366] hover:bg-[#002244] text-white h-11"
                      disabled={loading}
                    >
                      {loading ? t("login.loggingIn") : t("login.loginButton")}
                    </Button>

                    <div className="space-y-3 text-center">
                      <a className="text-sm text-[#003366] hover:underline block cursor-pointer">
                        {t("login.forgotPassword")}
                      </a>

                      <Link
                        to="/signup"
                        className="text-sm text-[#003366] hover:underline block font-medium"
                      >
                        {t("login.firstTime")}
                      </Link>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Footer (Simplified matching Navbar branding style) */}
      <Footer />
    </div>
  );
}