-- CreateEnum
CREATE TYPE "WorkspaceSource" AS ENUM ('manual', 'github', 'gitlab');

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "source" "WorkspaceSource" NOT NULL DEFAULT 'manual';
