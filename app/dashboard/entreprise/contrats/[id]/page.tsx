"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import {
  deleteContratAction,
  getContratAction,
  updateContratNotesAction,
  updateContratStatutAction,
  type ContratStatut,
} from "@/app/actions/contrats";

const STATUT_STYLES: Record<string, string> = {
  brouillon: "border-zinc-700 bg-zinc-800 text-zinc-300",
  envoye:    "border-blue-900/50 bg-blue-950/40 text-blue-300",
  signe:     "border-emerald-900/50 bg-emerald-950/40 text-emerald-300",
  archive:   "border-yellow-900/50 bg-yellow-950/40 text-yellow-300",
};

const STATUT_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  envoye:    "Envoyé",
  signe:     "Signé",
  archive:   "Archivé",
};

const SERVICE_LABELS: Record<string, string> = {
  site: "Création de site internet",
  seo: "Référencement SEO local",
  ads: "Google Ads & Meta Ads",
  fidelite: "Carte de fidélité digitale",
  ia: "Agent téléphonique IA",
  social: "Gestion réseaux sociaux",
};

type Contrat = Awaited<ReturnType<typeof getContratAction>>;

export default function ContratDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contrat, setContrat] = useState<Contrat>(null);
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    getContratAction(id).then(c => {
      setContrat(c);
      setNotes(c?.notes ?? "");
    });
  }, [id]);

  if (!contrat) {
    return (
      <div className="px-4 py-8 sm:px-8 sm:py-10">
        <p className="text-sm text-zinc-500">Chargement…</p>
      </div>
    );
  }

  const fd = contrat.formData as Record<string, unknown>;

  function changeStatut(statut: ContratStatut) {
    startTransition(async () => {
      await updateContratStatutAction(id, statut);
      setContrat(prev => prev ? { ...prev, statut } : prev);
    });
  }

  function saveNotes() {
    startTransition(async () => {
      await updateContratNotesAction(id, notes);
    });
  }

  function doDelete() {
    startTransition(async () => {
      await deleteContratAction(id);
      router.push("/dashboard/entreprise/contrats");
    });
  }

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-600">
            <Link href="/dashboard/entreprise/contrats" className="hover:text-zinc-400">Contrats</Link>
            {" / "}
            {contrat.clientNom}
          </p>
          <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">{contrat.clientNom}</h1>
          <div className="mt-2 flex items-center gap-2">
            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUT_STYLES[contrat.statut]}`}>
              {STATUT_LABELS[contrat.statut]}
            </span>
            <span className="text-xs text-zinc-600">
              Créé le {new Intl.DateTimeFormat("fr-FR").format(contrat.createdAt)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/contrats/${contrat.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="h-9 rounded-lg border border-zinc-700 px-4 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white disabled:opacity-50"
          >
            Télécharger PDF
          </a>
          {confirmDelete ? (
            <>
              <button type="button" onClick={doDelete} disabled={isPending} className="h-9 rounded-lg border border-red-900/60 px-4 text-sm text-red-400 transition-colors hover:bg-red-950/30 disabled:opacity-50">
                Confirmer suppression
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="h-9 rounded-lg border border-zinc-800 px-4 text-sm text-zinc-500 transition-colors hover:text-white">
                Annuler
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className="h-9 rounded-lg border border-zinc-800 px-4 text-sm text-zinc-600 transition-colors hover:border-red-900/60 hover:text-red-400">
              Supprimer
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main */}
        <div className="grid gap-5">
          {/* Statut */}
          <section className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-5">
            <h2 className="mb-4 text-sm font-medium text-zinc-300">Changer le statut</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(["brouillon","envoye","signe","archive"] as ContratStatut[]).map(s => (
                <button
                  key={s}
                  type="button"
                  disabled={isPending}
                  onClick={() => changeStatut(s)}
                  className={`h-9 rounded-lg border px-3 text-xs font-medium transition-colors disabled:opacity-50 ${
                    contrat.statut === s
                      ? STATUT_STYLES[s]
                      : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                  }`}
                >
                  {STATUT_LABELS[s]}
                </button>
              ))}
            </div>
          </section>

          {/* Infos client */}
          <section className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-5">
            <h2 className="mb-4 text-sm font-medium text-zinc-300">Client</h2>
            <div className="divide-y divide-zinc-800/40">
              {[
                ["Raison sociale", String(fd.client_nom ?? "")],
                ["Forme juridique", String(fd.client_forme_juridique ?? "")],
                ["SIRET", String(fd.client_siret ?? "")],
                ["Représentant", String(fd.client_representant ?? "")],
                ["Email", String(fd.client_email ?? "")],
                ["Téléphone", String(fd.client_telephone ?? "")],
                ["Adresse", String(fd.client_adresse ?? "")],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-2.5">
                  <span className="text-xs text-zinc-500">{label}</span>
                  <span className="text-right text-sm text-zinc-300">{value || "—"}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Services */}
          <section className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-5">
            <h2 className="mb-4 text-sm font-medium text-zinc-300">Services</h2>
            <div className="divide-y divide-zinc-800/40">
              {contrat.services.map(s => {
                const priceKey = `prix_${s}`;
                return (
                  <div key={s} className="flex justify-between gap-4 py-2.5">
                    <span className="text-sm text-zinc-300">{SERVICE_LABELS[s] ?? s}</span>
                    <span className="text-sm font-medium text-white">{String(fd[priceKey] ?? "—")}</span>
                  </div>
                );
              })}
              {contrat.total && (
                <div className="flex justify-between gap-4 py-2.5">
                  <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Total mensuel</span>
                  <span className="text-base font-semibold text-white">{contrat.total}</span>
                </div>
              )}
            </div>
          </section>

          {/* Notes */}
          <section className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-5">
            <h2 className="mb-4 text-sm font-medium text-zinc-300">Notes internes</h2>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              placeholder="Notes visibles uniquement par toi..."
              className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-600"
            />
            <button
              type="button"
              onClick={saveNotes}
              disabled={isPending}
              className="mt-3 h-9 rounded-lg bg-white px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 disabled:opacity-50"
            >
              Sauvegarder
            </button>
          </section>
        </div>

        {/* Sidebar */}
        <div className="grid gap-5 self-start">
          <section className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-5">
            <h2 className="mb-4 text-sm font-medium text-zinc-300">Durée & facturation</h2>
            <div className="divide-y divide-zinc-800/40">
              {[
                ["Engagement", `${contrat.dureeMois} mois`],
                ["Début", String(fd.date_debut ?? "—")],
                ["Fin", String(fd.date_fin ?? "—")],
                ["Facturation", String(fd.mode_facturation ?? "")  === "debut" ? "Début de mois" : "Fin de mois"],
                ["Date signature", String(fd.date_signature ?? "—")],
                ["Lieu", String(fd.lieu_signature ?? "—")],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5 py-2.5">
                  <span className="text-xs text-zinc-600">{label}</span>
                  <span className="text-sm text-zinc-300">{value || "—"}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-5">
            <h2 className="mb-3 text-sm font-medium text-zinc-300">Fichier</h2>
            <a
              href={`/api/contrats/${contrat.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-white text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
            >
              Télécharger PDF
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}
