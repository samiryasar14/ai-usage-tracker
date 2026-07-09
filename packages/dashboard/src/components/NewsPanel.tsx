import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Newspaper } from "lucide-react";
import { api } from "../api";

const relativeTime = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });

function formatRelative(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);
  if (Math.abs(diffMinutes) < 60) return relativeTime.format(diffMinutes, "minute");
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return relativeTime.format(diffHours, "hour");
  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) return relativeTime.format(diffDays, "day");
  const diffMonths = Math.round(diffDays / 30);
  return relativeTime.format(diffMonths, "month");
}

export function NewsPanel() {
  const news = useQuery({
    queryKey: ["news"],
    queryFn: () => api.news(20),
    refetchInterval: 15 * 60_000,
    staleTime: 10 * 60_000,
  });

  return (
    <div>
      <h2 className="flex items-center gap-2 text-sm font-medium text-text-secondary">
        <Newspaper size={16} />
        AI News
      </h2>

      <div className="mt-3 space-y-3">
        {news.isLoading ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : news.isError ? (
          <p className="text-sm text-red-600">Couldn&apos;t load news right now.</p>
        ) : (news.data ?? []).length === 0 ? (
          <p className="text-sm text-text-muted">No news right now.</p>
        ) : (
          news.data!.map((item) => (
            <a
              key={item.link}
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="group block rounded-md border border-hairline p-3 transition-colors hover:border-series-1/50 hover:bg-text-primary/[0.02]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-series-1">{item.source}</span>
                <span className="text-xs text-text-muted">{formatRelative(item.publishedAt)}</span>
              </div>
              <div className="mt-1.5 flex items-start gap-1 text-sm font-medium leading-snug text-text-primary">
                <span className="flex-1">{item.title}</span>
                <ExternalLink
                  size={12}
                  className="mt-0.5 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
                />
              </div>
              {item.summary && <p className="mt-1 text-xs text-text-secondary line-clamp-2">{item.summary}</p>}
            </a>
          ))
        )}
      </div>
    </div>
  );
}
