import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const PARTICLE_COUNT = 90;

interface Particle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  phase: number;
}

/**
 * Fixed, full-viewport backdrop mounted once at the app root — a canvas
 * starfield plus a few drifting aurora blobs and a mouse-reactive glow.
 * Everything here is decorative (pointer-events-none) and sits at z-0 behind
 * a z-10 content wrapper, so it never fights click targets.
 */
export function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.3);
  const glowX = useSpring(mouseX, { stiffness: 35, damping: 20 });
  const glowY = useSpring(mouseY, { stiffness: 35, damping: 20 });

  useEffect(() => {
    function onMove(e: PointerEvent) {
      mouseX.set(e.clientX / window.innerWidth);
      mouseY.set(e.clientY / window.innerHeight);
    }
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [mouseX, mouseY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];

    function resize() {
      width = canvas!.clientWidth;
      height = canvas!.clientHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.3 + 0.4,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
        phase: Math.random() * Math.PI * 2,
      }));
    }
    resize();
    window.addEventListener("resize", resize);

    let frame = 0;
    let raf = 0;

    function draw() {
      ctx!.clearRect(0, 0, width, height);
      const isDark = document.documentElement.classList.contains("dark");
      ctx!.fillStyle = isDark ? "rgba(226,235,255,1)" : "rgba(10,11,13,1)";

      for (const p of particles) {
        if (!reducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;
        }
        const twinkle = reducedMotion ? 0.5 : 0.35 + Math.sin(frame * 0.02 + p.phase) * 0.35;
        ctx!.globalAlpha = Math.max(0.05, twinkle);
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      frame++;
      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="animate-aurora absolute -left-1/4 -top-1/4 h-[60vh] w-[60vh] rounded-full bg-[radial-gradient(closest-side,var(--series-1),transparent)] opacity-[0.14] blur-3xl" />
      <div className="animate-aurora absolute -right-1/4 top-1/4 h-[55vh] w-[55vh] rounded-full bg-[radial-gradient(closest-side,var(--series-2),transparent)] opacity-[0.14] blur-3xl [animation-delay:-6s]" />
      <div className="animate-aurora absolute bottom-0 left-1/3 h-[50vh] w-[50vh] rounded-full bg-[radial-gradient(closest-side,var(--series-3),transparent)] opacity-[0.08] blur-3xl [animation-delay:-11s]" />

      <div className="bg-grid absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(ellipse_70%_55%_at_50%_0%,black,transparent)]" />

      <motion.div
        className="absolute h-[42vw] w-[42vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,var(--series-1),transparent)] opacity-[0.07] blur-3xl"
        style={{ left: useTransform(glowX, (v) => `${v * 100}%`), top: useTransform(glowY, (v) => `${v * 100}%`) }}
      />

      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-70" />
    </div>
  );
}
