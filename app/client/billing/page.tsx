import { requireClient } from "@/lib/auth/roles";
import { BillingCard } from "@/components/client/billing-card";

export default async function ClientBillingPage() {
  const { organization } = await requireClient();
  const billing = organization.billing;

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-zinc-600">Abonnement</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">Mon abonnement</h1>
      </div>

      {billing ? (
        <div className="max-w-md">
          <BillingCard
            offerKey={billing.offerKey}
            setupAmount={billing.setupAmount}
            monthlyAmount={billing.monthlyAmount}
            subscriptionStatus={billing.subscriptionStatus}
            isSimulated={billing.isSimulated}
            activatedAt={billing.activatedAt}
          />
        </div>
      ) : (
        <p className="text-sm text-zinc-500">Aucune information d&apos;abonnement disponible.</p>
      )}
    </div>
  );
}
