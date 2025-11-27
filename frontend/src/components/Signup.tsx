import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { Search, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import backgroundImage from "figma:asset/9bf36aafa693f4a63cbdf015b397abd2911f2e4f.png";

const API_URL = import.meta.env.VITE_API_URL as string;

export function Signup() {
  const { t, i18n } = useTranslation();

  const [signupMethod, setSignupMethod] = useState<"email" | "phone">("email");

  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState(""); 
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName || !contact || !password || !confirmPassword) {
      setError(t("signup.errors.fillAll"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("signup.errors.passwordMismatch"));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: contact,
          password,
          name: fullName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("signup.errors.failed"));
        setLoading(false);
        return;
      }

      setSuccess(t("signup.success.accountCreated"));
      setLoading(false);

      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Signup error:", err);
      setError(t("signup.errors.network"));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="bg-[#003366] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Sabancı Logo */}
            <div className="flex items-center">
              <div className="border-2 border-white px-3 py-1">
                <div className="text-sm">Sabancı</div>
                <div className="text-sm">Üniversitesi</div>
              </div>
            </div>

            {/* Center Title */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className="text-white tracking-widest">E D U   H O T E L</h1>
            </div>

            {/* Header Right Items */}
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="hover:text-gray-300 transition-colors">
                {t("header.mySU")}
              </a>
              <button className="hover:text-gray-300 transition-colors">
                <Search className="h-4 w-4" />
              </button>

              {/* 🌐 Language Switcher */}
              <div className="flex items-center gap-2 ml-2">
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
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />

        <div className="relative z-10">
          <div className="flex justify-center">

            <div className="w-full max-w-md">
              <Card className="border-gray-200">
                <CardContent className="space-y-6 pt-6">
                  <form className="space-y-6" onSubmit={handleSubmit}>

                    <div className="space-y-2">
                      <Label htmlFor="fullname">{t("signup.fullNameLabel")}</Label>
                      <Input
                        id="fullname"
                        type="text"
                        placeholder={t("signup.fullNamePlaceholder")}
                        className="border-gray-300"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signupMethod">{t("signup.signupWith")}</Label>
                      <select
                        id="signupMethod"
                        value={signupMethod}
                        onChange={(e) =>
                          setSignupMethod(e.target.value as "email" | "phone")
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003366]"
                      >
                        <option value="email">{t("signup.email")}</option>
                        <option value="phone">{t("signup.phone")}</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact">
                        {signupMethod === "email"
                          ? t("signup.emailAddress")
                          : t("signup.phoneNumber")}
                      </Label>
                      <Input
                        id="contact"
                        type={signupMethod === "email" ? "email" : "tel"}
                        placeholder={
                          signupMethod === "email"
                            ? t("signup.enterEmail")
                            : t("signup.enterPhone")
                        }
                        className="border-gray-300"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">{t("signup.passwordLabel")}</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder={t("signup.passwordPlaceholder")}
                        className="border-gray-300"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">
                        {t("signup.confirmPasswordLabel")}
                      </Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder={t("signup.confirmPasswordPlaceholder")}
                        className="border-gray-300"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-red-600 text-center">{error}</p>
                    )}
                    {success && (
                      <p className="text-sm text-green-600 text-center">
                        {success}
                      </p>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-[#003366] hover:bg-[#002244] text-white"
                      disabled={loading}
                    >
                      {loading
                        ? t("signup.creatingAccount")
                        : t("signup.createAccount")}
                    </Button>

                    <div className="space-y-3">
                      <Link
                        to="/"
                        className="text-sm text-[#003366] hover:underline block"
                      >
                        {t("signup.alreadyHaveAccount")}
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
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    {t("footer.about")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    {t("footer.academic")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    {t("footer.research")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    {t("footer.campusLife")}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-sm">{t("footer.resources")}</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    {t("footer.library")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    {t("footer.sucourse")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    {t("footer.email")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    {t("footer.support")}
                  </a>
                </li>
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
