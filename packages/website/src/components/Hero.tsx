import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Download } from "lucide-react";
import { GITHUB_RELEASES_URL } from "../constants";
import { ProductVisual } from "./ProductVisual";

function TiltStage({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(py, [0, 1], [7, -7]), { stiffness: 120, damping: 20 });
  const rotateY = useSpring(useTransform(px, [0, 1], [-7, 7]), { stiffness: 120, damping: 20 });

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  }

  function onPointerLeave() {
    px.set(0.5);
    py.set(0.5);
  }

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="[perspective:1400px]"
    >
      <motion.div style={{ rotateX, rotateY }}>{children}</motion.div>
    </div>
  );
}

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-20 sm:pb-28 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="glass-panel mx-auto mb-6 inline-flex animate-fade-up items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-text-secondary">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-series-1" />
            Free &amp; open source · Local-first · Windows desktop app
          </div>

          <h1 className="animate-fade-up text-4xl font-bold tracking-tight text-text-primary [animation-delay:80ms] sm:text-5xl md:text-6xl">
            Know exactly what your{" "}
            <span className="relative inline-block">
              <span className="text-gradient">AI coding tools</span>
              <svg
                viewBox="0 0 200 12"
                className="absolute -bottom-2 left-0 h-3 w-full text-series-1/70"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 8 C 50 2, 150 2, 198 8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  className="animate-draw-line"
                />
              </svg>
            </span>{" "}
            are costing you
          </h1>

          <p className="mx-auto mt-6 max-w-2xl animate-fade-up text-balance text-lg text-text-secondary [animation-delay:160ms] sm:text-xl">
            Soar AI Tracker watches your Claude Code usage in real time, tracks spend down to the session and project,
            forecasts your monthly bill, and warns you before the bill surprises you — all without a single byte
            leaving your machine.
          </p>

          <div className="mt-10 flex animate-fade-up flex-col items-center justify-center gap-3 [animation-delay:240ms] sm:flex-row">
            <a
              href={GITHUB_RELEASES_URL}
              target="_blank"
              rel="noreferrer"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-lg bg-text-primary px-6 py-3 text-sm font-semibold text-plane shadow-lg shadow-series-1/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download size={17} />
              Download for Windows
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#features"
              className="glass-panel inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-text-primary/[0.04]"
            >
              See what it does
            </a>
          </div>

          <p className="mt-4 animate-fade-up text-xs text-text-muted [animation-delay:300ms]">
            Free forever. No account, no telemetry, no cloud sync.
          </p>
        </div>

        <div className="relative mt-16 animate-fade-up [animation-delay:380ms] sm:mt-20">
          <TiltStage>
            <ProductVisual />
          </TiltStage>
        </div>
      </div>
    </section>
  );
}
