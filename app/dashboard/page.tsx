import Link from "next/link";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/session";
import { getProspects } from "@/lib/prospects-db";
import { getAdminClientRequests, formatDate } from "@/lib/f5l-portal";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  await requireAdmin();
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const displayName =
    (user.user_metadata?.name as string | undefined) || user.email || "";

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const [prospects, todos, requests] = await Promise.all([
    getProspects(user.id).catch(() => []),
    prisma.todoItem
      .findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } })
      .catch(() => []),
    getAdminClientRequests().catch(() => []),
  ]);

  const toFollowUp = prospects.filter(
    (p) => (p.status === "TODO" || p.status === "IN_PROGRESS") && p.prochaineAction,
  );
  const activeClients = prospects.filter((p) => p.status === "CLIENT_ACTIF").length;
  const openRequests = requests.filter((r) => r.status !== "done");
  const priorityTodos = todos
    .filter((t) => t.status !== "DONE")
    .filter((t) => t.priority === "HIGH" || (t.dueDate && new Date(t.dueDate) <= endOfToday))
    .slice(0, 5);

  const dateLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-zinc-600">Tableau de bord</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">
          Bonjour{displayName ? `, ${displayName}` : ""}
        </h1>
        <p className="mt-1 text-sm capitalize text-zinc-500">{dateLabel}</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="À relancer" value={toFollowUp.length} href="/dashboard/prospection/crm" />
        <StatCard label="Demandes ouvertes" value={openRequests.length} href="/dashboard/entreprise/demandes" />
        <StatCard label="Todos prioritaires" value={priorityTodos.length} href="/dashboard/working/todolist" />
        <StatCard label="Clients actifs" value={activeClients} href="/dashboard/suivi-client" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 px-6 py-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-medium text-white">Todos prioritaires</h2>
            <Link href="/dashboard/working/todolist" className="text-sm text-zinc-500 transition-colors hover:text-white">
              Voir tout
            </Link>
          </div>
          {priorityTodos.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-6 text-center text-sm text-zinc-600">
              Rien d&apos;urgent aujourd&apos;hui.
            </p>
          ) : (
            <div className="grid gap-2">
              {priorityTodos.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 px-4 py-3">
                  <p className="truncate text-sm text-white">{t.title}</p>
                  <span className="shrink-0 text-xs text-zinc-600">
                    {t.priority === "HIGH" ? "Priorité haute" : t.dueDate ? formatDate(t.dueDate) : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 px-6 py-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-medium text-white">Demandes client récentes</h2>
            <Link href="/dashboard/entreprise/demandes" className="text-sm text-zinc-500 transition-colors hover:text-white">
              Voir tout
            </Link>
          </div>
          {openRequests.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-6 text-center text-sm text-zinc-600">
              Aucune demande ouverte.
            </p>
          ) : (
            <div className="grid gap-2">
              {openRequests.slice(0, 4).map((r) => (
                <div key={r.id} className="rounded-lg border border-zinc-800 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm text-white">{r.title}</p>
                    <span className="shrink-0 text-xs text-zinc-600">{r.organizationName}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {toFollowUp.length > 0 && (
        <section className="mt-6 rounded-xl border border-zinc-800/80 bg-zinc-900/20 px-6 py-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-medium text-white">Prospects à relancer</h2>
            <Link href="/dashboard/prospection/crm" className="text-sm text-zinc-500 transition-colors hover:text-white">
              Voir le CRM
            </Link>
          </div>
          <div className="grid gap-2">
            {toFollowUp.slice(0, 4).map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 px-4 py-3">
                <p className="truncate text-sm text-white">{p.entreprise || p.nom}</p>
                <span className="shrink-0 truncate text-xs text-zinc-500">{p.prochaineAction}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-800/30"
    >
      <p className="text-xs uppercase tracking-wider text-zinc-600">{label}</p>
      <p className="mt-1 text-2xl font-medium text-white">{value}</p>
    </Link>
  );
}
