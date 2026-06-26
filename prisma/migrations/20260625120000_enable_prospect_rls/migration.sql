ALTER TABLE "Prospect" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Prospect_select_own" ON "Prospect";
DROP POLICY IF EXISTS "Prospect_insert_own" ON "Prospect";
DROP POLICY IF EXISTS "Prospect_update_own" ON "Prospect";
DROP POLICY IF EXISTS "Prospect_delete_own" ON "Prospect";

CREATE POLICY "Prospect_select_own"
ON "Prospect"
FOR SELECT
USING (auth.uid()::text = "userId");

CREATE POLICY "Prospect_insert_own"
ON "Prospect"
FOR INSERT
WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Prospect_update_own"
ON "Prospect"
FOR UPDATE
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Prospect_delete_own"
ON "Prospect"
FOR DELETE
USING (auth.uid()::text = "userId");
