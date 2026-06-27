import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { SiteManager } from "@/components/dashboard/site-manager";
import { getCurrentUser } from "@/lib/session";
import { getSites } from "@/lib/sites-db";
import { getProspects } from "@/lib/prospects-db";
import type { SiteView } from "@/lib/site-types";

export default async function SiteInternetPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let sites: SiteView[] = [];
  let prospects: { id: string; label: string }[] = [];
  let dbError = false;

  try {
    const [s, p] = await Promise.all([
      getSites(user.id),
      getProspects(user.id),
    ]);
    sites = s;
    prospects = p.map((row) => ({
      id: row.id,
      label: row.entreprise?.trim() || row.nom,
    }));
  } catch {
    dbError = true;
  }

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const baseUrl = `${proto}://${host}`;

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-zinc-600">
          Working
        </p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">
          Site internet
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Gère le contenu des sites clients (offres, produits, images). Chaque
          site expose une API publique que le site live consomme.
        </p>
      </div>

      {dbError ? (
        <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 px-6 py-5">
          <p className="text-sm font-medium text-amber-400">
            Base de données non disponible
          </p>
          <p className="mt-1 text-xs text-amber-600">
            Vérifiez DATABASE_URL dans votre configuration.
          </p>
        </div>
      ) : (
        <SiteManager sites={sites} prospects={prospects} baseUrl={baseUrl} />
      )}
    </div>
  );
}
