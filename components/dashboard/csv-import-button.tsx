"use client";

import { useState, useTransition } from "react";
import { CsvImportModal } from "@/components/dashboard/csv-import-modal";
import {
  getCsvImportHistoryAction,
  rollbackCsvImportAction,
  type CsvImportHistoryItem,
} from "@/app/actions/prospects";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function CsvImportButton({
  initialImports = [],
}: {
  initialImports?: CsvImportHistoryItem[];
}) {
  const [open, setOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [imports, setImports] = useState(initialImports);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function refreshHistory() {
    startTransition(async () => {
      setImports(await getCsvImportHistoryAction());
    });
  }

  function rollbackImport(item: CsvImportHistoryItem) {
    const label = item.fileName || "cet import CSV";
    if (!confirm(`Annuler ${label} ? Les prospects encore liés à cet import seront supprimés.`)) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const result = await rollbackCsvImportAction(item.id);
      if (result.error) {
        setMessage(result.error);
      } else {
        setMessage(`${result.deleted} prospect${result.deleted !== 1 ? "s" : ""} supprimé${result.deleted !== 1 ? "s" : ""}.`);
      }
      setImports(await getCsvImportHistoryAction());
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          onClick={() => setHistoryOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
        >
          Historique CSV
        </button>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
        >
          <span className="text-base leading-none">↑</span>
          Importer CSV
        </button>
      </div>

      {open && (
        <CsvImportModal
          onClose={() => setOpen(false)}
          onImported={refreshHistory}
        />
      )}

      {historyOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && !isPending && setHistoryOpen(false)}
        >
          <div className="flex max-h-[82vh] w-full max-w-2xl flex-col rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
              <div>
                <h2 className="text-base font-medium text-white">Historique des imports CSV</h2>
                <p className="mt-1 text-xs text-zinc-600">
                  Annule un import pour supprimer les prospects créés par ce fichier.
                </p>
              </div>
              <button
                onClick={() => setHistoryOpen(false)}
                disabled={isPending}
                className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {message && (
                <p className="mb-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-300">
                  {message}
                </p>
              )}

              {imports.length === 0 ? (
                <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-8 text-center text-sm text-zinc-500">
                  Aucun import CSV enregistré pour le moment.
                </p>
              ) : (
                <div className="space-y-2">
                  {imports.map((item) => {
                    const reverted = item.status === "REVERTED";
                    return (
                      <article
                        key={item.id}
                        className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-medium text-white">
                              {item.fileName || "Import CSV"}
                            </h3>
                            <p className="mt-1 text-xs text-zinc-500">
                              {formatDate(item.createdAt)} · {item.importedCount} importé
                              {item.importedCount !== 1 ? "s" : ""} · {item.remainingProspects} restant
                              {item.remainingProspects !== 1 ? "s" : ""}
                            </p>
                            {reverted && (
                              <p className="mt-1 text-xs text-amber-400">
                                Annulé · {item.revertedCount} supprimé
                                {item.revertedCount !== 1 ? "s" : ""}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => rollbackImport(item)}
                            disabled={isPending || reverted || item.remainingProspects === 0}
                            className="rounded-lg border border-red-900/50 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Annuler l&apos;import
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-zinc-800 px-6 py-4">
              <button
                type="button"
                onClick={refreshHistory}
                disabled={isPending}
                className="rounded-lg px-4 py-2 text-sm text-zinc-400 transition-colors hover:text-white disabled:opacity-50"
              >
                {isPending ? "Actualisation..." : "Actualiser"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
