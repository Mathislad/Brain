import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";

export default async function DevisFacturePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="px-8 py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-zinc-600">
          Entreprise
        </p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">
          Devis &amp; facture
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Création et suivi des devis et factures.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800/80 px-6 py-16 text-center">
        <p className="text-sm text-zinc-500">Section en cours de construction.</p>
      </div>
    </div>
  );
}
