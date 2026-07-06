import assert from "node:assert/strict";
import test from "node:test";

import {
  autoDetectMapping,
  buildProspectRowFromCsv,
  createCsvColumns,
  formatCsvColumnOption,
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
