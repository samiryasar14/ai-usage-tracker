-- CreateTable
CREATE TABLE "AlertRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "thresholdUsd" REAL NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AlertEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ruleId" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "triggeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT NOT NULL,
    "acknowledgedAt" DATETIME,
    CONSTRAINT "AlertEvent_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AlertRule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AlertEvent_ruleId_periodKey_key" ON "AlertEvent"("ruleId", "periodKey");
