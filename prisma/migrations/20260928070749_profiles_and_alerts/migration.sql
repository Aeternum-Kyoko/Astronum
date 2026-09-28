-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SavedChart" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "place" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "timezone" TEXT NOT NULL,
    "relation" TEXT NOT NULL DEFAULT 'Self',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedChart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SavedChart" ("createdAt", "date", "id", "latitude", "longitude", "name", "place", "time", "timezone", "userId") SELECT "createdAt", "date", "id", "latitude", "longitude", "name", "place", "time", "timezone", "userId" FROM "SavedChart";
DROP TABLE "SavedChart";
ALTER TABLE "new_SavedChart" RENAME TO "SavedChart";
CREATE INDEX "SavedChart_userId_idx" ON "SavedChart"("userId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "sessionVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifyDaily" BOOLEAN NOT NULL DEFAULT false,
    "notifyDasha" BOOLEAN NOT NULL DEFAULT false,
    "notifyFestivals" BOOLEAN NOT NULL DEFAULT false,
    "notifyTransits" BOOLEAN NOT NULL DEFAULT false,
    "unsubscribeToken" TEXT,
    "lastDailySentOn" TEXT,
    "sentAlertKeys" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "passwordHash", "sessionVersion") SELECT "createdAt", "email", "id", "name", "passwordHash", "sessionVersion" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_unsubscribeToken_key" ON "User"("unsubscribeToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
