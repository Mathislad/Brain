import type { ProspectFormData, ProspectStatus } from "@/lib/prospect-types";

export type ProspectCsvField = {
  key: keyof ProspectFormData;
  label: string;
  aliases: string[];
};

export type CsvColumn = {
  id: string;
  index: number;
  header: string;
  label: string;
};

export const BRAIN_FIELDS: ProspectCsvField[] = [
  {
    key: "nom",
    label: "Nom / Prénom *",
    aliases: [
      "nom",
      "prénom",
      "prenom",
      "nom prénom",
      "nom, prénom",
      "nom complet",
      "nom et prénom",
      "prénom nom",
      "personne",
      "contact",
      "contact principal",
      "nom contact",
      "name",
      "full name",
      "contact name",
      "lead name",
    ],
  },
  {
    key: "entreprise",
    label: "Entreprise",
    aliases: [
      "entreprise",
      "nom de l'entreprise",
      "nom d'entreprise",
      "nom entreprise",
      "société",
      "societe",
      "raison sociale",
      "commerce",
      "établissement",
      "etablissement",
      "enseigne",
      "marque",
      "account",
      "company",
      "company name",
      "business",
      "organization",
      "organisation",
      "client",
    ],
  },
  {
    key: "email",
    label: "Email",
    aliases: ["email", "e-mail", "adresse mail", "adresse email", "adresse e-mail", "mail", "courriel"],
  },
  {
    key: "telephone",
    label: "Téléphone",
    aliases: [
      "téléphone",
      "telephone",
      "téléphone fixe",
      "numéro de téléphone",
      "numéro",
      "numero",
      "phone",
      "phone number",
      "mobile",
      "portable",
      "tel",
      "tél",
      "whatsapp",
    ],
  },
  {
    key: "siteInternet",
    label: "Site internet",
    aliases: [
      "site internet",
      "site web",
      "site",
      "website",
      "web site",
      "url",
      "url site",
      "domaine",
      "domain",
      "web",
      "lien",
      "link",
    ],
  },
  {
    key: "instagram",
    label: "Instagram",
    aliases: [
      "instagram",
      "insta",
      "ig",
      "instagram url",
      "lien instagram",
      "profil instagram",
      "compte instagram",
      "instagram handle",
    ],
  },
  {
    key: "facebook",
    label: "Facebook",
    aliases: [
      "facebook",
      "facebook url",
      "lien facebook",
      "page facebook",
      "profil facebook",
      "compte facebook",
      "fb",
      "meta",
    ],
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    aliases: [
      "linkedin",
      "linked in",
      "linkedine",
      "linkedin url",
      "lien linkedin",
      "profil linkedin",
      "page linkedin",
      "compte linkedin",
    ],
  },
  {
    key: "prochaineAction",
    label: "Prochaine action",
    aliases: [
      "prochaine action",
      "prochain contact",
      "relance",
      "rappel",
      "follow up",
      "next action",
      "next step",
      "à faire",
      "a faire",
      "todo",
    ],
  },
  {
    key: "derniereAction",
    label: "Dernière action",
    aliases: [
      "dernière action",
      "dernier contact",
      "dernière modification",
      "derniere modification",
      "modifié le",
      "updated at",
      "last action",
      "last contact",
      "last update",
      "dernière interaction",
    ],
  },
  {
    key: "ville",
    label: "Ville / localisation",
    aliases: [
      "ville",
      "lieu",
      "adresse",
      "adresse complète",
      "adresse complete",
      "code postal",
      "cp",
      "département",
      "departement",
      "région",
      "region",
      "pays",
      "zone",
      "quartier",
      "city",
      "address",
      "localité",
      "localite",
      "location",
      "localisation",
    ],
  },
  {
    key: "activite",
    label: "Activité / niche",
    aliases: [
      "activité",
      "activite",
      "niche",
      "catégorie",
      "categorie",
      "type",
      "type d'activité",
      "type d'activite",
      "secteur",
      "secteur d'activité",
      "secteur d'activite",
      "métier",
      "metier",
      "industrie",
      "industry",
      "activity",
      "domaine",
      "business category",
    ],
  },
  {
    key: "status",
    label: "Statut",
    aliases: [
      "statut",
      "status",
      "état",
      "etat",
      "pipeline",
      "phase",
      "stage",
      "avancement",
    ],
  },
  {
    key: "note",
    label: "Notes",
    aliases: [
      "note",
      "notes",
      "texte",
      "bio",
      "message",
      "commentaire",
      "commentaires",
      "remarque",
      "remarques",
      "remarks",
      "description",
      "résumé",
      "resume",
      "brief",
      "réseaux sociaux",
      "reseaux sociaux",
      "social media",
      "social networks",
      "social links",
    ],
  },
];

export type ProspectCsvMapping = Record<keyof ProspectFormData, string>;

export function normalizeCsvHeader(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['']/g, "'");
}

export function createCsvColumns(headers: string[]): CsvColumn[] {
  return headers.map((header, index) => {
    const cleanHeader = header.trim().replace(/^\uFEFF/, "");
    const label = cleanHeader || `Colonne ${index + 1}`;

    return {
      id: String(index),
      index,
      header: cleanHeader,
      label,
    };
  });
}

export function getCsvCell(row: string[], column: CsvColumn | undefined): string {
  if (!column) return "";
  const value = row[column.index];
  return typeof value === "string" ? value : "";
}

function normalizedWords(value: string): string[] {
  return normalizeCsvHeader(value)
    .replace(/[^a-z0-9+@.]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function normalizedPhrase(value: string): string {
  return normalizedWords(value).join(" ");
}

function aliasScore(header: string, aliases: string[]): number {
  const normalizedHeader = normalizedPhrase(header);
  if (!normalizedHeader) return 0;

  let score = 0;
  for (const alias of aliases) {
    const normalizedAlias = normalizedPhrase(alias);
    if (!normalizedAlias) continue;

    if (normalizedHeader === normalizedAlias) {
      score = Math.max(score, 120);
    } else if (normalizedHeader.startsWith(`${normalizedAlias} `)) {
      score = Math.max(score, 94);
    } else if (normalizedHeader.endsWith(` ${normalizedAlias}`)) {
      score = Math.max(score, 88);
    } else if (normalizedAlias.length >= 4 && normalizedHeader.includes(` ${normalizedAlias} `)) {
      score = Math.max(score, 82);
    } else if (
      normalizedAlias.length >= 7 &&
      (normalizedHeader.includes(normalizedAlias) ||
        (normalizedHeader.length >= 4 && normalizedAlias.includes(normalizedHeader)))
    ) {
      score = Math.max(score, 70);
    }
  }

  return score;
}

function sampleValues(column: CsvColumn, rows: string[][]): string[] {
  return rows
    .slice(0, 25)
    .map((row) => getCsvCell(row, column).trim())
    .filter(Boolean);
}

function countMatches(values: string[], predicate: (value: string) => boolean): number {
  return values.filter(predicate).length;
}

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function looksLikePhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

function looksLikeUrl(value: string): boolean {
  return /^(https?:\/\/|www\.|[a-z0-9-]+\.[a-z]{2,})(\S*)$/i.test(value.trim());
}

function looksLikeLocation(value: string): boolean {
  const normalized = normalizeCsvHeader(value);
  return /\d{5}/.test(value) || normalized.includes(" france") || normalized.includes(" rue ");
}

function valueScore(fieldKey: keyof ProspectFormData, values: string[]): number {
  if (!values.length) return 0;

  const emailMatches = countMatches(values, looksLikeEmail);
  const phoneMatches = countMatches(values, looksLikePhone);
  const urlMatches = countMatches(values, looksLikeUrl);
  const locationMatches = countMatches(values, looksLikeLocation);
  const statusMatches = countMatches(values, (value) => normalizeCsvStatus(value) != null);
  const instagramMatches = countMatches(values, (value) =>
    normalizeCsvHeader(value).includes("instagram") || normalizeCsvHeader(value).includes("insta"),
  );
  const facebookMatches = countMatches(values, (value) => normalizeCsvHeader(value).includes("facebook"));
  const linkedinMatches = countMatches(values, (value) => normalizeCsvHeader(value).includes("linkedin"));

  const ratio = (count: number) => count / values.length;

  switch (fieldKey) {
    case "email":
      return ratio(emailMatches) >= 0.5 ? 80 : 0;
    case "telephone":
      return ratio(phoneMatches) >= 0.5 ? 80 : 0;
    case "siteInternet":
      return ratio(urlMatches) >= 0.5 ? 82 : 0;
    case "instagram":
      return instagramMatches > 0 ? 70 : 0;
    case "facebook":
      return facebookMatches > 0 ? 70 : 0;
    case "linkedin":
      return linkedinMatches > 0 ? 70 : 0;
    case "ville":
      return ratio(locationMatches) >= 0.35 ? 52 : 0;
    case "status":
      return ratio(statusMatches) >= 0.5 ? 78 : 0;
    case "nom":
      return emailMatches || phoneMatches || urlMatches ? -80 : 0;
    case "entreprise":
      return emailMatches || phoneMatches ? -80 : 0;
    default:
      return 0;
  }
}

function detectColumnForField(
  field: ProspectCsvField,
  columns: CsvColumn[],
  rows: string[][],
  used: Set<string>,
): CsvColumn | null {
  let best: { column: CsvColumn; score: number } | null = null;

  for (const column of columns) {
    if (used.has(column.id)) continue;

    const score =
      aliasScore(column.header, field.aliases) +
      valueScore(field.key, sampleValues(column, rows));

    if (!best || score > best.score) {
      best = { column, score };
    }
  }

  return best && best.score >= 70 ? best.column : null;
}

export function autoDetectMapping(columns: CsvColumn[], rows: string[][] = []): ProspectCsvMapping {
  const mapping = {} as ProspectCsvMapping;
  const used = new Set<string>();

  for (const field of BRAIN_FIELDS) {
    const match = detectColumnForField(field, columns, rows, used);
    mapping[field.key] = match?.id ?? "";
    if (match) used.add(match.id);
  }

  return mapping;
}

export function normalizeCsvStatus(value: string): ProspectStatus | null {
  const normalized = normalizeCsvHeader(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  if (["todo", "a faire", "nouveau", "nouvelle", "new", "lead"].includes(normalized)) {
    return "TODO";
  }

  if (
    [
      "en cours",
      "in progress",
      "contacte",
      "contactee",
      "contacté",
      "contactée",
      "relance",
      "relancé",
      "qualifie",
      "qualifié",
      "prospect chaud",
    ].includes(normalized)
  ) {
    return "IN_PROGRESS";
  }

  if (
    [
      "fait",
      "termine",
      "terminé",
      "done",
      "clos",
      "ferme",
      "fermé",
      "perdu",
      "lost",
    ].includes(normalized)
  ) {
    return "DONE";
  }

  if (
    [
      "client",
      "client actif",
      "actif",
      "gagne",
      "gagné",
      "won",
      "signed",
      "signe",
      "signé",
    ].includes(normalized)
  ) {
    return "CLIENT_ACTIF";
  }

  return null;
}

export function buildProspectRowFromCsv(
  raw: string[],
  columns: CsvColumn[],
  mapping: ProspectCsvMapping,
): ProspectFormData {
  const out: ProspectFormData = { nom: "" };
  const columnsById = new Map(columns.map((column) => [column.id, column]));

  for (const field of BRAIN_FIELDS) {
    const column = columnsById.get(mapping[field.key]);
    const value = getCsvCell(raw, column).trim();
    if (column && value) {
      (out as Record<string, string | null>)[field.key] =
        field.key === "status" ? normalizeCsvStatus(value) : value;
    }
  }

  if (!out.nom && out.entreprise) {
    out.nom = out.entreprise;
  }

  return out;
}

export function hasImportableName(mapping: ProspectCsvMapping): boolean {
  return Boolean(mapping.nom || mapping.entreprise);
}

export function formatCsvColumnOption(column: CsvColumn, rows: string[][]): string {
  const sample = rows
    .map((row) => getCsvCell(row, column).trim())
    .find(Boolean);

  return sample
    ? `${column.index + 1}. ${column.label} — ex: ${sample.slice(0, 48)}`
    : `${column.index + 1}. ${column.label}`;
}
