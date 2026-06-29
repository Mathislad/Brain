import { offerLabel, formatCents } from "@/lib/offers";

interface BillingCardProps {
  offerKey:           string | null;
  setupAmount:        number | null;
  monthlyAmount:      number | null;
  subscriptionStatus: string;
  isSimulated:        boolean;
  activatedAt:        Date | null;
}

const STATUS_STYLES: Record<string, string> = {
  inactive:  "border-zinc-700 bg-zinc-800 text-zinc-400",
  pending:   "border-yellow-900/50 bg-yellow-950/30 text-yellow-300",
  active:    "border-emerald-900/50 bg-emerald-950/30 text-emerald-300",
  past_due:  "border-red-900/50 bg-red-950/30 text-red-300",
  canceled:  "border-zinc-700 bg-zinc-900 text-zinc-500",
};

const STATUS_LABELS: Record<string, string> = {
  inactive: "Inactif",
  pending:  "En attente",
  active:   "Actif",
  past_due: "Paiement en retard",
  canceled: "Résilié",
};

export function BillingCard({
  offerKey,
  setupAmount,
  monthlyAmount,
  subscriptionStatus,
  isSimulated,
  activatedAt,
}: BillingCardProps) {
  const styleCls = STATUS_STYLES[subscriptionStatus] ?? STATUS_STYLES.inactive;

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-600">Abonnement</p>
          <p className="mt-1 text-lg font-medium text-white">
            {offerKey ? offerLabel(offerKey) : "—"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${styleCls}`}>
            {STATUS_LABELS[subscriptionStatus] ?? subscriptionStatus}
          </span>
          {isSimulated && (
            <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] text-zinc-600">
              simulation
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-zinc-800/40">
        {setupAmount !== null && setupAmount > 0 && (
          <div className="flex justify-between py-3">
            <span className="text-sm text-zinc-500">Frais d&apos;installation</span>
            <span className="text-sm text-white">{formatCents(setupAmount)}</span>
          </div>
        )}
        {monthlyAmount !== null && (
          <div className="flex justify-between py-3">
            <span className="text-sm text-zinc-500">Mensualité</span>
            <span className="text-sm font-medium text-white">{formatCents(monthlyAmount)}/mois</span>
          </div>
        )}
        {setupAmount !== null && monthlyAmount !== null && (
          <div className="flex justify-between py-3">
            <span className="text-sm text-zinc-500">Total mois 1</span>
            <span className="text-sm font-semibold text-white">
              {formatCents(setupAmount + monthlyAmount)}
            </span>
          </div>
        )}
        {activatedAt && (
          <div className="flex justify-between py-3">
            <span className="text-sm text-zinc-500">Activé le</span>
            <span className="text-sm text-zinc-300">
              {new Intl.DateTimeFormat("fr-FR").format(activatedAt)}
            </span>
          </div>
        )}
      </div>

      <p className="mt-4 text-[11px] text-zinc-700">
        TVA non applicable — art. L.223-3 CIBS / 293 B CGI
      </p>

      {/* TODO Stripe V3 : bouton "Gérer mon abonnement" → Stripe Customer Portal */}
    </div>
  );
}
