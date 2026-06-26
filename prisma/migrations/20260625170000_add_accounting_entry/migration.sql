-- CreateTable
CREATE TABLE "AccountingEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountingEntry_userId_idx" ON "AccountingEntry"("userId");

-- CreateIndex
CREATE INDEX "AccountingEntry_userId_date_idx" ON "AccountingEntry"("userId", "date");

-- RLS (défense en profondeur, cohérent avec les autres tables)
ALTER TABLE "AccountingEntry" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "AccountingEntry_select_own" ON "AccountingEntry";
DROP POLICY IF EXISTS "AccountingEntry_insert_own" ON "AccountingEntry";
DROP POLICY IF EXISTS "AccountingEntry_update_own" ON "AccountingEntry";
DROP POLICY IF EXISTS "AccountingEntry_delete_own" ON "AccountingEntry";
CREATE POLICY "AccountingEntry_select_own" ON "AccountingEntry" FOR SELECT USING (auth.uid()::text = "userId");
CREATE POLICY "AccountingEntry_insert_own" ON "AccountingEntry" FOR INSERT WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "AccountingEntry_update_own" ON "AccountingEntry" FOR UPDATE USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "AccountingEntry_delete_own" ON "AccountingEntry" FOR DELETE USING (auth.uid()::text = "userId");
