"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  addClientLinkAction,
  deleteClientLinkAction,
} from "@/app/actions/clients";
import { ClientBillingSection } from "@/components/dashboard/client-billing-section";
import type {
  ClientWithLinks,
  ClientLinkCategory,
} from "@/lib/client-types";

type LinkRecord = ClientWithLinks["links"][number];

const SECTIONS: {
  category: ClientLinkCategory;
  title: string;
  icon: string;
  labelPlaceholder: string;
  valuePlaceholder: string;
  hint?: string;
}[] = [
  {
    category: "PROJECT",
    title: "Projets",
    icon: "📁",
    labelPlaceholder: "Site v2, Identité visuelle…",
    valuePlaceholder: "https://… ou /Users/…/projet",
  },
  {
    category: "FILE",
    title: "Fichiers bureau",
    icon: "🗂️",
    labelPlaceholder: "Dossier livrables…",
    valuePlaceholder: "/Users/mathis/Desktop/Client/…",
    hint: "Chemin local — utilisez « Copier » (les navigateurs bloquent l'ouverture directe).",
  },
  {
    category: "WEB",
    title: "Liens web",
    icon: "🔗",
    labelPlaceholder: "Drive, Figma, Notion…",
    valuePlaceholder: "https://…",
  },
  {
    category: "CONTACT",
    title: "Contacts",
    icon: "👤",
    labelPlaceholder: "Responsable, comptable…",
    valuePlaceholder: "email ou téléphone",
  },
];

function hrefFor(category: ClientLinkCategory, value: string): string | null {
  const v = value.trim();
  if (category === "WEB") return v.startsWith("http") ? v : `https://${v}`;
  if (category === "FILE") return v.startsWith("file://") ? v : `file://${v}`;
  if (category === "CONTACT") {
    if (v.includes("@")) return `mailto:${v}`;
    if (/^[+\d][\d\s().-]{4,}$/.test(v)) return `tel:${v.replace(/\s/g, "")}`;
    return null;
  }
  // PROJECT
  if (v.startsWith("http")) return v;
  if (v.startsWith("/") || v.startsWith("~")) return `file://${v}`;
  return null;
}

const INPUT =
  "w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-600";

export function ClientDetailModal({
  client,
  onClose,
}: {
  client: ClientWithLinks;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 px-6 py-5">
          <div>
            <h2 className="text-lg font-medium text-white">
              {client.entreprise || client.nom}
            </h2>
            {client.entreprise && (
              <p className="text-sm text-zinc-500">{client.nom}</p>
            )}
            {client.activite && (
              <p className="mt-0.5 text-xs text-zinc-600">{client.activite}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6">
          {/* Coordonnées (depuis le CRM) */}
          <Coordonnees client={client} />

          {/* Facturation */}
          <ClientBillingSection client={client} />

          {/* Sections de liens */}
          {SECTIONS.map((section) => (
            <LinkSection
              key={section.category}
              prospectId={client.id}
              section={section}
              links={client.links.filter((l) => l.category === section.category)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Coordonnees({ client }: { client: ClientWithLinks }) {
  const rows: { label: string; value: string | null; href?: string | null }[] = [
    { label: "Email", value: client.email, href: client.email ? `mailto:${client.email}` : null },
    { label: "Téléphone", value: client.telephone, href: client.telephone ? `tel:${client.telephone}` : null },
    {
      label: "Site",
      value: client.siteInternet,
      href: client.siteInternet
        ? client.siteInternet.startsWith("http")
          ? client.siteInternet
          : `https://${client.siteInternet}`
        : null,
    },
    { label: "Instagram", value: client.instagram, href: client.instagram },
    { label: "LinkedIn", value: client.linkedin, href: client.linkedin },
  ].filter((r) => r.value);

  if (rows.length === 0) return null;

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-600">
        Coordonnées
      </h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-xl border border-zinc-800/60 bg-zinc-900/20 px-4 py-3">
        {rows.map((r) => (
          <div key={r.label} className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-zinc-600">
              {r.label}
            </p>
            {r.href ? (
              <a
                href={r.href}
                target={r.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="block truncate text-sm text-zinc-300 transition-colors hover:text-white"
              >
                {r.value}
              </a>
            ) : (
              <p className="truncate text-sm text-zinc-300">{r.value}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function LinkSection({
  prospectId,
  section,
  links,
}: {
  prospectId: string;
  section: (typeof SECTIONS)[number];
  links: LinkRecord[];
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-600">
          <span aria-hidden>{section.icon}</span>
          {section.title}
          {links.length > 0 && (
            <span className="rounded-full bg-zinc-800 px-1.5 text-[10px] text-zinc-400">
              {links.length}
            </span>
          )}
        </h3>
        <button
          onClick={() => setAdding((v) => !v)}
          className="text-xs text-zinc-500 transition-colors hover:text-white"
        >
          {adding ? "Annuler" : "+ Ajouter"}
        </button>
      </div>

      {section.hint && links.length === 0 && !adding && (
        <p className="mb-2 text-xs text-zinc-700">{section.hint}</p>
      )}

      <div className="space-y-1.5">
        {links.map((link) => (
          <LinkRow key={link.id} link={link} category={section.category} />
        ))}

        {links.length === 0 && !adding && (
          <p className="rounded-lg border border-dashed border-zinc-800/80 px-3 py-2.5 text-xs text-zinc-600">
            Aucun {section.title.toLowerCase()} pour l&apos;instant.
          </p>
        )}

        {adding && (
          <AddLinkForm
            prospectId={prospectId}
            category={section.category}
            labelPlaceholder={section.labelPlaceholder}
            valuePlaceholder={section.valuePlaceholder}
            onDone={() => setAdding(false)}
          />
        )}
      </div>
    </div>
  );
}

function LinkRow({
  link,
  category,
}: {
  link: LinkRecord;
  category: ClientLinkCategory;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const href = hrefFor(category, link.value);
  const showCopy = category === "FILE" || category === "PROJECT";

  function copy() {
    navigator.clipboard.writeText(link.value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function remove() {
    startTransition(async () => {
      await deleteClientLinkAction(link.id);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/30 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-200">{link.label}</p>
        {href ? (
          <a
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="block truncate text-xs text-zinc-500 underline-offset-2 transition-colors hover:text-zinc-300 hover:underline"
          >
            {link.value}
          </a>
        ) : (
          <p className="truncate text-xs text-zinc-500">{link.value}</p>
        )}
      </div>

      {showCopy && (
        <button
          onClick={copy}
          className="shrink-0 rounded px-1.5 py-0.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          title="Copier le chemin"
        >
          {copied ? "Copié ✓" : "Copier"}
        </button>
      )}
      <button
        onClick={remove}
        disabled={isPending}
        className="shrink-0 rounded p-1 text-zinc-700 transition-colors hover:bg-zinc-800 hover:text-red-400 disabled:opacity-50"
        title="Supprimer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      </button>
    </div>
  );
}

function AddLinkForm({
  prospectId,
  category,
  labelPlaceholder,
  valuePlaceholder,
  onDone,
}: {
  prospectId: string;
  category: ClientLinkCategory;
  labelPlaceholder: string;
  valuePlaceholder: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim() || !value.trim()) {
      setError("Libellé et valeur requis.");
      return;
    }
    setError(null);
    startTransition(async () => {
      await addClientLinkAction({ prospectId, category, label, value });
      router.refresh();
      onDone();
    });
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-2 rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-3"
    >
      <input
        className={INPUT}
        placeholder={labelPlaceholder}
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        disabled={isPending}
        autoFocus
      />
      <input
        className={INPUT}
        placeholder={valuePlaceholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={isPending}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          disabled={isPending}
          className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:text-white disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {isPending ? "Ajout…" : "Ajouter"}
        </button>
      </div>
    </form>
  );
}
