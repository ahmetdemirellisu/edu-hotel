import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-[#003366] text-white py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          <div>
            <div className="border-2 border-white px-3 py-1 inline-block mb-3">
              <div className="text-xs">Sabancı</div>
              <div className="text-xs">Üniversitesi</div>
            </div>
            <p className="text-sm text-gray-300">
              {t("footer.address.line1")}<br />
              {t("footer.address.line2")}
            </p>
          </div>

          <div>
            <h4 className="text-sm mb-3">{t("footer.quickLinks")}</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>{t("footer.about")}</li>
              <li>{t("footer.services")}</li>
              <li>{t("footer.privacy")}</li>
              <li>{t("footer.terms")}</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm mb-3">{t("footer.contactTitle")}</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>{t("footer.phone")}</li>
              <li>{t("footer.emailAddress")}</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-blue-800 pt-6 text-center text-sm text-gray-300">
          <p>{t("footer.rightsEduHotel")}</p>
        </div>
      </div>
    </footer>
  );
}
