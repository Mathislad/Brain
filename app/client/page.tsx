import Link from "next/link";

import { requireClient } from "@/lib/auth/roles";
import { getMyDocumentsAction } from "@/app/actions/organizations";
import { offerLabel } from "@/lib/offers";

export default async function ClientDashboard() {
  const { organization, user } = await requireClient();
  const documents = await getMyDocumentsAction();
  const billing = organization.billing;

  return (
    <div className="grid gap-8">
      {/* Accueil */}
      <div>
        <p className="text-xs uppercase tracking-widest text-zinc-600">Espace client</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">
          Bonjour{user.user_metadata?.name ? `, ${user.user_metadata.name}` : ""}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{organization.name}</p>
      </div>

      {/* Statut */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatusCard
          label="Espace"
          value="Actif"
          sub="F5L Brain"
          accent="emerald"
        />
        <StatusCard
          label="Offre"
          value={billing?.offerKey ? offerLabel(billing.offerKey) : "—"}
          sub={billing?.subscriptionStatus === "active" ? "Abonnement actif" : "En attente"}
          accent={billing?.subscriptionStatus === "active" ? "blue" : "zinc"}
        />
        <StatusCard
          label="Documents"
          value={String(documents.length)}
          sub={documents.length === 1 ? "document disponible" : "documents disponibles"}
          accent="zinc"
        />
      </div>

      {/* Prochaines étapes (statique V1) */}
      <section className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-6">
        <h2 className="mb-4 text-sm font-medium text-zinc-300">Prochaines étapes</h2>
        <div className="grid gap-3">
          {[
            { done: true,  label: "Espace client activé" },
            { done: false, label: "Accès aux livrables via Documents" },
            { done: false, label: "Suivi de votre accompagnement mensuel" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                item.done
                  ? "border-emerald-900/60 bg-emerald-950/40 text-emerald-400"
                  : "border-zinc-800 text-zinc-700"
              }`}>
                {item.done ? "✓" : ""}
              </div>
              <span className={`text-sm ${item.done ? "text-zinc-300" : "text-zinc-600"}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Documents récents */}
      {documents.length > 0 && (
        <section className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-300">Documents récents</h2>
            <Link href="/client/documents" className="text-xs text-zinc-500 hover:text-white transition-colors">
              Voir tout →
            </Link>
          </div>
          <div className="grid gap-2">
            {documents.slice(0, 3).map((doc) => (
              <DocRow key={doc.id} doc={doc} />
            ))}
          </div>
        </section>
      )}

      <p className="text-xs text-zinc-700">
        Votre espace F5L Brain s&apos;enrichira progressivement selon les modules activés dans votre accompagnement.
      </p>
    </div>
  );
}

function StatusCard({
  label, value, sub, accent,
}: { label: string; value: string; sub: string; accent: "emerald" | "blue" | "zinc" }) {
  const colors = {
    emerald: "border-emerald-900/40 bg-emerald-950/20",
    blue:    "border-blue-900/40 bg-blue-950/20",
    zinc:    "border-zinc-800 bg-zinc-900/40",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[accent]}`}>
      <p className="text-xs uppercase tracking-wider text-zinc-600">{label}</p>
      <p className="mt-1 text-lg font-medium text-white">{value}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>
    </div>
  );
}

function DocRow({ doc }: { doc: { id: string; title: string; category: string | null; createdAt: Date; externalUrl: string | null } }) {
  const CATEGORY_LABELS: Record<string, string> = {
    contrat: "Contrat", facture: "Facture", brief: "Brief", livrable: "Livrable", suivi: "Suivi",
  };
  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-800/40 px-4 py-2.5">
      <div>
        <p className="text-sm text-white">{doc.title}</p>
        <p className="text-xs text-zinc-600">
          {doc.category ? (CATEGORY_LABELS[doc.category] ?? doc.category) : "Document"} ·{" "}
          {new Intl.DateTimeFormat("fr-FR").format(doc.createdAt)}
        </p>
      </div>
      {doc.externalUrl && (
        <a href={doc.externalUrl} target="_blank" rel="noreferrer"
          className="text-xs text-zinc-500 transition-colors hover:text-white">
          Ouvrir →
        </a>
      )}
    </div>
  );
}
