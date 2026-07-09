import { useEffect, useState } from "react";
import { Github, Moon, Sun } from "lucide-react";
import { GITHUB_REPO_URL } from "../constants";
import { Logo } from "./Logo";

interface NavProps {
  dark: boolean;
  onToggleDark: () => void;
}

export function Nav({ dark, onToggleDark }: NavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-all duration-300 ${
        scrolled ? "border-hairline bg-plane/80 shadow-sm shadow-black/10" : "border-transparent bg-plane/30"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-2">
          <Logo size={26} />
          <span className="text-sm font-semibold tracking-tight text-text-primary">Soar AI Tracker</span>
        </a>

        <nav className="hidden items-center gap-6 text-sm font-medium text-text-secondary lg:flex">
          <a href="#integrations" className="transition-colors hover:text-text-primary">
            Integrations
          </a>
          <a href="#how-it-works" className="transition-colors hover:text-text-primary">
            How it works
          </a>
          <a href="#features" className="transition-colors hover:text-text-primary">
            Features
          </a>
          <a href="#open-source" className="transition-colors hover:text-text-primary">
            Open Source
          </a>
          <a href="#faq" className="transition-colors hover:text-text-primary">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            <Github size={16} />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <button
            type="button"
            onClick={onToggleDark}
            aria-label="Toggle dark mode"
            className="rounded-md p-2 text-text-secondary transition-colors hover:text-text-primary"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <a
            href="#download"
            className="hidden items-center gap-1.5 rounded-md bg-text-primary px-3.5 py-1.5 text-sm font-semibold text-plane transition-transform hover:scale-[1.03] sm:flex"
          >
            Download
          </a>
        </div>
      </div>
    </header>
  );
}
