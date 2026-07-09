import { Download as DownloadIcon, ShieldAlert } from "lucide-react";
import { GITHUB_RELEASES_URL } from "../constants";

export function Download() {
  return (
    <section id="download" className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <div className="relative overflow-hidden rounded-3xl border border-hairline bg-surface px-6 py-16 text-center sm:px-12 sm:py-20">
        <div
          className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-64 w-[36rem] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(closest-side, var(--series-1), var(--series-2), transparent)" }}
        />

        <div className="relative">
          <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            Get Soar AI Tracker for Windows
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-text-secondary">
            Free, open source, and installs in under a minute. macOS and Linux builds are on the roadmap.
          </p>

          <div className="mt-8 flex justify-center">
            <a
              href={GITHUB_RELEASES_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-text-primary px-7 py-3.5 text-sm font-semibold text-plane shadow-lg shadow-text-primary/10 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <DownloadIcon size={18} />
              Download for Windows
            </a>
          </div>

          <div className="mx-auto mt-8 flex max-w-xl items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-left text-sm text-amber-700 dark:text-amber-400">
            <ShieldAlert size={18} className="mt-0.5 shrink-0" />
            <p>
              Windows may show an <strong>&ldquo;unrecognized publisher&rdquo;</strong> warning since the installer
              isn&apos;t code-signed yet — click <strong>&ldquo;More info&rdquo;</strong> →{" "}
              <strong>&ldquo;Run anyway&rdquo;</strong> to proceed. This is expected for a small open-source project.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
