import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Newspaper, RefreshCw } from "lucide-react";
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
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const news = useQuery({
    queryKey: ["news"],
    queryFn: () => api.news(20),
    refetchInterval: 15 * 60_000,
    staleTime: 10 * 60_000,
  });

  // Bypasses the server's 15-minute cache TTL (`force=1`) so the button always
  // pulls genuinely fresh items instead of silently no-op'ing mid-window, then
  // writes straight into the query cache — no need to touch the queryFn above.
  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      const fresh = await api.news(20, true);
      queryClient.setQueryData(["news"], fresh);
    } catch {
      // Swallow — the panel keeps showing whatever it had before.
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-medium text-text-secondary">
          <Newspaper size={16} />
          AI News
        </h2>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          title="Refresh news"
          aria-label="Refresh news"
          className="flex h-6 w-6 items-center justify-center rounded text-text-muted transition-colors hover:bg-text-primary/[0.06] hover:text-text-primary disabled:opacity-50"
        >
          <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
        </button>
      </div>

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
              className="group flex gap-3 rounded-md border border-hairline p-3 transition-colors hover:border-series-1/50 hover:bg-text-primary/[0.02]"
            >
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt=""
                  loading="lazy"
                  className="h-14 w-14 shrink-0 rounded object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
              <div className="min-w-0 flex-1">
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
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
