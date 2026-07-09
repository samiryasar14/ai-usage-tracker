import { Github } from "lucide-react";
import { GITHUB_REPO_URL } from "../constants";
import { Logo } from "./Logo";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-hairline bg-plane/40 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
        <div className="flex items-center gap-2">
          <Logo size={20} />
          <span className="text-sm font-medium text-text-secondary">Soar AI Tracker</span>
        </div>

        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          <Github size={15} />
          View source on GitHub
        </a>

        <p className="text-xs text-text-muted">© {year} Soar AI Tracker. MIT licensed. Local-first, always.</p>
      </div>
    </footer>
  );
}
