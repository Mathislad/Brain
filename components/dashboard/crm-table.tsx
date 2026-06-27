"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { StatusBadge, STATUS_LABELS } from "@/components/dashboard/status-badge";
import { ProspectFormModal } from "@/components/dashboard/prospect-form-modal";
import { deleteProspectAction } from "@/app/actions/prospects";
import type { ProspectStatus } from "@/lib/prospect-types";
import type { Prospect } from "@/lib/prospects-db";

const TABS: { id: ProspectStatus; label: string }[] = [
  { id: "TODO", label: "Prospects" },
  { id: "IN_PROGRESS", label: "Rendez-vous" },
  { id: "DONE", label: "Client" },
];

const ALL_NICHES = "__all__";
const DO_NOT_CALL_STORAGE_KEY = "brain.crm.doNotCall.v1";

interface DoNotCallEntry {
  id: string;
  phone: string;
  normalizedPhone: string;
  note: string;
  createdAt: string;
}

const COLUMNS = [
  "Entreprise",
  "Nom / Prénom",
  "Niche",
  "Téléphone",
  "Email",
  "Site internet",
  "Prochaine action",
  "Dernière action",
  "Instagram",
  "Facebook",
  "LinkedIn",
  "Statut",
  "Provenance",
  "",
];

function ExternalLink({ url, label }: { url: string | null; label: string }) {
  if (!url) return <span className="text-zinc-700">—</span>;
  return (
    <a
      href={url.startsWith("http") ? url : `https://${url}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-zinc-400 underline-offset-2 transition-colors hover:text-white hover:underline"
    >
      {label}
    </a>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return <td className="whitespace-nowrap px-4 py-3 align-middle">{children}</td>;
}

function TextCell({ value }: { value: string | null }) {
  if (!value) return <Cell><span className="text-zinc-700">—</span></Cell>;
  return (
    <Cell>
      <p className="max-w-[160px] truncate text-sm text-zinc-300" title={value}>
        {value}
      </p>
    </Cell>
  );
}

function createLocalId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizePhone(value: string | null | undefined) {
  const digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0033")) return `0${digits.slice(4)}`;
  if (digits.startsWith("33") && digits.length === 11) return `0${digits.slice(2)}`;

  return digits;
}

function loadDoNotCallEntries(): DoNotCallEntry[] {
  try {
    const raw = localStorage.getItem(DO_NOT_CALL_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as DoNotCallEntry[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry) => ({
        ...entry,
        normalizedPhone: normalizePhone(entry.normalizedPhone || entry.phone),
        note: entry.note ?? "",
      }))
      .filter((entry) => entry.normalizedPhone);
  } catch {
    return [];
  }
}

function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span className="flex items-center gap-1">
        <button
          onClick={() =>
            startTransition(async () => {
              await deleteProspectAction(id);
              router.refresh();
            })
          }
          disabled={isPending}
          className="rounded px-1.5 py-0.5 text-xs text-red-400 hover:bg-red-950/40 disabled:opacity-50"
        >
          {isPending ? "…" : "Supprimer"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded px-1.5 py-0.5 text-xs text-zinc-500 hover:text-white"
        >
          Annuler
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded p-1 text-zinc-700 transition-colors hover:bg-zinc-800 hover:text-red-400"
      title="Supprimer"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4h6v2" />
      </svg>
    </button>
  );
}

export function CrmTable({ prospects: all }: { prospects: Prospect[] }) {
  const [activeTab, setActiveTab] = useState<ProspectStatus>("TODO");
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [doNotCallEntries, setDoNotCallEntries] = useState<DoNotCallEntry[]>([]);
  const [doNotCallLoaded, setDoNotCallLoaded] = useState(false);
  const [newBlockedPhone, setNewBlockedPhone] = useState("");
  const [newBlockedNote, setNewBlockedNote] = useState("");
  const [phoneToCheck, setPhoneToCheck] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDoNotCallEntries(loadDoNotCallEntries());
      setDoNotCallLoaded(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!doNotCallLoaded) return;
    localStorage.setItem(
      DO_NOT_CALL_STORAGE_KEY,
      JSON.stringify(doNotCallEntries),
    );
  }, [doNotCallEntries, doNotCallLoaded]);

  const niches = Array.from(
    new Set(
      all
        .map((p) => p.activite?.trim())
        .filter((niche): niche is string => Boolean(niche)),
    ),
  ).sort((a, b) => a.localeCompare(b, "fr"));
  const statusFiltered = all.filter((p) => p.status === activeTab);
  const filtered =
    selectedNiches.length === 0
      ? statusFiltered
      : statusFiltered.filter((p) => {
          const niche = p.activite?.trim();
          return niche ? selectedNiches.includes(niche) : false;
        });
  const count = (s: ProspectStatus) => all.filter((p) => p.status === s).length;
  const nicheCount = (niche: string) =>
    niche === ALL_NICHES
      ? statusFiltered.length
      : statusFiltered.filter((p) => p.activite?.trim() === niche).length;
  const selectedNicheLabel = selectedNiches.join(", ");
  const doNotCallSet = useMemo(
    () => new Set(doNotCallEntries.map((entry) => entry.normalizedPhone)),
    [doNotCallEntries],
  );
  const normalizedPhoneToCheck = normalizePhone(phoneToCheck);
  const checkMatch = normalizedPhoneToCheck
    ? doNotCallEntries.find(
        (entry) => entry.normalizedPhone === normalizedPhoneToCheck,
      )
    : undefined;

  function addDoNotCallEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedPhone = normalizePhone(newBlockedPhone);
    if (!normalizedPhone) return;

    setDoNotCallEntries((current) => {
      const existing = current.find(
        (entry) => entry.normalizedPhone === normalizedPhone,
      );

      if (existing) {
        return current.map((entry) =>
          entry.id === existing.id
            ? {
                ...entry,
                phone: newBlockedPhone.trim(),
                note: newBlockedNote.trim(),
              }
            : entry,
        );
      }

      return [
        {
          id: createLocalId(),
          phone: newBlockedPhone.trim(),
          normalizedPhone,
          note: newBlockedNote.trim(),
          createdAt: new Date().toISOString(),
        },
        ...current,
      ];
    });
    setNewBlockedPhone("");
    setNewBlockedNote("");
  }

  function removeDoNotCallEntry(id: string) {
    setDoNotCallEntries((current) => current.filter((entry) => entry.id !== id));
  }

  function toggleNiche(niche: string) {
    if (niche === ALL_NICHES) {
      setSelectedNiches([]);
      return;
    }

    setSelectedNiches((current) =>
      current.includes(niche)
        ? current.filter((selected) => selected !== niche)
        : [...current, niche],
    );
  }

  return (
    <>
      <div>
        <section className="mb-6 rounded-xl border border-zinc-800/80 bg-zinc-950/60">
          <div className="grid gap-5 p-5 xl:grid-cols-[minmax(320px,0.9fr)_minmax(420px,1.1fr)]">
            <div>
              <div className="mb-4">
                <h2 className="text-base font-medium text-white">
                  À ne pas rappeler
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Colle un numéro pour savoir s&apos;il est déjà dans la liste rouge.
                </p>
              </div>

              <label className="grid gap-1.5">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-600">
                  Vérifier un numéro
                </span>
                <input
                  value={phoneToCheck}
                  onChange={(event) => setPhoneToCheck(event.target.value)}
                  placeholder="+33 6 00 00 00 00"
                  className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-600"
                />
              </label>

              {phoneToCheck.trim() && (
                <div
                  className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
                    checkMatch
                      ? "border-red-900/50 bg-red-950/20 text-red-300"
                      : "border-emerald-900/40 bg-emerald-950/20 text-emerald-300"
                  }`}
                >
                  {checkMatch ? (
                    <p>
                      Numéro en liste rouge
                      {checkMatch.note ? ` · ${checkMatch.note}` : ""}
                    </p>
                  ) : normalizedPhoneToCheck ? (
                    <p>Numéro absent de la liste rouge.</p>
                  ) : (
                    <p>Colle un numéro valide pour lancer la vérification.</p>
                  )}
                </div>
              )}

              <form onSubmit={addDoNotCallEntry} className="mt-5 grid gap-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
                  <label className="grid gap-1.5">
                    <span className="text-xs font-medium uppercase tracking-wider text-zinc-600">
                      Ajouter un numéro
                    </span>
                    <input
                      value={newBlockedPhone}
                      onChange={(event) => setNewBlockedPhone(event.target.value)}
                      placeholder="06 00 00 00 00"
                      className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-600"
                    />
                  </label>

                  <label className="grid gap-1.5">
                    <span className="text-xs font-medium uppercase tracking-wider text-zinc-600">
                      Note
                    </span>
                    <input
                      value={newBlockedNote}
                      onChange={(event) => setNewBlockedNote(event.target.value)}
                      placeholder="Refus, mauvais contact..."
                      className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-600"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  className="h-10 rounded-lg bg-white px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
                >
                  Ajouter à la liste rouge
                </button>
              </form>
            </div>

            <div className="min-w-0">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-600">
                  Liste rouge
                </p>
                <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
                  {doNotCallEntries.length}
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto rounded-lg border border-zinc-800/80">
                {doNotCallEntries.length === 0 ? (
                  <div className="px-4 py-8 text-sm text-zinc-500">
                    Aucun numéro dans la liste rouge.
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/60">
                        {["Numéro", "Note", ""].map((heading) => (
                          <th
                            key={heading}
                            className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40">
                      {doNotCallEntries.map((entry) => (
                        <tr key={entry.id} className="bg-zinc-900/10">
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-zinc-300">
                            {entry.phone}
                          </td>
                          <td className="px-4 py-3">
                            <p className="max-w-[220px] truncate text-zinc-500">
                              {entry.note || "—"}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => removeDoNotCallEntry(entry.id)}
                              className="rounded px-2 py-1 text-xs text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-red-400"
                            >
                              Retirer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Onglets + bouton Nouveau */}
        <div className="flex items-center border-b border-zinc-800">
          <div className="flex min-w-0 flex-1 items-end overflow-x-auto">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors sm:px-5 ${
                    active
                      ? "border-white text-white"
                      : "border-transparent text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${
                      active ? "bg-zinc-700 text-zinc-300" : "bg-zinc-900 text-zinc-600"
                    }`}
                  >
                    {count(tab.id)}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="mb-1 ml-2 flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-800 px-2 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white sm:px-3"
          >
            <span className="text-base leading-none">+</span>
            <span className="hidden sm:inline">Nouveau prospect</span>
          </button>
        </div>

        {/* Sous-menu niches */}
        {niches.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-x border-zinc-800/80 bg-zinc-950 px-4 py-3">
            <span className="mr-1 text-xs font-medium uppercase tracking-wider text-zinc-600">
              Niches
            </span>
            {[ALL_NICHES, ...niches].map((niche) => {
              const active =
                niche === ALL_NICHES
                  ? selectedNiches.length === 0
                  : selectedNiches.includes(niche);
              const label = niche === ALL_NICHES ? "Toutes" : niche;
              return (
                <button
                  key={niche}
                  onClick={() => toggleNiche(niche)}
                  className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "border-white bg-white text-black"
                      : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white"
                  }`}
                >
                  <span className="truncate">{label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 ${
                      active ? "bg-black/10 text-black/70" : "bg-zinc-900 text-zinc-600"
                    }`}
                  >
                    {nicheCount(niche)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-b-xl border border-t-0 border-zinc-800/80">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-zinc-500">
                Aucun {STATUS_LABELS[activeTab].toLowerCase()}
                {selectedNiches.length > 0 ? ` dans la niche ${selectedNicheLabel}` : ""} pour
                l&apos;instant.
              </p>
              {all.length === 0 && (
                <p className="mt-1 text-xs text-zinc-600">
                  Crée un prospect ou importe une base CSV.
                </p>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60">
                  {COLUMNS.map((h, i) => (
                    <th
                      key={i}
                      className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {filtered.map((p) => {
                  const isDoNotCall = doNotCallSet.has(normalizePhone(p.telephone));

                  return (
                  <tr
                    key={p.id}
                    className="bg-zinc-900/10 transition-colors hover:bg-zinc-800/20"
                  >
                    <Cell>
                      <span className="text-sm text-zinc-300">
                        {p.entreprise || <span className="text-zinc-700">—</span>}
                      </span>
                    </Cell>

                    <Cell>
                      <span className="font-medium text-white">
                        {p.nom || <span className="text-zinc-700">—</span>}
                      </span>
                    </Cell>

                    <TextCell value={p.activite} />

                    <Cell>
                      {p.telephone ? (
                        <div className="flex flex-col gap-1">
                          <a href={`tel:${p.telephone}`} className="text-zinc-400 transition-colors hover:text-white">
                            {p.telephone}
                          </a>
                          {isDoNotCall && (
                            <span className="w-fit rounded-full border border-red-900/50 bg-red-950/20 px-2 py-0.5 text-[11px] font-medium text-red-300">
                              Liste rouge
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-700">—</span>
                      )}
                    </Cell>

                    <Cell>
                      {p.email ? (
                        <a href={`mailto:${p.email}`} className="text-zinc-400 transition-colors hover:text-white">
                          {p.email}
                        </a>
                      ) : (
                        <span className="text-zinc-700">—</span>
                      )}
                    </Cell>

                    <Cell>
                      <ExternalLink url={p.siteInternet} label="Voir" />
                    </Cell>

                    <TextCell value={p.prochaineAction} />
                    <TextCell value={p.derniereAction} />

                    <Cell>
                      <ExternalLink url={p.instagram} label="Instagram" />
                    </Cell>
                    <Cell>
                      <ExternalLink url={p.facebook} label="Facebook" />
                    </Cell>
                    <Cell>
                      <ExternalLink url={p.linkedin} label="LinkedIn" />
                    </Cell>

                    <Cell>
                      <StatusBadge recordId={p.id} status={p.status} />
                    </Cell>

                    <Cell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.provenance === "CSV"
                          ? "bg-blue-950/50 text-blue-400"
                          : "bg-zinc-800 text-zinc-400"
                      }`}>
                        {p.provenance ?? "App"}
                      </span>
                    </Cell>

                    {/* Actions */}
                    <Cell>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => setEditingProspect(p)}
                          className="rounded p-1 text-zinc-700 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                          title="Modifier"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <DeleteButton id={p.id} />
                      </div>
                    </Cell>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showCreate && (
        <ProspectFormModal
          defaultStatus={activeTab}
          onClose={() => setShowCreate(false)}
        />
      )}

      {editingProspect && (
        <ProspectFormModal
          prospect={editingProspect}
          onClose={() => setEditingProspect(null)}
        />
      )}
    </>
  );
}
