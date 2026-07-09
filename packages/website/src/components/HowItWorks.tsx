import { Download, Radar, LayoutDashboard } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Reveal } from "./Reveal";

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    icon: Download,
    title: "Install",
    description: "Grab the Windows installer and run it — no account, no setup wizard, done in under a minute.",
  },
  {
    icon: Radar,
    title: "It finds your usage automatically",
    description:
      "Soar AI Tracker reads your local Claude Code session logs directly. Add an OpenAI key later if you want that too — entirely optional.",
  },
  {
    icon: LayoutDashboard,
    title: "Watch it live",
    description: "Spend, tokens, and forecasts update in real time as you work, with alerts before you go over budget.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">Up and running in three steps</h2>
        <p className="mt-4 text-lg text-text-secondary">No config files, no API keys required to get started.</p>
      </Reveal>

      <div className="relative mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
        <div className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px bg-hairline sm:block" />

        {STEPS.map(({ icon: Icon, title, description }, i) => (
          <Reveal key={title} delayMs={i * 120} className="relative text-center sm:text-left">
            <div className="relative z-10 mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-hairline bg-plane text-sm font-bold text-series-1 sm:mx-0">
              {i + 1}
            </div>
            <span className="relative z-10 mt-4 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-series-1/10 text-series-1">
              <Icon size={17} />
            </span>
            <h3 className="mt-3 text-base font-semibold text-text-primary">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{description}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
