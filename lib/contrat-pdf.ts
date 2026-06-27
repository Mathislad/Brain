import type { ContratFormData } from "@/app/actions/contrats";

const PAGE_WIDTH = 595.276;
const PAGE_HEIGHT = 841.89;
const MARGIN = 46;
const BLUE = [0.18, 0.39, 1] as const;
const BLACK = [0.04, 0.04, 0.05] as const;
const GREY = [0.42, 0.42, 0.48] as const;
const LIGHT = [0.95, 0.96, 0.98] as const;

type RGB = readonly [number, number, number];
type FontName = "F1" | "F2";

const SERVICE_LABELS: Record<string, string> = {
  site: "Création de site internet",
  seo: "Référencement SEO local",
  ads: "Google Ads & Meta Ads",
  fidelite: "Carte de fidélité digitale",
  ia: "Agent téléphonique IA",
  social: "Gestion réseaux sociaux",
};

const SERVICE_DETAILS: Record<string, Array<[string, keyof ContratFormData]>> = {
  site: [
    ["Type de site", "site_type"],
    ["Nombre de pages", "site_nb_pages"],
    ["Délai de livraison", "site_delai"],
    ["Hébergement", "site_hebergement"],
    ["Maintenance", "site_maintenance"],
  ],
  seo: [
    ["Zone ciblée", "seo_zone"],
    ["Mots-clés", "seo_keywords"],
    ["Rapport mensuel", "seo_rapport"],
  ],
  ads: [
    ["Plateformes", "ads_plateformes"],
    ["Budget publicitaire", "ads_budget"],
    ["Objectif", "ads_objectif"],
    ["Zone ciblée", "ads_zone"],
    ["Rapport mensuel", "ads_rapport"],
  ],
  fidelite: [
    ["Plateforme", "fidelite_plateforme"],
    ["Maintenance mensuelle", "fidelite_maintenance"],
    ["Accès tableau de bord", "fidelite_acces"],
  ],
  ia: [
    ["Cas d'usage", "ia_usecases"],
    ["Numéro de téléphone", "ia_numero"],
    ["Rapport mensuel", "ia_rapport"],
  ],
  social: [
    ["Plateformes", "social_plateformes"],
    ["Fréquence", "social_frequence"],
    ["Contenus", "social_contenus"],
    ["Fourniture visuels", "social_visuels"],
    ["Validation", "social_validation"],
    ["Rapport mensuel", "social_rapport"],
  ],
};

const WIN_ANSI: Record<string, number> = {
  "€": 0x80,
  "Œ": 0x8c,
  "œ": 0x9c,
  "Š": 0x8a,
  "š": 0x9a,
  "Ž": 0x8e,
  "ž": 0x9e,
  "Ÿ": 0x9f,
  "’": 0x92,
  "“": 0x93,
  "”": 0x94,
  "•": 0x95,
  "–": 0x96,
  "—": 0x97,
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

  let body = "%PDF-1.7\n% Brain F5L contract\n";
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

function value(form: ContratFormData, key: keyof ContratFormData) {
  const item = form[key];
  return Array.isArray(item) ? item.join(", ") : String(item ?? "").trim();
}

function priceFor(form: ContratFormData, service: string) {
  const key = `prix_${service}` as keyof ContratFormData;
  return value(form, key) || "-";
}

function selectedServices(form: ContratFormData) {
  return Array.isArray(form.services_souscrits) ? form.services_souscrits : [];
}

export function generateContratPdf(form: ContratFormData) {
  const canvas = new PdfCanvas();
  let y = 40;

  function header() {
    canvas.rect(0, 0, PAGE_WIDTH, 18, BLUE);
    canvas.text("F5L", MARGIN, y, 24, BLUE, "F2");
    canvas.text("CONTRAT", PAGE_WIDTH - MARGIN - 135, y + 2, 20, BLACK, "F2");
    y += 32;
    canvas.text("Abonnement mensuel - Services digitaux pour TPE & artisans", MARGIN, y, 10, GREY);
    y += 32;
  }

  function footer() {
    canvas.line(MARGIN, PAGE_HEIGHT - 64, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 64, GREY);
    canvas.text("Ladouceur Mathis Création - F5L", MARGIN, PAGE_HEIGHT - 46, 8, GREY);
    canvas.text("Ladouceurmc.contact@gmail.com · 06 18 65 15 79", MARGIN, PAGE_HEIGHT - 32, 8, BLUE);
  }

  function ensureSpace(height: number) {
    if (y + height < PAGE_HEIGHT - 86) return;
    footer();
    canvas.addPage();
    y = 40;
    header();
  }

  function paragraph(text: string, size = 9, color: RGB = BLACK) {
    const lines = wrapText(text, PAGE_WIDTH - MARGIN * 2, size);
    for (const line of lines) {
      ensureSpace(size + 8);
      canvas.text(line, MARGIN, y, size, color);
      y += size + 5;
    }
  }

  function title(text: string) {
    ensureSpace(32);
    y += 8;
    canvas.text(text, MARGIN, y, 12, BLUE, "F2");
    y += 20;
  }

  function row(label: string, content: string) {
    ensureSpace(24);
    canvas.text(label, MARGIN, y, 8, GREY, "F2");
    canvas.text(content || "-", MARGIN + 155, y, 9, BLACK);
    y += 16;
  }

  header();

  canvas.text("CONTRAT DE PRESTATION DE SERVICES NUMÉRIQUES", MARGIN, y, 18, BLACK, "F2");
  y += 30;
  canvas.rect(MARGIN, y, PAGE_WIDTH - MARGIN * 2, 120, LIGHT);
  y += 18;
  canvas.text("Entre les soussignés", MARGIN + 16, y, 10, GREY, "F2");
  y += 18;
  row("Prestataire", "Ladouceur Mathis Création - F5L");
  row("Client", value(form, "client_nom"));
  row("Forme juridique", value(form, "client_forme_juridique"));
  row("SIRET / SIREN", value(form, "client_siret"));
  row("Représentant", value(form, "client_representant"));
  y += 18;

  title("Article 1 - Objet du contrat");
  paragraph(
    "Le présent contrat définit les conditions dans lesquelles le Prestataire réalise, au bénéfice du Client, des prestations de services numériques dans le cadre d'un abonnement mensuel. Les services souscrits, livrables, délais et indicateurs de suivi sont détaillés en Annexe A.",
  );
  paragraph(
    "Le Prestataire est tenu à une obligation de moyens. Il met en œuvre ses compétences, ressources et diligences nécessaires à la bonne exécution des prestations, sans garantir un résultat déterminé sauf stipulation écrite contraire.",
  );

  title("Article 2 - Services souscrits");
  const services = selectedServices(form);
  if (services.length) {
    services.forEach((service) => {
      row(SERVICE_LABELS[service] ?? service, priceFor(form, service));
    });
  } else {
    paragraph("Aucun service souscrit renseigné.");
  }
  row("Total mensuel", value(form, "total_mensuel"));

  title("Article 3 - Durée et entrée en vigueur");
  paragraph(
    `Le contrat entre en vigueur à compter de sa signature par les deux Parties. Durée initiale : ${value(form, "duree_mois")} mois. Date de début : ${value(form, "date_debut") || "-"}. Date de fin prévue : ${value(form, "date_fin") || "-"}.`,
  );

  title("Article 4 - Prix, facturation et paiement");
  paragraph(
    `Les prix sont exprimés en euros TTC, sauf mention contraire. Le mode de facturation retenu est : ${value(form, "mode_facturation") === "debut" ? "début de mois pour le mois à venir" : "fin de mois pour le mois écoulé"}. Les budgets publicitaires Google Ads, Meta Ads ou toute dépense média restent à la charge du Client et sont exclus des honoraires, sauf accord écrit contraire.`,
  );
  paragraph(
    "TVA non applicable selon le régime applicable du Prestataire. Les mentions légales de facturation pourront être adaptées en fonction de l'évolution du régime fiscal.",
  );

  title("Article 5 - Obligations du Client");
  paragraph(
    "Le Client s'engage à fournir les accès, informations, contenus, visuels, validations et éléments nécessaires à la bonne réalisation des prestations. Tout retard de transmission peut décaler les délais de livraison ou de mise en ligne.",
  );

  title("Article 6 - Données, confidentialité et RGPD");
  paragraph(
    "Chaque Partie s'engage à préserver la confidentialité des informations échangées. Le Client certifie avoir informé ses propres clients de la transmission éventuelle de leurs données au Prestataire dans le cadre des services souscrits, conformément au RGPD.",
  );

  title("Article 7 - Propriété intellectuelle");
  paragraph(
    "Les livrables réalisés spécifiquement pour le Client sont transmis pour l'exploitation prévue au contrat après paiement des sommes dues. Les méthodes, modèles, outils, automatisations et savoir-faire du Prestataire restent sa propriété.",
  );

  title("Article 8 - Résiliation et suspension");
  paragraph(
    "Sauf durée ferme indiquée, les offres sont sans engagement au-delà de la période initiale prévue. En cas de défaut de paiement, le Prestataire peut suspendre les services après relance restée sans effet.",
  );

  title("Annexe A - Services et livrables détaillés");
  paragraph(
    "Cette annexe fait partie intégrante du contrat. Elle précise, pour chaque service souscrit, le périmètre exact, les livrables attendus, les délais et indicateurs de suivi.",
  );

  services.forEach((service) => {
    title(SERVICE_LABELS[service] ?? service);
    row("Prix", priceFor(form, service));
    const details = SERVICE_DETAILS[service] ?? [];
    details.forEach(([label, key]) => {
      const item = value(form, key);
      if (item) row(label, item);
    });
  });

  title("Signature");
  paragraph(
    `Fait à ${value(form, "lieu_signature") || "_________"}, le ${value(form, "date_signature") || "____ / ____ / ______"}.`,
  );
  ensureSpace(100);
  canvas.text("Le Prestataire", MARGIN, y, 10, BLACK, "F2");
  canvas.text("Le Client", PAGE_WIDTH / 2 + 36, y, 10, BLACK, "F2");
  y += 48;
  canvas.line(MARGIN, y, MARGIN + 180, y, GREY);
  canvas.line(PAGE_WIDTH / 2 + 36, y, PAGE_WIDTH - MARGIN, y, GREY);
  y += 16;
  canvas.text("Ladouceur Mathis Création - F5L", MARGIN, y, 8, GREY);
  canvas.text(value(form, "client_nom") || "Raison sociale / Nom du Client", PAGE_WIDTH / 2 + 36, y, 8, GREY);

  footer();
  return buildPdf(canvas.getPages());
}
