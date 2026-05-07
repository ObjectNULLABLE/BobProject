-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "characters" TEXT NOT NULL DEFAULT '[]',
    "maps" TEXT NOT NULL DEFAULT '[]',
    "diceHistory" TEXT NOT NULL DEFAULT '[]'
);
