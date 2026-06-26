"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";

import { importFromCsvAction } from "@/app/actions/prospects";
import type { ProspectFormData } from "@/lib/prospect-types";

// ─── Field mapping config ─────────────────────────────────────────────────────

const BRAIN_FIELDS: {
  key: keyof ProspectFormData;
  label: string;
  aliases: string[];
}[] = [
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

function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['']/g, "'");
}

function autoDetectMapping(headers: string[]): Record<keyof ProspectFormData, string> {
  const mapping = {} as Record<keyof ProspectFormData, string>;
  const used = new Set<string>();

  for (const field of BRAIN_FIELDS) {
    // 1. Exact match (normalized)
    let match = headers.find(
      (h) => !used.has(h) && field.aliases.some((alias) => normalize(alias) === normalize(h)),
    );
    // 2. Fallback: header contains the first alias as a substring
    if (!match) {
      match = headers.find(
        (h) => !used.has(h) && normalize(h).includes(normalize(field.aliases[0])),
      );
    }
    if (match) {
      mapping[field.key] = match;
      used.add(match);
    } else {
      mapping[field.key] = "";
    }
  }
  return mapping;
}

// ─── Component ────────────────────────────────────────────────────────────────

type Step = "upload" | "map" | "preview";

interface Props {
  onClose: () => void;
}

export function CsvImportModal({ onClose }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<keyof ProspectFormData, string>>(
    {} as Record<keyof ProspectFormData, string>,
  );
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ count: number; error?: string } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function parseFile(file: File) {
    setParseError(null);
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      setParseError("Format non supporté. Utilise un fichier .csv");
      return;
    }
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(result) {
        if (!result.data.length) {
          setParseError("Le fichier est vide.");
          return;
        }
        const hdrs = result.meta.fields ?? [];
        const detected = autoDetectMapping(hdrs);
        setHeaders(hdrs);
        setRows(result.data);
        setMapping(detected);
        setSelected(new Set(result.data.map((_, i) => i)));
        setStep("map");
      },
      error(err) {
        setParseError(`Erreur de lecture : ${err.message}`);
      },
    });
  }

  function handleFile(file: File | undefined) {
    if (file) parseFile(file);
  }

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFile(e.dataTransfer.files[0]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Build mapped rows for preview/import
  function buildRow(raw: Record<string, string>): ProspectFormData {
    const out: ProspectFormData = { nom: "" };
    for (const field of BRAIN_FIELDS) {
      const col = mapping[field.key];
      if (col && raw[col] !== undefined) {
        (out as Record<string, string | null>)[field.key] = raw[col].trim() || null;
      }
    }
    return out;
  }

  function handleImport() {
    const selectedRows = Array.from(selected).map((i) => buildRow(rows[i]));
    startTransition(async () => {
      const res = await importFromCsvAction(selectedRows);
      setResult(res);
      if (!res.error) {
        router.refresh();
        setTimeout(onClose, 1400);
      }
    });
  }

  const allSelected = selected.size === rows.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && !isPending && onClose()}
    >
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div>
            <h2 className="text-base font-medium text-white">Importer une base CSV</h2>
            <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-600">
              {(["upload", "map", "preview"] as Step[]).map((s, i) => (
                <span key={s} className="flex items-center gap-2">
                  <span className={step === s ? "text-white" : step > s ? "text-zinc-500" : ""}>
                    {i + 1}. {s === "upload" ? "Fichier" : s === "map" ? "Mapping" : "Sélection"}
                  </span>
                  {i < 2 && <span>›</span>}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* ── Step 1: Upload ── */}
          {step === "upload" && (
            <div className="flex flex-col items-center justify-center px-6 py-12">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`flex w-full max-w-md cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed px-8 py-14 text-center transition-colors ${
                  isDragging
                    ? "border-zinc-500 bg-zinc-800/40"
                    : "border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/40"
                }`}
              >
                <span className="text-4xl">📁</span>
                <div>
                  <p className="text-sm font-medium text-zinc-300">
                    Glisse ton fichier ici
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">ou clique pour parcourir</p>
                  <p className="mt-3 text-xs text-zinc-700">
                    Format supporté : .csv — UTF-8, délimiteur virgule ou point-virgule
                  </p>
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              {parseError && (
                <p className="mt-4 text-sm text-red-400">{parseError}</p>
              )}
              <p className="mt-6 text-xs text-zinc-700">
                Compatible : Airtable, Notion, Google Sheets, Excel, HubSpot, Salesforce…
              </p>
            </div>
          )}

          {/* ── Step 2: Column mapping ── */}
          {step === "map" && (
            <div className="px-6 py-6">
              <p className="mb-4 text-sm text-zinc-400">
                {rows.length} ligne{rows.length !== 1 ? "s" : ""} détectée
                {rows.length !== 1 ? "s" : ""}. Associe les colonnes de ton fichier
                aux champs Brain.
              </p>
              <div className="space-y-3">
                {BRAIN_FIELDS.map((field) => (
                  <div key={field.key} className="grid grid-cols-2 items-center gap-4">
                    <span className="text-sm text-zinc-400">{field.label}</span>
                    <select
                      value={mapping[field.key] ?? ""}
                      onChange={(e) =>
                        setMapping((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
                    >
                      <option value="">— ignorer —</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              {!mapping.nom && (
                <p className="mt-4 text-xs text-amber-500">
                  Le champ « Nom / Prénom » doit être mappé pour continuer.
                </p>
              )}
            </div>
          )}

          {/* ── Step 3: Row selection ── */}
          {step === "preview" && (
            <div>
              <div className="flex items-center gap-3 border-b border-zinc-800/60 px-6 py-2.5">
                <button
                  onClick={() =>
                    setSelected(
                      allSelected ? new Set() : new Set(rows.map((_, i) => i)),
                    )
                  }
                  className="text-xs text-zinc-400 underline-offset-2 hover:text-white hover:underline"
                >
                  {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
                </button>
                <span className="text-zinc-700">·</span>
                <span className="text-xs text-zinc-500">
                  {selected.size} / {rows.length} ligne{rows.length !== 1 ? "s" : ""}
                </span>
              </div>
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-zinc-950">
                  <tr className="border-b border-zinc-800">
                    <th className="w-10 px-4 py-3" />
                    {BRAIN_FIELDS.filter((f) => mapping[f.key]).map((f) => (
                      <th
                        key={f.key}
                        className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
                      >
                        {f.label.replace(" *", "")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {rows.map((raw, i) => {
                    const mapped = buildRow(raw);
                    const checked = selected.has(i);
                    return (
                      <tr
                        key={i}
                        onClick={() =>
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (checked) {
                              next.delete(i);
                            } else {
                              next.add(i);
                            }
                            return next;
                          })
                        }
                        className={`cursor-pointer transition-colors ${
                          checked
                            ? "hover:bg-zinc-800/30"
                            : "opacity-40 hover:opacity-60"
                        }`}
                      >
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() =>
                              setSelected((prev) => {
                                const next = new Set(prev);
                                if (checked) next.delete(i);
                                else next.add(i);
                                return next;
                              })
                            }
                            className="h-4 w-4 rounded border-zinc-600 accent-white"
                          />
                        </td>
                        {BRAIN_FIELDS.filter((f) => mapping[f.key]).map((f) => (
                          <td key={f.key} className="px-4 py-3">
                            <span className="max-w-[140px] truncate text-zinc-300 block" title={(mapped as Record<string, string | null>)[f.key] ?? ""}>
                              {(mapped as Record<string, string | null>)[f.key] || (
                                <span className="text-zinc-700">—</span>
                              )}
                            </span>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-6 py-4">
          <div>
            {result && (
              <p className={`text-sm ${result.error ? "text-red-400" : "text-emerald-400"}`}>
                {result.error ??
                  `${result.count} prospect${result.count !== 1 ? "s" : ""} importé${result.count !== 1 ? "s" : ""} ✓`}
              </p>
            )}
            {step === "map" && (
              <button
                onClick={() => setStep("upload")}
                className="text-xs text-zinc-500 underline-offset-2 hover:text-white hover:underline"
              >
                ← Changer de fichier
              </button>
            )}
            {step === "preview" && (
              <button
                onClick={() => setStep("map")}
                className="text-xs text-zinc-500 underline-offset-2 hover:text-white hover:underline"
              >
                ← Modifier le mapping
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg px-4 py-2 text-sm text-zinc-400 transition-colors hover:text-white disabled:opacity-50"
            >
              Annuler
            </button>
            {step === "map" && (
              <button
                onClick={() => setStep("preview")}
                disabled={!mapping.nom}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Voir les données →
              </button>
            )}
            {step === "preview" && (
              <button
                onClick={handleImport}
                disabled={isPending || selected.size === 0}
                className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {isPending && <span className="animate-spin text-base leading-none">↻</span>}
                {isPending
                  ? "Import…"
                  : `Importer ${selected.size} ligne${selected.size !== 1 ? "s" : ""}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
