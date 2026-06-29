import Link from "next/link";

import { getMyDocumentsAction } from "@/app/actions/organizations";
import { requireClient } from "@/lib/auth/roles";
import { getPortalOverview, serviceLabels, statusLabels } from "@/lib/f5l-portal";
import { offerLabel } from "@/lib/offers";

const nextActions = [
  { done: true, label: "Espace client activé", note: "Accès F5L Brain opérationnel" },
  { done: false, label: "Centraliser les accès publicitaires", note: "Meta, Google et tracking" },
  { done: false, label: "Valider les priorités du mois", note: "Actions proposées par votre conseiller F5L" },
];

export default async function ClientDashboard() {
  const { organization, user } = await requireClient();
  const documents = await getMyDocumentsAction();
  const overview = await getPortalOverview(organization.id, user.id);
  const billing = organization.billing;
  const activeServices = overview.activeCount;

  return (
    <div className="grid gap-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-600">Espace client F5L Brain</p>
          <h1 className="mt-2 text-3xl font-medium tracking-tight text-white">
            Bonjour{user.user_metadata?.name ? `, ${user.user_metadata.name}` : ""}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            {organization.name} · suivez vos services, documents et prochaines actions.
          </p>
        </div>
        <Link
          href="/client/support"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-700 px-4 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
        >
          Demander une action
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCard label="Portail" value="Actif" sub="Accès sécurisé" accent="emerald" />
        <StatusCard
          label="Offre"
          value={billing?.offerKey ? offerLabel(billing.offerKey) : "À définir"}
          sub={billing?.subscriptionStatus === "active" ? "Abonnement actif" : "En attente"}
          accent={billing?.subscriptionStatus === "active" ? "blue" : "zinc"}
        />
        <StatusCard
          label="Services"
          value={`${activeServices}/${overview.services.length}`}
          sub="services actifs"
          accent="cyan"
        />
        <StatusCard
          label="Documents"
          value={String(documents.length)}
          sub={documents.length === 1 ? "document disponible" : "documents disponibles"}
          accent="zinc"
        />
      </div>

      <section className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-medium text-white">Services F5L</h2>
            <p className="mt-1 text-sm text-zinc-500">Vue synthétique de votre système d&apos;acquisition.</p>
          </div>
          <Link href="/client/services" className="text-sm text-zinc-500 transition-colors hover:text-white">
            Détail
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {overview.services.slice(0, 6).map((service) => (
            <div key={service.id} className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-white">{service.name || serviceLabels[service.type]}</p>
                <ServiceStatus status={service.status} />
              </div>
              <p className="mt-2 text-xs leading-5 text-zinc-500">{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <section className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-6">
          <h2 className="mb-4 text-base font-medium text-white">Prochaines actions</h2>
          <div className="grid gap-3">
            {nextActions.map((item) => (
              <div key={item.label} className="flex gap-3 rounded-lg border border-zinc-800/70 p-4">
                <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                  item.done
                    ? "border-emerald-700/60 bg-emerald-950/40 text-emerald-300"
                    : "border-zinc-700 text-zinc-700"
                }`}>
                  {item.done ? "✓" : ""}
                </div>
                <div>
                  <p className={item.done ? "text-sm text-zinc-300" : "text-sm text-white"}>{item.label}</p>
                  <p className="mt-0.5 text-xs text-zinc-600">{item.note}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-medium text-white">Documents récents</h2>
            <Link href="/client/documents" className="text-sm text-zinc-500 transition-colors hover:text-white">
              Voir tout
            </Link>
          </div>
          {documents.length > 0 ? (
            <div className="grid gap-2">
              {documents.slice(0, 3).map((doc) => (
                <DocRow key={doc.id} doc={doc} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-800 px-5 py-8 text-sm text-zinc-500">
              Aucun document partagé pour le moment.
            </div>
          )}
        </section>
      </div>

      <section className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-6">
        <h2 className="mb-4 text-base font-medium text-white">Notifications</h2>
        <div className="grid gap-3">
          {overview.notifications.map((notification) => (
            <div key={notification.id} className="rounded-lg border border-zinc-800/70 p-4">
              <p className="text-sm font-medium text-white">{notification.title}</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">{notification.message}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatusCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: "emerald" | "blue" | "cyan" | "zinc";
}) {
  const colors = {
    emerald: "border-emerald-900/40 bg-emerald-950/20",
    blue: "border-blue-900/40 bg-blue-950/20",
    cyan: "border-cyan-900/40 bg-cyan-950/20",
    zinc: "border-zinc-800 bg-zinc-900/40",
  };
  return (
    <div className={`rounded-lg border p-4 ${colors[accent]}`}>
      <p className="text-xs uppercase tracking-wider text-zinc-600">{label}</p>
      <p className="mt-1 text-lg font-medium text-white">{value}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>
    </div>
  );
}

function ServiceStatus({ status }: { status: string }) {
  const isReady = status === "active";
  const isPrepared = status === "planned";
  return (
    <span
      className={`rounded-lg border px-2 py-0.5 text-[11px] ${
        isReady
          ? "border-emerald-900/60 text-emerald-300"
          : isPrepared
            ? "border-cyan-900/60 text-cyan-300"
            : "border-zinc-800 text-zinc-500"
      }`}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}

function DocRow({
  doc,
}: {
  doc: { id: string; title: string; category: string | null; createdAt: Date; externalUrl: string | null };
}) {
  const categoryLabels: Record<string, string> = {
    contrat: "Contrat",
    facture: "Facture",
    brief: "Brief",
    livrable: "Livrable",
    suivi: "Suivi",
  };
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800/40 px-4 py-3">
      <div>
        <p className="text-sm text-white">{doc.title}</p>
        <p className="text-xs text-zinc-600">
          {doc.category ? (categoryLabels[doc.category] ?? doc.category) : "Document"} ·{" "}
          {new Intl.DateTimeFormat("fr-FR").format(doc.createdAt)}
        </p>
      </div>
      {doc.externalUrl && (
        <a href={doc.externalUrl} target="_blank" rel="noreferrer" className="text-xs text-zinc-500 transition-colors hover:text-white">
          Ouvrir
        </a>
      )}
    </div>
  );
}
