import { getTemplate, kindLabel, statusMeta } from "@/lib/document-templates";

type PdfProspect = {
  nom: string;
  entreprise: string | null;
  email: string | null;
  telephone: string | null;
  ville: string | null;
  activite: string | null;
};

export type PdfDocument = {
  type: string;
  templateId: string;
  reference: string;
  title: string;
  status: string;
  amount: number | null;
  data: Record<string, string>;
  issuedAt: Date;
  prospect: PdfProspect;
};

const PAGE_WIDTH = 595.276;
const PAGE_HEIGHT = 841.89;
const MARGIN = 46;
const BLUE = [0.18, 0.39, 1] as const;
const BLACK = [0.04, 0.04, 0.05] as const;
const GREY = [0.42, 0.42, 0.48] as const;
const LIGHT = [0.95, 0.96, 0.98] as const;
const MONEY_KEYS = new Set([
  "montant",
  "installation",
  "mensualite",
  "mensualite_depart",
  "mensualite_suite",
]);

type RGB = readonly [number, number, number];
type FontName = "F1" | "F2";

function asMoney(value: number | string | null | undefined) {
  const amount =
    typeof value === "number"
      ? value
      : Number.parseFloat(String(value ?? "").replace(",", "."));
  if (!Number.isFinite(amount)) return "";
  return amount.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

function dateFr(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

const WIN_ANSI: Record<string, number> = {
  "€": 0x80,
  "‚": 0x82,
  "ƒ": 0x83,
  "„": 0x84,
  "…": 0x85,
  "†": 0x86,
  "‡": 0x87,
  "ˆ": 0x88,
  "‰": 0x89,
  "Š": 0x8a,
  "‹": 0x8b,
  "Œ": 0x8c,
  "Ž": 0x8e,
  "‘": 0x91,
  "’": 0x92,
  "“": 0x93,
  "”": 0x94,
  "•": 0x95,
  "–": 0x96,
  "—": 0x97,
  "˜": 0x98,
  "™": 0x99,
  "š": 0x9a,
  "›": 0x9b,
  "œ": 0x9c,
  "ž": 0x9e,
  "Ÿ": 0x9f,
};

function winAnsiLiteral(value: string) {
  let out = "";
  const normalized = value.replace(/\u00a0/g, " ");

  for (const char of normalized) {
    const mapped = WIN_ANSI[char];
    const code = mapped ?? char.charCodeAt(0);

    if (char === "(" || char === ")" || char === "\\") {
      out += `\\${char}`;
    } else if (code >= 32 && code <= 126) {
      out += char;
    } else if (code >= 0 && code <= 255) {
      out += `\\${code.toString(8).padStart(3, "0")}`;
    } else {
      const fallback = char.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      out += fallback && fallback !== char ? fallback : "?";
    }
  }

  return `(${out})`;
}

function lineWidth(text: string, size: number) {
  return text.length * size * 0.48;
}

function wrapText(text: string, maxWidth: number, size: number) {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (lineWidth(next, size) <= maxWidth) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
  }

  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

class PdfCanvas {
  private pages: string[][] = [[]];
  private current = this.pages[0];

  addPage() {
    this.current = [];
    this.pages.push(this.current);
  }

  text(
    value: string,
    x: number,
    y: number,
    size = 10,
    color: RGB = BLACK,
    font: FontName = "F1",
  ) {
    const baseline = PAGE_HEIGHT - y - size;
    this.current.push(
      `BT /${font} ${size} Tf ${color.join(" ")} rg 1 0 0 1 ${x.toFixed(2)} ${baseline.toFixed(2)} Tm ${winAnsiLiteral(value)} Tj ET`,
    );
  }

  rect(x: number, y: number, width: number, height: number, color: RGB) {
    const pdfY = PAGE_HEIGHT - y - height;
    this.current.push(
      `${color.join(" ")} rg ${x.toFixed(2)} ${pdfY.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f`,
    );
  }

  line(x1: number, y1: number, x2: number, y2: number, color: RGB = GREY) {
    const py1 = PAGE_HEIGHT - y1;
    const py2 = PAGE_HEIGHT - y2;
    this.current.push(
      `${color.join(" ")} RG 0.6 w ${x1.toFixed(2)} ${py1.toFixed(2)} m ${x2.toFixed(2)} ${py2.toFixed(2)} l S`,
    );
  }

  getPages() {
    return this.pages;
  }
}

function buildPdf(pages: string[][]) {
  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("");
  objects.push(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
  );
  objects.push(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
  );

  const pageObjectIds: number[] = [];

  for (const page of pages) {
    const content = page.join("\n");
    const contentId = objects.length + 1;
    objects.push(
      `<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`,
    );
    const pageId = objects.length + 1;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    pageObjectIds.push(pageId);
  }

  objects[1] =
    `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`;

  let body = "%PDF-1.7\n% Brain F5L\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(body, "utf8"));
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(body, "utf8");
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i += 1) {
    body += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(body, "utf8");
}

function getData(document: PdfDocument, key: string) {
  return document.data[key]?.trim() ?? "";
}

function formatFieldValue(key: string, value: string) {
  if (MONEY_KEYS.has(key)) return asMoney(value);
  return value;
}

export function generateDocumentPdf(document: PdfDocument) {
  const canvas = new PdfCanvas();
  const template = getTemplate(document.templateId);
  const meta = statusMeta(document.status);
  const clientName = document.prospect.entreprise || document.prospect.nom;
  const prestation = getData(document, "prestation") || document.title;
  const included = getData(document, "inclus");
  let y = 40;

  function ensureSpace(height: number) {
    if (y + height < PAGE_HEIGHT - 48) return;
    canvas.addPage();
    y = 44;
    canvas.text("F5L", MARGIN, y, 18, BLUE, "F2");
    canvas.text(document.reference, PAGE_WIDTH - MARGIN - 130, y + 4, 10, GREY, "F1");
    y += 34;
  }

  function paragraph(text: string, x: number, width: number, size = 10, color: RGB = BLACK) {
    const lines = wrapText(text, width, size);
    for (const line of lines) {
      ensureSpace(size + 8);
      canvas.text(line, x, y, size, color);
      y += size + 5;
    }
  }

  function labelValue(label: string, value: string, x: number, width: number) {
    canvas.text(label, x, y, 8, GREY, "F2");
    y += 13;
    paragraph(value || "-", x, width, 10, BLACK);
  }

  canvas.rect(0, 0, PAGE_WIDTH, 18, BLUE);
  canvas.text("F5L", MARGIN, y, 24, BLUE, "F2");
  canvas.text(kindLabel(document.type).toUpperCase(), PAGE_WIDTH - MARGIN - 130, y + 2, 20, BLACK, "F2");
  y += 34;
  canvas.text("Plus de clients. Mesurable.", MARGIN, y, 10, GREY);
  canvas.text(document.reference, PAGE_WIDTH - MARGIN - 130, y, 10, GREY);
  y += 34;

  const cardTop = y;
  canvas.rect(MARGIN, cardTop, PAGE_WIDTH - MARGIN * 2, 92, LIGHT);
  y += 18;
  canvas.text("Client", MARGIN + 18, y, 9, GREY, "F2");
  canvas.text("Document", PAGE_WIDTH / 2 + 10, y, 9, GREY, "F2");
  y += 18;
  canvas.text(clientName, MARGIN + 18, y, 13, BLACK, "F2");
  canvas.text(`${document.reference} - ${meta.label}`, PAGE_WIDTH / 2 + 10, y, 11, BLACK, "F2");
  y += 18;
  canvas.text(document.prospect.nom, MARGIN + 18, y, 10, BLACK);
  canvas.text(`Date : ${dateFr(document.issuedAt)}`, PAGE_WIDTH / 2 + 10, y, 10, BLACK);
  y += 15;
  const contact = [document.prospect.email, document.prospect.telephone, document.prospect.ville]
    .filter(Boolean)
    .join(" · ");
  canvas.text(contact || document.prospect.activite || "-", MARGIN + 18, y, 9, GREY);
  y = cardTop + 118;

  canvas.text(document.title, MARGIN, y, 18, BLACK, "F2");
  y += 28;
  paragraph(prestation, MARGIN, PAGE_WIDTH - MARGIN * 2, 11, BLACK);
  if (included) {
    y += 6;
    canvas.text("Inclus", MARGIN, y, 10, BLUE, "F2");
    y += 18;
    paragraph(included, MARGIN, PAGE_WIDTH - MARGIN * 2, 10, BLACK);
  }

  y += 14;
  ensureSpace(120);
  canvas.text("Détails financiers", MARGIN, y, 13, BLUE, "F2");
  y += 20;
  canvas.rect(MARGIN, y, PAGE_WIDTH - MARGIN * 2, 28, BLACK);
  canvas.text("Élément", MARGIN + 14, y + 9, 9, [1, 1, 1], "F2");
  canvas.text("Montant / détail", PAGE_WIDTH - MARGIN - 170, y + 9, 9, [1, 1, 1], "F2");
  y += 28;

  const rows =
    template?.fields
      .filter((field) => {
        const value = getData(document, field.key);
        return (
          value &&
          !["prestation", "inclus", "conditions", "validite", "delai"].includes(field.key)
        );
      })
      .map((field) => ({
        label: field.label,
        value: formatFieldValue(field.key, getData(document, field.key)),
      })) ?? [];

  if (!rows.length && document.amount != null) {
    rows.push({ label: "Montant principal", value: asMoney(document.amount / 100) });
  }

  rows.forEach((row, index) => {
    ensureSpace(36);
    if (index % 2 === 0) {
      canvas.rect(MARGIN, y, PAGE_WIDTH - MARGIN * 2, 32, LIGHT);
    }
    canvas.text(row.label, MARGIN + 14, y + 10, 9, BLACK);
    canvas.text(row.value, PAGE_WIDTH - MARGIN - 170, y + 10, 10, BLACK, "F2");
    y += 32;
  });

  if (document.amount != null) {
    y += 8;
    canvas.line(PAGE_WIDTH - MARGIN - 210, y, PAGE_WIDTH - MARGIN, y, GREY);
    y += 14;
    canvas.text("Montant principal", PAGE_WIDTH - MARGIN - 210, y, 10, BLACK, "F2");
    canvas.text(asMoney(document.amount / 100), PAGE_WIDTH - MARGIN - 105, y, 12, BLUE, "F2");
    y += 28;
  }

  y += 8;
  ensureSpace(120);
  canvas.text("Conditions", MARGIN, y, 13, BLUE, "F2");
  y += 20;
  const validity = getData(document, "validite");
  const delay = getData(document, "delai");
  const conditions = getData(document, "conditions");
  labelValue("Validité", validity ? `${validity} jours` : "-", MARGIN, 210);
  if (delay) labelValue("Délai", delay, MARGIN, PAGE_WIDTH - MARGIN * 2);
  if (conditions) {
    canvas.text("Garantie / conditions", MARGIN, y, 8, GREY, "F2");
    y += 13;
    paragraph(conditions, MARGIN, PAGE_WIDTH - MARGIN * 2, 9, BLACK);
  }

  ensureSpace(80);
  y = Math.max(y + 16, PAGE_HEIGHT - 96);
  canvas.line(MARGIN, y, PAGE_WIDTH - MARGIN, y, GREY);
  y += 16;
  canvas.text("Ladouceurmc.contact@gmail.com · 06 18 65 15 79", MARGIN, y, 9, BLUE);
  canvas.text("F5L · Toutes nos offres sont sans engagement", MARGIN, y + 16, 8, GREY);

  return buildPdf(canvas.getPages());
}
