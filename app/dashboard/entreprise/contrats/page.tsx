import Link from "next/link";

import { getContratsAction } from "@/app/actions/contrats";

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
  site: "Site", seo: "SEO", ads: "Ads", fidelite: "Fidélité", ia: "IA", social: "Social",
};

export default async function ContratsPage() {
  const contrats = await getContratsAction();

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-600">Entreprise</p>
          <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">Contrats</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {contrats.length} contrat{contrats.length !== 1 ? "s" : ""} générés.
          </p>
        </div>
        <Link
          href="/dashboard/entreprise/contrats/nouveau"
          className="h-10 rounded-lg bg-white px-5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 inline-flex items-center"
        >
          Nouveau contrat
        </Link>
      </div>

      {contrats.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 px-8 py-20 text-center">
          <p className="text-sm text-zinc-500">Aucun contrat pour le moment.</p>
          <Link
            href="/dashboard/entreprise/contrats/nouveau"
            className="mt-4 inline-flex h-9 items-center rounded-lg bg-white px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
          >
            Créer le premier contrat
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800/80">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60">
                {["Client", "Services", "Total/mois", "Durée", "Date signature", "Statut", ""].map((h, i) => (
                  <th key={i} className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {contrats.map(c => (
                <tr key={c.id} className="bg-zinc-900/10 transition-colors hover:bg-zinc-800/20">
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link href={`/dashboard/entreprise/contrats/${c.id}`} className="font-medium text-white hover:underline">
                      {c.clientNom}
                    </Link>
                    {c.clientSiret && <p className="text-xs text-zinc-600">{c.clientSiret}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.services.map(s => (
                        <span key={s} className="rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400">
                          {SERVICE_LABELS[s] ?? s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-300">{c.total ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-400">{c.dureeMois} mois</td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-400">
                    {c.dateSig
                      ? new Intl.DateTimeFormat("fr-FR").format(c.dateSig)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUT_STYLES[c.statut] ?? STATUT_STYLES.brouillon}`}>
                      {STATUT_LABELS[c.statut] ?? c.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/entreprise/contrats/${c.id}`}
                      className="text-xs text-zinc-500 transition-colors hover:text-white"
                    >
                      Détails →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
