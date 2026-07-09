import type { LucideIcon } from "lucide-react";
import { Bot, Cpu, Sparkles, Terminal, Globe, Boxes, Wrench, Code2 } from "lucide-react";
import { Reveal } from "./Reveal";

interface LiveProvider {
  name: string;
  detail: string;
}

const LIVE_PROVIDERS: LiveProvider[] = [
  { name: "Claude Code", detail: "Reads your local session logs directly — no API key needed to get started." },
  { name: "OpenAI", detail: "Optional API key unlocks spend and usage tracking for your OpenAI account." },
];

interface RoadmapProvider {
  name: string;
  icon: LucideIcon;
}

const ROADMAP_PROVIDERS: RoadmapProvider[] = [
  { name: "Cursor", icon: Terminal },
  { name: "GitHub Copilot", icon: Code2 },
  { name: "Gemini", icon: Sparkles },
  { name: "OpenRouter", icon: Globe },
  { name: "Groq", icon: Cpu },
  { name: "Ollama", icon: Boxes },
  { name: "Mistral", icon: Wrench },
  { name: "DeepSeek", icon: Bot },
  { name: "Cohere", icon: Sparkles },
  { name: "Together AI", icon: Globe },
  { name: "JetBrains AI", icon: Code2 },
  { name: "Windsurf", icon: Terminal },
];

export function Integrations() {
  return (
    <section id="integrations" className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">Built to track every AI tool</h2>
        <p className="mt-4 text-lg text-text-secondary">
          Two providers work today. The plugin architecture is built so more can be added without a rewrite.
        </p>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {LIVE_PROVIDERS.map((provider, i) => (
          <Reveal key={provider.name} delayMs={i * 100}>
            <div className="glass-panel group relative overflow-hidden rounded-2xl p-6">
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[radial-gradient(closest-side,var(--series-1),transparent)] opacity-20 blur-3xl transition-opacity duration-300 group-hover:opacity-35" />
              <div className="relative flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">{provider.name}</h3>
                <span className="flex items-center gap-1.5 rounded-full bg-series-3/10 px-2.5 py-1 text-[11px] font-medium text-series-3">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-series-3" />
                  Connected
                </span>
              </div>
              <p className="relative mt-3 text-sm leading-relaxed text-text-secondary">{provider.detail}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delayMs={120} className="mt-14 text-center">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">On the roadmap</h3>
      </Reveal>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {ROADMAP_PROVIDERS.map(({ name, icon: Icon }, i) => (
          <Reveal key={name} delayMs={i * 30}>
            <div className="flex items-center gap-2 rounded-full border border-dashed border-hairline px-4 py-2 text-sm text-text-muted opacity-70 transition-opacity hover:opacity-100">
              <Icon size={14} />
              {name}
              <span className="text-[10px] uppercase tracking-wide text-text-muted/70">Soon</span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
