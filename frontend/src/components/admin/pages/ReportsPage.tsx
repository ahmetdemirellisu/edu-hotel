// src/components/admin/pages/ReportsPage.tsx
import React, { useState } from "react";
import {
  FileText,
  Calendar as CalendarIcon,
  Bed,
  DollarSign,
  Download,
  BarChart3,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export function ReportsPage() {
  const { t } = useTranslation("admin");
  const [selectedReport, setSelectedReport] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [format, setFormat] = useState<"pdf" | "xlsx" | "docx">("pdf");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 1500);
  };

  const reportTypes = [
    {
      nameKey: "reports.daily",
      descriptionKey: "reports.dailyDesc",
      icon: FileText,
      gradient: "from-blue-500 to-blue-700",
      accentBg: "bg-blue-50",
      accentText: "text-blue-600",
      tag: "Daily",
    },
    {
      nameKey: "reports.monthly",
      descriptionKey: "reports.monthlyDesc",
      icon: CalendarIcon,
      gradient: "from-violet-500 to-violet-700",
      accentBg: "bg-violet-50",
      accentText: "text-violet-600",
      tag: "Monthly",
    },
    {
      nameKey: "reports.roomOccupancy",
      descriptionKey: "reports.roomOccupancyDesc",
      icon: Bed,
      gradient: "from-emerald-500 to-emerald-700",
      accentBg: "bg-emerald-50",
      accentText: "text-emerald-600",
      tag: "Occupancy",
    },
    {
      nameKey: "reports.revenue",
      descriptionKey: "reports.revenueDesc",
      icon: DollarSign,
      gradient: "from-amber-500 to-orange-600",
      accentBg: "bg-amber-50",
      accentText: "text-amber-600",
      tag: "Revenue",
    },
  ];

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes rpIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .rp-card { animation: rpIn 0.3s ease-out both; }
      `}</style>

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" style={{ animation: "rpIn 0.3s ease-out" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t("pages.reports.title", "Reports")}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{t("reports.subtitle", "Generate and download operational reports")}</p>
          </div>
        </div>
      </div>

      {/* ── Report Type Cards ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {reportTypes.map((report, idx) => {
          const Icon = report.icon;
          const isSelected = selectedReport === idx;
          return (
            <div
              key={idx}
              className="rp-card bg-white rounded-2xl border overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              style={{
                animationDelay: `${idx * 0.07}s`,
                borderColor: isSelected ? "#003366" : "#f1f5f9",
                boxShadow: isSelected ? "0 0 0 2px #003366, 0 4px 24px rgba(0,51,102,0.1)" : undefined,
              }}
              onClick={() => setSelectedReport(isSelected ? null : idx)}
            >
              <div className={`h-1 bg-gradient-to-r ${report.gradient}`} />
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl ${report.accentBg} ${report.accentText} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-[15px] font-bold text-gray-900">{t(report.nameKey)}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${report.accentBg} ${report.accentText}`}>{report.tag}</span>
                    </div>
                    <p className="text-[13px] text-gray-500 leading-relaxed">{t(report.descriptionKey)}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? "bg-[#003366]" : "border-2 border-gray-200"}`}>
                    {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Generation Options ──────────────────────────── */}
      <div
        className="rp-card bg-white rounded-2xl border border-gray-100 overflow-hidden"
        style={{ animationDelay: "0.28s", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,51,102,0.04)" }}
      >
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-[#003366]" />
          <h3 className="text-[15px] font-bold text-gray-900">{t("reports.optionsTitle", "Generation Options")}</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Date range */}
            <div className="md:col-span-1 space-y-3">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">{t("reports.dateRange", "Date Range")}</label>
              <div className="space-y-2">
                <div className="flex items-center h-10 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-300 transition-all">
                  <span className="px-3 text-[11px] text-gray-400 font-medium flex-shrink-0">From</span>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    className="flex-1 h-full bg-transparent text-sm text-gray-700 outline-none pr-3" />
                </div>
                <div className="flex items-center h-10 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-300 transition-all">
                  <span className="px-3 text-[11px] text-gray-400 font-medium flex-shrink-0">To</span>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    className="flex-1 h-full bg-transparent text-sm text-gray-700 outline-none pr-3" />
                </div>
              </div>
            </div>

            {/* Format */}
            <div className="md:col-span-1 space-y-3">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">{t("reports.format", "Output Format")}</label>
              <div className="grid grid-cols-3 gap-2">
                {(["pdf", "xlsx", "docx"] as const).map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setFormat(fmt)}
                    className="h-10 rounded-xl border text-xs font-bold transition-all"
                    style={{
                      background: format === fmt ? "#003366" : "#f8fafc",
                      borderColor: format === fmt ? "#003366" : "#e2e8f0",
                      color: format === fmt ? "white" : "#64748b",
                    }}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-gray-400">
                {format === "pdf" ? "PDF document, ready to print" : format === "xlsx" ? "Excel spreadsheet" : "Word document"}
              </p>
            </div>

            {/* Generate action */}
            <div className="md:col-span-1 flex flex-col justify-end space-y-3">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">&nbsp;</label>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full h-10 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 relative overflow-hidden group transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70"
                style={{ background: "linear-gradient(135deg, #003366 0%, #0055aa 100%)" }}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative flex items-center gap-2">
                  {generating ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
                  ) : (
                    <><Download className="h-4 w-4" />{t("reports.downloadReport", "Generate Report")}<ArrowRight className="h-3.5 w-3.5" /></>
                  )}
                </span>
              </button>
              <p className="text-[11px] text-gray-400 text-center">
                {selectedReport !== null
                  ? `${reportTypes[selectedReport].tag} report selected`
                  : "Select a report type above"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
