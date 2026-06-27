"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  createDocumentAction,
  updateDocumentStatusAction,
  deleteDocumentAction,
} from "@/app/actions/documents";
import {
  DOCUMENT_KINDS,
  DOCUMENT_STATUSES,
  getTemplatesByKind,
  getTemplate,
  statusMeta,
  kindLabel,
  type DocumentKind,
  type DocumentListItem,
  type DocumentStatus,
  type ProspectOption,
} from "@/lib/document-templates";

function euros(cents: number | null): string {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const TONE_CLASS: Record<string, string> = {
  neutral: "bg-zinc-800 text-zinc-300",
  info: "bg-blue-950/60 text-blue-400",
  ok: "bg-emerald-950/60 text-emerald-400",
  warn: "bg-amber-950/60 text-amber-400",
  danger: "bg-red-950/60 text-red-400",
};

const KIND_CLASS: Record<DocumentKind, string> = {
  DEVIS: "bg-purple-950/50 text-purple-300",
  FACTURE: "bg-blue-950/50 text-blue-300",
  CONTRAT: "bg-amber-950/50 text-amber-300",
};

export function DocumentsManager({
  documents,
  prospects,
}: {
  documents: DocumentListItem[];
  prospects: ProspectOption[];
}) {
  const [kindFilter, setKindFilter] = useState<DocumentKind | "ALL">("ALL");
  const [clientFilter, setClientFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter((d) => {
      if (kindFilter !== "ALL" && d.type !== kindFilter) return false;
      if (clientFilter !== "ALL" && d.clientId !== clientFilter) return false;
      if (q) {
        const hay = `${d.reference} ${d.title} ${d.clientName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [documents, kindFilter, clientFilter, search]);

  // Groupé par client, trié par date (les docs sont déjà triés date desc en amont)
  const groups = useMemo(() => {
    const map = new Map<string, { name: string; docs: DocumentListItem[] }>();
    for (const d of filtered) {
      const g = map.get(d.clientId) ?? { name: d.clientName, docs: [] };
      g.docs.push(d);
      map.set(d.clientId, g);
    }
    return Array.from(map.entries())
      .map(([clientId, g]) => ({ clientId, ...g }))
      .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [filtered]);

  const kindCount = (k: DocumentKind | "ALL") =>
    k === "ALL"
      ? documents.length
      : documents.filter((d) => d.type === k).length;

  return (
    <div className="space-y-5">
      {/* Barre d'actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 p-1">
          {(["ALL", ...DOCUMENT_KINDS.map((k) => k.id)] as const).map((k) => {
            const active = kindFilter === k;
            const label = k === "ALL" ? "Tous" : kindLabel(k);
            return (
              <button
                key={k}
                onClick={() => setKindFilter(k)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                {label}
                <span className="ml-1.5 text-xs text-zinc-600">{kindCount(k)}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setCreating(true)}
          disabled={prospects.length === 0}
          className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40"
          title={prospects.length === 0 ? "Crée d'abord un client/prospect" : undefined}
        >
          <span className="text-base leading-none">+</span>
          Nouveau document
        </button>
      </div>

      {/* Filtres secondaires */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="h-9 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-zinc-600"
        >
          <option value="ALL">Tous les clients</option>
          {prospects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher (référence, titre, client)…"
          className="h-9 min-w-[220px] flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-600"
        />
      </div>

      {/* Inventaire groupé par client */}
      {groups.length === 0 ? (
        <div className="rounded-xl border border-zinc-800/80 px-6 py-16 text-center">
          <p className="text-sm text-zinc-500">
            {documents.length === 0
              ? "Aucun document. Crée ton premier devis, facture ou contrat."
              : "Aucun document pour ce filtre."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.clientId}>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-sm font-medium text-white">{group.name}</h3>
                <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-xs text-zinc-500">
                  {group.docs.length} document{group.docs.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-zinc-800/80">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/60">
                      {["Référence", "Type", "Titre", "Montant", "Date", "Statut", ""].map(
                        (h) => (
                          <th
                            key={h}
                            className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {group.docs.map((doc) => (
                      <DocumentRow key={doc.id} doc={doc} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <CreateDocumentModal
          prospects={prospects}
          onClose={() => setCreating(false)}
        />
      )}
    </div>
  );
}

function DocumentRow({ doc }: { doc: DocumentListItem }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const meta = statusMeta(doc.status);

  function setStatus(status: DocumentStatus) {
    startTransition(async () => {
      await updateDocumentStatusAction(doc.id, status);
      router.refresh();
    });
  }

  function remove() {
    if (!confirm(`Supprimer ${doc.reference} ?`)) return;
    startTransition(async () => {
      await deleteDocumentAction(doc.id);
      router.refresh();
    });
  }

  return (
    <tr className="bg-zinc-900/10 transition-colors hover:bg-zinc-800/20">
      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-zinc-400">
        {doc.reference}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${KIND_CLASS[doc.type]}`}
        >
          {kindLabel(doc.type)}
        </span>
      </td>
      <td className="px-4 py-3 font-medium text-white">{doc.title}</td>
      <td className="whitespace-nowrap px-4 py-3 font-mono text-zinc-300">
        {euros(doc.amount)}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-zinc-400">
        {formatDate(doc.issuedAt)}
      </td>
      <td className="px-4 py-3">
        <select
          value={doc.status}
          disabled={isPending}
          onChange={(e) => setStatus(e.target.value as DocumentStatus)}
          className={`cursor-pointer rounded-full border-0 px-2 py-0.5 text-xs font-medium outline-none ${TONE_CLASS[meta.tone]}`}
        >
          {DOCUMENT_STATUSES.map((s) => (
            <option key={s.id} value={s.id} className="bg-zinc-900 text-white">
              {s.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-1">
          <a
            href={`/api/documents/${doc.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="rounded px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            PDF
          </a>
          <button
            onClick={remove}
            disabled={isPending}
            className="rounded px-2 py-1 text-xs text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-red-400 disabled:opacity-50"
          >
            Supprimer
          </button>
        </div>
      </td>
    </tr>
  );
}

const INPUT =
  "w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-600";

function defaultFieldsForTemplate(templateId: string) {
  const template = getTemplate(templateId);
  if (!template) return {};
  return Object.fromEntries(
    template.fields
      .filter((field) => field.defaultValue !== undefined)
      .map((field) => [field.key, field.defaultValue ?? ""]),
  );
}

function CreateDocumentModal({
  prospects,
  onClose,
}: {
  prospects: ProspectOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [kind, setKind] = useState<DocumentKind>("DEVIS");
  const templates = getTemplatesByKind(kind);
  const initialTemplateId = templates[0]?.id ?? "";
  const [templateId, setTemplateId] = useState(initialTemplateId);
  const [prospectId, setProspectId] = useState(prospects[0]?.id ?? "");
  const [title, setTitle] = useState(
    () => getTemplate(initialTemplateId)?.defaultTitle ?? "",
  );
  const [issuedAt, setIssuedAt] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [fields, setFields] = useState<Record<string, string>>(() =>
    defaultFieldsForTemplate(initialTemplateId),
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const template = getTemplate(templateId);

  function changeKind(k: DocumentKind) {
    setKind(k);
    const first = getTemplatesByKind(k)[0];
    setTemplateId(first?.id ?? "");
    setTitle(first?.defaultTitle ?? "");
    setFields(first ? defaultFieldsForTemplate(first.id) : {});
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!template) {
      setError("Choisis un template.");
      return;
    }
    if (!prospectId) {
      setError("Choisis un client.");
      return;
    }
    // champs requis
    for (const f of template.fields) {
      if (f.required && !fields[f.key]?.trim()) {
        setError(`Le champ « ${f.label} » est requis.`);
        return;
      }
    }

    // Montant : dérivé du champ amountFieldKey (en euros → centimes)
    let amount: number | null = null;
    if (template.amountFieldKey) {
      const raw = fields[template.amountFieldKey];
      if (raw) {
        const n = Number.parseFloat(raw.replace(",", "."));
        if (Number.isFinite(n)) amount = Math.round(n * 100);
      }
    }

    setError(null);
    startTransition(async () => {
      const res = await createDocumentAction({
        prospectId,
        type: kind,
        templateId,
        title: title.trim(),
        amount,
        issuedAt,
        data: fields,
      });
      if (!res.ok) {
        setError(res.error ?? "Erreur");
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && !isPending && onClose()}
    >
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-base font-medium text-white">Nouveau document</h2>
          <button
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-5 px-6 py-6">
            {/* Type */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                Type
              </label>
              <div className="flex gap-2">
                {DOCUMENT_KINDS.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => changeKind(k.id)}
                    className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                      kind === k.id
                        ? "border-white bg-white text-black"
                        : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white"
                    }`}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Template */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                Template
              </label>
              {templates.length === 0 ? (
                <p className="text-xs text-amber-500">
                  Aucun template pour ce type. Ajoute-en un dans
                  lib/document-templates.ts
                </p>
              ) : (
                <div className="space-y-2">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTemplateId(t.id);
                        setTitle(t.defaultTitle ?? "");
                        setFields(defaultFieldsForTemplate(t.id));
                      }}
                      className={`block w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                        templateId === t.id
                          ? "border-zinc-600 bg-zinc-800/60"
                          : "border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      <p className="text-sm text-white">{t.name}</p>
                      <p className="text-xs text-zinc-600">{t.description}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Client */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                Client / prospect
              </label>
              <select
                value={prospectId}
                onChange={(e) => setProspectId(e.target.value)}
                className={INPUT}
                disabled={isPending}
              >
                {prospects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Titre
                </label>
                <input
                  className={INPUT}
                  placeholder={template?.name ?? "Titre"}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Date
                </label>
                <input
                  type="date"
                  className={INPUT}
                  value={issuedAt}
                  onChange={(e) => setIssuedAt(e.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Champs du template */}
            {template && template.fields.length > 0 && (
              <div className="space-y-3 rounded-lg border border-zinc-800/60 bg-zinc-900/20 p-4">
                {template.fields.map((f) => (
                  <div key={f.key}>
                    <label className="mb-1 block text-xs text-zinc-500">
                      {f.label}
                      {f.required && <span className="text-red-400"> *</span>}
                    </label>
                    {f.type === "textarea" ? (
                      <textarea
                        className={`${INPUT} min-h-[70px] resize-y`}
                        placeholder={f.placeholder}
                        value={fields[f.key] ?? ""}
                        onChange={(e) =>
                          setFields((p) => ({ ...p, [f.key]: e.target.value }))
                        }
                        disabled={isPending}
                      />
                    ) : (
                      <input
                        type={f.type === "number" ? "text" : f.type}
                        inputMode={f.type === "number" ? "decimal" : undefined}
                        className={INPUT}
                        placeholder={f.placeholder}
                        value={fields[f.key] ?? ""}
                        onChange={(e) =>
                          setFields((p) => ({ ...p, [f.key]: e.target.value }))
                        }
                        disabled={isPending}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-zinc-800 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg px-4 py-2 text-sm text-zinc-400 transition-colors hover:text-white disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending || !template || !prospectId}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {isPending ? "Création…" : "Créer le document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
