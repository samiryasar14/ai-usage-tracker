export interface NormalizedUsageRecord {
  /** Stable id for this turn, used for upsert dedup (e.g. Claude Code's requestId/uuid). */
  externalId: string;
  providerName: string;
  modelName: string;
  /** Absolute path of the project/workspace this turn ran in. */
  projectPath: string;
  /** Provider-specific session/conversation id. */
  sessionExternalId: string;
  /** How the client was invoked, e.g. "claude-vscode", "cli". */
  entrypoint: string | null;
  timestamp: Date;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
}

export interface ProviderPlugin {
  readonly name: string;

  /** Verify the plugin can reach its data source (local files, API, etc). */
  connect(): Promise<boolean>;

  /** Pull any usage records produced since the last call. Must be safe to call repeatedly. */
  fetchUsage(): Promise<NormalizedUsageRecord[]>;
}
