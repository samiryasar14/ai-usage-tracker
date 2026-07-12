import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, FolderKanban, History, Sparkles, Settings, Moon, Sun } from "lucide-react";
import { api, connectRefreshSocket, type Settings as SettingsMap } from "./api";
import { Logo } from "./components/Logo";
import { NewsPanel } from "./components/NewsPanel";
import { ResizablePanel } from "./components/ResizablePanel";
import { DashboardView } from "./views/DashboardView";
import { ProjectsView } from "./views/ProjectsView";
import { ActivityView } from "./views/ActivityView";
import { AssistantView } from "./views/AssistantView";
import { SettingsView } from "./views/SettingsView";

type Tab = "dashboard" | "projects" | "activity" | "assistant" | "settings";

const TABS: Array<{ key: Tab; label: string; icon: typeof LayoutDashboard }> = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "projects", label: "Projects", icon: FolderKanban },
  { key: "activity", label: "Activity", icon: History },
  { key: "assistant", label: "AI Assistant", icon: Sparkles },
  { key: "settings", label: "Settings", icon: Settings },
];

function useDarkMode() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  function toggle() {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  }

  return { dark, toggle };
}

export function App() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [toast, setToast] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(true);
  const { dark, toggle: toggleDark } = useDarkMode();

  // Same React Query cache key as the copy fetched inside SettingsView, so
  // this doesn't cause an extra request — just gives onAlert below a synchronous
  // way to read the current preference via queryClient.getQueryData.
  useQuery({ queryKey: ["settings"], queryFn: api.settings });

  useEffect(() => {
    return connectRefreshSocket({
      onRefresh: () => queryClient.invalidateQueries(),
      onAlert: (message) => {
        setToast(message);
        queryClient.invalidateQueries({ queryKey: ["alertEvents"] });
        const settings = queryClient.getQueryData<SettingsMap>(["settings"]);
        if (settings?.notifyOnBudgetAlert !== "false") {
          void window.electronAPI?.showNotification?.("Soar AI Tracker", message);
        }
      },
      onConnectionChange: setSocketConnected,
    });
  }, [queryClient]);

  // Kept at the shell level (not inside DashboardView) so the "server is
  // unreachable" / "some models are unpriced" banners are visible from any
  // tab, not just Dashboard. Same React Query cache key as the copy fetched
  // inside DashboardView, so this doesn't cause an extra request.
  const overview = useQuery({ queryKey: ["overview"], queryFn: api.overview, refetchInterval: 15_000 });
  const unpricedModels = overview.data?.unpricedModels ?? [];

  return (
    <div className="flex h-screen bg-plane">
      {/* Icon-only left sidebar — replaces the old top nav bar. Native `title`
          attributes give hover tooltips without a new dependency. */}
      <ResizablePanel side="left" storageKey="sidebar-width" defaultWidth={64} minWidth={56} maxWidth={112}>
        <aside className="glass-panel flex h-full flex-col items-center py-4">
          <div className="relative" title="Soar AI Tracker">
            <Logo size={28} />
            {/* Small live-connection indicator — reflects the same socketConnected
                state as the "Live updates disconnected" banner below, just as an
                always-visible glance rather than only appearing on disconnect. */}
            <span
              title={socketConnected ? "Live" : "Reconnecting…"}
              className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ${
                socketConnected ? "bg-series-1 animate-live-pulse" : "bg-text-muted"
              }`}
            />
          </div>

          <nav className="mt-8 flex flex-col items-center gap-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                title={label}
                aria-label={label}
                className={`flex h-10 w-10 items-center justify-center rounded-md transition-colors ${
                  tab === key
                    ? "bg-text-primary/[0.06] text-series-1"
                    : "text-text-secondary hover:bg-text-primary/[0.04] hover:text-text-primary"
                }`}
              >
                <Icon size={19} />
              </button>
            ))}
          </nav>

          <button
            type="button"
            onClick={toggleDark}
            title="Toggle dark mode"
            aria-label="Toggle dark mode"
            className="mt-auto flex h-10 w-10 items-center justify-center rounded-md text-text-secondary hover:bg-text-primary/[0.04] hover:text-text-primary"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </aside>
      </ResizablePanel>

      {/* Center: scrollable main content, independent of the sidebar/news panel. */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-8">
          {toast && (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-600">
              <span>{toast}</span>
              <button type="button" onClick={() => setToast(null)} className="ml-4 font-medium">
                Dismiss
              </button>
            </div>
          )}

          {!socketConnected && (
            <div className="mb-4 rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-600">
              Live updates disconnected — reconnecting… (data will refresh automatically once back online)
            </div>
          )}

          {overview.isError && (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-600">
              <span>Couldn&apos;t reach the Soar AI Tracker server. Is it running?</span>
              <button type="button" onClick={() => queryClient.invalidateQueries()} className="ml-4 font-medium">
                Retry
              </button>
            </div>
          )}

          {unpricedModels.length > 0 && (
            <div className="mb-4 rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-600">
              Cost not counted for {unpricedModels.reduce((sum, m) => sum + m.requestCount, 0)} request
              {unpricedModels.reduce((sum, m) => sum + m.requestCount, 0) === 1 ? "" : "s"} from unpriced model
              {unpricedModels.length === 1 ? "" : "s"}: {unpricedModels.map((m) => m.name).join(", ")}. Spend totals
              below are under-reported until pricing is added for {unpricedModels.length === 1 ? "it" : "them"}.
            </div>
          )}

          {tab === "dashboard" && <DashboardView />}
          {tab === "projects" && <ProjectsView />}
          {tab === "activity" && <ActivityView />}
          {tab === "assistant" && <AssistantView />}
          {tab === "settings" && <SettingsView />}
        </div>
      </div>

      {/* Right: AI news panel — scrolls independently, hidden below `lg` since
          three columns plus content needs real screen width. */}
      <ResizablePanel
        side="right"
        storageKey="news-panel-width"
        defaultWidth={320}
        minWidth={240}
        maxWidth={560}
        className="hidden lg:flex"
      >
        <aside className="glass-panel h-full p-5">
          <NewsPanel />
        </aside>
      </ResizablePanel>
    </div>
  );
}
