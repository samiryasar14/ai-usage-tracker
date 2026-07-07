import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getDb } from "@ai-usage-tracker/db";

/**
 * Packaged builds don't ship the `prisma` CLI (too heavy to bundle just for
 * migrations) — this replays the same migration.sql files Prisma generates in
 * dev, tracked in a lightweight table of its own. Only invoked for a fresh
 * userData database (see index.ts); the dev database is always migrated via
 * `prisma migrate dev` directly and never touches this table, so the two
 * migration trackers never collide.
 */
export async function runMigrations(migrationsDir: string): Promise<void> {
  const db = getDb();
  await db.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS "_app_migrations" ("name" TEXT NOT NULL PRIMARY KEY, "appliedAt" INTEGER NOT NULL)`,
  );
  const applied = new Set(
    (await db.$queryRawUnsafe<Array<{ name: string }>>(`SELECT "name" FROM "_app_migrations"`)).map((r) => r.name),
  );

  const migrationFolders = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const folder of migrationFolders) {
    if (applied.has(folder)) continue;

    const sql = readFileSync(join(migrationsDir, folder, "migration.sql"), "utf-8");
    // These migration.sql files contain only sequential DDL (no procedural
    // blocks/triggers), so splitting on statement-terminating semicolons is safe.
    const statements = sql
      .split(/;\s*(?:\r?\n|$)/)
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await db.$executeRawUnsafe(statement);
    }
    await db.$executeRawUnsafe(`INSERT INTO "_app_migrations" ("name", "appliedAt") VALUES (?, ?)`, folder, Date.now());
  }
}
