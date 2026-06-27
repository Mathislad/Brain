-- CreateTable
CREATE TABLE "Contrat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientNom" TEXT NOT NULL,
    "clientSiret" TEXT,
    "services" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "total" TEXT,
    "dureeMois" INTEGER NOT NULL,
    "dateDebut" TIMESTAMP(3),
    "dateSig" TIMESTAMP(3),
    "statut" TEXT NOT NULL DEFAULT 'brouillon',
    "storagePath" TEXT,
    "formData" JSONB NOT NULL DEFAULT '{}',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contrat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Contrat_userId_idx" ON "Contrat"("userId");
CREATE INDEX "Contrat_userId_statut_idx" ON "Contrat"("userId", "statut");

-- RLS
ALTER TABLE "Contrat" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contrat_select" ON "Contrat"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "contrat_insert" ON "Contrat"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "contrat_update" ON "Contrat"
  FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "contrat_delete" ON "Contrat"
  FOR DELETE USING (auth.uid()::text = "userId");

-- Bucket Storage (à exécuter dans le dashboard Supabase ou via supabase CLI)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('contrats', 'contrats', false);
