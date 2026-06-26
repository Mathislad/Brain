-- CreateEnum
CREATE TYPE "ProspectStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateTable
CREATE TABLE "Prospect" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "entreprise" TEXT,
    "email" TEXT,
    "telephone" TEXT,
    "ville" TEXT,
    "activite" TEXT,
    "status" "ProspectStatus" NOT NULL DEFAULT 'TODO',
    "canal" TEXT,
    "source" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "linkedin" TEXT,
    "siteInternet" TEXT,
    "note" TEXT,
    "prochaineAction" TEXT,
    "derniereAction" TEXT,
    "externalId" TEXT,
    "externalSource" TEXT,
    "recuLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prospect_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Prospect_userId_idx" ON "Prospect"("userId");

-- CreateIndex
CREATE INDEX "Prospect_userId_status_idx" ON "Prospect"("userId", "status");

-- CreateIndex
CREATE INDEX "Prospect_userId_externalId_idx" ON "Prospect"("userId", "externalId");
