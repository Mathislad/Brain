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

  if (!mapping.nom && mapping.entreprise) {
    mapping.nom = mapping.entreprise;
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
