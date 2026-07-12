import { AlertTriangle, Bug, FileText, ListChecks, Plug, Sparkles, TrendingUp, Wrench } from "lucide-react";
import { Reveal } from "./Reveal";

const RELEASES = [
  {
    version: "v0.7.0",
    date: "July 12, 2026",
    changes: [
      { icon: Sparkles, text: "Data retention now archives daily totals before deleting, so trend charts survive past the retention window." },
      { icon: Sparkles, text: "Added manual multi-device sync — export usage data on one machine, import it on another." },
    ],
  },
  {
    version: "v0.6.0",
    date: "July 12, 2026",
    changes: [
      { icon: Sparkles, text: "Added a system tray icon — live today/month spend in the tooltip, plus a quick menu." },
      { icon: AlertTriangle, text: "Closing the window now minimizes to tray instead of quitting; use the tray menu to exit." },
    ],
  },
  {
    version: "v0.5.0",
    date: "July 12, 2026",
    changes: [
      { icon: TrendingUp, text: "Smarter forecast — weekday/weekend weighting plus a month-over-month trend." },
      { icon: AlertTriangle, text: "New Spending anomalies panel flags unusually high-cost days." },
      { icon: Sparkles, text: "Subscriptions and usage cost are unified into one total spend figure." },
      { icon: FileText, text: "Added PDF export alongside CSV/JSON." },
      { icon: Sparkles, text: "Budget rules can now target a specific project or model, and support daily budgets." },
      { icon: Sparkles, text: "A deterministic Insights panel summarizes what changed this month." },
    ],
  },
  {
    version: "v0.4.0",
    date: "July 12, 2026",
    changes: [
      { icon: Plug, text: "New GitHub Copilot plugin — pulls billed usage from GitHub's billing API." },
      { icon: Sparkles, text: "Providers are a real registry now: enable/disable and live connection status for each one in Settings." },
      { icon: Wrench, text: "Fixed OpenAI/Copilot requests being wrongly flagged as \"cost not counted\" when their cost was already accurate." },
    ],
  },
  {
    version: "v0.3.0",
    date: "July 12, 2026",
    changes: [
      { icon: Wrench, text: "Fixed subagent turns being double-counted in cost and token totals across the whole app." },
      { icon: ListChecks, text: "Every panel now shows a loading state and a retry banner on fetch failure." },
      { icon: Sparkles, text: "Sortable, filterable tables — Model Leaderboard, Session History, and Projects — plus Load More on Session History." },
      { icon: Sparkles, text: "Budget alert acknowledgement, in-place subscription editing, and an expanded Settings page (data retention, notifications, export defaults)." },
      { icon: Sparkles, text: "A first-run empty state for new installs with no usage data yet." },
    ],
  },
  {
    version: "v0.2.0",
    date: "July 11, 2026",
    changes: [
      { icon: Bug, text: "Fixed the packaged Windows app opening to a blank white screen." },
      { icon: Bug, text: "Fixed the app/taskbar/installer icon showing the generic Electron icon instead of the real logo." },
      { icon: Sparkles, text: "GitHub account renamed to sysamiryasar — repo links and auto-update now point to the new owner." },
      { icon: Wrench, text: "Fixed subagent turns being double-counted in cost and token totals across the dashboard, alerts, and forecast." },
    ],
  },
  {
    version: "v0.1.0",
    date: "July 9, 2026",
    changes: [
      { icon: Sparkles, text: "Initial release — Windows installer, dashboard, budget alerts, subscriptions, and CSV/JSON export." },
    ],
  },
];

export function Changelog() {
  return (
    <section id="changelog" className="relative mx-auto max-w-3xl px-6 py-20 sm:py-28">
      <Reveal className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">Changelog</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-text-secondary">What's changed, release by release.</p>
      </Reveal>

      <div className="mt-10 space-y-4">
        {RELEASES.map(({ version, date, changes }, i) => (
          <Reveal key={version} delayMs={i * 60}>
            <div className="glass-panel rounded-xl px-5 py-4">
              <div className="flex items-baseline gap-3">
                <span className="text-sm font-semibold text-series-1">{version}</span>
                <span className="text-xs text-text-muted">{date}</span>
              </div>
              <ul className="mt-3 space-y-2">
                {changes.map(({ icon: Icon, text }, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm text-text-secondary">
                    <Icon size={15} className="mt-0.5 shrink-0 text-text-muted" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
