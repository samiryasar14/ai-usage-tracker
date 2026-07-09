import { ArrowRight, Download, Github } from "lucide-react";
import { GITHUB_RELEASES_URL, GITHUB_REPO_URL } from "../constants";
import { Reveal } from "./Reveal";

export function FinalCTA() {
  return (
    <section className="relative mx-auto max-w-5xl px-6 py-20 text-center sm:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-72 w-[42rem] rounded-full bg-[radial-gradient(closest-side,var(--series-1),var(--series-2),transparent)] opacity-10 blur-3xl" />

      <Reveal className="relative">
        <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-5xl">
          Take control of your <span className="text-gradient">AI workflow</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-text-secondary">
          One desktop app. The tools you already use. Complete visibility, total privacy.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={GITHUB_RELEASES_URL}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-2 rounded-lg bg-text-primary px-7 py-3.5 text-sm font-semibold text-plane shadow-lg shadow-series-1/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download size={17} />
            Download Now
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </a>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="glass-panel inline-flex items-center gap-2 rounded-lg px-7 py-3.5 text-sm font-semibold text-text-primary transition-colors hover:bg-text-primary/[0.04]"
          >
            <Github size={17} />
            View Source
          </a>
        </div>
      </Reveal>
    </section>
  );
}
