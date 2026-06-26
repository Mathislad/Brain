import { redirect } from "next/navigation";

import { CrmTable } from "@/components/dashboard/crm-table";
import { CsvImportButton } from "@/components/dashboard/csv-import-button";
import { getCurrentUser } from "@/lib/session";
import { getProspects, type Prospect } from "@/lib/prospects-db";

function DbErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 px-6 py-5">
      <p className="text-sm font-medium text-amber-400">
        Base de données non disponible
      </p>
      <p className="mt-1 text-xs text-amber-600">{message}</p>
    </div>
  );
}

function getDbErrorMessage(e: unknown): string {
  const msg = e instanceof Error ? e.message : "";
  if (
    msg.includes("P2021") ||
    msg.includes("does not exist") ||
    msg.includes("relation") ||
    msg.includes("table")
  ) {
    return "Table manquante. Configurez DATABASE_URL dans .env puis exécutez : pnpm prisma migrate dev --name add_prospects";
  }
  if (
    msg.includes("ECONNREFUSED") ||
    msg.includes("connect") ||
    msg.includes("password authentication")
  ) {
    return "Connexion impossible. Vérifiez DATABASE_URL dans votre .env.";
  }
  return "Erreur de base de données. Vérifiez DATABASE_URL dans votre .env.";
}

export default async function CrmPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let prospects: Prospect[] = [];
  let dbError: string | null = null;

  try {
    prospects = await getProspects(user.id);
  } catch (e) {
    dbError = getDbErrorMessage(e);
  }

  return (
    <div className="px-8 py-10">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-600">
            Prospection
          </p>
          <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">
            CRM
          </h1>
          {!dbError && (
            <p className="mt-1 text-sm text-zinc-500">
              {prospects.length} prospect{prospects.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <CsvImportButton />
      </div>

      {dbError ? (
        <DbErrorBanner message={dbError} />
      ) : (
        <CrmTable prospects={prospects} />
      )}
    </div>
  );
}
