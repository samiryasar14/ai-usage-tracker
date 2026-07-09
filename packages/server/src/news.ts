import Parser from "rss-parser";

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  publishedAt: string | null;
  summary: string | null;
  imageUrl: string | null;
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

// media:content / media:thumbnail are namespaced RSS extensions rss-parser
// doesn't parse by default — pull them in as custom fields so we can pick an
// image out of them below. Plain `enclosure` is already parsed natively.
const parser = new Parser<unknown, { mediaContent?: unknown; mediaThumbnail?: { $?: { url?: string } } }>({
  timeout: FETCH_TIMEOUT_MS,
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail"],
    ],
  },
});

function stripHtml(html: string | undefined): string | null {
  if (!html) return null;
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > 200 ? `${text.slice(0, 200)}…` : text || null;
}

function extractImage(item: {
  mediaContent?: unknown;
  mediaThumbnail?: { $?: { url?: string } };
  enclosure?: { url?: string; type?: string };
  content?: string;
  contentSnippet?: string;
}): string | null {
  const mediaContent = item.mediaContent;
  const candidates = Array.isArray(mediaContent) ? mediaContent : mediaContent ? [mediaContent] : [];
  for (const candidate of candidates) {
    const url = (candidate as { $?: { url?: string } })?.$?.url;
    if (url) return url;
  }
  if (item.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url;
  if (item.enclosure?.url && /^image\//.test(item.enclosure.type ?? "")) return item.enclosure.url;
  const imgMatch = /<img[^>]+src=["']([^"']+)["']/i.exec(item.content ?? "");
  return imgMatch ? imgMatch[1] : null;
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
      imageUrl: extractImage(item),
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

/**
 * Returns cached news, refreshing if the cache is stale or `force` is set
 * (backs the news panel's manual refresh button — bypasses the TTL so
 * "refresh" always actually re-fetches instead of silently no-op'ing inside
 * the 15-minute window). Never throws — a failed refresh just serves
 * whatever was cached before, or an empty list on a cold start.
 */
export async function getNews(limit: number, force = false): Promise<NewsItem[]> {
  const isStale = !cache || Date.now() - cache.fetchedAt > CACHE_TTL_MS;
  if (isStale || force) {
    try {
      await refreshCache();
    } catch (err) {
      console.warn("[news] Refresh failed, serving stale/empty cache:", err);
    }
  }
  return (cache?.items ?? []).slice(0, limit);
}
