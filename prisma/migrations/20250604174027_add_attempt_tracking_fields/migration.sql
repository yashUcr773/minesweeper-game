-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_daily_puzzle_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "timeElapsed" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "daily_puzzle_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "daily_puzzle_entries_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "daily_puzzles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_daily_puzzle_entries" ("completed", "completedAt", "id", "puzzleId", "score", "timeElapsed", "userId") SELECT "completed", "completedAt", "id", "puzzleId", "score", "timeElapsed", "userId" FROM "daily_puzzle_entries";
DROP TABLE "daily_puzzle_entries";
ALTER TABLE "new_daily_puzzle_entries" RENAME TO "daily_puzzle_entries";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
