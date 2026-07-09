import { ChevronDown } from "lucide-react";
import { Reveal } from "./Reveal";

const FAQS = [
  {
    question: "Is my data actually private?",
    answer:
      "Yes. Soar AI Tracker reads your local session logs and runs entirely on your machine — there's no account, no cloud sync, and no telemetry. Nothing about your usage or code ever leaves your computer.",
  },
  {
    question: "Why does Windows show an \"unrecognized publisher\" warning?",
    answer:
      "The installer isn't code-signed yet — that costs money for a small open-source project. Click \"More info\" → \"Run anyway\" to proceed; you can also inspect the full source on GitHub before you trust it.",
  },
  {
    question: "Does it work with tools other than Claude Code?",
    answer:
      "OpenAI is supported today via an optional API key. More providers are on the roadmap — the app is built around a plugin interface, so adding one is straightforward.",
  },
  {
    question: "Is it really free?",
    answer: "Yes, entirely — MIT licensed and free forever. No paid tier, no usage limits, no upsell.",
  },
  {
    question: "Is there a macOS or Linux build?",
    answer:
      "Not yet — Windows is the only packaged build today. macOS and Linux are on the roadmap; until then you can run it from source on any platform Node.js supports.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="relative mx-auto max-w-3xl px-6 py-20 sm:py-28">
      <Reveal className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">Questions</h2>
      </Reveal>

      <div className="mt-10 space-y-3">
        {FAQS.map(({ question, answer }, i) => (
          <Reveal key={question} delayMs={i * 60}>
            <details className="group rounded-xl border border-hairline bg-surface px-5 py-4 open:pb-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-text-primary">
                {question}
                <ChevronDown
                  size={16}
                  className="shrink-0 text-text-muted transition-transform duration-300 group-open:rotate-180"
                />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">{answer}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
