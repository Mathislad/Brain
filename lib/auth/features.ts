import "server-only";

import { prisma } from "@/lib/prisma";

export type FeatureKey =
  | "documents"
  | "billing"
  | "crm"
  | "loyalty_card"
  | "ai_followup"
  | "acquisition"
  | "reservation";

export const DEFAULT_FEATURES: Record<FeatureKey, boolean> = {
  documents:   true,
  billing:     true,
  crm:         false,
  loyalty_card: false,
  ai_followup: false,
  acquisition: false,
  reservation: false,
};

export async function hasFeature(orgId: string, key: FeatureKey): Promise<boolean> {
  const f = await prisma.organizationFeature.findFirst({
    where: { organizationId: orgId, featureKey: key, enabled: true },
  });
  return !!f;
}

export async function getOrgFeatures(orgId: string): Promise<Record<FeatureKey, boolean>> {
  const rows = await prisma.organizationFeature.findMany({
    where: { organizationId: orgId },
  });
  const result = { ...DEFAULT_FEATURES };
  for (const row of rows) {
    result[row.featureKey as FeatureKey] = row.enabled;
  }
  return result;
}
