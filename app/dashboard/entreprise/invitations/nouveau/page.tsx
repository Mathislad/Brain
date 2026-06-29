"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";

import { createInvitationAction } from "@/app/actions/invitations";
import { OFFER_LABELS, formatCents } from "@/lib/offers";

interface ProspectOption {
  id: string;
  nom: string;
  email: string | null;
  entreprise: string | null;
}

export default function NouvelleInvitationPage() {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; code?: string } | null>(null);

  // Prospect search
  const [prospects, setProspects] = useState<ProspectOption[]>([]);
  const [query, setQuery] = useState("");
  const [selectedProspect, setSelectedProspect] = useState<ProspectOption | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Form fields
  const [offerKey, setOfferKey] = useState("");
  const [setupEuros, setSetupEuros] = useState("");
  const [monthlyEuros, setMonthlyEuros] = useState("");
  const [notesAdmin, setNotesAdmin] = useState("");

  // Load prospects once
  useEffect(() => {
    fetch("/api/admin/prospects-list")
      .then((r) => r.json())
      .then((data: ProspectOption[]) => setProspects(data))
      .catch(() => {});
  }, []);

  const filtered = query.trim().length >= 1
    ? prospects.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.nom.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.entreprise?.toLowerCase().includes(q)
        );
      }).slice(0, 8)
    : [];

  function selectProspect(p: ProspectOption) {
    setSelectedProspect(p);
    setQuery(p.entreprise ?? p.nom);
    setShowDropdown(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProspect) return setError("Sélectionnez un prospect.");
    if (!offerKey) return setError("Choisissez une offre.");

    const setupCents   = Math.round(parseFloat(setupEuros || "0") * 100);
    const monthlyCents = Math.round(parseFloat(monthlyEuros || "0") * 100);
    if (isNaN(monthlyCents) || monthlyCents < 0) return setError("Montant mensuel invalide.");

    setError(null);
    start(async () => {
      try {
        const { accessToken } = await createInvitationAction({
          prospectId:    selectedProspect.id,
          offerKey,
          setupAmount:   setupCents,
          monthlyAmount: monthlyCents,
          notesAdmin,
        });
        const base = window.location.origin;
        setResult({ url: `${base}/client/onboarding/${accessToken}` });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de la création.");
      }
    });
  }

  if (result) {
    return (
      <div className="px-4 py-8 sm:px-8 sm:py-10">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest text-zinc-600">Portail client</p>
          <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">Invitation créée</h1>
        </div>

        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/10 p-6">
          <p className="text-sm font-medium text-emerald-300">
            Invitation générée avec succès.
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Transmettez ce lien au client <strong className="text-zinc-300">manuellement</strong> (email, message).
            Le code à 6 chiffres est visible dans la liste des invitations — il se renouvelle toutes les 15 min.
          </p>

          <div className="mt-5 grid gap-3">
            <div>
              <p className="mb-1.5 text-xs font-medium text-zinc-500">Lien d&apos;onboarding</p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={result.url}
                  className="h-9 flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-300 outline-none"
                />
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(result.url)}
                  className="h-9 shrink-0 rounded-lg border border-zinc-700 px-3 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                >
                  Copier
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard/entreprise/invitations")}
              className="inline-flex h-9 items-center rounded-lg bg-white px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
            >
              Voir les invitations
            </button>
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setSelectedProspect(null);
                setQuery("");
                setOfferKey("");
                setSetupEuros("");
                setMonthlyEuros("");
                setNotesAdmin("");
              }}
              className="inline-flex h-9 items-center rounded-lg border border-zinc-700 px-4 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Nouvelle invitation
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-zinc-600">Portail client</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">Nouvelle invitation</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Créez un lien d&apos;onboarding à transmettre manuellement au client.
        </p>
      </div>

      <form onSubmit={submit} className="grid max-w-lg gap-5">
        {/* Prospect */}
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-zinc-500">Prospect</label>
          <div className="relative">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowDropdown(true);
                if (selectedProspect && e.target.value !== (selectedProspect.entreprise ?? selectedProspect.nom)) {
                  setSelectedProspect(null);
                }
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder="Rechercher un prospect..."
              className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-600"
            />
            {showDropdown && filtered.length > 0 && (
              <div className="absolute top-full z-10 mt-1 w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-xl">
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={() => selectProspect(p)}
                    className="w-full px-3 py-2 text-left transition-colors hover:bg-zinc-900"
                  >
                    <p className="text-sm font-medium text-white">{p.entreprise ?? p.nom}</p>
                    <p className="text-xs text-zinc-500">
                      {p.entreprise ? p.nom : ""}{p.entreprise && p.email ? " · " : ""}{p.email ?? "Pas d'email"}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedProspect && (
            <p className="text-xs text-emerald-400">
              ✓ {selectedProspect.nom}{selectedProspect.email ? ` — ${selectedProspect.email}` : " — ⚠ aucun email"}
            </p>
          )}
        </div>

        {/* Offre */}
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-zinc-500">Offre</label>
          <select
            value={offerKey}
            onChange={(e) => setOfferKey(e.target.value)}
            className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors focus:border-zinc-600"
          >
            <option value="">Sélectionner une offre...</option>
            {Object.entries(OFFER_LABELS).map(([key, label]) => (
              <option key={key} value={key} className="bg-zinc-900">
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Montants */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-zinc-500">
              Frais installation (€)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={setupEuros}
              onChange={(e) => setSetupEuros(e.target.value)}
              className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-600"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-zinc-500">
              Mensualité (€) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              required
              value={monthlyEuros}
              onChange={(e) => setMonthlyEuros(e.target.value)}
              className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-600"
            />
          </div>
        </div>

        {/* Aperçu montants */}
        {(setupEuros || monthlyEuros) && (
          <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/30 px-4 py-3 text-xs text-zinc-500">
            {setupEuros && parseFloat(setupEuros) > 0 && (
              <div className="flex justify-between">
                <span>Installation</span>
                <span className="text-zinc-300">{formatCents(Math.round(parseFloat(setupEuros) * 100))}</span>
              </div>
            )}
            {monthlyEuros && (
              <div className="flex justify-between">
                <span>Mensualité</span>
                <span className="text-zinc-300">{formatCents(Math.round(parseFloat(monthlyEuros) * 100))}/mois</span>
              </div>
            )}
            {setupEuros && monthlyEuros && (
              <div className="mt-1 flex justify-between border-t border-zinc-800/60 pt-1 font-medium">
                <span>Total mois 1</span>
                <span className="text-white">{formatCents(Math.round((parseFloat(setupEuros) + parseFloat(monthlyEuros)) * 100))}</span>
              </div>
            )}
          </div>
        )}

        {/* Notes internes */}
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-zinc-500">
            Notes internes <span className="text-zinc-700">(non visibles du client)</span>
          </label>
          <textarea
            rows={2}
            value={notesAdmin}
            onChange={(e) => setNotesAdmin(e.target.value)}
            placeholder="Contexte, conditions particulières..."
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-zinc-600 resize-none"
          />
        </div>

        {error && (
          <p className="rounded-lg border border-red-900/50 bg-red-950/20 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending || !selectedProspect || !offerKey}
            className="inline-flex h-10 items-center rounded-lg bg-white px-5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 disabled:opacity-40"
          >
            {isPending ? "Création…" : "Créer l'invitation"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-zinc-600 transition-colors hover:text-zinc-300"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
