-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Request" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "cacheReadTokens" INTEGER NOT NULL,
    "cacheCreationTokens" INTEGER NOT NULL,
    "cost" REAL NOT NULL,
    "isSidechain" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Request_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Request_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Request" ("cacheCreationTokens", "cacheReadTokens", "cost", "externalId", "id", "inputTokens", "modelId", "outputTokens", "sessionId", "timestamp") SELECT "cacheCreationTokens", "cacheReadTokens", "cost", "externalId", "id", "inputTokens", "modelId", "outputTokens", "sessionId", "timestamp" FROM "Request";
DROP TABLE "Request";
ALTER TABLE "new_Request" RENAME TO "Request";
CREATE UNIQUE INDEX "Request_externalId_key" ON "Request"("externalId");
CREATE INDEX "Request_timestamp_idx" ON "Request"("timestamp");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
