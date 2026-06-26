-- CreateTable
CREATE TABLE "ClientLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientLink_userId_idx" ON "ClientLink"("userId");

-- CreateIndex
CREATE INDEX "ClientLink_prospectId_idx" ON "ClientLink"("prospectId");

-- AddForeignKey
ALTER TABLE "ClientLink" ADD CONSTRAINT "ClientLink_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;
