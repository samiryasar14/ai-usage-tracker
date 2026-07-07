import { AssistantChat } from "../components/AssistantChat";

export function AssistantView() {
  return (
    <section className="rounded-lg border border-hairline bg-surface p-5">
      <h2 className="text-sm font-medium text-text-secondary">AI Assistant</h2>
      <p className="mt-1 text-sm text-text-muted">
        Preview — a rule-based assistant that can answer questions about your tracked spend, model usage, cost
        forecast, and budget recommendations. Not a general-purpose LLM.
      </p>
      <div className="mt-4">
        <AssistantChat />
      </div>
    </section>
  );
}
