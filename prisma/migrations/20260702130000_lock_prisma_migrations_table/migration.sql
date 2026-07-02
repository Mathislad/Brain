-- Ferme _prisma_migrations à l'API PostgREST (RLS sans policy = refus par défaut).
-- Dernière table du schéma public sans RLS (33/33 après ce changement).
-- Prisma (rôle postgres, propriétaire) bypasse la RLS : migrate deploy/status/resolve
-- ne sont pas affectés.
-- Appliqué manuellement via SQL Editor le 2 juillet 2026, marqué --applied.

ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
