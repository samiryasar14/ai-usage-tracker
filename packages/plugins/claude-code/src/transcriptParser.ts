import type { NormalizedUsageRecord } from "@ai-usage-tracker/shared";

// Shape of one line from ~/.claude/projects/<project>/<sessionId>.jsonl.
// Only the fields we actually read are declared here — the real records carry
// many more (see the transcript inspected while designing this plugin).
interface ClaudeCodeLogLine {
  type?: string;
  uuid?: string;
  requestId?: string;
  timestamp?: string;
  sessionId?: string;
  cwd?: string;
  entrypoint?: string;
  isApiErrorMessage?: boolean;
  message?: {
    model?: string;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      cache_read_input_tokens?: number;
      cache_creation_input_tokens?: number;
    };
  };
}

/**
 * Different Claude Code entrypoints report `cwd` with different drive-letter
 * casing for the same folder (e.g. claude-vscode: "c:\...", claude-desktop:
 * "C:\..."). Windows paths are case-insensitive, so left as-is this splits one
 * project into two rows depending on which client was used. Lowercase just the
 * drive letter — leave everything else (including non-Windows paths) untouched.
 */
function normalizeProjectPath(cwd: string): string {
  return /^[A-Za-z]:[\\/]/.test(cwd) ? cwd[0].toLowerCase() + cwd.slice(1) : cwd;
}

/**
 * Normalizes one assistant-turn log line into a usage record, or returns null
 * for lines that aren't billable assistant turns (user turns, tool events,
 * queue-operation markers, malformed JSON, etc).
 */
export function parseTranscriptLine(rawLine: string): NormalizedUsageRecord | null {
  const line = rawLine.trim();
  if (!line) return null;

  let parsed: ClaudeCodeLogLine;
  try {
    parsed = JSON.parse(line);
  } catch {
    return null;
  }

  if (parsed.type !== "assistant") return null;
  // Rate-limit/error notices are logged as assistant turns with a "<synthetic>"
  // model and no real usage — not billable API calls, so skip them.
  if (parsed.isApiErrorMessage) return null;

  const usage = parsed.message?.usage;
  const model = parsed.message?.model;
  if (!usage || !model || model === "<synthetic>") return null;

  const externalId = parsed.uuid ?? parsed.requestId;
  if (!externalId || !parsed.sessionId || !parsed.cwd || !parsed.timestamp) return null;

  return {
    externalId,
    providerName: "claude-code",
    modelName: model,
    projectPath: normalizeProjectPath(parsed.cwd),
    sessionExternalId: parsed.sessionId,
    entrypoint: parsed.entrypoint ?? null,
    timestamp: new Date(parsed.timestamp),
    inputTokens: usage.input_tokens ?? 0,
    outputTokens: usage.output_tokens ?? 0,
    cacheReadTokens: usage.cache_read_input_tokens ?? 0,
    cacheCreationTokens: usage.cache_creation_input_tokens ?? 0,
  };
}
