"use client";

import { useMemo, useState } from "react";

type ActivityKey = "vente" | "bic_service" | "bnc" | "bnc_cipav";

interface ActivityRates {
  label: string;
  cotisation: number; // taux cotisations sociales micro-entrepreneur
  versementLiberatoire: number; // taux versement libératoire IR
  abattement: number; // abattement forfaitaire micro-fiscal
  plafondCA: number; // plafond de CA annuel du régime micro
}

const ACTIVITIES: Record<ActivityKey, ActivityRates> = {
  vente: {
    label: "Vente de marchandises (BIC)",
    cotisation: 0.123,
    versementLiberatoire: 0.01,
    abattement: 0.71,
    plafondCA: 188_700,
  },
  bic_service: {
    label: "Prestations de services commerciales/artisanales (BIC)",
    cotisation: 0.212,
    versementLiberatoire: 0.017,
    abattement: 0.5,
    plafondCA: 77_700,
  },
  bnc: {
    label: "Prestations de services libérales (BNC)",
    cotisation: 0.246,
    versementLiberatoire: 0.022,
    abattement: 0.34,
    plafondCA: 77_700,
  },
  bnc_cipav: {
    label: "Professions libérales réglementées (CIPAV)",
    cotisation: 0.232,
    versementLiberatoire: 0.022,
    abattement: 0.34,
    plafondCA: 77_700,
  },
};

const DEFAULT_BAREME = [
  { max: 11294, taux: 0 },
  { max: 28797, taux: 0.11 },
  { max: 82341, taux: 0.3 },
  { max: 177106, taux: 0.41 },
  { max: Infinity, taux: 0.45 },
];

function formatEUR(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

function computeIR(revenuImposable: number, parts: number) {
  const quotient = revenuImposable / parts;
  let impotParPart = 0;
  let lower = 0;

  for (const tranche of DEFAULT_BAREME) {
    if (quotient <= lower) break;
    const upper = Math.min(quotient, tranche.max);
    impotParPart += Math.max(0, upper - lower) * tranche.taux;
    lower = tranche.max;
    if (quotient <= tranche.max) break;
  }

  const impotTotal = impotParPart * parts;
  const trancheMarginale =
    DEFAULT_BAREME.find((t) => quotient <= t.max)?.taux ?? 0.45;

  return {
    impotTotal: Math.round(impotTotal),
    tauxMoyen: revenuImposable > 0 ? impotTotal / revenuImposable : 0,
    tauxMarginal: trancheMarginale,
  };
}

const TABS = [
  { key: "micro", label: "Micro-entreprise" },
  { key: "ir", label: "Barème impôt sur le revenu" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function SimulatorTool() {
  const [tab, setTab] = useState<TabKey>("micro");

  // ── Micro-entreprise ──────────────────────────────────────────────
  const [ca, setCa] = useState(30000);
  const [activity, setActivity] = useState<ActivityKey>("bic_service");
  const [versementLiberatoire, setVersementLiberatoire] = useState(false);
  const [acre, setAcre] = useState(false);

  const rates = ACTIVITIES[activity];

  const microResult = useMemo(() => {
    const tauxCotisation = acre ? rates.cotisation * 0.5 : rates.cotisation;
    const cotisations = ca * tauxCotisation;
    const impotVL = versementLiberatoire ? ca * rates.versementLiberatoire : 0;
    const baseImposable = ca * (1 - rates.abattement);
    const revenuNet = ca - cotisations - impotVL;
    const depassement = ca > rates.plafondCA;

    return { cotisations, impotVL, baseImposable, revenuNet, depassement };
  }, [ca, rates, versementLiberatoire, acre]);

  // ── Barème IR ──────────────────────────────────────────────────────
  const [revenuImposable, setRevenuImposable] = useState(30000);
  const [parts, setParts] = useState(1);

  const irResult = useMemo(
    () => computeIR(revenuImposable, parts || 1),
    [revenuImposable, parts],
  );

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-zinc-600">
          Administratif
        </p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">
          Simulateur
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">
          Estimation des cotisations et de l&apos;impôt. Taux indicatifs — à
          vérifier avant toute décision (barème 2024, revenus 2023).
        </p>
      </div>

      <div className="mb-6 flex h-10 w-fit gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-md px-3 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "micro" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 px-6 py-5">
            <p className="mb-4 text-sm font-medium text-zinc-200">
              Paramètres
            </p>
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-zinc-500">
                  Chiffre d&apos;affaires annuel
                </span>
                <input
                  type="number"
                  min={0}
                  value={ca}
                  onChange={(e) => setCa(Number(e.target.value) || 0)}
                  className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-zinc-600"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-zinc-500">
                  Type d&apos;activité
                </span>
                <select
                  value={activity}
                  onChange={(e) => setActivity(e.target.value as ActivityKey)}
                  className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-zinc-600"
                >
                  {Object.entries(ACTIVITIES).map(([key, a]) => (
                    <option key={key} value={key}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2.5 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={versementLiberatoire}
                  onChange={(e) => setVersementLiberatoire(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-950"
                />
                Versement libératoire de l&apos;impôt sur le revenu
              </label>

              <label className="flex items-center gap-2.5 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={acre}
                  onChange={(e) => setAcre(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-950"
                />
                ACRE (estimation : -50% sur les cotisations)
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 px-6 py-5">
            <p className="mb-4 text-sm font-medium text-zinc-200">Résultat</p>
            <div className="flex flex-col gap-3">
              <Row
                label={`Cotisations sociales (${formatPercent(acre ? rates.cotisation * 0.5 : rates.cotisation)})`}
                value={formatEUR(microResult.cotisations)}
              />
              {versementLiberatoire && (
                <Row
                  label={`Impôt — versement libératoire (${formatPercent(rates.versementLiberatoire)})`}
                  value={formatEUR(microResult.impotVL)}
                />
              )}
              <Row
                label="Revenu net estimé"
                value={formatEUR(microResult.revenuNet)}
                highlight
              />
              <div className="mt-2 h-px bg-zinc-800/60" />
              <Row
                label={`Base imposable après abattement (${formatPercent(rates.abattement)})`}
                value={formatEUR(microResult.baseImposable)}
              />
              <p className="text-xs text-zinc-600">
                Sans versement libératoire, reportez cette base dans l&apos;onglet
                « Barème impôt sur le revenu » pour estimer l&apos;IR dû.
              </p>

              {microResult.depassement && (
                <p className="mt-2 rounded-lg border border-amber-900/40 bg-amber-950/20 px-3 py-2 text-xs text-amber-400">
                  Le CA saisi dépasse le plafond micro-entreprise pour cette
                  activité ({formatEUR(rates.plafondCA)}).
                </p>
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 px-6 py-5">
            <p className="mb-4 text-sm font-medium text-zinc-200">
              Paramètres
            </p>
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-zinc-500">
                  Revenu net imposable (foyer)
                </span>
                <input
                  type="number"
                  min={0}
                  value={revenuImposable}
                  onChange={(e) =>
                    setRevenuImposable(Number(e.target.value) || 0)
                  }
                  className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-zinc-600"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-zinc-500">
                  Nombre de parts fiscales
                </span>
                <input
                  type="number"
                  min={1}
                  step={0.5}
                  value={parts}
                  onChange={(e) => setParts(Number(e.target.value) || 1)}
                  className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-zinc-600"
                />
              </label>
            </div>

            <div className="mt-5 rounded-lg border border-zinc-800/60 px-4 py-3">
              <p className="mb-2 text-xs font-medium text-zinc-500">
                Barème par tranche (2024)
              </p>
              <div className="flex flex-col gap-1 text-xs text-zinc-500">
                {DEFAULT_BAREME.map((t, i) => {
                  const prev = i === 0 ? 0 : DEFAULT_BAREME[i - 1].max;
                  return (
                    <p key={i}>
                      {formatEUR(prev)} – {t.max === Infinity ? "∞" : formatEUR(t.max)} :{" "}
                      <span className="text-zinc-300">{formatPercent(t.taux)}</span>
                    </p>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 px-6 py-5">
            <p className="mb-4 text-sm font-medium text-zinc-200">Résultat</p>
            <div className="flex flex-col gap-3">
              <Row
                label="Impôt sur le revenu estimé"
                value={formatEUR(irResult.impotTotal)}
                highlight
              />
              <Row
                label="Taux moyen d'imposition"
                value={formatPercent(irResult.tauxMoyen)}
              />
              <Row
                label="Taux marginal (TMI)"
                value={formatPercent(irResult.tauxMarginal)}
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-zinc-500">{label}</span>
      <span
        className={`text-sm font-medium ${highlight ? "text-white" : "text-zinc-300"}`}
      >
        {value}
      </span>
    </div>
  );
}
