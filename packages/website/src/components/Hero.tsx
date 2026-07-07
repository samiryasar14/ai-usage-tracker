import { ArrowRight, Download } from "lucide-react";
import { GITHUB_RELEASES_URL } from "../constants";
import { ProductVisual } from "./ProductVisual";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(closest-side, var(--series-1), transparent)" }}
      />
      <div
        className="pointer-events-none absolute -top-16 left-1/2 h-96 w-96 translate-x-1/3 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(closest-side, var(--series-2), transparent)" }}
      />

      <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-20 sm:pb-28 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-hairline bg-surface px-3 py-1 text-xs font-medium text-text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-series-1" />
            Free &amp; open source · Local-first · Windows desktop app
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl md:text-6xl">
            Know exactly what your{" "}
            <span className="text-gradient">AI coding tools</span> are costing you
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-text-secondary sm:text-xl">
            AI Usage Hub watches your Claude Code usage in real time, tracks spend down to the session and project,
            forecasts your monthly bill, and warns you before the bill surprises you — all without a single byte
            leaving your machine.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={GITHUB_RELEASES_URL}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-2 rounded-lg bg-text-primary px-6 py-3 text-sm font-semibold text-plane shadow-lg shadow-text-primary/10 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download size={17} />
              Download for Windows
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-surface px-6 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-text-primary/[0.04]"
            >
              See what it does
            </a>
          </div>

          <p className="mt-4 text-xs text-text-muted">Free forever. No account, no telemetry, no cloud sync.</p>
        </div>

        <div className="relative mt-16 sm:mt-20">
          <ProductVisual />
        </div>
      </div>
    </section>
  );
}
