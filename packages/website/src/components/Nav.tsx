import { Github, Moon, Sun } from "lucide-react";
import { GITHUB_REPO_URL } from "../constants";
import { Logo } from "./Logo";

interface NavProps {
  dark: boolean;
  onToggleDark: () => void;
}

export function Nav({ dark, onToggleDark }: NavProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-hairline/70 bg-plane/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-2">
          <Logo size={26} />
          <span className="text-sm font-semibold tracking-tight text-text-primary">AI Usage Hub</span>
        </a>

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
        </div>
      </div>
    </header>
  );
}
