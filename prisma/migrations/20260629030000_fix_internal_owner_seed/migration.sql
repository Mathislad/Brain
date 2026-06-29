-- Corrige le seed owner interne sans modifier la migration déjà appliquée.
-- Idempotent : si le membre existe déjà, aucun doublon n'est créé.

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
    ON CONFLICT ("organizationId", "userId") DO UPDATE
      SET "role" = 'OWNER';
  END IF;
END $$;
