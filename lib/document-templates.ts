// ─────────────────────────────────────────────────────────────────────────────
// Registre des templates de documents (devis / facture / contrat).
//
// 👉 POUR AJOUTER UN TEMPLATE : ajoute simplement un objet dans
//    DOCUMENT_TEMPLATES ci-dessous. Il apparaîtra automatiquement dans le
//    sélecteur de la page « Devis & facture ». Chaque template définit ses
//    champs (`fields`) qui seront proposés à la saisie puis stockés dans le
//    document (colonne `data`).
// ─────────────────────────────────────────────────────────────────────────────

export type DocumentKind = "DEVIS" | "FACTURE" | "CONTRAT";

export type DocumentStatus =
  | "DRAFT"
  | "SENT"
  | "SIGNED"
  | "PAID"
  | "CANCELLED";

export type TemplateFieldType = "text" | "textarea" | "number" | "date";

export type TemplateField = {
  key: string;
  label: string;
  type: TemplateFieldType;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
};

export type DocumentTemplate = {
  id: string;
  kind: DocumentKind;
  name: string;
  description: string;
  defaultTitle?: string;
  /** Champ servant de montant principal (centimes), s'il existe. */
  amountFieldKey?: string;
  fields: TemplateField[];
};

export const DOCUMENT_KINDS: { id: DocumentKind; label: string; plural: string }[] = [
  { id: "DEVIS", label: "Devis", plural: "Devis" },
  { id: "FACTURE", label: "Facture", plural: "Factures" },
  { id: "CONTRAT", label: "Contrat", plural: "Contrats" },
];

export const DOCUMENT_STATUSES: {
  id: DocumentStatus;
  label: string;
  tone: "neutral" | "info" | "ok" | "warn" | "danger";
}[] = [
  { id: "DRAFT", label: "Brouillon", tone: "neutral" },
  { id: "SENT", label: "Envoyé", tone: "info" },
  { id: "SIGNED", label: "Signé", tone: "ok" },
  { id: "PAID", label: "Payé", tone: "ok" },
  { id: "CANCELLED", label: "Annulé", tone: "danger" },
];

const PRESTATION_FIELD: TemplateField = {
  key: "prestation",
  label: "Prestation / objet",
  type: "textarea",
  required: true,
  placeholder: "Description de la prestation…",
};

const MONTANT_FIELD: TemplateField = {
  key: "montant",
  label: "Montant HT (€)",
  type: "number",
  required: true,
  placeholder: "1500",
};

const VALIDITE_FIELD: TemplateField = {
  key: "validite",
  label: "Validité du devis (jours)",
  type: "number",
  placeholder: "30",
  defaultValue: "30",
};

const DELAI_FIELD: TemplateField = {
  key: "delai",
  label: "Délai de démarrage",
  type: "text",
  defaultValue: "Démarrage sous 7 à 14 jours selon l'offre.",
};

const GARANTIE_FIELD: TemplateField = {
  key: "conditions",
  label: "Conditions / garantie",
  type: "textarea",
  defaultValue:
    "Sans engagement : vous arrêtez quand vous voulez. Garantie résultat : si nous ne sommes pas à la hauteur, nous travaillons gratuitement jusqu'à atteindre les résultats promis.",
};

function f5lFidelisationTemplate(
  id: string,
  name: string,
  monthly: string,
  setup: string,
  included: string,
): DocumentTemplate {
  return {
    id,
    kind: "DEVIS",
    name: `F5L Fidélisation - ${name}`,
    description: `${name} : ${monthly} €/mois, installation ${setup} €.`,
    defaultTitle: `Devis F5L Fidélisation - ${name}`,
    amountFieldKey: "installation",
    fields: [
      {
        key: "prestation",
        label: "Offre",
        type: "text",
        required: true,
        defaultValue: `F5L Fidélisation - ${name}`,
      },
      {
        key: "inclus",
        label: "Inclus",
        type: "textarea",
        required: true,
        defaultValue: included,
      },
      {
        key: "installation",
        label: "Installation HT (€)",
        type: "number",
        required: true,
        defaultValue: setup,
      },
      {
        key: "mensualite",
        label: "Mensualité HT (€)",
        type: "number",
        required: true,
        defaultValue: monthly,
      },
      DELAI_FIELD,
      VALIDITE_FIELD,
      GARANTIE_FIELD,
    ],
  };
}

// Templates de démarrage + offres F5L issues de la plaquette client.
export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  f5lFidelisationTemplate(
    "devis-f5l-fidelisation-essentiel",
    "Essentiel",
    "149",
    "299",
    "Site web, CRM et relances clients automatiques.",
  ),
  f5lFidelisationTemplate(
    "devis-f5l-fidelisation-croissance",
    "Croissance",
    "299",
    "499",
    "Essentiel + carte de fidélité numérique + référencement SEO.",
  ),
  f5lFidelisationTemplate(
    "devis-f5l-fidelisation-premium",
    "Premium",
    "599",
    "799",
    "Croissance + répondeur téléphonique IA + réservation en ligne.",
  ),
  {
    id: "devis-f5l-campagne-test-45j",
    kind: "DEVIS",
    name: "F5L Campagne test 45 jours",
    description: "Campagne ciblée Meta ou Google, page dédiée et bilan chiffré.",
    defaultTitle: "Devis F5L Campagne test 45 jours",
    amountFieldKey: "installation",
    fields: [
      {
        key: "prestation",
        label: "Offre",
        type: "text",
        required: true,
        defaultValue: "Campagne test 45 jours",
      },
      {
        key: "inclus",
        label: "Inclus",
        type: "textarea",
        required: true,
        defaultValue:
          "1 campagne ciblée Meta ou Google : publicité, page dédiée, suivi des demandes et bilan chiffré.",
      },
      {
        key: "installation",
        label: "Installation HT (€)",
        type: "number",
        required: true,
        defaultValue: "390",
      },
      {
        key: "budget_pub",
        label: "Budget publicitaire",
        type: "text",
        defaultValue: "Budget publicitaire à prévoir en supplément.",
      },
      DELAI_FIELD,
      VALIDITE_FIELD,
      GARANTIE_FIELD,
    ],
  },
  {
    id: "devis-f5l-acquisition-complete",
    kind: "DEVIS",
    name: "F5L Acquisition complète",
    description: "Meta + Google, pages dédiées, CRM, suivi et reporting mensuel.",
    defaultTitle: "Devis F5L Acquisition complète",
    amountFieldKey: "mensualite_depart",
    fields: [
      {
        key: "prestation",
        label: "Offre",
        type: "text",
        required: true,
        defaultValue: "Système complet F5L Acquisition",
      },
      {
        key: "inclus",
        label: "Inclus",
        type: "textarea",
        required: true,
        defaultValue:
          "Publicités Meta + Google, pages dédiées, CRM, suivi de chaque demande de devis et reporting mensuel.",
      },
      {
        key: "mensualite_depart",
        label: "Mensualité HT - 3 premiers mois (€)",
        type: "number",
        required: true,
        defaultValue: "1500",
      },
      {
        key: "mensualite_suite",
        label: "Mensualité HT ensuite (€)",
        type: "number",
        required: true,
        defaultValue: "3000",
      },
      DELAI_FIELD,
      VALIDITE_FIELD,
      GARANTIE_FIELD,
    ],
  },
  {
    id: "devis-f5l-site-seo",
    kind: "DEVIS",
    name: "Complément - Site web SEO",
    description: "Site web professionnel optimisé SEO, livré sous 7 jours.",
    defaultTitle: "Devis Site web professionnel optimisé SEO",
    amountFieldKey: "installation",
    fields: [
      {
        key: "prestation",
        label: "Offre",
        type: "text",
        required: true,
        defaultValue: "Site web professionnel optimisé SEO",
      },
      {
        key: "inclus",
        label: "Inclus",
        type: "textarea",
        required: true,
        defaultValue: "Site professionnel optimisé SEO, livré sous 7 jours.",
      },
      {
        key: "installation",
        label: "Création HT (€)",
        type: "number",
        required: true,
        defaultValue: "499",
      },
      {
        key: "mensualite",
        label: "Hébergement / maintenance HT (€ / mois)",
        type: "number",
        required: true,
        defaultValue: "24",
      },
      VALIDITE_FIELD,
      GARANTIE_FIELD,
    ],
  },
  {
    id: "devis-f5l-repondeur-ia",
    kind: "DEVIS",
    name: "Complément - Répondeur téléphonique IA",
    description: "Répondeur IA pour ne plus rater d'appels.",
    defaultTitle: "Devis Répondeur téléphonique IA",
    amountFieldKey: "mensualite",
    fields: [
      {
        key: "prestation",
        label: "Offre",
        type: "text",
        required: true,
        defaultValue: "Répondeur téléphonique IA",
      },
      {
        key: "inclus",
        label: "Inclus",
        type: "textarea",
        required: true,
        defaultValue: "Répondeur téléphonique IA pour ne plus rater aucun appel.",
      },
      {
        key: "mensualite",
        label: "Mensualité HT (€)",
        type: "number",
        required: true,
        defaultValue: "99",
      },
      VALIDITE_FIELD,
      GARANTIE_FIELD,
    ],
  },
  {
    id: "devis-standard",
    kind: "DEVIS",
    name: "Devis standard",
    description: "Devis simple : prestation, montant, validité.",
    amountFieldKey: "montant",
    fields: [
      PRESTATION_FIELD,
      MONTANT_FIELD,
      {
        key: "validite",
        label: "Validité (jours)",
        type: "number",
        placeholder: "30",
      },
      { key: "conditions", label: "Conditions", type: "textarea", placeholder: "Acompte 30%…" },
    ],
  },
  {
    id: "facture-standard",
    kind: "FACTURE",
    name: "Facture standard",
    description: "Facture : prestation, montant, échéance.",
    amountFieldKey: "montant",
    fields: [
      PRESTATION_FIELD,
      MONTANT_FIELD,
      { key: "echeance", label: "Date d'échéance", type: "date" },
      { key: "mentions", label: "Mentions légales", type: "textarea", placeholder: "TVA non applicable, art. 293 B du CGI…" },
    ],
  },
  {
    id: "contrat-prestation",
    kind: "CONTRAT",
    name: "Contrat de prestation",
    description: "Contrat de prestation de service générique.",
    fields: [
      { key: "objet", label: "Objet du contrat", type: "textarea", required: true, placeholder: "Prestation de…" },
      { key: "duree", label: "Durée", type: "text", placeholder: "12 mois" },
      { key: "montant", label: "Montant (€)", type: "number", placeholder: "0" },
      { key: "clauses", label: "Clauses particulières", type: "textarea" },
    ],
  },
];

export function getTemplate(id: string): DocumentTemplate | undefined {
  return DOCUMENT_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByKind(kind: DocumentKind): DocumentTemplate[] {
  return DOCUMENT_TEMPLATES.filter((t) => t.kind === kind);
}

export function kindLabel(kind: string): string {
  return DOCUMENT_KINDS.find((k) => k.id === kind)?.label ?? kind;
}

export function statusMeta(status: string) {
  return (
    DOCUMENT_STATUSES.find((s) => s.id === status) ?? {
      id: status as DocumentStatus,
      label: status,
      tone: "neutral" as const,
    }
  );
}

export function isDocumentKind(v: unknown): v is DocumentKind {
  return v === "DEVIS" || v === "FACTURE" || v === "CONTRAT";
}

export function isDocumentStatus(v: unknown): v is DocumentStatus {
  return DOCUMENT_STATUSES.some((s) => s.id === v);
}

export type DocumentFormData = {
  prospectId: string;
  type: DocumentKind;
  templateId: string;
  title: string;
  amount: number | null; // centimes
  issuedAt: string | null; // "YYYY-MM-DD"
  data: Record<string, string>;
};

/** Forme sérialisable d'un document pour les composants client. */
export type DocumentListItem = {
  id: string;
  type: DocumentKind;
  templateId: string;
  reference: string;
  title: string;
  status: DocumentStatus;
  amount: number | null; // centimes
  issuedAt: string; // "YYYY-MM-DD"
  clientId: string;
  clientName: string;
};

export type ProspectOption = { id: string; name: string };
