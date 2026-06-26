import { redirect } from "next/navigation";

import { ColdCallSession } from "@/components/dashboard/cold-call-session";
import { getCurrentUser } from "@/lib/session";
import { getProspects } from "@/lib/prospects-db";

export default async function ColdCallPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const all = await getProspects(user.id);
  const prospects = all.filter((p) => p.telephone && p.telephone.trim() !== "");

  return (
    <div className="px-8 py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-zinc-600">
          Prospection
        </p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">
          Cold Call
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {prospects.length} prospect{prospects.length !== 1 ? "s" : ""} avec
          numéro
        </p>
      </div>

      {prospects.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Aucun prospect avec numéro de téléphone. Importez un CSV ou créez un prospect depuis le CRM.
        </p>
      ) : (
        <ColdCallSession prospects={prospects} />
      )}
    </div>
  );
}
