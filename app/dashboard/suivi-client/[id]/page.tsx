import { notFound } from "next/navigation";

import { ClientOrgDashboard } from "@/components/dashboard/client-org-dashboard";
import { requireAdmin } from "@/lib/auth/roles";
import {
  getAdsOverview,
  getAiAgentsOverview,
  getAutomationOverview,
  getClientRequests,
  getCrmOverview,
  getOrganizationDetail,
  getPortalServices,
  getWebsiteOverview,
} from "@/lib/f5l-portal";

export default async function SuiviClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const organization = await getOrganizationDetail(id);
  if (!organization) notFound();

  const [services, requests, website, metaAds, googleAds, crm, automations, aiAgents] =
    await Promise.all([
      getPortalServices(id),
      getClientRequests(id),
      getWebsiteOverview(id),
      getAdsOverview(id, "meta"),
      getAdsOverview(id, "google"),
      getCrmOverview(id),
      getAutomationOverview(id),
      getAiAgentsOverview(id),
    ]);

  return (
    <ClientOrgDashboard
      organization={organization}
      services={services}
      requests={requests}
      website={website}
      metaAds={metaAds}
      googleAds={googleAds}
      crm={crm}
      automations={automations}
      aiAgents={aiAgents}
    />
  );
}
