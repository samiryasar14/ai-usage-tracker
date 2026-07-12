import { Sparkles, Terminal } from "lucide-react";

export function Onboarding() {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-hairline bg-surface px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-series-1/10 text-series-1">
        <Sparkles size={22} />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-text-primary">No usage recorded yet</h2>
      <p className="mt-2 max-w-md text-sm text-text-secondary">
        Soar AI Tracker watches your local Claude Code logs (<code className="text-text-primary">~/.claude/projects</code>)
        and updates automatically as you work — nothing to configure.
      </p>
      <div className="mt-6 flex items-center gap-2 rounded-md border border-hairline bg-plane px-4 py-2 text-sm text-text-secondary">
        <Terminal size={15} className="shrink-0 text-text-muted" />
        Run a Claude Code session, and this dashboard fills in within a few seconds.
      </div>
    </div>
  );
}
