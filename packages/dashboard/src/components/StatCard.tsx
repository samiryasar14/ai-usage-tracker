interface StatCardProps {
  label: string;
  value: string;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-lg border border-hairline bg-surface px-5 py-4">
      <div className="text-sm text-text-secondary">{label}</div>
      <div className="mt-1 text-3xl font-semibold text-text-primary">{value}</div>
    </div>
  );
}
