-- AlterTable
ALTER TABLE "Prospect" ADD COLUMN "formule" TEXT;
ALTER TABLE "Prospect" ADD COLUMN "montantTotal" INTEGER;
ALTER TABLE "Prospect" ADD COLUMN "devisSigne" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "label" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_prospectId_idx" ON "Payment"("prospectId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;
