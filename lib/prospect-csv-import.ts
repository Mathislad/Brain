import type { ProspectFormData } from "@/lib/prospect-types";

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
    aliases: ["nom", "nom prénom", "nom, prénom", "nom complet", "nom et prénom", "prénom nom", "contact", "name", "full name", "contact name"],
  },
  {
    key: "entreprise",
    label: "Entreprise",
    aliases: ["entreprise", "nom de l'entreprise", "nom d'entreprise", "nom entreprise", "société", "raison sociale", "account", "company", "company name", "organization", "organisation", "client"],
  },
  {
    key: "email",
    label: "Email",
    aliases: ["email", "e-mail", "adresse mail", "adresse email", "adresse e-mail", "mail", "courriel"],
  },
  {
    key: "telephone",
    label: "Téléphone",
    aliases: ["téléphone", "telephone", "téléphone fixe", "numéro de téléphone", "numéro", "phone", "phone number", "mobile", "portable", "tel", "tél"],
  },
  {
    key: "siteInternet",
    label: "Site internet",
    aliases: ["site internet", "site web", "site", "website", "url", "web", "lien", "link"],
  },
  {
    key: "instagram",
    label: "Instagram",
    aliases: ["instagram", "instagram url", "lien instagram"],
  },
  {
    key: "facebook",
    label: "Facebook",
    aliases: ["facebook", "facebook url", "lien facebook", "fb"],
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    aliases: ["linkedin", "linkedine", "linkedin url", "lien linkedin"],
  },
  {
    key: "prochaineAction",
    label: "Prochaine action",
    aliases: ["prochaine action", "prochain contact", "next action", "next step", "à faire"],
  },
  {
    key: "derniereAction",
    label: "Dernière action",
    aliases: ["dernière action", "dernier contact", "last action", "last contact", "dernière interaction"],
  },
  {
    key: "ville",
    label: "Ville",
    aliases: ["ville", "city", "localité", "location", "localisation"],
  },
  {
    key: "activite",
    label: "Activité",
    aliases: ["activité", "activity", "secteur", "secteur d'activité", "industry", "domaine"],
  },
  {
    key: "note",
    label: "Notes",
    aliases: ["note", "notes", "commentaire", "commentaires", "remarque", "remarques", "remarks", "description"],
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

export function autoDetectMapping(columns: CsvColumn[]): ProspectCsvMapping {
  const mapping = {} as ProspectCsvMapping;
  const used = new Set<string>();

  for (const field of BRAIN_FIELDS) {
    let match = columns.find(
      (column) =>
        !used.has(column.id) &&
        field.aliases.some((alias) => normalizeCsvHeader(alias) === normalizeCsvHeader(column.header)),
    );

    if (!match) {
      match = columns.find(
        (column) =>
          !used.has(column.id) &&
          normalizeCsvHeader(column.header).includes(normalizeCsvHeader(field.aliases[0])),
      );
    }

    mapping[field.key] = match?.id ?? "";
    if (match) used.add(match.id);
  }

  return mapping;
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
      (out as Record<string, string | null>)[field.key] = value;
    }
  }

  return out;
}

export function formatCsvColumnOption(column: CsvColumn, rows: string[][]): string {
  const sample = rows
    .map((row) => getCsvCell(row, column).trim())
    .find(Boolean);

  return sample
    ? `${column.index + 1}. ${column.label} — ex: ${sample.slice(0, 48)}`
    : `${column.index + 1}. ${column.label}`;
}
