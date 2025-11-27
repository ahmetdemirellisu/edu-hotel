import { Navbar } from "./layout/Navbar";
import { Footer } from "./layout/Footer";
import { useTranslation } from "react-i18next";

export function Dashboard() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-gray-900 mb-8">{t("main.welcomeBack")}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Quick Actions */}
          <div className="p-8 bg-white rounded-2xl shadow">
            <h3 className="mb-6">{t("main.quickActions")}</h3>

            <div className="grid grid-cols-2 gap-4">
              <a className="bg-[#003366] text-white rounded-xl p-6 text-center" href="/book-room">
                {t("main.quick.bookRoom")}
              </a>
              <button className="border-2 border-[#003366] text-[#003366] rounded-xl p-6">
                {t("main.quick.cleaning")}
              </button>
              <button className="border-2 border-[#003366] text-[#003366] rounded-xl p-6">
                {t("main.quick.reportIssue")}
              </button>
              <button className="border-2 border-[#003366] text-[#003366] rounded-xl p-6">
                {t("main.quick.contactSupport")}
              </button>
            </div>
          </div>

          {/* Announcements */}
          <div className="p-8 bg-white rounded-2xl shadow">
            <h3 className="mb-6">{t("main.announcements.title")}</h3>

            <div className="space-y-4">
              {/* Example items — you can localize real items */}
              <div className="bg-blue-50 p-4 rounded-xl">
                <h4>{t("main.announcements.holidayTitle")}</h4>
                <p className="text-sm">{t("main.announcements.holidayMsg")}</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl">
                <h4>{t("main.announcements.diningTitle")}</h4>
                <p className="text-sm">{t("main.announcements.diningMsg")}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
