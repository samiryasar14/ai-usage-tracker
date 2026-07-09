import { Reveal } from "./Reveal";

const STATS = [
  { value: "$0", label: "to use, forever" },
  { value: "100%", label: "local — nothing leaves your machine" },
  { value: "<60s", label: "install to first dashboard" },
  { value: "MIT", label: "licensed and open source" },
];

export function StatsBar() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 pb-4">
      <Reveal>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-hairline bg-hairline/60 backdrop-blur-xl sm:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="bg-surface/70 px-5 py-6 text-center">
              <div className="text-2xl font-bold tracking-tight text-gradient sm:text-3xl">{stat.value}</div>
              <div className="mt-1 text-xs text-text-secondary">{stat.label}</div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
