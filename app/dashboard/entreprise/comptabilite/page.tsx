import { redirect } from "next/navigation";

import { AccountingTool } from "@/components/dashboard/accounting-tool";
import { getCurrentUser } from "@/lib/session";
import { getClientPaymentsForAccounting } from "@/lib/clients-db";
import { getAccountingEntries } from "@/lib/accounting-db";

export default async function ComptabilitePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [entries, clientPayments] = await Promise.all([
    getAccountingEntries(user.id),
    getClientPaymentsForAccounting(user.id),
  ]);

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-zinc-600">
          Administratif
        </p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">
          Comptabilité
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Suivi des recettes, dépenses et trésorerie. Les paiements clients sont
          synchronisés automatiquement.
        </p>
      </div>

      <AccountingTool entries={entries} clientPayments={clientPayments} />
    </div>
  );
}
