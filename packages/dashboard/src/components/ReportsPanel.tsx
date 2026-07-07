import { FileDown, FileJson } from "lucide-react";
import { useState } from "react";
import { reportExportUrl, type ReportPeriod } from "../api";

const PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: "day", label: "Today" },
  { value: "week", label: "Last 7 days" },
  { value: "month", label: "This month" },
];

export function ReportsPanel() {
  const [period, setPeriod] = useState<ReportPeriod>("month");

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
        className="flex items-center gap-1.5 rounded-md border border-hairline px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-hairline/20 focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface"
      >
        <FileDown size={14} className="text-text-secondary" />
        Download CSV
      </a>
      <a
        href={reportExportUrl(period, "json")}
        className="flex items-center gap-1.5 rounded-md border border-hairline px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-hairline/20 focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface"
      >
        <FileJson size={14} className="text-text-secondary" />
        Download JSON
      </a>
    </div>
  );
}
