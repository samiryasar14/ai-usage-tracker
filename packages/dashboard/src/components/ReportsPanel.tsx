import { FileDown, FileJson, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, reportExportUrl, type ReportFormat, type ReportPeriod } from "../api";

const PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: "day", label: "Today" },
  { value: "week", label: "Last 7 days" },
  { value: "month", label: "This month" },
];

const primaryLinkClass =
  "flex items-center gap-1.5 rounded-md bg-text-primary px-3 py-1.5 text-sm font-medium text-surface transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface";
const secondaryLinkClass =
  "flex items-center gap-1.5 rounded-md border border-hairline px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-hairline/20 focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface";

export function ReportsPanel() {
  const settings = useQuery({ queryKey: ["settings"], queryFn: api.settings });
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [initializedFromSettings, setInitializedFromSettings] = useState(false);

  // Settings load asynchronously after mount — seed the period picker from
  // the saved default exactly once, without overwriting the user's choice
  // on every settings refetch.
  useEffect(() => {
    if (initializedFromSettings || !settings.data) return;
    if (settings.data.defaultReportPeriod) setPeriod(settings.data.defaultReportPeriod as ReportPeriod);
    setInitializedFromSettings(true);
  }, [settings.data, initializedFromSettings]);

  const defaultFormat: ReportFormat = (settings.data?.defaultReportFormat as ReportFormat) ?? "csv";

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm text-text-secondary">
        Period
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
          className="w-40 rounded-md border border-hairline bg-transparent px-2 py-1 text-text-primary transition-colors focus:border-series-1 focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface"
        >
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      <a
        href={reportExportUrl(period, "csv")}
        className={defaultFormat === "csv" ? primaryLinkClass : secondaryLinkClass}
      >
        <FileDown size={14} />
        Download CSV
      </a>
      <a
        href={reportExportUrl(period, "json")}
        className={defaultFormat === "json" ? primaryLinkClass : secondaryLinkClass}
      >
        <FileJson size={14} />
        Download JSON
      </a>
      <a
        href={reportExportUrl(period, "pdf")}
        className={defaultFormat === "pdf" ? primaryLinkClass : secondaryLinkClass}
      >
        <FileText size={14} />
        Download PDF
      </a>
    </div>
  );
}
