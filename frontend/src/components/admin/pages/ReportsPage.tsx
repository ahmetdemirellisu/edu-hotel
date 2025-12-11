// src/components/admin/pages/ReportsPage.tsx
import { Card, CardContent } from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import {
  FileText,
  Calendar as CalendarIcon,
  Bed,
  DollarSign,
  Download
} from "lucide-react";
import { useTranslation } from "react-i18next";

export function ReportsPage() {
  const { t } = useTranslation("admin");

  const reportTypes = [
    {
      nameKey: "reports.daily",
      descriptionKey: "reports.dailyDesc",
      icon: FileText
    },
    {
      nameKey: "reports.monthly",
      descriptionKey: "reports.monthlyDesc",
      icon: CalendarIcon
    },
    {
      nameKey: "reports.roomOccupancy",
      descriptionKey: "reports.roomOccupancyDesc",
      icon: Bed
    },
    {
      nameKey: "reports.revenue",
      descriptionKey: "reports.revenueDesc",
      icon: DollarSign
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-gray-900 mb-6">
            {t("pages.reports.title")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {reportTypes.map((report, idx) => {
              const Icon = report.icon;
              return (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-lg p-6 hover:border-[#0066cc] hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-[#0066cc] p-3 rounded-lg">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-gray-900 mb-1">
                        {t(report.nameKey)}
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {t(report.descriptionKey)}
                      </p>
                      <Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700">
                        <Download className="h-4 w-4 mr-2" />
                        {t("reports.generateButton")}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Report Options */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-gray-900 mb-4">
              {t("reports.optionsTitle")}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  {t("reports.dateRange")}
                </label>
                <div className="flex gap-2">
                  <Input type="date" />
                  <Input type="date" />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  {t("reports.format")}
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066cc]">
                  <option value="pdf">PDF</option>
                  <option value="xlsx">Excel (XLSX)</option>
                  <option value="docx">Word (DOCX)</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button className="w-full bg-[#0066cc] hover:bg-[#0052a3] text-white">
                  <Download className="h-4 w-4 mr-2" />
                  {t("reports.downloadReport")}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
