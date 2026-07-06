CREATE TABLE "CsvImportBatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT,
    "sourceRowCount" INTEGER NOT NULL DEFAULT 0,
    "importedCount" INTEGER NOT NULL DEFAULT 0,
    "revertedCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "mapping" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revertedAt" TIMESTAMP(3),

    CONSTRAINT "CsvImportBatch_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Prospect" ADD COLUMN "csvImportId" TEXT;

CREATE INDEX "CsvImportBatch_userId_idx" ON "CsvImportBatch"("userId");
CREATE INDEX "CsvImportBatch_userId_status_idx" ON "CsvImportBatch"("userId", "status");
CREATE INDEX "CsvImportBatch_createdAt_idx" ON "CsvImportBatch"("createdAt");
CREATE INDEX "Prospect_csvImportId_idx" ON "Prospect"("csvImportId");

ALTER TABLE "Prospect"
ADD CONSTRAINT "Prospect_csvImportId_fkey"
FOREIGN KEY ("csvImportId") REFERENCES "CsvImportBatch"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CsvImportBatch" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CsvImportBatch_select_own" ON "CsvImportBatch" FOR SELECT USING (auth.uid()::text = "userId");
CREATE POLICY "CsvImportBatch_insert_own" ON "CsvImportBatch" FOR INSERT WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "CsvImportBatch_update_own" ON "CsvImportBatch" FOR UPDATE USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "CsvImportBatch_delete_own" ON "CsvImportBatch" FOR DELETE USING (auth.uid()::text = "userId");
