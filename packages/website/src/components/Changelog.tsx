import { Bug, Sparkles, Wrench } from "lucide-react";
import { Reveal } from "./Reveal";

const RELEASES = [
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
