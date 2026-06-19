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
import { toast } from "sonner";
import { adminFetch } from "../../../api/adminFetch";

const API_BASE = (import.meta as any).env?.VITE_API_URL || "/ehp/api";

type ReportApiType = "daily" | "monthly" | "occupancy" | "revenue";

export function ReportsPage() {
  const { t } = useTranslation("admin");
  const [selectedReport, setSelectedReport] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [generating, setGenerating] = useState(false);

  const reportTypes: Array<{
    apiType: ReportApiType;
    nameKey: string;
    descriptionKey: string;
    icon: typeof FileText;
    gradient: string;
    accentBg: string;
    accentText: string;
    tagKey: string;
  }> = [
    {
      apiType: "daily",
      nameKey: "reports.daily",
      descriptionKey: "reports.dailyDesc",
      icon: FileText,
      gradient: "linear-gradient(to right, #3b82f6, #1d4ed8)",
      accentBg: "bg-blue-50",
      accentText: "text-blue-600",
      tagKey: "reports.tags.daily",
    },
    {
      apiType: "monthly",
      nameKey: "reports.monthly",
      descriptionKey: "reports.monthlyDesc",
      icon: CalendarIcon,
      gradient: "linear-gradient(to right, #8b5cf6, #6d28d9)",
      accentBg: "bg-violet-50",
      accentText: "text-violet-600",
      tagKey: "reports.tags.monthly",
    },
    {
      apiType: "occupancy",
      nameKey: "reports.roomOccupancy",
      descriptionKey: "reports.roomOccupancyDesc",
      icon: Bed,
      gradient: "linear-gradient(to right, #10b981, #047857)",
      accentBg: "bg-emerald-50",
      accentText: "text-emerald-600",
      tagKey: "reports.tags.occupancy",
    },
    {
      apiType: "revenue",
      nameKey: "reports.revenue",
      descriptionKey: "reports.revenueDesc",
      icon: DollarSign,
      gradient: "linear-gradient(to right, #f59e0b, #ea580c)",
      accentBg: "bg-amber-50",
      accentText: "text-amber-600",
      tagKey: "reports.tags.revenue",
    },
  ];

  const handleGenerate = async () => {
    if (selectedReport === null) {
      toast.error(t("reports.selectFirst", "Please select a report type above."));
      return;
    }
    setGenerating(true);
    try {
      const report = reportTypes[selectedReport];
      const params = new URLSearchParams();
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      const qs = params.toString();
      const url = `${API_BASE}/admin/reports/${report.apiType}${qs ? "?" + qs : ""}`;
      const res = await adminFetch(url);
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error || `Server error ${res.status}`);
      }
      const blob = await res.blob();
      // Try to read the server-suggested filename from Content-Disposition; fall back to a default.
      const dispo = res.headers.get("Content-Disposition") || "";
      const match = dispo.match(/filename="?([^"]+)"?/i);
      const filename = match ? match[1] : `${report.apiType}-report.csv`;
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
      toast.success(t("reports.downloaded", "Report downloaded: {{name}}", { name: filename }));
    } catch (err: any) {
      console.error("Report generation failed:", err);
      toast.error(err?.message || t("reports.generateFailed", "Failed to generate report."));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes rpIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .rp-card { animation: rpIn 0.3s ease-out both; }
      `}</style>

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" style={{ animation: "rpIn 0.3s ease-out" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
            style={{ background: "linear-gradient(to bottom right, #003366, #0055aa)" }}
          >
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-[28px] font-semibold text-[#003366] tracking-tight leading-tight">{t("pages.reports.title", "Reports")}</h1>
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
              <div className="h-1" style={{ background: report.gradient }} />
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl ${report.accentBg} ${report.accentText} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-[15px] font-bold text-gray-900">{t(report.nameKey)}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${report.accentBg} ${report.accentText}`}>{t(report.tagKey)}</span>
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
                  <span className="px-3 text-[11px] text-gray-400 font-medium flex-shrink-0">{t("reports.from", "From")}</span>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    className="flex-1 h-full bg-transparent text-sm text-gray-700 outline-none pr-3" />
                </div>
                <div className="flex items-center h-10 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-300 transition-all">
                  <span className="px-3 text-[11px] text-gray-400 font-medium flex-shrink-0">{t("reports.to", "To")}</span>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    className="flex-1 h-full bg-transparent text-sm text-gray-700 outline-none pr-3" />
                </div>
              </div>
            </div>

            {/* Format */}
            <div className="md:col-span-1 space-y-3">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">{t("reports.format", "Output Format")}</label>
              <div className="flex items-center h-10 bg-gray-50 border border-gray-200 rounded-xl px-3.5 gap-2">
                <FileText className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-800 leading-tight">CSV</p>
                  <p className="text-[10px] text-gray-400 leading-tight">{t("reports.formatHint.csv", "Excel-friendly, UTF-8")}</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-400">
                {t("reports.formatNote", "Reports are downloaded as CSV files compatible with Excel and Google Sheets.")}
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
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t("reports.generating", "Generating...")}</>
                  ) : (
                    <><Download className="h-4 w-4" />{t("reports.downloadReport", "Generate Report")}<ArrowRight className="h-3.5 w-3.5" /></>
                  )}
                </span>
              </button>
              <p className="text-[11px] text-gray-400 text-center">
                {selectedReport !== null
                  ? t("reports.selectedHint", "{{tag}} report selected", { tag: t(reportTypes[selectedReport].tagKey) })
                  : t("reports.selectPrompt", "Select a report type above")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
