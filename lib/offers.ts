export const OFFER_LABELS: Record<string, string> = {
  fidelisation_essentiel:  "Fidélisation Essentiel",
  fidelisation_croissance: "Croissance",
  fidelisation_premium:    "Premium",
  campagne_45j:            "Campagne 45 jours",
  acquisition:             "Système complet F5L Acquisition",
  site_web:                "Site web",
  seo_local:               "SEO Local",
  sur_mesure:              "Sur mesure",
};

export const OFFER_KEYS = Object.keys(OFFER_LABELS);

export function offerLabel(key: string): string {
  return OFFER_LABELS[key] ?? key;
}

export function formatCents(cents: number): string {
  return (
    (cents / 100).toLocaleString("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }) + " €"
  );
}

export type PortalOffer = {
  key: string;
  title: string;
  monthlyLabel: string;
  setupLabel: string;
  description: string;
  highlighted?: boolean;
};

export const PORTAL_OFFERS: PortalOffer[] = [
  {
    key: "fidelisation_croissance",
    title: "Croissance",
    monthlyLabel: "299 €/mois",
    setupLabel: "499 €",
    description: "Essentiel + carte de fidélité numérique + référencement SEO.",
  },
  {
    key: "fidelisation_premium",
    title: "Premium",
    monthlyLabel: "599 €/mois",
    setupLabel: "799 €",
    description: "Croissance + répondeur téléphonique IA + réservation en ligne.",
    highlighted: true,
  },
  {
    key: "campagne_45j",
    title: "Campagne test 45 jours",
    monthlyLabel: "Dès 390 €",
    setupLabel: "+ budget pub",
    description:
      "1 campagne ciblée Meta ou Google : publicité, page dédiée, suivi des demandes, bilan chiffré.",
  },
  {
    key: "acquisition",
    title: "Système complet F5L Acquisition",
    monthlyLabel: "1 500 €/mois (3 mois)",
    setupLabel: "puis 3 000 €/mois",
    description:
      "Publicités Meta + Google, pages dédiées, CRM, suivi de chaque demande de devis, reporting mensuel.",
    highlighted: true,
  },
];
