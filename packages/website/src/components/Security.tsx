import { ShieldCheck, WifiOff, KeyRound, EyeOff } from "lucide-react";
import { Reveal } from "./Reveal";

const CLAIMS = [
  { icon: WifiOff, text: "No cloud sync. The app never phones home with your usage or code." },
  { icon: EyeOff, text: "No account, no telemetry, no analytics collection of any kind." },
  { icon: KeyRound, text: "Your optional OpenAI key is encrypted at rest using your OS's secure storage." },
];

export function Security() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <div className="glass-panel relative overflow-hidden rounded-3xl px-6 py-16 sm:px-12 sm:py-20">
        <div className="pointer-events-none absolute inset-x-0 -bottom-24 mx-auto h-64 w-[36rem] rounded-full bg-[radial-gradient(closest-side,var(--series-3),transparent)] opacity-10 blur-3xl" />

        <div className="relative mx-auto max-w-3xl text-center">
          <Reveal>
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-series-3/10" />
              <span className="absolute inset-2 rounded-full bg-series-3/10" />
              <ShieldCheck size={32} className="relative text-series-3" />
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
              Your data never leaves your machine
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-text-secondary">
              Soar AI Tracker is built local-first, not local-optional. There is no server to breach, because there
              is no server.
            </p>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
            {CLAIMS.map(({ icon: Icon, text }, i) => (
              <Reveal key={text} delayMs={i * 100}>
                <div className="glass-panel h-full rounded-xl p-5">
                  <Icon size={18} className="text-series-3" />
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
