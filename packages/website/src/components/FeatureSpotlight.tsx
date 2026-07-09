import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Reveal } from "./Reveal";

interface FeatureSpotlightProps {
  icon: LucideIcon;
  title: string;
  description: string;
  bullets: string[];
  visual: ReactNode;
  reverse?: boolean;
}

export function FeatureSpotlight({ icon: Icon, title, description, bullets, visual, reverse }: FeatureSpotlightProps) {
  return (
    <div className={`flex flex-col items-center gap-10 lg:flex-row ${reverse ? "lg:flex-row-reverse" : ""}`}>
      <Reveal className="flex-1">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-series-1/10 text-series-1">
          <Icon size={20} />
        </span>
        <h3 className="mt-4 text-2xl font-bold tracking-tight text-text-primary">{title}</h3>
        <p className="mt-3 max-w-md text-base leading-relaxed text-text-secondary">{description}</p>
        <ul className="mt-5 space-y-2">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2 text-sm text-text-secondary">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-series-1" />
              {bullet}
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal delayMs={120} className="w-full flex-1">
        <div className="glass-panel relative overflow-hidden rounded-2xl p-6 shadow-2xl shadow-black/10">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[radial-gradient(closest-side,var(--series-1),var(--series-2))] opacity-10 blur-3xl" />
          {visual}
        </div>
      </Reveal>
    </div>
  );
}
