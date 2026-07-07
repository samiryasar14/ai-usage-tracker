import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Send, User } from "lucide-react";
import { api } from "../api";

export function AssistantChat() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = useQuery({ queryKey: ["assistantMessages"], queryFn: api.assistantMessages });

  const sendMessage = useMutation({
    mutationFn: (content: string) => api.sendAssistantMessage(content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assistantMessages"] }),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data, sendMessage.isPending]);

  const rows = messages.data ?? [];

  return (
    <div className="flex flex-col">
      <div className="max-h-96 min-h-[12rem] space-y-3 overflow-y-auto">
        {rows.map((message) => {
          const isUser = message.role === "user";
          return (
            <div key={message.id} className={`flex items-start gap-2 ${isUser ? "flex-row-reverse text-right" : ""}`}>
              <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full border border-hairline text-text-muted">
                {isUser ? <User size={13} /> : <Bot size={13} />}
              </span>
              <div className={`flex flex-col gap-0.5 ${isUser ? "items-end" : "items-start"}`}>
                <span className="text-xs text-text-muted">{isUser ? "You" : "Assistant"}</span>
                <p className="whitespace-pre-wrap text-sm text-text-primary">{message.content}</p>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <p className="text-sm text-text-muted">
            No messages yet — ask me about your spend, most-used model, cost forecast, or a recommended budget for a
            project.
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="mt-4 flex items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const content = draft.trim();
          if (!content || sendMessage.isPending) return;
          sendMessage.mutate(content);
          setDraft("");
        }}
      >
        <label className="flex flex-1 flex-col gap-1 text-sm text-text-secondary">
          Message
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask about your spend, most-used model, or a budget recommendation…"
            className="w-full rounded-md border border-hairline bg-transparent px-2 py-1 text-text-primary"
          />
        </label>
        <button
          type="submit"
          disabled={sendMessage.isPending || !draft.trim()}
          className="flex items-center gap-1.5 rounded-md bg-text-primary px-3 py-1.5 text-sm font-medium text-surface disabled:opacity-50"
        >
          {sendMessage.isPending ? (
            "Sending…"
          ) : (
            <>
              <Send size={14} />
              Send
            </>
          )}
        </button>
      </form>
    </div>
  );
}
