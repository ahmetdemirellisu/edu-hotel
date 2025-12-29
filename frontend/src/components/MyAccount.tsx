import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Navbar } from "./layout/Navbar"; 
import { Footer } from "./layout/Footer"; 
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { User, Mail, Phone, Lock, AlertCircle, CheckCircle2, LogOut } from "lucide-react";

export function MyAccount() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // State to hold consolidated user data
  const [userData, setUserData] = useState({
    fullName: "",
    email: "",
    phone: "",
    tcNo: "",
    userType: ""
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedName = localStorage.getItem("userName"); // Backup source

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserData({
          // Prioritize name from object, fallback to individual userName string
          fullName: parsedUser.name || storedName || "",
          email: parsedUser.email || localStorage.getItem("userEmail") || "",
          phone: parsedUser.phone || "",
          tcNo: parsedUser.tcNo || "Not Provided",
          userType: parsedUser.userType || "STUDENT"
        });
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    } else if (!localStorage.getItem("authToken")) {
      // If no token exists, they aren't logged in
      navigate("/");
    }
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setUserData((prev) => ({ ...prev, [id]: value }));
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    navigate("/");
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl text-[#003366] mb-2 font-bold">{t("account.title")}</h2>
          <p className="text-gray-600">{t("account.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Profile Information Card */}
            <Card className="shadow-lg border-0">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-xl text-[#003366]">{t("account.profile.title")}</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <form className="space-y-6">
                  {/* CONSOLIDATED FULL NAME BLOCK */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-gray-700">
                      {t("signup.fullNameLabel", "Full Name")}
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-[10px] h-4 w-4 text-gray-400 pointer-events-none" />
                      <Input 
                        id="fullName" 
                        value={userData.fullName} 
                        onChange={handleInputChange}
                        placeholder={t("signup.fullNamePlaceholder")}
                        className="border-gray-300 pl-10" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700">{t("account.profile.email")}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-[10px] h-4 w-4 text-gray-400 pointer-events-none" />
                      <Input 
                        id="email" 
                        type="email" 
                        value={userData.email} 
                        onChange={handleInputChange}
                        className="border-gray-300 pl-10" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-700">{t("account.profile.phone")}</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-[10px] h-4 w-4 text-gray-400" />
                      <Input 
                        id="phone" 
                        type="tel" 
                        value={userData.phone} 
                        onChange={handleInputChange}
                        className="border-gray-300 pl-10" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <Label htmlFor="tcNo" className="text-gray-500 text-xs uppercase tracking-wider">
                      {t("account.profile.tcNo", "Identification Number")}
                    </Label>
                    <Input 
                      id="tcNo" 
                      value={userData.tcNo} 
                      className="border-gray-200 bg-gray-50 text-gray-500 italic" 
                      disabled 
                    />
                    <p className="text-[10px] text-gray-400">{t("account.profile.tcNote")}</p>
                  </div>

                  <div className="pt-4">
                    <Button className="bg-[#0066cc] hover:bg-[#0052a3] text-white px-8">
                      {t("account.profile.saveBtn")}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card className="shadow-lg border-0">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-xl text-[#003366]">{t("account.password.title")}</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <form className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">{t("account.password.current")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-[10px] h-4 w-4 text-gray-400" />
                      <Input id="currentPassword" type="password" className="border-gray-300 pl-10" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">{t("account.password.new")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-[10px] h-4 w-4 text-gray-400" />
                      <Input id="newPassword" type="password" className="border-gray-300 pl-10" />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
                    <div className="text-xs text-blue-900 leading-relaxed">
                      <p className="font-bold mb-1">{t("account.password.mustContain")}</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>{t("account.password.req1")}</li>
                        <li>{t("account.password.req2")}</li>
                        <li>{t("account.password.req3")}</li>
                      </ul>
                    </div>
                  </div>

                  <Button className="bg-[#0066cc] hover:bg-[#0052a3] text-white">
                    {t("account.password.updateBtn")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <Card className="shadow-lg border-0 overflow-hidden">
              <CardHeader className="bg-[#003366] text-white">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" /> {t("account.status.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{t("account.status.type")}</span>
                    <span className="text-sm font-bold px-2 py-1 bg-blue-50 text-[#003366] rounded">
                      {userData.userType}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{t("account.status.label")}</span>
                    <div className="flex items-center gap-1 text-sm font-bold text-green-600">
                      <CheckCircle2 className="h-4 w-4" /> {t("account.status.active")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader className="border-b">
                <CardTitle className="text-lg text-[#003366]">{t("account.prefs.title")}</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500 uppercase">{t("account.prefs.lang")}</Label>
                  <Select defaultValue={i18n.language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="tr">Türkçe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" className="w-full border-[#0066cc] text-[#0066cc]">
                  {t("account.prefs.saveBtn")}
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-red-100 bg-red-50/30">
              <CardContent className="p-4">
                <Button 
                  onClick={handleLogout}
                  variant="ghost" 
                  className="w-full text-red-600 hover:bg-red-100 hover:text-red-700 justify-start"
                >
                  <LogOut className="h-4 w-4 mr-2" /> {t("account.session.logoutBtn")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}