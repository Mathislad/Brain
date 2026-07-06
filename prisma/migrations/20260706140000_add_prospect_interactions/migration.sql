-- Compteur d'interactions loggées avec un prospect (sessions cold call).
ALTER TABLE "Prospect" ADD COLUMN IF NOT EXISTS "interactions" INTEGER NOT NULL DEFAULT 0;
