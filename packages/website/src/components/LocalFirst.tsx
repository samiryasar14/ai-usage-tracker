import type { LucideIcon } from "lucide-react";
import { Terminal, Puzzle, Database, LayoutDashboard } from "lucide-react";
import { Reveal } from "./Reveal";

interface Node {
  icon: LucideIcon;
  label: string;
  detail: string;
}

const NODES: Node[] = [
  { icon: Terminal, label: "Claude Code / OpenAI", detail: "Your local session logs" },
  { icon: Puzzle, label: "Plugin", detail: "Reads & normalizes usage" },
  { icon: Database, label: "SQLite", detail: "Stored on your disk" },
  { icon: LayoutDashboard, label: "Dashboard", detail: "Your desktop app" },
];

function Connector() {
  return (
    <div className="relative mx-1 hidden h-px flex-1 overflow-hidden bg-hairline sm:block">
      <div className="absolute inset-y-0 h-full w-10 animate-flow-dot bg-[linear-gradient(to_right,transparent,var(--series-1),transparent)]" />
    </div>
  );
}

export function LocalFirst() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          Everything stays on this device
        </h2>
        <p className="mt-4 text-lg text-text-secondary">
          No cloud sync, no external server, no telemetry. Data flows in one direction — onto your disk, and no
          further.
        </p>
      </Reveal>

      <Reveal delayMs={100} className="mt-14">
        <div className="glass-panel rounded-2xl p-8 sm:p-10">
          <div className="flex flex-col items-stretch gap-6 sm:flex-row sm:items-center">
            {NODES.map((node, i) => (
              <div key={node.label} className="flex flex-1 items-center gap-6 sm:flex-col sm:text-center">
                <div className="flex flex-col items-center gap-2 sm:flex-1">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-series-1/10 text-series-1">
                    <node.icon size={20} />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-text-primary">{node.label}</div>
                    <div className="text-xs text-text-muted">{node.detail}</div>
                  </div>
                </div>
                {i < NODES.length - 1 && <Connector />}
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
