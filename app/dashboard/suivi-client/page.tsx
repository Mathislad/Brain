import Link from "next/link";

import { getClientOrgsAction } from "@/app/actions/organizations";
import { requireAdmin } from "@/lib/auth/roles";
import { offerLabel } from "@/lib/offers";

const STATUS_STYLES: Record<string, string> = {
  active: "border-emerald-900/50 bg-emerald-950/60 text-emerald-400",
  pending: "border-yellow-900/50 bg-yellow-950/60 text-yellow-400",
  suspended: "border-red-900/50 bg-red-950/60 text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  pending: "En attente",
  suspended: "Suspendu",
};

export default async function SuiviClientPage() {
  await requireAdmin();
  const organizations = await getClientOrgsAction();

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-zinc-600">
          Suivi client
        </p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">
          Dashboard
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">
          Vue d&apos;ensemble des clients avec portail F5L Brain : site,
          campagnes publicitaires, CRM et demandes en cours.
        </p>
      </div>

      {organizations.length === 0 ? (
        <div className="rounded-xl border border-zinc-800/80 px-6 py-16 text-center">
          <p className="text-sm text-zinc-500">
            Aucun client avec accès portail pour l&apos;instant. Les
            organisations apparaissent ici une fois l&apos;onboarding
            complété.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {organizations.map((org) => (
            <Link
              key={org.id}
              href={`/dashboard/suivi-client/${org.id}`}
              className="group rounded-xl border border-zinc-800/80 bg-zinc-900/20 px-5 py-4 transition-colors hover:border-zinc-700 hover:bg-zinc-800/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">
                    {org.name}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-zinc-500">
                    {org.prospect?.email ?? "Email non renseigné"}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    STATUS_STYLES[org.status] ?? STATUS_STYLES.pending
                  }`}
                >
                  {STATUS_LABELS[org.status] ?? org.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {org.billing?.offerKey && (
                  <span className="rounded-full bg-zinc-800/80 px-2 py-0.5 text-xs text-zinc-400">
                    {offerLabel(org.billing.offerKey)}
                  </span>
                )}
                <span className="rounded-full bg-zinc-800/80 px-2 py-0.5 text-xs text-zinc-400">
                  {org.billing?.subscriptionStatus === "active"
                    ? "Abonnement actif"
                    : "Abonnement inactif"}
                </span>
                <span className="rounded-full bg-zinc-800/80 px-2 py-0.5 text-xs text-zinc-400">
                  {org.members.length > 0 ? "Accès portail créé" : "Sans accès portail"}
                </span>
              </div>

              <span className="mt-3 inline-block text-xs text-zinc-700 transition-colors group-hover:text-zinc-400">
                Voir le dashboard →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
