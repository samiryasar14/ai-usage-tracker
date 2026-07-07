import { CLAUDE_MODEL_PRICING } from "@ai-usage-tracker/shared";
import { getDb } from "./index.js";

async function main() {
  const db = getDb();

  const provider = await db.provider.upsert({
    where: { name: "claude-code" },
    update: {},
    create: {
      name: "claude-code",
      type: "coding-assistant",
      status: "connected",
    },
  });

  for (const pricing of CLAUDE_MODEL_PRICING) {
    await db.model.upsert({
      where: { providerId_name: { providerId: provider.id, name: pricing.modelName } },
      update: {
        contextWindow: pricing.contextWindow,
        inputPricePerMTok: pricing.inputPerMTok,
        outputPricePerMTok: pricing.outputPerMTok,
        cacheReadPricePerMTok: pricing.cacheReadPerMTok,
        cacheWritePricePerMTok: pricing.cacheWrite5mPerMTok,
      },
      create: {
        providerId: provider.id,
        name: pricing.modelName,
        contextWindow: pricing.contextWindow,
        inputPricePerMTok: pricing.inputPerMTok,
        outputPricePerMTok: pricing.outputPerMTok,
        cacheReadPricePerMTok: pricing.cacheReadPerMTok,
        cacheWritePricePerMTok: pricing.cacheWrite5mPerMTok,
      },
    });
  }

  console.log(`Seeded provider "${provider.name}" with ${CLAUDE_MODEL_PRICING.length} models.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await getDb().$disconnect();
  });
