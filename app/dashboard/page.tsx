import { getCurrentUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const displayName =
    (user?.user_metadata?.name as string | undefined) || user?.email || "";

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-12">
      <p className="text-xs uppercase tracking-widest text-zinc-600">
        Tableau de bord
      </p>
      <h1 className="mt-2 text-2xl font-medium tracking-tight text-white">
        Bonjour, {displayName}
      </h1>
    </div>
  );
}
