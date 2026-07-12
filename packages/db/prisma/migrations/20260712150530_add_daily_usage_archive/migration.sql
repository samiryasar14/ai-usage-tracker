-- CreateTable
CREATE TABLE "DailyUsageArchive" (
    "date" TEXT NOT NULL PRIMARY KEY,
    "requests" INTEGER NOT NULL,
    "tokens" INTEGER NOT NULL,
    "cost" REAL NOT NULL,
    "archivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
