import type { ComponentType } from "react";

interface StatCardProps {
  label: string;
  value: string;
  icon: ComponentType<{ size?: string | number; className?: string }>;
}

export function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg glass-panel px-5 py-4 transition-shadow hover:shadow-[0_0_24px_-8px_var(--series-1)]">
      {/* Soft radial glow that fades in on hover — same technique as the
          website's feature cards (Features.tsx): an absolutely-positioned,
          blurred gradient blob that only becomes visible on :hover. */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[radial-gradient(closest-side,var(--series-1),var(--series-2))] opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-20" />
      <div className="relative flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-series-1/10 text-series-1">
          <Icon size={16} />
        </span>
        <div className="text-sm text-text-secondary">{label}</div>
      </div>
      <div className="relative mt-2 font-mono text-3xl font-semibold tabular-nums text-text-primary">{value}</div>
    </div>
  );
}
