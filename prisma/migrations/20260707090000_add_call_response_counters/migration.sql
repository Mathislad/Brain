-- Compteurs d'appels qualifies pendant les sessions de cold call.
ALTER TABLE "Prospect" ADD COLUMN IF NOT EXISTS "appelsAvecReponse" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Prospect" ADD COLUMN IF NOT EXISTS "appelsSansReponse" INTEGER NOT NULL DEFAULT 0;
