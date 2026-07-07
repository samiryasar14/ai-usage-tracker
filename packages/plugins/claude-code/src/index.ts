import { open, stat } from "node:fs/promises";
import type { NormalizedUsageRecord, ProviderPlugin } from "@ai-usage-tracker/shared";
import { getDb } from "@ai-usage-tracker/db";
import { listTranscriptFiles, getClaudeProjectsDir } from "./logDiscovery.js";
import { parseTranscriptLine } from "./transcriptParser.js";

export { getClaudeProjectsDir, listTranscriptFiles };
export { parseTranscriptLine };

/**
 * Reads new lines appended to `filePath` since the last recorded byte offset,
 * returning normalized records and the new offset. Only complete (newline-
 * terminated) lines are consumed — a trailing partial line is left for next time.
 */
async function tailFile(
  filePath: string,
  previousOffset: number,
): Promise<{ records: NormalizedUsageRecord[]; newOffset: number }> {
  const { size } = await stat(filePath);

  // File shrank (rotated/truncated) — start over from the beginning.
  const startOffset = size < previousOffset ? 0 : previousOffset;
  if (size <= startOffset) {
    return { records: [], newOffset: startOffset };
  }

  const handle = await open(filePath, "r");
  try {
    const length = size - startOffset;
    const buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, startOffset);
    const text = buffer.toString("utf8");

    const lastNewline = text.lastIndexOf("\n");
    if (lastNewline === -1) {
      // No complete line yet.
      return { records: [], newOffset: startOffset };
    }

    const completeText = text.slice(0, lastNewline);
    const records = completeText
      .split("\n")
      .map(parseTranscriptLine)
      .filter((r): r is NormalizedUsageRecord => r !== null);

    return { records, newOffset: startOffset + lastNewline + 1 };
  } finally {
    await handle.close();
  }
}

export class ClaudeCodePlugin implements ProviderPlugin {
  readonly name = "claude-code";

  async connect(): Promise<boolean> {
    const files = await listTranscriptFiles();
    return files.length >= 0; // an empty projects dir is still a valid, connected state
  }

  async fetchUsage(): Promise<NormalizedUsageRecord[]> {
    const db = getDb();
    const files = await listTranscriptFiles();
    const allRecords: NormalizedUsageRecord[] = [];

    for (const filePath of files) {
      const cursor = await db.ingestCursor.findUnique({ where: { filePath } });
      const previousOffset = cursor?.byteOffset ?? 0;

      const { records, newOffset } = await tailFile(filePath, previousOffset);
      if (records.length > 0) {
        allRecords.push(...records);
      }
      if (newOffset !== previousOffset) {
        await db.ingestCursor.upsert({
          where: { filePath },
          update: { byteOffset: newOffset },
          create: { filePath, byteOffset: newOffset },
        });
      }
    }

    return allRecords;
  }
}
