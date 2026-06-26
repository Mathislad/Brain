"use client";

import { useState } from "react";
import { CsvImportModal } from "@/components/dashboard/csv-import-modal";

export function CsvImportButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
      >
        <span className="text-base leading-none">↑</span>
        Importer CSV
      </button>

      {open && <CsvImportModal onClose={() => setOpen(false)} />}
    </>
  );
}
