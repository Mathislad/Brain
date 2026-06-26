import { redirect } from "next/navigation";

import { DeleteAccountButton } from "@/components/dashboard/delete-account-button";
import { UpdateNameForm } from "@/components/dashboard/update-name-form";
import { getCurrentUser } from "@/lib/session";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const currentName =
    (user.user_metadata?.name as string | undefined) ?? "";

  return (
    <div className="mx-auto max-w-xl px-8 py-12">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest text-zinc-600">
          Paramètres
        </p>
        <h1 className="mt-2 text-2xl font-medium tracking-tight text-white">
          Votre compte
        </h1>
      </div>

      {/* Informations */}
      <section className="mb-10">
        <h2 className="mb-4 text-sm font-medium text-zinc-400">
          Informations
        </h2>
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-6">
          <div className="mb-4 flex flex-col gap-1">
            <p className="text-xs text-zinc-600">Email</p>
            <p className="text-sm text-zinc-300">{user.email}</p>
          </div>
          <div className="h-px bg-zinc-800/60" />
          <div className="mt-4">
            <UpdateNameForm currentName={currentName} />
          </div>
        </div>
      </section>

      {/* Zone de danger */}
      <section>
        <h2 className="mb-4 text-sm font-medium text-red-500/60">
          Zone de danger
        </h2>
        <div className="rounded-xl border border-red-950/50 bg-zinc-900/30 p-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-zinc-200">
                Supprimer le compte
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Action irréversible. Toutes vos données seront supprimées.
              </p>
            </div>
            <DeleteAccountButton />
          </div>
        </div>
      </section>
    </div>
  );
}
