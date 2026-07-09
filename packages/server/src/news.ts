import Parser from "rss-parser";

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  publishedAt: string | null;
  summary: string | null;
}

// Verified working (checked by hand, not guessed) — official feeds where one
// exists, an official GitHub releases Atom feed otherwise (GitHub generates
// these automatically for any public repo, so they're always reliable).
const NEWS_SOURCES: Array<{ name: string; url: string }> = [
  { name: "Claude Code", url: "https://github.com/anthropics/claude-code/releases.atom" },
  { name: "OpenAI", url: "https://openai.com/news/rss.xml" },
  { name: "Cursor", url: "https://cursor.com/changelog/rss.xml" },
  { name: "Codex CLI", url: "https://github.com/openai/codex/releases.atom" },
  { name: "GitHub Changelog", url: "https://github.blog/changelog/feed/" },
];

const CACHE_TTL_MS = 15 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8_000;

let cache: { items: NewsItem[]; fetchedAt: number } | null = null;
const parser = new Parser({ timeout: FETCH_TIMEOUT_MS });

function stripHtml(html: string | undefined): string | null {
  if (!html) return null;
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > 200 ? `${text.slice(0, 200)}…` : text || null;
}

async function fetchSource(source: { name: string; url: string }): Promise<NewsItem[]> {
  try {
    const feed = await parser.parseURL(source.url);
    return (feed.items ?? []).slice(0, 10).map((item) => ({
      title: item.title ?? "(untitled)",
      link: item.link ?? source.url,
      source: source.name,
      publishedAt: item.isoDate ?? item.pubDate ?? null,
      summary: stripHtml(item.contentSnippet ?? item.content),
    }));
  } catch (err) {
    // A down/renamed feed shouldn't break the whole panel — log and skip it.
    console.warn(`[news] Failed to fetch "${source.name}" (${source.url}):`, err);
    return [];
  }
}

async function refreshCache(): Promise<NewsItem[]> {
  const results = await Promise.allSettled(NEWS_SOURCES.map(fetchSource));
  const items = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  items.sort((a, b) => {
    const aTime = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const bTime = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return bTime - aTime;
  });
  cache = { items, fetchedAt: Date.now() };
  return items;
}

/** Returns cached news, refreshing in the background if the cache is stale. Never throws. */
export async function getNews(limit: number): Promise<NewsItem[]> {
  const isStale = !cache || Date.now() - cache.fetchedAt > CACHE_TTL_MS;
  if (isStale) {
    try {
      await refreshCache();
    } catch (err) {
      console.warn("[news] Refresh failed, serving stale/empty cache:", err);
    }
  }
  return (cache?.items ?? []).slice(0, limit);
}
