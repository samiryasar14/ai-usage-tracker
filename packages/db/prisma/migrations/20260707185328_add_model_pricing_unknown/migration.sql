-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Model" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contextWindow" INTEGER NOT NULL,
    "inputPricePerMTok" REAL NOT NULL,
    "outputPricePerMTok" REAL NOT NULL,
    "cacheReadPricePerMTok" REAL NOT NULL,
    "cacheWritePricePerMTok" REAL NOT NULL,
    "pricingUnknown" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Model_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Model" ("cacheReadPricePerMTok", "cacheWritePricePerMTok", "contextWindow", "id", "inputPricePerMTok", "name", "outputPricePerMTok", "providerId") SELECT "cacheReadPricePerMTok", "cacheWritePricePerMTok", "contextWindow", "id", "inputPricePerMTok", "name", "outputPricePerMTok", "providerId" FROM "Model";
DROP TABLE "Model";
ALTER TABLE "new_Model" RENAME TO "Model";
CREATE UNIQUE INDEX "Model_providerId_name_key" ON "Model"("providerId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
