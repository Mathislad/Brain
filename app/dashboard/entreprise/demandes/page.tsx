import type { Metadata } from "next";

import { updateClientRequestStatusAction } from "@/app/actions/f5l-portal";
import { requireAdmin } from "@/lib/auth/roles";
import { formatDate, getAdminClientRequests, statusLabels } from "@/lib/f5l-portal";

export const metadata: Metadata = {
  title: "Demandes client",
};

export default async function AdminClientRequestsPage() {
  await requireAdmin();
  const requests = await getAdminClientRequests();

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-zinc-600">Suivi client</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">Demandes client</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {requests.length} demande{requests.length !== 1 ? "s" : ""} enregistrée{requests.length !== 1 ? "s" : ""}.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-xl border border-zinc-800/80 px-6 py-16 text-center">
          <p className="text-sm text-zinc-500">Aucune demande client pour le moment.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {requests.map((request) => (
            <article key={request.id} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-5">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-medium text-white">{request.title}</h2>
                    <span className="rounded-lg border border-zinc-800 px-2 py-0.5 text-[11px] text-zinc-500">
                      {request.organizationName ?? "Client"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">{request.description}</p>
                  <p className="mt-3 text-xs text-zinc-600">
                    {request.category} · {request.priority} · créée le {formatDate(request.createdAt)}
                  </p>
                </div>
                <form action={updateClientRequestStatusAction} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={request.id} />
                  <select
                    name="status"
                    defaultValue={request.status}
                    className="h-9 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-300 outline-none"
                  >
                    <option value="open">Ouverte</option>
                    <option value="in_progress">En cours</option>
                    <option value="waiting_client">Action client</option>
                    <option value="done">Terminée</option>
                  </select>
                  <button className="h-9 rounded-lg border border-zinc-700 px-3 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white">
                    Mettre à jour
                  </button>
                </form>
              </div>
              <p className="mt-3 text-xs text-zinc-600">Statut actuel : {statusLabels[request.status] ?? request.status}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
