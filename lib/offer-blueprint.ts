import type { FeatureKey } from "@/lib/auth/features";
import type { ServiceType } from "@/lib/f5l-portal-format";

// Modèle de services + features à provisionner selon l'offre choisie.
// Consommé au seed d'onboarding (completeSignupAction) et à la création
// d'invitation. `import type` uniquement : ce fichier reste neutre (pas de
// dépendance runtime server-only), donc réutilisable partout.

type ServiceSeed = {
  type: ServiceType;
  name: string;
  status: string; // planned | active | paused | done | attention
};

export type OfferBlueprint = {
  services: ServiceSeed[];
  features: FeatureKey[];
};

const SERVICE_LABELS: Record<ServiceType, string> = {
  website: "Site internet",
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  crm: "CRM / leads",
  ai_agent: "Agents IA",
  automation: "Automatisations",
  support: "Support",
};

function svc(type: ServiceType, status = "planned"): ServiceSeed {
  return { type, name: SERVICE_LABELS[type], status };
}

export const OFFER_BLUEPRINT: Record<string, OfferBlueprint> = {
  fidelisation_essentiel: {
    services: [svc("website"), svc("support")],
    features: ["documents", "billing"],
  },
  fidelisation_croissance: {
    services: [svc("website"), svc("crm"), svc("support")],
    features: ["documents", "billing", "crm", "loyalty_card"],
  },
  fidelisation_premium: {
    services: [svc("website"), svc("crm"), svc("ai_agent"), svc("support")],
    features: ["documents", "billing", "crm", "loyalty_card", "ai_followup", "reservation"],
  },
  campagne_45j: {
    services: [svc("meta_ads"), svc("crm"), svc("support")],
    features: ["documents", "billing", "acquisition", "crm"],
  },
  acquisition: {
    services: [
      svc("meta_ads"),
      svc("google_ads"),
      svc("crm"),
      svc("automation"),
      svc("support"),
    ],
    features: ["documents", "billing", "acquisition", "crm"],
  },
  site_web: {
    services: [svc("website"), svc("support")],
    features: ["documents", "billing"],
  },
  seo_local: {
    services: [svc("website"), svc("support")],
    features: ["documents", "billing"],
  },
  sur_mesure: {
    services: [svc("support")],
    features: ["documents", "billing"],
  },
};

// Socle appliqué si l'offre est inconnue ou absente.
export const FALLBACK_BLUEPRINT: OfferBlueprint = {
  services: [svc("support")],
  features: ["documents", "billing"],
};

export function getOfferBlueprint(offerKey?: string | null): OfferBlueprint {
  if (!offerKey) return FALLBACK_BLUEPRINT;
  return OFFER_BLUEPRINT[offerKey] ?? FALLBACK_BLUEPRINT;
}
