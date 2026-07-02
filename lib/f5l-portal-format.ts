export type ServiceType =
  | "website"
  | "meta_ads"
  | "google_ads"
  | "crm"
  | "ai_agent"
  | "automation"
  | "support";

export type PortalService = {
  id: string;
  type: ServiceType;
  name: string;
  status: string;
  progress: number;
  description: string;
  updatedAt: Date;
  source: "db" | "mock";
};

export type PortalRequest = {
  id: string;
  organizationId: string;
  organizationName?: string;
  category: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
  source: "db" | "mock";
};

export const serviceLabels: Record<ServiceType, string> = {
  website: "Site internet",
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  crm: "CRM / leads",
  ai_agent: "Agents IA",
  automation: "Automatisations",
  support: "Support",
};

export const statusLabels: Record<string, string> = {
  planned: "Préparé",
  active: "Actif",
  paused: "En pause",
  done: "Terminé",
  attention: "À surveiller",
  draft: "Brouillon",
  open: "Ouverte",
  in_progress: "En cours",
  waiting_client: "Action client",
};

export function formatMoneyCents(value?: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value / 100);
}

export function formatDate(value?: Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}
