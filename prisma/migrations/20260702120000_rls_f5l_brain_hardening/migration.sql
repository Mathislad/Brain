-- ─────────────────────────────────────────────────────────────────────────────
-- Durcissement RLS des tables métier F5L Brain (Blocs 2-4 du plan Supabase).
-- Appliqué manuellement via SQL Editor le 2 juillet 2026, puis marqué
-- `prisma migrate resolve --applied` pour garder l'historique reproductible.
--
-- Rappel : l'app se connecte en rôle postgres (propriétaire) qui BYPASSE la
-- RLS. Ces policies ferment l'accès via l'API PostgREST anon/authenticated.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Bloc 2 : verrouillage search_path des fonctions RLS ──────────────────────
-- CREATE OR REPLACE : même signature, les policies existantes restent valides.

CREATE OR REPLACE FUNCTION public.is_org_admin(p_org_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public."OrganizationMember" m
    WHERE m."organizationId" = p_org_id
      AND m."userId" = (SELECT auth.uid()::text)
      AND m.role IN ('OWNER', 'ADMIN')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public."OrganizationMember" m
    WHERE m."organizationId" = p_org_id
      AND m."userId" = (SELECT auth.uid()::text)
  );
$$;

COMMENT ON FUNCTION public.is_org_admin(text) IS
  'True si l''utilisateur courant est OWNER/ADMIN de l''org. SECURITY DEFINER, search_path verrouillé.';
COMMENT ON FUNCTION public.is_org_member(text) IS
  'True si l''utilisateur courant est membre de l''org. SECURITY DEFINER, search_path verrouillé.';

-- ── Bloc 3 : activation RLS sur les 12 tables métier F5L Brain ───────────────

ALTER TABLE "F5lService"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WebsiteProject"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WebsiteTask"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdAccount"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdCampaign"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CrmPipelineStage"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CrmLead"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClientAutomation"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AiAgent"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AiAgentLog"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClientRequest"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClientNotification" ENABLE ROW LEVEL SECURITY;

-- ── Bloc 4 : policies ─────────────────────────────────────────────────────────
-- Lecture : membre de l'org OU admin Brain. Écriture : admin Brain, sauf
-- ClientRequest (insert client) et ClientNotification (update client = lu).
-- DROP IF EXISTS pour idempotence sur base fraîche (même pattern que les
-- migrations RLS historiques).

-- F5lService
DROP POLICY IF EXISTS "f5lservice_select" ON "F5lService";
DROP POLICY IF EXISTS "f5lservice_insert" ON "F5lService";
DROP POLICY IF EXISTS "f5lservice_update" ON "F5lService";
DROP POLICY IF EXISTS "f5lservice_delete" ON "F5lService";
CREATE POLICY "f5lservice_select" ON "F5lService" FOR SELECT USING (is_org_member("organizationId") OR is_org_admin('org_internal_f5l'));
CREATE POLICY "f5lservice_insert" ON "F5lService" FOR INSERT WITH CHECK (is_org_admin('org_internal_f5l'));
CREATE POLICY "f5lservice_update" ON "F5lService" FOR UPDATE USING (is_org_admin('org_internal_f5l')) WITH CHECK (is_org_admin('org_internal_f5l'));
CREATE POLICY "f5lservice_delete" ON "F5lService" FOR DELETE USING (is_org_admin('org_internal_f5l'));

-- WebsiteProject
DROP POLICY IF EXISTS "websiteproject_select" ON "WebsiteProject";
DROP POLICY IF EXISTS "websiteproject_insert" ON "WebsiteProject";
DROP POLICY IF EXISTS "websiteproject_update" ON "WebsiteProject";
DROP POLICY IF EXISTS "websiteproject_delete" ON "WebsiteProject";
CREATE POLICY "websiteproject_select" ON "WebsiteProject" FOR SELECT USING (is_org_member("organizationId") OR is_org_admin('org_internal_f5l'));
CREATE POLICY "websiteproject_insert" ON "WebsiteProject" FOR INSERT WITH CHECK (is_org_admin('org_internal_f5l'));
CREATE POLICY "websiteproject_update" ON "WebsiteProject" FOR UPDATE USING (is_org_admin('org_internal_f5l')) WITH CHECK (is_org_admin('org_internal_f5l'));
CREATE POLICY "websiteproject_delete" ON "WebsiteProject" FOR DELETE USING (is_org_admin('org_internal_f5l'));

-- AdAccount
DROP POLICY IF EXISTS "adaccount_select" ON "AdAccount";
DROP POLICY IF EXISTS "adaccount_insert" ON "AdAccount";
DROP POLICY IF EXISTS "adaccount_update" ON "AdAccount";
DROP POLICY IF EXISTS "adaccount_delete" ON "AdAccount";
CREATE POLICY "adaccount_select" ON "AdAccount" FOR SELECT USING (is_org_member("organizationId") OR is_org_admin('org_internal_f5l'));
CREATE POLICY "adaccount_insert" ON "AdAccount" FOR INSERT WITH CHECK (is_org_admin('org_internal_f5l'));
CREATE POLICY "adaccount_update" ON "AdAccount" FOR UPDATE USING (is_org_admin('org_internal_f5l')) WITH CHECK (is_org_admin('org_internal_f5l'));
CREATE POLICY "adaccount_delete" ON "AdAccount" FOR DELETE USING (is_org_admin('org_internal_f5l'));

-- AdCampaign
DROP POLICY IF EXISTS "adcampaign_select" ON "AdCampaign";
DROP POLICY IF EXISTS "adcampaign_insert" ON "AdCampaign";
DROP POLICY IF EXISTS "adcampaign_update" ON "AdCampaign";
DROP POLICY IF EXISTS "adcampaign_delete" ON "AdCampaign";
CREATE POLICY "adcampaign_select" ON "AdCampaign" FOR SELECT USING (is_org_member("organizationId") OR is_org_admin('org_internal_f5l'));
CREATE POLICY "adcampaign_insert" ON "AdCampaign" FOR INSERT WITH CHECK (is_org_admin('org_internal_f5l'));
CREATE POLICY "adcampaign_update" ON "AdCampaign" FOR UPDATE USING (is_org_admin('org_internal_f5l')) WITH CHECK (is_org_admin('org_internal_f5l'));
CREATE POLICY "adcampaign_delete" ON "AdCampaign" FOR DELETE USING (is_org_admin('org_internal_f5l'));

-- CrmPipelineStage
DROP POLICY IF EXISTS "crmstage_select" ON "CrmPipelineStage";
DROP POLICY IF EXISTS "crmstage_insert" ON "CrmPipelineStage";
DROP POLICY IF EXISTS "crmstage_update" ON "CrmPipelineStage";
DROP POLICY IF EXISTS "crmstage_delete" ON "CrmPipelineStage";
CREATE POLICY "crmstage_select" ON "CrmPipelineStage" FOR SELECT USING (is_org_member("organizationId") OR is_org_admin('org_internal_f5l'));
CREATE POLICY "crmstage_insert" ON "CrmPipelineStage" FOR INSERT WITH CHECK (is_org_admin('org_internal_f5l'));
CREATE POLICY "crmstage_update" ON "CrmPipelineStage" FOR UPDATE USING (is_org_admin('org_internal_f5l')) WITH CHECK (is_org_admin('org_internal_f5l'));
CREATE POLICY "crmstage_delete" ON "CrmPipelineStage" FOR DELETE USING (is_org_admin('org_internal_f5l'));

-- CrmLead
DROP POLICY IF EXISTS "crmlead_select" ON "CrmLead";
DROP POLICY IF EXISTS "crmlead_insert" ON "CrmLead";
DROP POLICY IF EXISTS "crmlead_update" ON "CrmLead";
DROP POLICY IF EXISTS "crmlead_delete" ON "CrmLead";
CREATE POLICY "crmlead_select" ON "CrmLead" FOR SELECT USING (is_org_member("organizationId") OR is_org_admin('org_internal_f5l'));
CREATE POLICY "crmlead_insert" ON "CrmLead" FOR INSERT WITH CHECK (is_org_admin('org_internal_f5l'));
CREATE POLICY "crmlead_update" ON "CrmLead" FOR UPDATE USING (is_org_admin('org_internal_f5l')) WITH CHECK (is_org_admin('org_internal_f5l'));
CREATE POLICY "crmlead_delete" ON "CrmLead" FOR DELETE USING (is_org_admin('org_internal_f5l'));

-- ClientAutomation
DROP POLICY IF EXISTS "automation_select" ON "ClientAutomation";
DROP POLICY IF EXISTS "automation_insert" ON "ClientAutomation";
DROP POLICY IF EXISTS "automation_update" ON "ClientAutomation";
DROP POLICY IF EXISTS "automation_delete" ON "ClientAutomation";
CREATE POLICY "automation_select" ON "ClientAutomation" FOR SELECT USING (is_org_member("organizationId") OR is_org_admin('org_internal_f5l'));
CREATE POLICY "automation_insert" ON "ClientAutomation" FOR INSERT WITH CHECK (is_org_admin('org_internal_f5l'));
CREATE POLICY "automation_update" ON "ClientAutomation" FOR UPDATE USING (is_org_admin('org_internal_f5l')) WITH CHECK (is_org_admin('org_internal_f5l'));
CREATE POLICY "automation_delete" ON "ClientAutomation" FOR DELETE USING (is_org_admin('org_internal_f5l'));

-- AiAgent
DROP POLICY IF EXISTS "aiagent_select" ON "AiAgent";
DROP POLICY IF EXISTS "aiagent_insert" ON "AiAgent";
DROP POLICY IF EXISTS "aiagent_update" ON "AiAgent";
DROP POLICY IF EXISTS "aiagent_delete" ON "AiAgent";
CREATE POLICY "aiagent_select" ON "AiAgent" FOR SELECT USING (is_org_member("organizationId") OR is_org_admin('org_internal_f5l'));
CREATE POLICY "aiagent_insert" ON "AiAgent" FOR INSERT WITH CHECK (is_org_admin('org_internal_f5l'));
CREATE POLICY "aiagent_update" ON "AiAgent" FOR UPDATE USING (is_org_admin('org_internal_f5l')) WITH CHECK (is_org_admin('org_internal_f5l'));
CREATE POLICY "aiagent_delete" ON "AiAgent" FOR DELETE USING (is_org_admin('org_internal_f5l'));

-- AiAgentLog
DROP POLICY IF EXISTS "aiagentlog_select" ON "AiAgentLog";
DROP POLICY IF EXISTS "aiagentlog_insert" ON "AiAgentLog";
DROP POLICY IF EXISTS "aiagentlog_update" ON "AiAgentLog";
DROP POLICY IF EXISTS "aiagentlog_delete" ON "AiAgentLog";
CREATE POLICY "aiagentlog_select" ON "AiAgentLog" FOR SELECT USING (is_org_member("organizationId") OR is_org_admin('org_internal_f5l'));
CREATE POLICY "aiagentlog_insert" ON "AiAgentLog" FOR INSERT WITH CHECK (is_org_admin('org_internal_f5l'));
CREATE POLICY "aiagentlog_update" ON "AiAgentLog" FOR UPDATE USING (is_org_admin('org_internal_f5l')) WITH CHECK (is_org_admin('org_internal_f5l'));
CREATE POLICY "aiagentlog_delete" ON "AiAgentLog" FOR DELETE USING (is_org_admin('org_internal_f5l'));

-- ClientRequest (le client crée ses demandes)
DROP POLICY IF EXISTS "request_select" ON "ClientRequest";
DROP POLICY IF EXISTS "request_insert" ON "ClientRequest";
DROP POLICY IF EXISTS "request_update" ON "ClientRequest";
DROP POLICY IF EXISTS "request_delete" ON "ClientRequest";
CREATE POLICY "request_select" ON "ClientRequest" FOR SELECT USING (is_org_member("organizationId") OR is_org_admin('org_internal_f5l'));
CREATE POLICY "request_insert" ON "ClientRequest" FOR INSERT WITH CHECK (is_org_member("organizationId") OR is_org_admin('org_internal_f5l'));
CREATE POLICY "request_update" ON "ClientRequest" FOR UPDATE USING (is_org_admin('org_internal_f5l')) WITH CHECK (is_org_admin('org_internal_f5l'));
CREATE POLICY "request_delete" ON "ClientRequest" FOR DELETE USING (is_org_admin('org_internal_f5l'));

-- ClientNotification (le client marque comme lue)
DROP POLICY IF EXISTS "notification_select" ON "ClientNotification";
DROP POLICY IF EXISTS "notification_insert" ON "ClientNotification";
DROP POLICY IF EXISTS "notification_update" ON "ClientNotification";
DROP POLICY IF EXISTS "notification_delete" ON "ClientNotification";
CREATE POLICY "notification_select" ON "ClientNotification" FOR SELECT USING (is_org_member("organizationId") OR is_org_admin('org_internal_f5l'));
CREATE POLICY "notification_insert" ON "ClientNotification" FOR INSERT WITH CHECK (is_org_admin('org_internal_f5l'));
CREATE POLICY "notification_update" ON "ClientNotification" FOR UPDATE USING (is_org_member("organizationId") OR is_org_admin('org_internal_f5l')) WITH CHECK (is_org_member("organizationId") OR is_org_admin('org_internal_f5l'));
CREATE POLICY "notification_delete" ON "ClientNotification" FOR DELETE USING (is_org_admin('org_internal_f5l'));

-- WebsiteTask (pas d'organizationId : isolation héritée du projet parent)
DROP POLICY IF EXISTS "websitetask_select" ON "WebsiteTask";
DROP POLICY IF EXISTS "websitetask_insert" ON "WebsiteTask";
DROP POLICY IF EXISTS "websitetask_update" ON "WebsiteTask";
DROP POLICY IF EXISTS "websitetask_delete" ON "WebsiteTask";
CREATE POLICY "websitetask_select" ON "WebsiteTask" FOR SELECT USING (
  is_org_admin('org_internal_f5l')
  OR EXISTS (
    SELECT 1 FROM "WebsiteProject" p
    WHERE p.id = "WebsiteTask"."websiteProjectId"
      AND is_org_member(p."organizationId")
  )
);
CREATE POLICY "websitetask_insert" ON "WebsiteTask" FOR INSERT WITH CHECK (is_org_admin('org_internal_f5l'));
CREATE POLICY "websitetask_update" ON "WebsiteTask" FOR UPDATE USING (is_org_admin('org_internal_f5l')) WITH CHECK (is_org_admin('org_internal_f5l'));
CREATE POLICY "websitetask_delete" ON "WebsiteTask" FOR DELETE USING (is_org_admin('org_internal_f5l'));
