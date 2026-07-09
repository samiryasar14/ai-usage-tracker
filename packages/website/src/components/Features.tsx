import type { LucideIcon } from "lucide-react";
import { BellRing, Github, Lightbulb, Lock, MessageCircleQuestion, Radar } from "lucide-react";
import { Reveal } from "./Reveal";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: Radar,
    title: "Usage tracking",
    description:
      "Real-time spend and token tracking across every session and project, broken down by model — updated live as you work.",
  },
  {
    icon: BellRing,
    title: "Budget alerts & forecasting",
    description:
      "Set a monthly budget and get alerted as you approach it. A simple cost forecast projects where you'll land before the month ends.",
  },
  {
    icon: MessageCircleQuestion,
    title: "AI assistant",
    description:
      "Ask plain-language questions about your spend — \"what did I spend on this project last week?\" — and get a straight answer.",
  },
  {
    icon: Lightbulb,
    title: "Per-project recommendations",
    description:
      "AI-suggested budget limits for each project, based on your real usage trends instead of guesswork.",
  },
  {
    icon: Lock,
    title: "Local-first & private",
    description:
      "Everything runs on your machine against your local session logs. No account, no cloud sync, nothing ever uploaded.",
  },
  {
    icon: Github,
    title: "Open source",
    description: "MIT licensed and public on GitHub — inspect it, self-host it, or send a pull request.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          Everything you need to stay ahead of the bill
        </h2>
        <p className="mt-4 text-lg text-text-secondary">
          Soar AI Tracker turns scattered log files into a clear picture of what you're actually spending.
        </p>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description }, i) => (
          <Reveal key={title} delayMs={i * 80}>
            <div className="group relative h-full overflow-hidden rounded-xl border border-hairline bg-surface p-6 transition-colors hover:border-series-1/40">
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[radial-gradient(closest-side,var(--series-1),var(--series-2))] opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-20" />
              <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg bg-series-1/10 text-series-1 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-3">
                <Icon size={20} />
              </span>
              <h3 className="relative mt-4 text-base font-semibold text-text-primary">{title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-text-secondary">{description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
