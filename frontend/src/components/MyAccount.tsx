import { useState } from "react";
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

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title */}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-gray-700">{t("account.profile.firstName")}</Label>
                      <Input id="firstName" className="border-gray-300" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-gray-700">{t("account.profile.lastName")}</Label>
                      <Input id="lastName" className="border-gray-300" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700">{t("account.profile.email")}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-[10px] h-4 w-4 text-gray-400 pointer-events-none" />
                      <Input id="email" type="email" className="border-gray-300 pl-10" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-700">{t("account.profile.phone")}</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-[10px] h-4 w-4 text-gray-400" />
                      <Input id="phone" type="tel" className="border-gray-300 pl-10" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tc-kimlik" className="text-gray-700">{t("account.profile.tcNo")}</Label>
                    <Input id="tc-kimlik" className="border-gray-300 bg-gray-50" disabled />
                    <p className="text-xs text-gray-500">{t("account.profile.tcNote")}</p>
                  </div>

                  <div className="pt-4">
                    <Button className="bg-[#0066cc] hover:bg-[#0052a3] text-white">
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

                  {/* Password Requirements Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-blue-900">
                        <p className="font-semibold">{t("account.password.mustContain")}</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>{t("account.password.req1")}</li>
                          <li>{t("account.password.req2")}</li>
                          <li>{t("account.password.req3")}</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button className="bg-[#0066cc] hover:bg-[#0052a3] text-white">
                      {t("account.password.updateBtn")}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar Area */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Account Status Card */}
            <Card className="shadow-lg border-0 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[#003366] to-[#0066cc] text-white">
                <CardTitle className="flex items-center gap-2 text-lg font-medium">
                  <User className="h-5 w-5" /> {t("account.status.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t("account.status.type")}</span>
                    <span className="font-medium text-gray-900">{t("account.status.student")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t("account.status.label")}</span>
                    <div className="flex items-center gap-1 font-medium text-green-600">
                      <CheckCircle2 className="h-4 w-4" /> {t("account.status.active")}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-4">
                    <span className="text-gray-500">{t("account.status.reservations")}</span>
                    <span className="font-medium">8 {t("account.status.total")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preferences Card */}
            <Card className="shadow-lg border-0">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-xl text-[#003366]">{t("account.prefs.title")}</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>{t("account.prefs.lang")}</Label>
                  <Select defaultValue={i18n.language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="tr">Türkçe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("account.prefs.emailNotifs")}</Label>
                  <Select defaultValue="all">
                    <SelectTrigger className="border-gray-300">
                      <SelectValue placeholder="Notifications" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("account.prefs.notifAll")}</SelectItem>
                      <SelectItem value="important">{t("account.prefs.notifImportant")}</SelectItem>
                      <SelectItem value="none">{t("account.prefs.notifNone")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" className="w-full border-[#0066cc] text-[#0066cc] hover:bg-blue-50">
                  {t("account.prefs.saveBtn")}
                </Button>
              </CardContent>
            </Card>

            {/* Logout Card */}
            <Card className="shadow-lg border-0 border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">{t("account.session.title")}</h3>
                  <p className="text-xs text-gray-500">{t("account.session.subtitle")}</p>
                  <Button 
                    onClick={handleLogout}
                    variant="outline" 
                    className="w-full border-red-500 text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" /> {t("account.session.logoutBtn")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}