-- F5L Brain product foundations: services, projects, ads, CRM, automations,
-- AI agents, client requests and notifications.

ALTER TABLE "ClientDocument" ADD COLUMN "serviceId" TEXT;

CREATE TABLE "F5lService" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'planned',
  "progress" INTEGER NOT NULL DEFAULT 0,
  "description" TEXT,
  "startedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "F5lService_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WebsiteProject" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "serviceId" TEXT,
  "domain" TEXT,
  "previewUrl" TEXT,
  "productionUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'planned',
  "currentStep" TEXT,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "contentStatus" TEXT NOT NULL DEFAULT 'waiting',
  "designStatus" TEXT NOT NULL DEFAULT 'planned',
  "developmentStatus" TEXT NOT NULL DEFAULT 'planned',
  "deploymentStatus" TEXT NOT NULL DEFAULT 'planned',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WebsiteProject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WebsiteTask" (
  "id" TEXT NOT NULL,
  "websiteProjectId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'todo',
  "assignedTo" TEXT,
  "dueDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WebsiteTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdAccount" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "accountName" TEXT NOT NULL,
  "externalAccountId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AdAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdCampaign" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "serviceId" TEXT,
  "platform" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "objective" TEXT,
  "budget" INTEGER,
  "spend" INTEGER,
  "leads" INTEGER NOT NULL DEFAULT 0,
  "cpl" INTEGER,
  "impressions" INTEGER NOT NULL DEFAULT 0,
  "clicks" INTEGER NOT NULL DEFAULT 0,
  "conversions" INTEGER NOT NULL DEFAULT 0,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AdCampaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmPipelineStage" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CrmPipelineStage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmLead" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "source" TEXT,
  "status" TEXT NOT NULL DEFAULT 'new',
  "value" INTEGER,
  "lastContactAt" TIMESTAMP(3),
  "nextActionAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CrmLead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClientAutomation" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'planned',
  "description" TEXT,
  "lastRunAt" TIMESTAMP(3),
  "nextRunAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ClientAutomation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiAgent" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'planned',
  "description" TEXT,
  "lastActivityAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AiAgent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiAgentLog" (
  "id" TEXT NOT NULL,
  "agentId" TEXT,
  "organizationId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'done',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AiAgentLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClientRequest" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT,
  "category" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ClientRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClientNotification" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ClientNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClientDocument_serviceId_idx" ON "ClientDocument"("serviceId");

CREATE INDEX "F5lService_organizationId_idx" ON "F5lService"("organizationId");
CREATE INDEX "F5lService_organizationId_type_idx" ON "F5lService"("organizationId", "type");
CREATE INDEX "F5lService_organizationId_status_idx" ON "F5lService"("organizationId", "status");

CREATE INDEX "WebsiteProject_organizationId_idx" ON "WebsiteProject"("organizationId");
CREATE INDEX "WebsiteProject_serviceId_idx" ON "WebsiteProject"("serviceId");
CREATE INDEX "WebsiteProject_organizationId_status_idx" ON "WebsiteProject"("organizationId", "status");

CREATE INDEX "WebsiteTask_websiteProjectId_idx" ON "WebsiteTask"("websiteProjectId");
CREATE INDEX "WebsiteTask_websiteProjectId_status_idx" ON "WebsiteTask"("websiteProjectId", "status");

CREATE INDEX "AdAccount_organizationId_idx" ON "AdAccount"("organizationId");
CREATE INDEX "AdAccount_organizationId_platform_idx" ON "AdAccount"("organizationId", "platform");

CREATE INDEX "AdCampaign_organizationId_idx" ON "AdCampaign"("organizationId");
CREATE INDEX "AdCampaign_serviceId_idx" ON "AdCampaign"("serviceId");
CREATE INDEX "AdCampaign_organizationId_platform_idx" ON "AdCampaign"("organizationId", "platform");
CREATE INDEX "AdCampaign_organizationId_status_idx" ON "AdCampaign"("organizationId", "status");

CREATE INDEX "CrmPipelineStage_organizationId_idx" ON "CrmPipelineStage"("organizationId");
CREATE INDEX "CrmPipelineStage_organizationId_position_idx" ON "CrmPipelineStage"("organizationId", "position");

CREATE INDEX "CrmLead_organizationId_idx" ON "CrmLead"("organizationId");
CREATE INDEX "CrmLead_organizationId_status_idx" ON "CrmLead"("organizationId", "status");
CREATE INDEX "CrmLead_organizationId_createdAt_idx" ON "CrmLead"("organizationId", "createdAt");

CREATE INDEX "ClientAutomation_organizationId_idx" ON "ClientAutomation"("organizationId");
CREATE INDEX "ClientAutomation_organizationId_status_idx" ON "ClientAutomation"("organizationId", "status");

CREATE INDEX "AiAgent_organizationId_idx" ON "AiAgent"("organizationId");
CREATE INDEX "AiAgent_organizationId_status_idx" ON "AiAgent"("organizationId", "status");

CREATE INDEX "AiAgentLog_agentId_idx" ON "AiAgentLog"("agentId");
CREATE INDEX "AiAgentLog_organizationId_idx" ON "AiAgentLog"("organizationId");
CREATE INDEX "AiAgentLog_organizationId_createdAt_idx" ON "AiAgentLog"("organizationId", "createdAt");

CREATE INDEX "ClientRequest_organizationId_idx" ON "ClientRequest"("organizationId");
CREATE INDEX "ClientRequest_organizationId_status_idx" ON "ClientRequest"("organizationId", "status");
CREATE INDEX "ClientRequest_userId_idx" ON "ClientRequest"("userId");

CREATE INDEX "ClientNotification_organizationId_idx" ON "ClientNotification"("organizationId");
CREATE INDEX "ClientNotification_userId_idx" ON "ClientNotification"("userId");
CREATE INDEX "ClientNotification_organizationId_readAt_idx" ON "ClientNotification"("organizationId", "readAt");

ALTER TABLE "ClientDocument" ADD CONSTRAINT "ClientDocument_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "F5lService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "F5lService" ADD CONSTRAINT "F5lService_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsiteProject" ADD CONSTRAINT "WebsiteProject_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsiteProject" ADD CONSTRAINT "WebsiteProject_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "F5lService"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WebsiteTask" ADD CONSTRAINT "WebsiteTask_websiteProjectId_fkey" FOREIGN KEY ("websiteProjectId") REFERENCES "WebsiteProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdAccount" ADD CONSTRAINT "AdAccount_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdCampaign" ADD CONSTRAINT "AdCampaign_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdCampaign" ADD CONSTRAINT "AdCampaign_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "F5lService"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmPipelineStage" ADD CONSTRAINT "CrmPipelineStage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmLead" ADD CONSTRAINT "CrmLead_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientAutomation" ADD CONSTRAINT "ClientAutomation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiAgent" ADD CONSTRAINT "AiAgent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiAgentLog" ADD CONSTRAINT "AiAgentLog_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AiAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AiAgentLog" ADD CONSTRAINT "AiAgentLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientRequest" ADD CONSTRAINT "ClientRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientNotification" ADD CONSTRAINT "ClientNotification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
