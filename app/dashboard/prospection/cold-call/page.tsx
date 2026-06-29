import { redirect } from "next/navigation";

import { ColdCallSession } from "@/components/dashboard/cold-call-session";
import { getCurrentUser } from "@/lib/session";
import { getProspects, type Prospect } from "@/lib/prospects-db";

export default async function ColdCallPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let prospects: Prospect[] = [];
  let dbError = false;
  try {
    const all = await getProspects(user.id);
    prospects = all.filter((p) => p.telephone && p.telephone.trim() !== "");
  } catch {
    dbError = true;
  }

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-zinc-600">
          Outils
        </p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">
          Cold Call
        </h1>
        {!dbError && (
          <p className="mt-1 text-sm text-zinc-500">
            {prospects.length} prospect{prospects.length !== 1 ? "s" : ""} avec
            numéro
          </p>
        )}
      </div>

      {dbError ? (
        <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 px-6 py-5">
          <p className="text-sm font-medium text-amber-400">
            Base de données non disponible
          </p>
          <p className="mt-1 text-xs text-amber-600">
            Vérifiez DATABASE_URL dans votre .env.
          </p>
        </div>
      ) : prospects.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Aucun prospect avec numéro de téléphone. Importez un CSV ou créez un prospect depuis le CRM.
        </p>
      ) : (
        <ColdCallSession prospects={prospects} />
      )}
    </div>
  );
}
