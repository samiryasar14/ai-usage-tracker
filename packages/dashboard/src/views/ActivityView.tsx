import { useQuery } from "@tanstack/react-query";
import { Bell, CreditCard, History, Smartphone } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { api } from "../api";

interface SectionHeadingProps {
  icon: ComponentType<{ size?: string | number; className?: string }>;
  children: ReactNode;
}

function SectionHeading({ icon: Icon, children }: SectionHeadingProps) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-medium text-text-secondary">
      <Icon size={16} className="text-text-secondary" />
      {children}
    </h2>
  );
}

// Keyed off ActivityEvent.type (see packages/server/src/activity.ts callers) —
// unrecognized types still render, just with the generic History icon.
const ACTIVITY_ICONS: Record<string, ComponentType<{ size?: string | number; className?: string }>> = {
  alert_triggered: Bell,
  subscription_added: CreditCard,
  subscription_removed: CreditCard,
  device_paired: Smartphone,
  device_revoked: Smartphone,
};

export function ActivityView() {
  const activity = useQuery({
    queryKey: ["activity"],
    queryFn: () => api.activity(50),
    refetchInterval: 15_000,
  });

  const events = activity.data ?? [];

  return (
    <div>
      <section className="rounded-lg border border-hairline bg-surface p-5">
        <SectionHeading icon={History}>Activity</SectionHeading>
        <ul className="mt-4 space-y-2">
          {events.map((event) => {
            const Icon = ACTIVITY_ICONS[event.type] ?? History;
            return (
              <li
                key={event.id}
                className="flex items-start gap-3 rounded-md border border-hairline px-3 py-2 text-sm"
              >
                <Icon size={15} className="mt-0.5 shrink-0 text-series-1" />
                <div className="min-w-0 flex-1">
                  <div className="text-text-primary">{event.message}</div>
                  <div className="text-text-muted">{new Date(event.createdAt).toLocaleString()}</div>
                </div>
              </li>
            );
          })}
          {events.length === 0 && (
            <li className="rounded-md border border-dashed border-hairline px-3 py-4 text-center text-sm text-text-muted">
              No activity yet.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
