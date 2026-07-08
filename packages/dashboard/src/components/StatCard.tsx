import type { ComponentType } from "react";

interface StatCardProps {
  label: string;
  value: string;
  icon: ComponentType<{ size?: string | number; className?: string }>;
}

export function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-lg border border-hairline bg-surface px-5 py-4">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-series-1/10 text-series-1">
          <Icon size={16} />
        </span>
        <div className="text-sm text-text-secondary">{label}</div>
      </div>
      <div className="mt-2 text-3xl font-semibold text-text-primary">{value}</div>
    </div>
  );
}
