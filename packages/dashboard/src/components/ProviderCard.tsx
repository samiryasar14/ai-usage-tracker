import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle } from "lucide-react";
import type { ProviderStatus } from "../api";

interface CredentialCopy {
  placeholder: string;
  helpText: string;
}

const CREDENTIAL_COPY: Record<string, CredentialCopy> = {
  openai: {
    placeholder: "sk-admin-...",
    helpText: "Requires an Admin API key from your OpenAI organization settings — a regular API key won't work.",
  },
  "github-copilot": {
    placeholder: "ghp_...",
    helpText:
      "Needs access to your account's billing usage report — a classic PAT with the read:user scope works for accounts on GitHub's enhanced billing platform.",
  },
};

interface ProviderCardProps {
  status: ProviderStatus;
  onToggleEnabled: (enabled: boolean) => void;
  togglingEnabled: boolean;
}

const isElectron = window.electronAPI?.isElectron === true;

export function ProviderCard({ status, onToggleEnabled, togglingEnabled }: ProviderCardProps) {
  const queryClient = useQueryClient();
  const copy = CREDENTIAL_COPY[status.name];
  const [keyDraft, setKeyDraft] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const hasCredential = useQuery({
    queryKey: ["hasCredential", status.name],
    queryFn: () => window.electronAPI!.hasCredential(status.name),
    enabled: isElectron && status.requiresCredentials,
  });

  const saveCredential = useMutation({
    mutationFn: (key: string) => window.electronAPI!.saveCredential(status.name, key),
    onSuccess: (result) => {
      setMessage(
        result.ok ? "Saved. Restart the app for this to take effect." : (result.error ?? "Failed to save the key."),
      );
      if (result.ok) {
        setKeyDraft("");
        queryClient.invalidateQueries({ queryKey: ["hasCredential", status.name] });
      }
    },
  });

  const clearCredential = useMutation({
    mutationFn: () => window.electronAPI!.clearCredential(status.name),
    onSuccess: (result) => {
      setMessage(
        result.ok
          ? "Disconnected. Restart the app for this to take effect."
          : (result.error ?? "Failed to disconnect."),
      );
      if (result.ok) queryClient.invalidateQueries({ queryKey: ["hasCredential", status.name] });
    },
  });

  return (
    <div className="rounded-md border border-hairline px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-text-primary">{status.displayName}</div>
          <div className="text-sm text-text-muted">
            {status.requiresCredentials
              ? "Pulls usage and cost data from an external API."
              : "Reads usage directly from local session logs."}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <div
            className={`flex items-center gap-1.5 text-sm ${status.connected ? "text-series-1" : "text-text-muted"}`}
          >
            {status.connected ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
            {status.connected ? "Connected" : "Not connected"}
          </div>
          <label className="flex items-center gap-1.5 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={status.enabled}
              disabled={togglingEnabled}
              onChange={(e) => onToggleEnabled(e.target.checked)}
              className="accent-series-1 transition-colors focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50"
            />
            Enabled
          </label>
        </div>
      </div>

      {status.requiresCredentials && isElectron && (
        <div className="mt-3 border-t border-hairline pt-3">
          {hasCredential.data ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-text-muted">Credential saved.</div>
              <button
                type="button"
                onClick={() => {
                  setMessage(null);
                  clearCredential.mutate();
                }}
                disabled={clearCredential.isPending}
                className="rounded-md border border-hairline px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-plane focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50"
              >
                {clearCredential.isPending ? "Disconnecting…" : "Disconnect"}
              </button>
            </div>
          ) : (
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                setMessage(null);
                saveCredential.mutate(keyDraft.trim());
              }}
            >
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="password"
                  value={keyDraft}
                  onChange={(e) => setKeyDraft(e.target.value)}
                  placeholder={copy?.placeholder ?? "..."}
                  autoComplete="off"
                  aria-label={`${status.displayName} credential`}
                  className="w-64 rounded-md border border-hairline bg-transparent px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface"
                />
                <button
                  type="submit"
                  disabled={!keyDraft.trim() || saveCredential.isPending}
                  className="rounded-md bg-text-primary px-3 py-1.5 text-sm font-medium text-surface transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50"
                >
                  {saveCredential.isPending ? "Connecting…" : "Connect"}
                </button>
              </div>
              {copy?.helpText && <p className="text-sm text-text-muted">{copy.helpText}</p>}
            </form>
          )}
          {message && <p className="mt-3 text-sm text-text-muted">{message}</p>}
        </div>
      )}
    </div>
  );
}
