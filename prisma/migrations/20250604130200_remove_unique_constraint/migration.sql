-- Remove unique constraint and extra fields from daily_puzzle_entries
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Drop the unique index
DROP INDEX IF EXISTS "daily_puzzle_entries_userId_puzzleId_attemptNumber_key";

-- Create new table without the extra fields and constraints
CREATE TABLE "new_daily_puzzle_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "timeElapsed" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "daily_puzzle_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "daily_puzzle_entries_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "daily_puzzles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Copy data from old table, excluding the extra fields
INSERT INTO "new_daily_puzzle_entries" ("id", "userId", "puzzleId", "timeElapsed", "score", "completed", "completedAt") 
SELECT "id", "userId", "puzzleId", "timeElapsed", "score", "completed", "completedAt" FROM "daily_puzzle_entries";

-- Drop old table and rename new table
DROP TABLE "daily_puzzle_entries";
ALTER TABLE "new_daily_puzzle_entries" RENAME TO "daily_puzzle_entries";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
