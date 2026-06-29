export const OFFER_LABELS: Record<string, string> = {
  fidelisation_essentiel:  "Fidélisation Essentiel",
  fidelisation_croissance: "Fidélisation Croissance",
  fidelisation_premium:    "Fidélisation Premium",
  campagne_45j:            "Campagne 45 jours",
  acquisition:             "Acquisition",
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
