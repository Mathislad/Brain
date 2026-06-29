import { redirect } from "next/navigation";

import { ClientCards } from "@/components/dashboard/client-cards";
import { getCurrentUser } from "@/lib/session";
import { getClientsWithLinks } from "@/lib/clients-db";

export default async function ClientPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const clients = await getClientsWithLinks(user.id);

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-zinc-600">
          Administratif
        </p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">
          Client
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {clients.length} client{clients.length !== 1 ? "s" : ""} actif
          {clients.length !== 1 ? "s" : ""}
        </p>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-xl border border-zinc-800/80 px-6 py-16 text-center">
          <p className="text-sm text-zinc-500">
            Aucun client pour l&apos;instant. Passez un prospect au statut « Client »
            depuis le CRM.
          </p>
        </div>
      ) : (
        <ClientCards clients={clients} />
      )}
    </div>
  );
}
