"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  logInteractionAction,
  updateProspectAction,
  updateProspectStatusAction,
} from "@/app/actions/prospects";
import { ProspectFormModal } from "@/components/dashboard/prospect-form-modal";
import { STATUS_LABELS } from "@/components/dashboard/status-badge";
import type { ProspectStatus } from "@/lib/prospect-types";
import type { Prospect } from "@/lib/prospects-db";

const STATUS_OPTIONS: Array<{ id: ProspectStatus; label: string }> = [
  { id: "TODO", label: "Prospect" },
  { id: "IN_PROGRESS", label: "Rendez-vous" },
  { id: "DONE", label: "Client" },
];

const ALL_STATUSES = "__all__";
const ALL_NICHES = "__all__";

import {
  addDoNotCallAction,
  getDoNotCallListAction,
  removeDoNotCallByPhoneAction,
} from "@/app/actions/do-not-call";

function normalizePhone(value: string | null | undefined) {
  const digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0033")) return `0${digits.slice(4)}`;
  if (digits.startsWith("33") && digits.length === 11) return `0${digits.slice(2)}`;
  return digits;
}

type QuickFields = {
  derniereAction: string;
  prochaineAction: string;
  note: string;
};

function TextValue({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
        {label}
      </p>
      <p className="mt-1 min-h-5 text-sm text-zinc-300">
        {value || <span className="text-zinc-700">—</span>}
      </p>
    </div>
  );
}

function ExternalLink({ value, label }: { value: string | null; label: string }) {
  if (!value) return <span className="text-zinc-700">—</span>;

  return (
    <a
      href={value.startsWith("http") ? value : `https://${value}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-zinc-300 underline-offset-4 transition-colors hover:text-white hover:underline"
    >
      {label}
    </a>
  );
}

function initialQuickFields(prospect: Prospect | null): QuickFields {
  return {
    derniereAction: prospect?.derniereAction ?? "",
    prochaineAction: prospect?.prochaineAction ?? "",
    note: prospect?.note ?? "",
  };
}

export function ColdCallSession({ prospects }: { prospects: Prospect[] }) {
  const router = useRouter();
  const [items, setItems] = useState(prospects);
  const [selectedStatus, setSelectedStatus] = useState<ProspectStatus | typeof ALL_STATUSES>(
    ALL_STATUSES,
  );
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [sessionIds, setSessionIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [quickFields, setQuickFields] = useState<QuickFields>(
    initialQuickFields(items[0] ?? null),
  );
  const [error, setError] = useState<string | null>(null);
  const [doNotCallSet, setDoNotCallSet] = useState<Set<string>>(new Set());
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getDoNotCallListAction().then((entries) => {
      setDoNotCallSet(new Set(entries.map((e) => e.normalizedPhone)));
    });
  }, []);

  const niches = useMemo(
    () =>
      Array.from(
        new Set(
          items
            .map((prospect) => prospect.activite?.trim())
            .filter((niche): niche is string => Boolean(niche)),
        ),
      ).sort((a, b) => a.localeCompare(b, "fr")),
    [items],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((prospect) => {
      if (!prospect.telephone?.trim()) return false;
      if (selectedStatus !== ALL_STATUSES && prospect.status !== selectedStatus) {
        return false;
      }
      if (selectedNiches.length > 0) {
        const niche = prospect.activite?.trim();
        if (!niche || !selectedNiches.includes(niche)) return false;
      }
      if (!normalizedQuery) return true;

      return [
        prospect.nom,
        prospect.entreprise,
        prospect.email,
        prospect.telephone,
        prospect.activite,
        prospect.ville,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery));
    });
  }, [items, query, selectedNiches, selectedStatus]);

  const sessionProspects = sessionIds
    .map((id) => items.find((prospect) => prospect.id === id))
    .filter((prospect): prospect is Prospect => Boolean(prospect));
  const currentProspect = sessionProspects[currentIndex] ?? null;
  const currentIsDoNotCall = currentProspect
    ? doNotCallSet.has(normalizePhone(currentProspect.telephone))
    : false;
  const sessionStarted = sessionIds.length > 0;
  const progressCurrent = sessionStarted ? Math.min(currentIndex + 1, sessionProspects.length) : 0;

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

  function startSession() {
    const ids = filtered.map((prospect) => prospect.id);
    setSessionIds(ids);
    setCurrentIndex(0);
    setError(null);
    setQuickFields(initialQuickFields(filtered[0] ?? null));
  }

  function goTo(index: number) {
    const nextIndex = Math.min(Math.max(index, 0), sessionProspects.length - 1);
    setCurrentIndex(nextIndex);
    setQuickFields(initialQuickFields(sessionProspects[nextIndex] ?? null));
    setError(null);
  }

  // Changement de prospect : ouvre la fenêtre d'actualisation avant de bouger.
  function requestNav(index: number) {
    const clamped = Math.min(Math.max(index, 0), sessionProspects.length - 1);
    if (clamped === currentIndex) return;
    setPendingIndex(clamped);
  }

  // Enregistre l'interaction (incrémente le compteur) puis navigue.
  function logAndGo() {
    if (!currentProspect || pendingIndex === null) return;
    const target = pendingIndex;
    const patch = {
      derniereAction: quickFields.derniereAction || null,
      prochaineAction: quickFields.prochaineAction || null,
      note: quickFields.note || null,
    };
    startTransition(async () => {
      try {
        const { interactions } = await logInteractionAction(currentProspect.id, patch);
        patchLocalProspect(currentProspect.id, { ...patch, interactions });
        setPendingIndex(null);
        goTo(target);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Impossible d'enregistrer l'interaction.");
      }
    });
  }

  function skipAndGo() {
    if (pendingIndex === null) return;
    const target = pendingIndex;
    setPendingIndex(null);
    goTo(target);
  }

  function confirmQuit() {
    if (confirm("Êtes-vous sûr d'avoir terminé votre session ?")) {
      setSessionIds([]);
      setCurrentIndex(0);
      setPendingIndex(null);
      setError(null);
    }
  }

  function patchLocalProspect(id: string, patch: Partial<Prospect>) {
    setItems((current) =>
      current.map((prospect) =>
        prospect.id === id ? { ...prospect, ...patch } : prospect,
      ),
    );
  }

  function changeStatus(status: ProspectStatus) {
    if (!currentProspect) return;
    const previousStatus = currentProspect.status;
    patchLocalProspect(currentProspect.id, { status });
    setError(null);

    startTransition(async () => {
      try {
        await updateProspectStatusAction(currentProspect.id, status);
        router.refresh();
      } catch (e) {
        patchLocalProspect(currentProspect.id, { status: previousStatus });
        setError(e instanceof Error ? e.message : "Impossible de changer le statut.");
      }
    });
  }

  function toggleDoNotCall() {
    if (!currentProspect?.telephone?.trim()) return;
    const phone = currentProspect.telephone;
    const normalized = normalizePhone(phone);
    const wasListed = doNotCallSet.has(normalized);

    // Mise à jour optimiste
    setDoNotCallSet((current) => {
      const next = new Set(current);
      if (wasListed) next.delete(normalized);
      else next.add(normalized);
      return next;
    });
    setError(null);

    startTransition(async () => {
      try {
        if (wasListed) {
          await removeDoNotCallByPhoneAction(phone);
        } else {
          await addDoNotCallAction(phone, currentProspect.entreprise || currentProspect.nom || "");
        }
        router.refresh();
      } catch (e) {
        // Rollback
        setDoNotCallSet((current) => {
          const next = new Set(current);
          if (wasListed) next.add(normalized);
          else next.delete(normalized);
          return next;
        });
        setError(e instanceof Error ? e.message : "Impossible de mettre à jour la liste rouge.");
      }
    });
  }

  function saveQuickFields() {
    if (!currentProspect) return;
    const previous = {
      derniereAction: currentProspect.derniereAction,
      prochaineAction: currentProspect.prochaineAction,
      note: currentProspect.note,
    };
    const patch = {
      derniereAction: quickFields.derniereAction || null,
      prochaineAction: quickFields.prochaineAction || null,
      note: quickFields.note || null,
    };

    patchLocalProspect(currentProspect.id, patch);
    setError(null);

    startTransition(async () => {
      try {
        await updateProspectAction(currentProspect.id, {
          nom: currentProspect.nom,
          entreprise: currentProspect.entreprise,
          email: currentProspect.email,
          telephone: currentProspect.telephone,
          siteInternet: currentProspect.siteInternet,
          instagram: currentProspect.instagram,
          facebook: currentProspect.facebook,
          linkedin: currentProspect.linkedin,
          activite: currentProspect.activite,
          ville: currentProspect.ville,
          status: currentProspect.status,
          ...patch,
        });
        router.refresh();
      } catch (e) {
        patchLocalProspect(currentProspect.id, previous);
        setError(e instanceof Error ? e.message : "Impossible d'enregistrer les notes.");
      }
    });
  }

  return (
    <>
      <div className="space-y-5">
        <section className="border-b border-zinc-800 pb-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[220px_1fr]">
                <select
                  value={selectedStatus}
                  onChange={(event) =>
                    setSelectedStatus(
                      event.target.value as ProspectStatus | typeof ALL_STATUSES,
                    )
                  }
                  className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-zinc-600"
                >
                  <option value={ALL_STATUSES}>Tous les tableaux</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Rechercher nom, entreprise, téléphone..."
                  className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-600"
                />
              </div>

              {niches.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {[ALL_NICHES, ...niches].map((niche) => {
                    const active =
                      niche === ALL_NICHES
                        ? selectedNiches.length === 0
                        : selectedNiches.includes(niche);
                    const label = niche === ALL_NICHES ? "Toutes les niches" : niche;

                    return (
                      <button
                        key={niche}
                        type="button"
                        onClick={() => toggleNiche(niche)}
                        className={`inline-flex max-w-full items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          active
                            ? "border-white bg-white text-black"
                            : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white"
                        }`}
                      >
                        <span className="truncate">{label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={startSession}
              disabled={filtered.length === 0}
              className="h-10 self-start rounded-lg bg-white px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Lancer {filtered.length}
            </button>
          </div>
        </section>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-zinc-800/80 py-14 text-center">
            <p className="text-sm text-zinc-500">Aucun numéro ne correspond aux filtres.</p>
          </div>
        ) : !sessionStarted ? (
          <div className="overflow-x-auto rounded-xl border border-zinc-800/80">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60">
                  {["Prospect", "Niche", "Téléphone", "Tableau", "Dernière action"].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {filtered.slice(0, 80).map((prospect) => (
                  <tr
                    key={prospect.id}
                    className="bg-zinc-900/10 transition-colors hover:bg-zinc-800/20"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{prospect.nom || "—"}</p>
                      <p className="text-xs text-zinc-500">{prospect.entreprise || "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {prospect.activite || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`tel:${prospect.telephone}`}
                        className="font-mono text-zinc-300 transition-colors hover:text-white"
                      >
                        {prospect.telephone}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {STATUS_LABELS[prospect.status]}
                    </td>
                    <td className="max-w-[240px] px-4 py-3">
                      <p className="truncate text-xs text-zinc-500">
                        {prospect.derniereAction || "—"}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : currentProspect ? (
          <section className="grid min-h-[620px] gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800 pb-5">
                <div>
                  <p className="text-xs uppercase tracking-widest text-zinc-600">
                    {progressCurrent} / {sessionProspects.length}
                  </p>
                  <h2 className="mt-2 text-3xl font-medium tracking-tight text-white">
                    {currentProspect.nom || "Sans nom"}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    {currentProspect.entreprise || "Entreprise non renseignée"}
                  </p>
                  <span className="mt-2 inline-flex items-center rounded-full border border-zinc-800 bg-zinc-950/60 px-2.5 py-0.5 text-xs text-zinc-400">
                    {currentProspect.interactions} interaction
                    {currentProspect.interactions !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProspect(currentProspect)}
                    className="h-9 rounded-lg border border-zinc-800 px-3 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
                  >
                    Modifier
                  </button>
                  <a
                    href={`tel:${currentProspect.telephone}`}
                    className="inline-flex h-9 items-center rounded-lg bg-white px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
                  >
                    Appeler
                  </a>
                  <button
                    type="button"
                    onClick={toggleDoNotCall}
                    disabled={isPending || !currentProspect.telephone?.trim()}
                    className={`h-9 rounded-lg border px-3 text-sm font-medium transition-colors disabled:opacity-50 ${
                      currentIsDoNotCall
                        ? "border-red-900/50 bg-red-950/40 text-red-300 hover:bg-red-950/60"
                        : "border-zinc-800 text-zinc-400 hover:border-red-800 hover:text-red-300"
                    }`}
                  >
                    {currentIsDoNotCall ? "Retirer de la liste rouge" : "Ne pas rappeler"}
                  </button>
                </div>
              </div>

              {currentIsDoNotCall && (
                <div className="mt-5 flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-2.5">
                  <span aria-hidden>⛔</span>
                  <p className="text-sm font-medium text-red-400">
                    Liste rouge — ne pas rappeler ce numéro.
                  </p>
                </div>
              )}

              <div className="grid gap-5 py-5 md:grid-cols-3">
                <TextValue label="Téléphone" value={currentProspect.telephone} />
                <TextValue label="Email" value={currentProspect.email} />
                <TextValue label="Niche" value={currentProspect.activite} />
                <TextValue label="Ville" value={currentProspect.ville} />
                <TextValue label="Source" value={currentProspect.provenance ?? "App"} />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                    Site
                  </p>
                  <div className="mt-1">
                    <ExternalLink value={currentProspect.siteInternet} label="Ouvrir" />
                  </div>
                </div>
              </div>

              <div className="border-y border-zinc-800 py-5">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                  Tableau
                </p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((status) => {
                    const active = currentProspect.status === status.id;
                    return (
                      <button
                        key={status.id}
                        type="button"
                        onClick={() => changeStatus(status.id)}
                        disabled={isPending}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                          active
                            ? "border-white bg-white text-black"
                            : "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"
                        }`}
                      >
                        {status.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 py-5 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Dernière action
                  </span>
                  <input
                    value={quickFields.derniereAction}
                    onChange={(event) =>
                      setQuickFields((current) => ({
                        ...current,
                        derniereAction: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-600"
                    placeholder="Appel effectué, pas de réponse..."
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Prochaine action
                  </span>
                  <input
                    value={quickFields.prochaineAction}
                    onChange={(event) =>
                      setQuickFields((current) => ({
                        ...current,
                        prochaineAction: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-600"
                    placeholder="Rappeler demain, envoyer un devis..."
                  />
                </label>
                <label className="space-y-1.5 md:col-span-2">
                  <span className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Note
                  </span>
                  <textarea
                    value={quickFields.note}
                    onChange={(event) =>
                      setQuickFields((current) => ({
                        ...current,
                        note: event.target.value,
                      }))
                    }
                    className="min-h-28 w-full resize-y rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-600"
                    placeholder="Contexte, objections, infos utiles..."
                  />
                </label>
              </div>

              {error && (
                <p role="alert" className="mb-4 text-sm text-red-400">
                  {error}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => requestNav(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  className="h-10 rounded-lg border border-zinc-800 px-4 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Précédent
                </button>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={saveQuickFields}
                    disabled={isPending}
                    className="h-10 rounded-lg border border-zinc-800 px-4 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white disabled:opacity-50"
                  >
                    {isPending ? "Enregistrement..." : "Enregistrer"}
                  </button>
                  <button
                    type="button"
                    onClick={() => requestNav(currentIndex + 1)}
                    disabled={currentIndex >= sessionProspects.length - 1}
                    className="h-10 rounded-lg bg-white px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </div>

            <aside className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-widest text-zinc-600">
                  Session
                </p>
                <button
                  type="button"
                  onClick={confirmQuit}
                  className="text-xs text-zinc-500 underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  Quitter
                </button>
              </div>
              <div className="space-y-2">
                {sessionProspects.map((prospect, index) => {
                  const active = index === currentIndex;
                  return (
                    <button
                      key={prospect.id}
                      type="button"
                      onClick={() => goTo(index)}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                        active
                          ? "border-white bg-white text-black"
                          : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-600 hover:text-white"
                      }`}
                    >
                      <span className="block truncate text-sm font-medium">
                        {prospect.nom || "Sans nom"}
                      </span>
                      <span className="mt-0.5 block truncate text-xs opacity-70">
                        {prospect.telephone}
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>
          </section>
        ) : null}
      </div>

      {pendingIndex !== null && currentProspect && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setPendingIndex(null)}
        >
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <p className="text-xs uppercase tracking-widest text-zinc-600">
              Actualiser avant de changer de prospect
            </p>
            <h3 className="mt-1 text-lg font-medium text-white">
              {currentProspect.nom || "Sans nom"}
            </h3>
            <p className="mt-0.5 text-sm text-zinc-500">
              {currentProspect.interactions} interaction
              {currentProspect.interactions !== 1 ? "s" : ""} enregistrée
              {currentProspect.interactions !== 1 ? "s" : ""} · l&apos;enregistrement en ajoute une.
            </p>

            <div className="mt-5 grid gap-3">
              <label className="space-y-1.5">
                <span className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Dernière action
                </span>
                <input
                  value={quickFields.derniereAction}
                  onChange={(event) =>
                    setQuickFields((current) => ({ ...current, derniereAction: event.target.value }))
                  }
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-600"
                  placeholder="Appel effectué, message laissé..."
                  autoFocus
                />
              </label>
              <label className="space-y-1.5">
                <span className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Prochaine action
                </span>
                <input
                  value={quickFields.prochaineAction}
                  onChange={(event) =>
                    setQuickFields((current) => ({ ...current, prochaineAction: event.target.value }))
                  }
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-600"
                  placeholder="Rappeler demain, envoyer un devis..."
                />
              </label>
              <label className="space-y-1.5">
                <span className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Note
                </span>
                <textarea
                  value={quickFields.note}
                  onChange={(event) =>
                    setQuickFields((current) => ({ ...current, note: event.target.value }))
                  }
                  className="min-h-24 w-full resize-y rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-600"
                  placeholder="Contexte, objections, infos utiles..."
                />
              </label>
            </div>

            {error && (
              <p role="alert" className="mt-3 text-sm text-red-400">
                {error}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setPendingIndex(null)}
                disabled={isPending}
                className="h-10 rounded-lg px-4 text-sm text-zinc-400 transition-colors hover:text-white disabled:opacity-50"
              >
                Annuler
              </button>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={skipAndGo}
                  disabled={isPending}
                  className="h-10 rounded-lg border border-zinc-800 px-4 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white disabled:opacity-50"
                >
                  Passer sans enregistrer
                </button>
                <button
                  type="button"
                  onClick={logAndGo}
                  disabled={isPending}
                  className="h-10 rounded-lg bg-white px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 disabled:opacity-50"
                >
                  {isPending ? "Enregistrement..." : "Enregistrer et continuer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingProspect && (
        <ProspectFormModal
          prospect={editingProspect}
          onClose={() => {
            setEditingProspect(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
