import { redirect } from "next/navigation";

import { AccountingTool } from "@/components/dashboard/accounting-tool";
import { getCurrentUser } from "@/lib/session";
import { getClientPaymentsForAccounting } from "@/lib/clients-db";

export default async function ComptabilitePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const clientPayments = await getClientPaymentsForAccounting(user.id);

  return (
    <div className="px-8 py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-zinc-600">
          Entreprise
        </p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">
          Comptabilité
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Suivi des recettes, dépenses et trésorerie. Les paiements clients sont
          synchronisés automatiquement.
        </p>
      </div>

      <AccountingTool clientPayments={clientPayments} />
    </div>
  );
}
