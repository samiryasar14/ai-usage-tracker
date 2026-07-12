import { useEffect, useRef, useState } from "react";
import { GitFork, Github, Star, CircleDot } from "lucide-react";
import { GITHUB_REPO_URL } from "../constants";
import { Reveal } from "./Reveal";
import { CountUp } from "./visuals/CountUp";

interface RepoStats {
  stars: number;
  forks: number;
  openIssues: number;
}

function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, inView };
}

export function OpenSource() {
  const [stats, setStats] = useState<RepoStats | null>(null);
  const { ref, inView } = useInView();

  useEffect(() => {
    let cancelled = false;
    fetch("https://api.github.com/repos/sysamiryasar/soar-ai-tracker")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setStats({
          stars: data.stargazers_count ?? 0,
          forks: data.forks_count ?? 0,
          openIssues: data.open_issues_count ?? 0,
        });
      })
      .catch(() => {
        // Stays null — the section below just skips the live counters.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = stats
    ? [
        { icon: Star, label: "Stars", value: stats.stars },
        { icon: GitFork, label: "Forks", value: stats.forks },
        { icon: CircleDot, label: "Open issues", value: stats.openIssues },
      ]
    : [];

  return (
    <section id="open-source" className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">Built in the open</h2>
        <p className="mt-4 text-lg text-text-secondary">
          MIT licensed, public on GitHub from day one. Inspect it, self-host it, or send a pull request.
        </p>
      </Reveal>

      <div ref={ref} className="mt-10 flex flex-col items-center gap-8">
        {metrics.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4">
            {metrics.map(({ icon: Icon, label, value }, i) => (
              <Reveal key={label} delayMs={i * 100}>
                <div className="glass-panel flex min-w-[9rem] flex-col items-center gap-1 rounded-xl px-6 py-4">
                  <Icon size={16} className="text-series-1" />
                  <span className="text-2xl font-bold text-text-primary">
                    <CountUp value={value} start={inView} />
                  </span>
                  <span className="text-xs text-text-muted">{label}</span>
                </div>
              </Reveal>
            ))}
          </div>
        )}

        <Reveal delayMs={200}>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-2 rounded-lg bg-text-primary px-6 py-3 text-sm font-semibold text-plane shadow-lg shadow-series-1/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Github size={17} />
            View source on GitHub
          </a>
        </Reveal>
      </div>
    </section>
  );
}
