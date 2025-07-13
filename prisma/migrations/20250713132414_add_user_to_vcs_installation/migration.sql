/*
  Warnings:

  - You are about to drop the column `logo` on the `Workspace` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,providerId]` on the table `VCSInstallation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `VCSInstallation` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add userId column as nullable first
ALTER TABLE "VCSInstallation" ADD COLUMN "userId" TEXT;

-- Step 2: Update existing VCS installations with user IDs based on account data
-- This assumes we can match VCS installations to users via the Account table
UPDATE "VCSInstallation"
SET "userId" = (
  SELECT "Account"."userId"
  FROM "Account"
  WHERE "Account"."providerAccountId" = "VCSInstallation"."installationId"
  AND "Account"."provider" = 'github'
  LIMIT 1
)
WHERE "userId" IS NULL;

-- Step 3: For any remaining NULL userIds, we'll need to delete those records or assign to a default user
-- Delete orphaned VCS installations that couldn't be matched to a user
DELETE FROM "VCSInstallation" WHERE "userId" IS NULL;

-- Step 4: Make userId required
ALTER TABLE "VCSInstallation" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Workspace" DROP COLUMN "logo";

-- CreateIndex
CREATE UNIQUE INDEX "VCSInstallation_userId_providerId_key" ON "VCSInstallation"("userId", "providerId");

-- AddForeignKey
ALTER TABLE "VCSInstallation" ADD CONSTRAINT "VCSInstallation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
