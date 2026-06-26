"use client";

import { useState } from "react";

import { ClientDetailModal } from "@/components/dashboard/client-detail-modal";
import type { ClientWithLinks } from "@/lib/client-types";

function initials(name: string, company: string | null): string {
  const src = (company || name || "?").trim();
  const parts = src.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function ClientCards({ clients }: { clients: ClientWithLinks[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openClient = clients.find((c) => c.id === openId) ?? null;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {clients.map((client) => {
          const title = client.entreprise || client.nom;
          const subtitle = client.entreprise ? client.nom : client.activite;
          return (
            <button
              key={client.id}
              onClick={() => setOpenId(client.id)}
              className="group flex items-start gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/20 px-5 py-4 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-800/30"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-sm font-semibold text-zinc-300">
                {initials(client.nom, client.entreprise)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">{title}</p>
                {subtitle && (
                  <p className="truncate text-sm text-zinc-500">{subtitle}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge n={client.links.filter((l) => l.category === "PROJECT").length} label="projet" />
                  <Badge n={client.links.filter((l) => l.category === "FILE").length} label="fichier" />
                  <Badge n={client.links.filter((l) => l.category === "WEB").length} label="lien web" />
                  <Badge n={client.links.filter((l) => l.category === "CONTACT").length} label="contact" />
                </div>
              </div>
              <span className="self-center text-zinc-700 transition-colors group-hover:text-zinc-400">
                →
              </span>
            </button>
          );
        })}
      </div>

      {openClient && (
        <ClientDetailModal client={openClient} onClose={() => setOpenId(null)} />
      )}
    </>
  );
}

function Badge({ n, label }: { n: number; label: string }) {
  if (n === 0) return null;
  return (
    <span className="rounded-full bg-zinc-800/80 px-2 py-0.5 text-xs text-zinc-400">
      {n} {label}
      {n !== 1 ? "s" : ""}
    </span>
  );
}
