// src/components/admin/pages/SettingsPage.tsx
import { Card, CardContent } from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { useTranslation } from "react-i18next";

export function SettingsPage() {
  const { t } = useTranslation("admin");

  return (
    <div className="space-y-6">
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-gray-900 mb-6">
            {t("pages.settings.title")}
          </h3>

          <div className="space-y-6">
            {/* General settings */}
            <div>
              <h4 className="text-gray-900 mb-3">
                {t("settings.generalSettings")}
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">
                    {t("settings.hotelName")}
                  </label>
                  <Input type="text" defaultValue="EDU HOTEL" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">
                    {t("settings.contactEmail")}
                  </label>
                  <Input type="email" defaultValue="hotel@sabanciuniv.edu" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">
                    {t("settings.contactPhone")}
                  </label>
                  <Input type="tel" defaultValue="+90 (216) 483 9000" />
                </div>
              </div>
            </div>

            {/* Booking settings */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-gray-900 mb-3">
                {t("settings.bookingSettings")}
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-900">
                      {t("settings.autoApprove")}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t("settings.autoApproveDesc")}
                    </p>
                  </div>
                  {/* dummy toggle */}
                  <button className="bg-gray-300 relative inline-flex h-6 w-11 items-center rounded-full">
                    <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                  </button>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">
                    {t("settings.minBookingAdvance")}
                  </label>
                  <Input type="number" defaultValue="24" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">
                    {t("settings.maxBookingDuration")}
                  </label>
                  <Input type="number" defaultValue="30" />
                </div>
              </div>
            </div>

            {/* Save button */}
            <div className="border-t border-gray-200 pt-6">
              <Button className="bg-[#0066cc] hover:bg-[#0052a3] text-white">
                {t("settings.saveSettings")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
