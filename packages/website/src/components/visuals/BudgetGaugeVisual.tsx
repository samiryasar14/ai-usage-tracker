import { BellRing } from "lucide-react";

const PERCENT = 78;
const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function BudgetGaugeVisual() {
  const offset = CIRCUMFERENCE * (1 - PERCENT / 100);

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-32 w-32">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="var(--hairline)" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke="url(#gauge-gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="gauge-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--series-1)" />
              <stop offset="100%" stopColor="var(--series-2)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-text-primary">{PERCENT}%</span>
          <span className="text-[10px] text-text-muted">of budget</span>
        </div>
      </div>

      <div className="mt-5 flex w-full items-start gap-2.5 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3.5 py-2.5 text-left">
        <BellRing size={15} className="mt-0.5 shrink-0 text-amber-500" />
        <p className="text-xs leading-snug text-amber-700 dark:text-amber-400">
          Approaching your $200 monthly budget — projected to land at $214.
        </p>
      </div>
    </div>
  );
}
