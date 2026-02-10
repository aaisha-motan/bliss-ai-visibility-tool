-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'ANALYST', 'VIEWER');

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "Engine" AS ENUM ('CHATGPT', 'PERPLEXITY', 'GOOGLE_AIO');

-- CreateEnum
CREATE TYPE "MentionType" AS ENUM ('FEATURED', 'MENTIONED', 'COMPETITOR_ONLY', 'NOT_FOUND');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ANALYST',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "serpApiKey" TEXT,
    "chatgptSessionToken" TEXT,
    "perplexitySessionToken" TEXT,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "industry" TEXT,
    "location" TEXT,
    "logoUrl" TEXT,
    "competitors" TEXT[],
    "prompts" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scan" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "ScanStatus" NOT NULL DEFAULT 'QUEUED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "currentStep" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "error" TEXT,

    CONSTRAINT "Scan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "scanId" TEXT,
    "overallScore" INTEGER NOT NULL,
    "promptCount" INTEGER NOT NULL,
    "featuredCount" INTEGER NOT NULL,
    "mentionedCount" INTEGER NOT NULL,
    "competitorOnlyCount" INTEGER NOT NULL,
    "notFoundCount" INTEGER NOT NULL,
    "bestEngine" TEXT,
    "worstEngine" TEXT,
    "newCompetitorsDetected" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptResult" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,

    CONSTRAINT "PromptResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngineResult" (
    "id" TEXT NOT NULL,
    "promptResultId" TEXT NOT NULL,
    "engine" "Engine" NOT NULL,
    "responseText" TEXT NOT NULL,
    "screenshotPath" TEXT,
    "mentionType" "MentionType" NOT NULL,
    "rankingPosition" INTEGER,
    "sentimentScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "competitorsMentioned" TEXT[],
    "newCompetitorsFound" TEXT[],
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EngineResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "Client_userId_idx" ON "Client"("userId");

-- CreateIndex
CREATE INDEX "Scan_clientId_idx" ON "Scan"("clientId");

-- CreateIndex
CREATE INDEX "Scan_status_idx" ON "Scan"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Report_scanId_key" ON "Report"("scanId");

-- CreateIndex
CREATE INDEX "Report_clientId_idx" ON "Report"("clientId");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");

-- CreateIndex
CREATE INDEX "PromptResult_reportId_idx" ON "PromptResult"("reportId");

-- CreateIndex
CREATE INDEX "EngineResult_promptResultId_idx" ON "EngineResult"("promptResultId");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptResult" ADD CONSTRAINT "PromptResult_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngineResult" ADD CONSTRAINT "EngineResult_promptResultId_fkey" FOREIGN KEY ("promptResultId") REFERENCES "PromptResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
