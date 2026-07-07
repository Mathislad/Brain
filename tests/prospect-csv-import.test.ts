import assert from "node:assert/strict";
import test from "node:test";

import {
  autoDetectMapping,
  buildProspectRowFromCsv,
  createCsvColumns,
  formatCsvColumnOption,
  hasImportableName,
} from "../lib/prospect-csv-import.ts";

test("CSV columns keep stable ids even when headers are duplicated or empty", () => {
  const columns = createCsvColumns(["Nom", "Téléphone", "Téléphone", ""]);

  assert.deepEqual(
    columns.map((column) => ({
      id: column.id,
      index: column.index,
      label: column.label,
    })),
    [
      { id: "0", index: 0, label: "Nom" },
      { id: "1", index: 1, label: "Téléphone" },
      { id: "2", index: 2, label: "Téléphone" },
      { id: "3", index: 3, label: "Colonne 4" },
    ],
  );
});

test("manual mapping can select the intended duplicated column", () => {
  const columns = createCsvColumns(["Nom", "Téléphone", "Téléphone", "Notes"]);
  const detected = autoDetectMapping(columns);
  const row = ["Ada Lovelace", "01 00 00 00 00", "06 11 22 33 44", "VIP"];

  const prospect = buildProspectRowFromCsv(row, columns, {
    ...detected,
    telephone: "2",
    note: "3",
  });

  assert.equal(prospect.nom, "Ada Lovelace");
  assert.equal(prospect.telephone, "06 11 22 33 44");
  assert.equal(prospect.note, "VIP");
});

test("column options include position and sample data for disambiguation", () => {
  const columns = createCsvColumns(["Email", "Email"]);
  const rows = [
    ["work@example.com", "personal@example.com"],
    ["", "backup@example.com"],
  ];

  assert.equal(
    formatCsvColumnOption(columns[1], rows),
    "2. Email — ex: personal@example.com",
  );
});

test("auto mapping recognizes Brain fields from the user's prospect CSV", () => {
  const columns = createCsvColumns([
    "Entreprise ",
    "Assignation",
    "Lieu",
    "E-mail",
    "Téléphone",
    "Website",
    "État",
    "Dernière modification",
    "Texte",
  ]);
  const row = [
    "NathVape",
    "Ainara Dumond",
    "15 Rue de Chante Barbe, 43200 Yssingeaux, France",
    "nathcycy11@gmail.com",
    "06 14 57 17 53",
    "http://nathvape.fr/",
    "A contacter",
    "1 avril 2026 14:58",
    "Couvreur",
  ];

  const mapping = autoDetectMapping(columns, [row]);
  const prospect = buildProspectRowFromCsv(row, columns, mapping);

  assert.equal(mapping.nom, "");
  assert.equal(mapping.entreprise, "0");
  assert.equal(mapping.ville, "2");
  assert.equal(mapping.email, "3");
  assert.equal(mapping.telephone, "4");
  assert.equal(mapping.siteInternet, "5");
  assert.equal(mapping.prochaineAction, "6");
  assert.equal(mapping.status, "");
  assert.equal(mapping.derniereAction, "7");
  assert.equal(mapping.activite, "8");
  assert.equal(mapping.note, "");
  assert.equal(hasImportableName(mapping), true);

  assert.equal(prospect.nom, "NathVape");
  assert.equal(prospect.entreprise, "NathVape");
  assert.equal(prospect.ville, "15 Rue de Chante Barbe, 43200 Yssingeaux, France");
  assert.equal(prospect.email, "nathcycy11@gmail.com");
  assert.equal(prospect.telephone, "06 14 57 17 53");
  assert.equal(prospect.siteInternet, "http://nathvape.fr/");
  assert.equal(prospect.prochaineAction, "A contacter");
  assert.equal(prospect.derniereAction, "1 avril 2026 14:58");
  assert.equal(prospect.activite, "Couvreur");
  assert.equal(prospect.status, undefined);
});

test("text column becomes niche when values are mostly business categories", () => {
  const columns = createCsvColumns(["Entreprise", "Texte", "État"]);
  const rows = [
    ["DUCULTY DAVID COUVREUR", "Couvreur", "A contacter"],
    ["BTRP Haute-Loire Étanchéité", "Couvreur", "Pas intéresser"],
    ["Ambiance Peinture", "Peintre en bâtiment", "A contacter"],
    ["Institut A", "Institut de beauté", "En cours"],
  ];
  const mapping = autoDetectMapping(columns, rows);

  assert.equal(mapping.entreprise, "0");
  assert.equal(mapping.activite, "1");
  assert.equal(mapping.note, "");
  assert.equal(mapping.prochaineAction, "2");
  assert.equal(mapping.status, "");
});

test("auto mapping recognizes social, location, and niche columns", () => {
  const columns = createCsvColumns([
    "Nom contact",
    "IG",
    "Page Facebook",
    "Profil LinkedIn",
    "Niche",
    "Localisation",
    "Réseaux sociaux",
  ]);
  const mapping = autoDetectMapping(columns);

  assert.equal(mapping.nom, "0");
  assert.equal(mapping.instagram, "1");
  assert.equal(mapping.facebook, "2");
  assert.equal(mapping.linkedin, "3");
  assert.equal(mapping.activite, "4");
  assert.equal(mapping.ville, "5");
  assert.equal(mapping.note, "6");
});

test("auto mapping uses sample values without stealing unrelated columns", () => {
  const columns = createCsvColumns([
    "Assignation",
    "Colonne A",
    "Colonne B",
    "Colonne C",
    "Entreprise",
  ]);
  const rows = [[
    "Ainara Dumond",
    "contact@example.com",
    "06 10 20 30 40",
    "https://example.fr",
    "Maison Test",
  ]];
  const mapping = autoDetectMapping(columns, rows);
  const prospect = buildProspectRowFromCsv(rows[0], columns, mapping);

  assert.equal(mapping.nom, "");
  assert.equal(mapping.email, "1");
  assert.equal(mapping.telephone, "2");
  assert.equal(mapping.siteInternet, "3");
  assert.equal(mapping.entreprise, "4");
  assert.equal(prospect.nom, "Maison Test");
  assert.equal(prospect.email, "contact@example.com");
});
