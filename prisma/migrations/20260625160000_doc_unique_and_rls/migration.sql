-- Référence de document unique par utilisateur + type (anti-doublon de factures)
CREATE UNIQUE INDEX "Document_userId_type_reference_key" ON "Document"("userId", "type", "reference");

-- RLS de défense en profondeur sur les tables liées.
-- L'app se connecte en propriétaire (postgres) qui BYPASSE la RLS : ces policies
-- ne changent rien pour l'app, mais ferment l'accès via l'API PostgREST anon de Supabase.
ALTER TABLE "ClientLink" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;

-- ── ClientLink ──
DROP POLICY IF EXISTS "ClientLink_select_own" ON "ClientLink";
DROP POLICY IF EXISTS "ClientLink_insert_own" ON "ClientLink";
DROP POLICY IF EXISTS "ClientLink_update_own" ON "ClientLink";
DROP POLICY IF EXISTS "ClientLink_delete_own" ON "ClientLink";
CREATE POLICY "ClientLink_select_own" ON "ClientLink" FOR SELECT USING (auth.uid()::text = "userId");
CREATE POLICY "ClientLink_insert_own" ON "ClientLink" FOR INSERT WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "ClientLink_update_own" ON "ClientLink" FOR UPDATE USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "ClientLink_delete_own" ON "ClientLink" FOR DELETE USING (auth.uid()::text = "userId");

-- ── Payment ──
DROP POLICY IF EXISTS "Payment_select_own" ON "Payment";
DROP POLICY IF EXISTS "Payment_insert_own" ON "Payment";
DROP POLICY IF EXISTS "Payment_update_own" ON "Payment";
DROP POLICY IF EXISTS "Payment_delete_own" ON "Payment";
CREATE POLICY "Payment_select_own" ON "Payment" FOR SELECT USING (auth.uid()::text = "userId");
CREATE POLICY "Payment_insert_own" ON "Payment" FOR INSERT WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "Payment_update_own" ON "Payment" FOR UPDATE USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "Payment_delete_own" ON "Payment" FOR DELETE USING (auth.uid()::text = "userId");

-- ── Document ──
DROP POLICY IF EXISTS "Document_select_own" ON "Document";
DROP POLICY IF EXISTS "Document_insert_own" ON "Document";
DROP POLICY IF EXISTS "Document_update_own" ON "Document";
DROP POLICY IF EXISTS "Document_delete_own" ON "Document";
CREATE POLICY "Document_select_own" ON "Document" FOR SELECT USING (auth.uid()::text = "userId");
CREATE POLICY "Document_insert_own" ON "Document" FOR INSERT WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "Document_update_own" ON "Document" FOR UPDATE USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "Document_delete_own" ON "Document" FOR DELETE USING (auth.uid()::text = "userId");
