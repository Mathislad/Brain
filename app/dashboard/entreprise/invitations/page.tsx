import Link from "next/link";
import { headers } from "next/headers";

import { getInvitationsAction } from "@/app/actions/invitations";
import { InvitationActions } from "@/components/dashboard/invitation-actions";
import { offerLabel, formatCents } from "@/lib/offers";
import { secondsUntilNextCode } from "@/lib/auth/invitation";

const STATUS_STYLES: Record<string, string> = {
  pending:     "border-yellow-900/50 bg-yellow-950/30 text-yellow-300",
  in_progress: "border-blue-900/50 bg-blue-950/30 text-blue-300",
  completed:   "border-emerald-900/50 bg-emerald-950/30 text-emerald-300",
  expired:     "border-zinc-700 bg-zinc-800/60 text-zinc-500",
  revoked:     "border-red-900/50 bg-red-950/30 text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  pending:     "En attente",
  in_progress: "En cours",
  completed:   "Complété",
  expired:     "Expiré",
  revoked:     "Révoqué",
};

export default async function InvitationsPage() {
  const invitations = await getInvitationsAction();
  const secsLeft = secondsUntilNextCode();

  // Dérive l'origine depuis les headers de la requête (fonctionne en local + Vercel)
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "";
  const proto = hdrs.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-600">Suivi client</p>
          <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">Invitations</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {invitations.length} invitation{invitations.length !== 1 ? "s" : ""} créée{invitations.length !== 1 ? "s" : ""}.
          </p>
        </div>
        <Link
          href="/dashboard/entreprise/invitations/nouveau"
          className="inline-flex h-10 items-center rounded-lg bg-white px-5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
        >
          Nouvelle invitation
        </Link>
      </div>

      {invitations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 px-8 py-20 text-center">
          <p className="text-sm text-zinc-500">Aucune invitation pour le moment.</p>
          <Link
            href="/dashboard/entreprise/invitations/nouveau"
            className="mt-4 inline-flex h-9 items-center rounded-lg bg-white px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
          >
            Créer la première invitation
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {invitations.map((inv) => {
            const prefilled = inv.prefilledData as {
              offerKey?: string;
              setupAmount?: number;
              monthlyAmount?: number;
              notesAdmin?: string;
            };
            const onboardingUrl = `${origin}/client/onboarding/${inv.accessToken}`;

            return (
              <div
                key={inv.id}
                className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 px-5 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  {/* Identité */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <p className="font-medium text-white">
                        {inv.organization.name}
                      </p>
                      <span className={`inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[inv.status] ?? STATUS_STYLES.expired}`}>
                        {STATUS_LABELS[inv.status] ?? inv.status}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-zinc-500">{inv.contactEmail}</p>
                  </div>

                  {/* Actions */}
                  <InvitationActions
                    invitationId={inv.id}
                    status={inv.status}
                    onboardingUrl={onboardingUrl}
                    currentCode={inv.currentCode}
                    secsLeft={secsLeft}
                  />
                </div>

                {/* Détails */}
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-zinc-500">
                  {prefilled.offerKey && (
                    <span>
                      <span className="text-zinc-600">Offre :</span>{" "}
                      <span className="text-zinc-300">{offerLabel(prefilled.offerKey)}</span>
                    </span>
                  )}
                  {prefilled.monthlyAmount != null && (
                    <span>
                      <span className="text-zinc-600">Mensualité :</span>{" "}
                      <span className="text-zinc-300">{formatCents(prefilled.monthlyAmount)}/mois</span>
                    </span>
                  )}
                  {prefilled.setupAmount != null && prefilled.setupAmount > 0 && (
                    <span>
                      <span className="text-zinc-600">Installation :</span>{" "}
                      <span className="text-zinc-300">{formatCents(prefilled.setupAmount)}</span>
                    </span>
                  )}
                  <span>
                    <span className="text-zinc-600">Expire :</span>{" "}
                    <span className={inv.tokenExpiresAt < new Date() ? "text-red-400" : "text-zinc-300"}>
                      {new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(inv.tokenExpiresAt)}
                    </span>
                  </span>
                  <span>
                    <span className="text-zinc-600">Créée :</span>{" "}
                    {new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(inv.createdAt)}
                  </span>
                </div>

                {prefilled.notesAdmin && (
                  <p className="mt-2 text-xs text-zinc-600 italic">{prefilled.notesAdmin}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
