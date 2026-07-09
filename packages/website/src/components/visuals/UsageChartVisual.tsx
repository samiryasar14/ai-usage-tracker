const BARS = [28, 42, 35, 58, 50, 72, 40, 85, 62, 78, 55, 92];
const MODELS = [
  { name: "Claude Opus", pct: 62 },
  { name: "Claude Sonnet", pct: 28 },
  { name: "GPT-5", pct: 10 },
];

export function UsageChartVisual() {
  return (
    <div className="relative">
      <div className="flex h-32 items-end gap-1.5">
        {BARS.map((height, i) => (
          <div
            key={i}
            className="animate-grow-bar w-full origin-bottom rounded-t-sm"
            style={{
              height: `${height}%`,
              background: "linear-gradient(to top, var(--series-1), var(--series-2))",
              boxShadow: "0 0 12px -2px var(--series-1)",
              animationDelay: `${i * 60}ms`,
              opacity: 0.85,
            }}
          />
        ))}
      </div>
      <div className="mt-5 space-y-2.5 border-t border-hairline pt-4">
        {MODELS.map((model) => (
          <div key={model.name} className="flex items-center gap-3 text-xs">
            <span className="w-24 shrink-0 text-text-secondary">{model.name}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-hairline">
              <div
                className="h-full rounded-full bg-[linear-gradient(to_right,var(--series-1),var(--series-2))]"
                style={{ width: `${model.pct}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-text-muted">{model.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
