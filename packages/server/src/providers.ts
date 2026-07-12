import { getDb } from "@ai-usage-tracker/db";
import type { ProviderPlugin } from "@ai-usage-tracker/shared";
import { ClaudeCodePlugin } from "@ai-usage-tracker/plugin-claude-code";
import { OpenAIPlugin } from "@ai-usage-tracker/plugin-openai";
import { GitHubCopilotPlugin } from "@ai-usage-tracker/plugin-github-copilot";

/**
 * Every plugin the app knows about, regardless of whether it's currently
 * enabled or has credentials configured — the single place a new provider
 * plugin gets registered. `runIngestionCycle` (ingest.ts) and the
 * /api/providers route both read through the enabled-filtering helpers below
 * rather than this list directly.
 */
export const PROVIDER_PLUGINS: ProviderPlugin[] = [
  new ClaudeCodePlugin(),
  new OpenAIPlugin(),
  new GitHubCopilotPlugin(),
];

function settingKey(providerName: string): string {
  return `provider:${providerName}:enabled`;
}

/** Enabled by default — a provider only stops being fetched if the user explicitly turns it off. */
export async function isProviderEnabled(providerName: string): Promise<boolean> {
  const db = getDb();
  const row = await db.setting.findUnique({ where: { key: settingKey(providerName) } });
  return row ? row.value === "true" : true;
}

export async function setProviderEnabled(providerName: string, enabled: boolean) {
  const db = getDb();
  await db.setting.upsert({
    where: { key: settingKey(providerName) },
    create: { key: settingKey(providerName), value: String(enabled) },
    update: { value: String(enabled) },
  });
}

export async function getEnabledPlugins(): Promise<ProviderPlugin[]> {
  const enabled = await Promise.all(PROVIDER_PLUGINS.map((p) => isProviderEnabled(p.name)));
  return PROVIDER_PLUGINS.filter((_, i) => enabled[i]);
}

export interface ProviderStatus {
  name: string;
  displayName: string;
  requiresCredentials: boolean;
  enabled: boolean;
  connected: boolean;
}

export async function getProviderStatuses(): Promise<ProviderStatus[]> {
  return Promise.all(
    PROVIDER_PLUGINS.map(async (plugin) => {
      const enabled = await isProviderEnabled(plugin.name);
      // Skip the connectivity check for a disabled provider — no point making
      // a network call (or, for credential-less plugins, doing any work at
      // all) for something the user has turned off.
      const connected = enabled ? await plugin.connect() : false;
      return {
        name: plugin.name,
        displayName: plugin.displayName,
        requiresCredentials: plugin.requiresCredentials,
        enabled,
        connected,
      };
    }),
  );
}
