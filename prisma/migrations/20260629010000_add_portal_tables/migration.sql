-- ─── AppRole enum ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "AppRole" AS ENUM ('OWNER', 'ADMIN', 'CLIENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Organization ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Organization" (
  "id"              TEXT NOT NULL,
  "name"            TEXT NOT NULL,
  "type"            TEXT NOT NULL DEFAULT 'client',
  "status"          TEXT NOT NULL DEFAULT 'pending',
  "prospectId"      TEXT,
  "siret"           TEXT,
  "adresse"         TEXT,
  "formeJuridique"  TEXT,
  "representant"    TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Organization_prospectId_key"
  ON "Organization"("prospectId");
CREATE INDEX IF NOT EXISTS "Organization_type_idx"   ON "Organization"("type");
CREATE INDEX IF NOT EXISTS "Organization_status_idx" ON "Organization"("status");
CREATE INDEX IF NOT EXISTS "Organization_prospectId_idx" ON "Organization"("prospectId");

ALTER TABLE "Organization"
  ADD CONSTRAINT "Organization_prospectId_fkey"
  FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE SET NULL;

-- ─── OrganizationMember ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "OrganizationMember" (
  "id"             TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId"         TEXT NOT NULL,
  "role"           "AppRole" NOT NULL DEFAULT 'CLIENT',
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "OrganizationMember_organizationId_userId_key"
  ON "OrganizationMember"("organizationId", "userId");
CREATE INDEX IF NOT EXISTS "OrganizationMember_userId_idx"
  ON "OrganizationMember"("userId");
CREATE INDEX IF NOT EXISTS "OrganizationMember_organizationId_idx"
  ON "OrganizationMember"("organizationId");

ALTER TABLE "OrganizationMember"
  ADD CONSTRAINT "OrganizationMember_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;

-- ─── ClientInvitation ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ClientInvitation" (
  "id"               TEXT NOT NULL,
  "organizationId"   TEXT NOT NULL,
  "contactEmail"     TEXT NOT NULL,
  "accessToken"      TEXT NOT NULL,
  "tokenExpiresAt"   TIMESTAMP(3) NOT NULL,
  "shortCodeSecret"  TEXT,
  "prefilledData"    JSONB NOT NULL DEFAULT '{}',
  "status"           TEXT NOT NULL DEFAULT 'pending',
  "completedAt"      TIMESTAMP(3),
  "codeValidatedAt"  TIMESTAMP(3),
  "failedAttempts"   INTEGER NOT NULL DEFAULT 0,
  "lockedUntil"      TIMESTAMP(3),
  "createdBy"        TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClientInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ClientInvitation_accessToken_key"
  ON "ClientInvitation"("accessToken");
CREATE INDEX IF NOT EXISTS "ClientInvitation_organizationId_idx"
  ON "ClientInvitation"("organizationId");
CREATE INDEX IF NOT EXISTS "ClientInvitation_contactEmail_idx"
  ON "ClientInvitation"("contactEmail");

ALTER TABLE "ClientInvitation"
  ADD CONSTRAINT "ClientInvitation_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;

-- ─── OrganizationBilling ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "OrganizationBilling" (
  "id"                      TEXT NOT NULL,
  "organizationId"          TEXT NOT NULL,
  "offerKey"                TEXT,
  "setupAmount"             INTEGER,
  "monthlyAmount"           INTEGER,
  "subscriptionStatus"      TEXT NOT NULL DEFAULT 'inactive',
  "stripeCustomerId"        TEXT,
  "stripeSubscriptionId"    TEXT,
  "stripeCheckoutSessionId" TEXT,
  "isSimulated"             BOOLEAN NOT NULL DEFAULT true,
  "activatedAt"             TIMESTAMP(3),
  "createdAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"               TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrganizationBilling_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "OrganizationBilling_organizationId_key"
  ON "OrganizationBilling"("organizationId");

ALTER TABLE "OrganizationBilling"
  ADD CONSTRAINT "OrganizationBilling_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;

-- ─── ClientDocument ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ClientDocument" (
  "id"              TEXT NOT NULL,
  "organizationId"  TEXT NOT NULL,
  "title"           TEXT NOT NULL,
  "description"     TEXT,
  "category"        TEXT,
  "storagePath"     TEXT,
  "externalUrl"     TEXT,
  "createdBy"       TEXT,
  "createdByRole"   "AppRole",
  "visibleToClient" BOOLEAN NOT NULL DEFAULT true,
  "uploadedBy"      TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClientDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ClientDocument_organizationId_idx"
  ON "ClientDocument"("organizationId");
CREATE INDEX IF NOT EXISTS "ClientDocument_organizationId_visible_idx"
  ON "ClientDocument"("organizationId", "visibleToClient");

ALTER TABLE "ClientDocument"
  ADD CONSTRAINT "ClientDocument_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;

-- ─── OrganizationFeature ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "OrganizationFeature" (
  "id"             TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "featureKey"     TEXT NOT NULL,
  "enabled"        BOOLEAN NOT NULL DEFAULT false,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrganizationFeature_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "OrganizationFeature_organizationId_featureKey_key"
  ON "OrganizationFeature"("organizationId", "featureKey");
CREATE INDEX IF NOT EXISTS "OrganizationFeature_organizationId_idx"
  ON "OrganizationFeature"("organizationId");

ALTER TABLE "OrganizationFeature"
  ADD CONSTRAINT "OrganizationFeature_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;

-- ─── Helpers RLS ──────────────────────────────────────────────────────────────
-- Toutes les colonnes ID sont TEXT (cuid), pas UUID.
-- auth.uid() est UUID → cast en text pour la comparaison.

CREATE OR REPLACE FUNCTION public.is_org_admin(p_org_id text)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM "OrganizationMember" m
    WHERE m."organizationId" = p_org_id
      AND m."userId" = auth.uid()::text
      AND m.role IN ('OWNER', 'ADMIN')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id text)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM "OrganizationMember" m
    WHERE m."organizationId" = p_org_id
      AND m."userId" = auth.uid()::text
  );
$$;

-- ─── Enable RLS ───────────────────────────────────────────────────────────────
ALTER TABLE "Organization"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrganizationMember"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClientInvitation"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrganizationBilling" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClientDocument"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrganizationFeature" ENABLE ROW LEVEL SECURITY;

-- ─── Organization policies ────────────────────────────────────────────────────
CREATE POLICY "org_select" ON "Organization"
FOR SELECT USING (
  is_org_member(id)
  OR is_org_admin('org_internal_f5l')
);

CREATE POLICY "org_insert" ON "Organization"
FOR INSERT WITH CHECK (
  is_org_admin('org_internal_f5l')
);

CREATE POLICY "org_update" ON "Organization"
FOR UPDATE USING (
  is_org_admin('org_internal_f5l')
  OR is_org_admin(id)
);

CREATE POLICY "org_delete" ON "Organization"
FOR DELETE USING (
  is_org_admin('org_internal_f5l')
);

-- ─── OrganizationMember policies ─────────────────────────────────────────────
CREATE POLICY "member_select" ON "OrganizationMember"
FOR SELECT USING (
  is_org_member("organizationId")
  OR is_org_admin('org_internal_f5l')
);

CREATE POLICY "member_insert" ON "OrganizationMember"
FOR INSERT WITH CHECK (
  is_org_admin("organizationId")
  OR is_org_admin('org_internal_f5l')
);

CREATE POLICY "member_delete" ON "OrganizationMember"
FOR DELETE USING (
  is_org_admin("organizationId")
  OR is_org_admin('org_internal_f5l')
);

-- ─── ClientInvitation policies ───────────────────────────────────────────────
-- L'onboarding public accède via service role (pas d'auth utilisateur côté serveur).
-- Les policies RLS couvrent les accès authentifiés (admin Brain + client connecté).
CREATE POLICY "invitation_select" ON "ClientInvitation"
FOR SELECT USING (
  is_org_admin('org_internal_f5l')
  OR is_org_member("organizationId")
);

CREATE POLICY "invitation_insert" ON "ClientInvitation"
FOR INSERT WITH CHECK (
  is_org_admin('org_internal_f5l')
);

CREATE POLICY "invitation_update" ON "ClientInvitation"
FOR UPDATE USING (
  is_org_admin('org_internal_f5l')
);

-- ─── OrganizationBilling policies ────────────────────────────────────────────
CREATE POLICY "billing_select" ON "OrganizationBilling"
FOR SELECT USING (
  is_org_admin('org_internal_f5l')
  OR is_org_member("organizationId")
);

CREATE POLICY "billing_insert" ON "OrganizationBilling"
FOR INSERT WITH CHECK (
  is_org_admin('org_internal_f5l')
);

CREATE POLICY "billing_update" ON "OrganizationBilling"
FOR UPDATE USING (
  is_org_admin('org_internal_f5l')
);

-- ─── ClientDocument policies ──────────────────────────────────────────────────
-- SELECT : admin de l'org voit tout.
--          Client voit (ce qu'il a créé) OU (les docs que l'admin a rendu visibles).
CREATE POLICY "document_select" ON "ClientDocument"
FOR SELECT USING (
  is_org_admin("organizationId")
  OR (
    is_org_member("organizationId")
    AND (
      "createdBy" = auth.uid()::text
      OR "visibleToClient" = true
    )
  )
);

-- INSERT : admin de l'org OU membre qui se désigne comme auteur.
CREATE POLICY "document_insert" ON "ClientDocument"
FOR INSERT WITH CHECK (
  is_org_admin("organizationId")
  OR (
    is_org_member("organizationId")
    AND "createdBy" = auth.uid()::text
  )
);

-- UPDATE : admin de l'org uniquement (le client ne modifie pas les docs fournis).
CREATE POLICY "document_update" ON "ClientDocument"
FOR UPDATE USING (
  is_org_admin("organizationId")
);

-- DELETE : admin de l'org uniquement.
CREATE POLICY "document_delete" ON "ClientDocument"
FOR DELETE USING (
  is_org_admin("organizationId")
);

-- ─── OrganizationFeature policies ────────────────────────────────────────────
CREATE POLICY "feature_select" ON "OrganizationFeature"
FOR SELECT USING (
  is_org_member("organizationId")
);

CREATE POLICY "feature_write" ON "OrganizationFeature"
FOR ALL USING (
  is_org_admin("organizationId")
  OR is_org_admin('org_internal_f5l')
) WITH CHECK (
  is_org_admin("organizationId")
  OR is_org_admin('org_internal_f5l')
);

-- ─── Seed : organisation interne F5L (idempotent) ────────────────────────────
-- ID stable fixe — jamais modifié. Utilisé dans les policies RLS ci-dessus.
INSERT INTO "Organization" ("id", "name", "type", "status", "updatedAt")
VALUES ('org_internal_f5l', 'F5L Agency', 'internal', 'active', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Seed owner : résout l'admin par email, idempotent via ON CONFLICT.
DO $$
DECLARE v_uid text;
BEGIN
  SELECT id::text INTO v_uid
  FROM auth.users
  WHERE email = 'ladouceurmathis.contact@gmail.com'
  LIMIT 1;

  IF v_uid IS NOT NULL THEN
    INSERT INTO "OrganizationMember"
      ("id", "organizationId", "userId", "role", "createdAt")
    VALUES (
      'member_internal_owner',
      'org_internal_f5l',
      v_uid,
      'OWNER',
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("organizationId", "userId") DO NOTHING;
  END IF;
END $$;
