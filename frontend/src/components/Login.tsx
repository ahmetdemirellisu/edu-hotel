import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { Search, Home } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import backgroundImage from "figma:asset/9bf36aafa693f4a63cbdf015b397abd2911f2e4f.png";

// Backend URL
const API_URL =
  (import.meta.env.VITE_API_URL as string) || "http://localhost:3000";
console.log("API_URL =", API_URL);

export function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // ✅ Save auth info
      localStorage.setItem("authToken", data.token);
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
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
      <header className="bg-[#003366] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left logo */}
            <div className="flex items-center">
              <div className="border-2 border-white px-3 py-1">
                <div className="text-sm">Sabancı</div>
                <div className="text-sm">Üniversitesi</div>
              </div>
            </div>

            {/* Center title */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className="text-white tracking-widest">E D U H O T E L</h1>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="hover:text-gray-300 transition-colors">
                {t("header.mySU")}
              </a>

              <button className="hover:text-gray-300 transition-colors">
                <Search className="h-4 w-4" />
              </button>

              {/* 🌐 Language Switcher */}
              <div className="flex items-center gap-2">
                <button
                  className={`px-2 py-1 rounded ${
                    i18n.language === "en"
                      ? "bg-white text-[#003366]"
                      : "hover:text-gray-300"
                  }`}
                  onClick={() => i18n.changeLanguage("en")}
                >
                  EN
                </button>

                <button
                  className={`px-2 py-1 rounded ${
                    i18n.language === "tr"
                      ? "bg-white text-[#003366]"
                      : "hover:text-gray-300"
                  }`}
                  onClick={() => i18n.changeLanguage("tr")}
                >
                  TR
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Home className="h-4 w-4" />
            <span>{t("breadcrumb.home")}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />

        {/* Foreground content */}
        <div className="relative z-10">
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <Card className="border-gray-200">
                <CardContent className="space-y-6 pt-6">
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <Label>{t("login.loginWith")}</Label>
                      <select
                        value={loginMethod}
                        onChange={(e) =>
                          setLoginMethod(e.target.value as "email" | "phone")
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003366]"
                      >
                        <option value="email">{t("login.email")}</option>
                        <option value="phone">{t("login.phone")}</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        {loginMethod === "email"
                          ? t("login.emailAddress")
                          : t("login.phoneNumber")}
                      </Label>
                      <Input
                        type={loginMethod === "email" ? "email" : "tel"}
                        placeholder={
                          loginMethod === "email"
                            ? t("login.enterEmail")
                            : t("login.enterPhone")
                        }
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
                      <p className="text-sm text-red-600 text-center">
                        {error}
                      </p>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-[#003366] hover:bg-[#002244] text-white"
                      disabled={loading}
                    >
                      {loading ? t("login.loggingIn") : t("login.loginButton")}
                    </Button>

                    <div className="space-y-3">
                      <a className="text-sm text-[#003366] hover:underline block">
                        {t("login.forgotPassword")}
                      </a>

                      <Link
                        to="/signup"
                        className="text-sm text-[#003366] hover:underline block"
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

      {/* Footer */}
      <footer className="bg-[#003366] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="border-2 border-white px-3 py-1 inline-block mb-4">
                <div className="text-sm">Sabancı</div>
                <div className="text-sm">Üniversitesi</div>
              </div>
              <p className="text-sm text-gray-300 mt-4">
                {t("footer.address.line1")}
                <br />
                {t("footer.address.line2")}
              </p>
            </div>

            <div>
              <h3 className="mb-4 text-sm">{t("footer.quickLinks")}</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>{t("footer.about")}</li>
                <li>{t("footer.academic")}</li>
                <li>{t("footer.research")}</li>
                <li>{t("footer.campusLife")}</li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-sm">{t("footer.resources")}</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>{t("footer.library")}</li>
                <li>{t("footer.sucourse")}</li>
                <li>{t("footer.email")}</li>
                <li>{t("footer.support")}</li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-sm">{t("footer.contactTitle")}</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>{t("footer.phone")}</li>
                <li>{t("footer.emailAddress")}</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-blue-800 pt-8 text-center text-sm text-gray-300">
            <p>{t("footer.rights")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
