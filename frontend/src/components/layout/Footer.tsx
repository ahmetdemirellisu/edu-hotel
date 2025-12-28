import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-[#003366] text-white py-12 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Logo and Address */}
          <div>
            <div className="border-2 border-white px-3 py-1 inline-block mb-4">
              <div className="text-xs font-medium">Sabancı</div>
              <div className="text-xs font-medium">Üniversitesi</div>
            </div>
            <p className="text-sm text-gray-300 mt-4 leading-relaxed">
              {t("footer.address.line1")}
              <br />
              {t("footer.address.line2")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider">
              {t("footer.quickLinks")}
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="hover:text-white cursor-pointer transition-colors">{t("footer.about")}</li>
              <li className="hover:text-white cursor-pointer transition-colors">{t("footer.academic")}</li>
              <li className="hover:text-white cursor-pointer transition-colors">{t("footer.research")}</li>
              <li className="hover:text-white cursor-pointer transition-colors">{t("footer.campusLife")}</li>
            </ul>
          </div>

          {/* Resources - Added to match Login Footer */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider">
              {t("footer.resources")}
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="hover:text-white cursor-pointer transition-colors">{t("footer.library")}</li>
              <li className="hover:text-white cursor-pointer transition-colors">{t("footer.sucourse")}</li>
              <li className="hover:text-white cursor-pointer transition-colors">{t("footer.email")}</li>
              <li className="hover:text-white cursor-pointer transition-colors">{t("footer.support")}</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider">
              {t("footer.contactTitle")}
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>{t("footer.phone")}</li>
              <li>{t("footer.emailAddress")}</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-blue-800 pt-8 text-center text-sm text-gray-300">
          <p>{t("footer.rights")}</p>
        </div>
      </div>
    </footer>
  );
}