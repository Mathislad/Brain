import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { SignOutButton } from "@/components/auth/sign-out-button";

// Page protégée : vérification authoritative de la session côté serveur.
export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="text-xs uppercase tracking-widest text-zinc-600">
          Tableau de bord
        </p>
        <h1 className="mt-2 text-2xl font-medium tracking-tight text-white">
          Bonjour, {user.name || user.email}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{user.email}</p>

        <div className="mt-10 border-t border-zinc-800/80 pt-6">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
