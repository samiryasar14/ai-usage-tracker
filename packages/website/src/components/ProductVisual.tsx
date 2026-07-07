import { ArrowDownRight, Bell, LayoutDashboard, Sparkles, TrendingUp } from "lucide-react";

const BARS = [32, 48, 40, 62, 55, 78, 46, 90, 68, 84, 60, 96];

const STATS = [
  { label: "Spend this month", value: "$41.20", delta: "+12%", tone: "up" as const },
  { label: "Tokens processed", value: "18.4M", delta: "+4%", tone: "up" as const },
  { label: "Projected month-end", value: "$63.90", delta: "under budget", tone: "down" as const },
];

export function ProductVisual() {
  return (
    <div className="relative mx-auto max-w-4xl">
      {/* Floating decorative chips */}
      <div className="animate-float pointer-events-none absolute -left-4 top-6 z-10 hidden rounded-xl border border-hairline bg-surface px-4 py-3 shadow-xl shadow-black/5 sm:flex sm:items-center sm:gap-2 md:-left-10">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-series-1/10 text-series-1">
          <Bell size={15} />
        </span>
        <div className="text-left">
          <div className="text-xs font-semibold text-text-primary">Budget alert</div>
          <div className="text-[11px] text-text-muted">80% of monthly limit</div>
        </div>
      </div>

      <div className="animate-float-delayed pointer-events-none absolute -right-4 top-24 z-10 hidden rounded-xl border border-hairline bg-surface px-4 py-3 shadow-xl shadow-black/5 sm:flex sm:items-center sm:gap-2 md:-right-10">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-series-2/10 text-series-2">
          <Sparkles size={15} />
        </span>
        <div className="text-left">
          <div className="text-xs font-semibold text-text-primary">Suggested limit</div>
          <div className="text-[11px] text-text-muted">$55 / mo for this project</div>
        </div>
      </div>

      {/* Main mockup frame */}
      <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-2xl shadow-black/10">
        {/* Titlebar */}
        <div className="flex items-center gap-2 border-b border-hairline px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          <div className="ml-3 flex items-center gap-1 text-xs font-medium text-text-secondary">
            <LayoutDashboard size={13} />
            AI Usage Hub — Dashboard
          </div>
        </div>

        <div className="p-5 sm:p-8">
          {/* Stat cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-hairline bg-plane px-4 py-3 text-left">
                <div className="text-[11px] text-text-secondary">{stat.label}</div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl font-semibold text-text-primary sm:text-2xl">{stat.value}</span>
                  <span
                    className={`flex items-center text-[11px] font-medium ${
                      stat.tone === "up" ? "text-series-1" : "text-emerald-500"
                    }`}
                  >
                    {stat.tone === "down" && <ArrowDownRight size={11} />}
                    {stat.delta}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div className="mt-5 rounded-lg border border-hairline bg-plane px-4 py-4 sm:mt-6 sm:px-6 sm:py-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                <TrendingUp size={13} />
                Spend over time
              </div>
              <div className="flex items-center gap-3 text-[11px] text-text-muted">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-series-1" /> Claude Code
                </span>
              </div>
            </div>
            <div className="flex h-32 items-end gap-1.5 sm:h-40 sm:gap-2">
              {BARS.map((height, i) => (
                <div key={i} className="group flex flex-1 flex-col items-center justify-end">
                  <div
                    className="animate-grow-bar w-full origin-bottom rounded-t-sm"
                    style={{
                      height: `${height}%`,
                      background: "linear-gradient(to top, var(--series-1), var(--series-2))",
                      animationDelay: `${i * 60}ms`,
                      opacity: 0.85,
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-text-muted">
              <span>4 weeks ago</span>
              <span>Today</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
