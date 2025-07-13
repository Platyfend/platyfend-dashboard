-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('oauth', 'email', 'credentials');

-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('owner', 'admin', 'member', 'viewer');

-- CreateEnum
CREATE TYPE "VCSProviderType" AS ENUM ('github', 'gitlab', 'bitbucket');

-- CreateEnum
CREATE TYPE "PullRequestStatus" AS ENUM ('open', 'closed', 'merged', 'draft');

-- CreateEnum
CREATE TYPE "FileChangeStatus" AS ENUM ('added', 'modified', 'removed', 'deleted', 'renamed');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('pending', 'in_progress', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "CommentType" AS ENUM ('comment', 'suggestion', 'question', 'praise', 'issue');

-- CreateEnum
CREATE TYPE "CommentSeverity" AS ENUM ('info', 'warning', 'error', 'critical');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('queued', 'processing', 'completed', 'failed', 'cancelled', 'retrying');

-- CreateEnum
CREATE TYPE "AIModel" AS ENUM ('gpt_4', 'gpt_4_turbo', 'gpt_3_5_turbo', 'claude_3_opus', 'claude_3_sonnet', 'claude_3_haiku', 'gemini_pro', 'default');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VCSProvider" (
    "id" TEXT NOT NULL,
    "type" "VCSProviderType" NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VCSProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VCSInstallation" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "installationId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "accountLogin" TEXT NOT NULL,
    "accessToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "workspaceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VCSInstallation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repository" (
    "id" TEXT NOT NULL,
    "vcsInstallationId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "private" BOOLEAN NOT NULL,
    "defaultBranch" TEXT NOT NULL DEFAULT 'main',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Repository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepositorySettings" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "autoReview" BOOLEAN NOT NULL DEFAULT true,
    "reviewPrivate" BOOLEAN NOT NULL DEFAULT true,
    "reviewTemplate" TEXT,
    "excludePaths" TEXT[],
    "aiModel" "AIModel" NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepositorySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PullRequest" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sourceBranch" TEXT NOT NULL,
    "targetBranch" TEXT NOT NULL,
    "status" "PullRequestStatus" NOT NULL DEFAULT 'open',
    "author" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PullRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PullRequestFile" (
    "id" TEXT NOT NULL,
    "pullRequestId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "status" "FileChangeStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PullRequestFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "pullRequestId" TEXT NOT NULL,
    "externalId" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'pending',
    "summary" TEXT,
    "processingTime" INTEGER,
    "aiModel" "AIModel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewComment" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "fileId" TEXT,
    "externalId" TEXT,
    "body" TEXT NOT NULL,
    "position" INTEGER,
    "startLine" INTEGER,
    "endLine" INTEGER,
    "suggestion" TEXT,
    "type" "CommentType" NOT NULL DEFAULT 'comment',
    "severity" "CommentSeverity",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewMetrics" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "issuesFound" INTEGER NOT NULL DEFAULT 0,
    "suggestionsGiven" INTEGER NOT NULL DEFAULT 0,
    "filesReviewed" INTEGER NOT NULL DEFAULT 0,
    "linesReviewed" INTEGER NOT NULL DEFAULT 0,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewJob" (
    "id" TEXT NOT NULL,
    "pullRequestId" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'queued',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "error" TEXT,
    "processorId" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_userId_workspaceId_key" ON "WorkspaceMember"("userId", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "VCSInstallation_providerId_installationId_key" ON "VCSInstallation"("providerId", "installationId");

-- CreateIndex
CREATE UNIQUE INDEX "Repository_vcsInstallationId_externalId_key" ON "Repository"("vcsInstallationId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "RepositorySettings_repositoryId_key" ON "RepositorySettings"("repositoryId");

-- CreateIndex
CREATE UNIQUE INDEX "PullRequest_repositoryId_number_key" ON "PullRequest"("repositoryId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "PullRequestFile_pullRequestId_path_key" ON "PullRequestFile"("pullRequestId", "path");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewMetrics_reviewId_key" ON "ReviewMetrics"("reviewId");

-- CreateIndex
CREATE INDEX "ReviewJob_status_priority_createdAt_idx" ON "ReviewJob"("status", "priority", "createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VCSInstallation" ADD CONSTRAINT "VCSInstallation_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "VCSProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VCSInstallation" ADD CONSTRAINT "VCSInstallation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repository" ADD CONSTRAINT "Repository_vcsInstallationId_fkey" FOREIGN KEY ("vcsInstallationId") REFERENCES "VCSInstallation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepositorySettings" ADD CONSTRAINT "RepositorySettings_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PullRequest" ADD CONSTRAINT "PullRequest_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PullRequestFile" ADD CONSTRAINT "PullRequestFile_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES "PullRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES "PullRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewComment" ADD CONSTRAINT "ReviewComment_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewComment" ADD CONSTRAINT "ReviewComment_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "PullRequestFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewMetrics" ADD CONSTRAINT "ReviewMetrics_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewJob" ADD CONSTRAINT "ReviewJob_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES "PullRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
