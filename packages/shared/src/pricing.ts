export interface ModelPricing {
  /** Model id as it appears in provider logs, e.g. "claude-sonnet-5". */
  modelName: string;
  contextWindow: number;
  /** All prices are USD per 1,000,000 tokens. */
  inputPerMTok: number;
  outputPerMTok: number;
  /** Prompt cache write, 5-minute TTL (1.25x input). */
  cacheWrite5mPerMTok: number;
  /** Prompt cache write, 1-hour TTL (2x input). */
  cacheWrite1hPerMTok: number;
  /** Prompt cache read/hit (0.1x input). */
  cacheReadPerMTok: number;
}

// Sourced from platform.claude.com/docs/en/pricing (cached 2026-06-24).
// Claude Sonnet 5 has introductory pricing of $2.00/$10.00 per MTok through 2026-08-31;
// standard pricing ($3.00/$15.00) is used here since intro pricing is time-limited.
export const CLAUDE_MODEL_PRICING: ModelPricing[] = [
  {
    modelName: "claude-fable-5",
    contextWindow: 1_000_000,
    inputPerMTok: 10.0,
    outputPerMTok: 50.0,
    cacheWrite5mPerMTok: 12.5,
    cacheWrite1hPerMTok: 20.0,
    cacheReadPerMTok: 1.0,
  },
  {
    modelName: "claude-opus-4-8",
    contextWindow: 1_000_000,
    inputPerMTok: 5.0,
    outputPerMTok: 25.0,
    cacheWrite5mPerMTok: 6.25,
    cacheWrite1hPerMTok: 10.0,
    cacheReadPerMTok: 0.5,
  },
  {
    modelName: "claude-opus-4-7",
    contextWindow: 1_000_000,
    inputPerMTok: 5.0,
    outputPerMTok: 25.0,
    cacheWrite5mPerMTok: 6.25,
    cacheWrite1hPerMTok: 10.0,
    cacheReadPerMTok: 0.5,
  },
  {
    modelName: "claude-opus-4-6",
    contextWindow: 1_000_000,
    inputPerMTok: 5.0,
    outputPerMTok: 25.0,
    cacheWrite5mPerMTok: 6.25,
    cacheWrite1hPerMTok: 10.0,
    cacheReadPerMTok: 0.5,
  },
  {
    modelName: "claude-sonnet-5",
    contextWindow: 1_000_000,
    inputPerMTok: 3.0,
    outputPerMTok: 15.0,
    cacheWrite5mPerMTok: 3.75,
    cacheWrite1hPerMTok: 6.0,
    cacheReadPerMTok: 0.3,
  },
  {
    modelName: "claude-sonnet-4-6",
    contextWindow: 1_000_000,
    inputPerMTok: 3.0,
    outputPerMTok: 15.0,
    cacheWrite5mPerMTok: 3.75,
    cacheWrite1hPerMTok: 6.0,
    cacheReadPerMTok: 0.3,
  },
  {
    modelName: "claude-haiku-4-5",
    contextWindow: 200_000,
    inputPerMTok: 1.0,
    outputPerMTok: 5.0,
    cacheWrite5mPerMTok: 1.25,
    cacheWrite1hPerMTok: 2.0,
    cacheReadPerMTok: 0.1,
  },
];

const PRICING_BY_MODEL = new Map(CLAUDE_MODEL_PRICING.map((p) => [p.modelName, p]));

export function getModelPricing(modelName: string): ModelPricing | undefined {
  return PRICING_BY_MODEL.get(modelName);
}

/**
 * Cost in USD for one turn's token usage. Cache writes are billed at the 5-minute
 * TTL rate since that's Claude Code's default (no explicit 1h TTL in its logs).
 */
export function computeCost(
  pricing: ModelPricing,
  usage: { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheCreationTokens: number },
): number {
  return (
    (usage.inputTokens / 1_000_000) * pricing.inputPerMTok +
    (usage.outputTokens / 1_000_000) * pricing.outputPerMTok +
    (usage.cacheReadTokens / 1_000_000) * pricing.cacheReadPerMTok +
    (usage.cacheCreationTokens / 1_000_000) * pricing.cacheWrite5mPerMTok
  );
}
