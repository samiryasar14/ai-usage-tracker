import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, FolderKanban, Sparkles, Settings, Moon, Sun } from "lucide-react";
import { api, connectRefreshSocket } from "./api";
import { DashboardView } from "./views/DashboardView";
import { ProjectsView } from "./views/ProjectsView";
import { AssistantView } from "./views/AssistantView";
import { SettingsView } from "./views/SettingsView";

type Tab = "dashboard" | "projects" | "assistant" | "settings";

const TABS: Array<{ key: Tab; label: string; icon: typeof LayoutDashboard }> = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "projects", label: "Projects", icon: FolderKanban },
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

  useEffect(() => {
    return connectRefreshSocket({
      onRefresh: () => queryClient.invalidateQueries(),
      onAlert: (message) => {
        setToast(message);
        queryClient.invalidateQueries({ queryKey: ["alertEvents"] });
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
    <div className="min-h-screen bg-plane">
      <header className="border-b border-hairline bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <span className="text-sm font-semibold text-text-primary">AI Usage Hub</span>
            <nav className="flex items-center gap-1">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    tab === key
                      ? "bg-text-primary/[0.06] text-text-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </nav>
          </div>
          <button
            type="button"
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            className="rounded-md p-1.5 text-text-secondary hover:text-text-primary"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
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
            <span>Couldn&apos;t reach the AI Usage Hub server. Is it running?</span>
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
        {tab === "assistant" && <AssistantView />}
        {tab === "settings" && <SettingsView />}
      </div>
    </div>
  );
}
