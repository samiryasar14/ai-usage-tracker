-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'connected'
);

-- CreateTable
CREATE TABLE "Model" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contextWindow" INTEGER NOT NULL,
    "inputPricePerMTok" REAL NOT NULL,
    "outputPricePerMTok" REAL NOT NULL,
    "cacheReadPricePerMTok" REAL NOT NULL,
    "cacheWritePricePerMTok" REAL NOT NULL,
    CONSTRAINT "Model_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "path" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "firstSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "entrypoint" TEXT,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    CONSTRAINT "Session_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Session_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Request" (
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
    CONSTRAINT "Request_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Request_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IngestCursor" (
    "filePath" TEXT NOT NULL PRIMARY KEY,
    "byteOffset" INTEGER NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Provider_name_key" ON "Provider"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Model_providerId_name_key" ON "Model"("providerId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Project_path_key" ON "Project"("path");

-- CreateIndex
CREATE UNIQUE INDEX "Session_providerId_externalId_key" ON "Session"("providerId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Request_externalId_key" ON "Request"("externalId");

-- CreateIndex
CREATE INDEX "Request_timestamp_idx" ON "Request"("timestamp");
