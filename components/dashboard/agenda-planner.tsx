"use client";

import {
  createAgendaEventAction,
  disconnectGoogleCalendarAction,
} from "@/app/actions/google-calendar";
import type { GoogleCalendarEvent } from "@/lib/google-calendar";

type Props = {
  connected: boolean;
  googleEmail: string | null;
  events: GoogleCalendarEvent[];
  error: string | null;
  message: string | null;
  missingConfig: boolean;
};

function formatEventDate(value: string) {
  if (!value) return "Date non renseignée";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function defaultStartValue() {
  const date = new Date();
  date.setHours(date.getHours() + 1, 0, 0, 0);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function AgendaPlanner({
  connected,
  googleEmail,
  events,
  error,
  message,
  missingConfig,
}: Props) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(320px,420px)_1fr]">
      <section className="rounded-lg border border-zinc-800/80 bg-zinc-950/60">
        <div className="border-b border-zinc-800/70 px-5 py-4">
          <p className="text-sm font-medium text-white">Google Calendar</p>
          <p className="mt-1 text-xs text-zinc-500">
            Synchronise les rendez-vous Brain avec ton agenda principal.
          </p>
        </div>

        <div className="grid gap-4 p-5">
          {message && (
            <p className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-300">
              {message}
            </p>
          )}

          {(error || missingConfig) && (
            <p className="rounded-lg border border-amber-900/40 bg-amber-950/20 px-3 py-2 text-xs text-amber-300">
              {error ||
                "Ajoute GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans Vercel avant de connecter Google Calendar."}
            </p>
          )}

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-zinc-600">
              Statut
            </p>
            <p className="mt-1 text-sm font-medium text-white">
              {connected ? "Connecté" : "Non connecté"}
            </p>
            {googleEmail && (
              <p className="mt-1 truncate text-xs text-zinc-500">{googleEmail}</p>
            )}
          </div>

          {connected ? (
            <form action={disconnectGoogleCalendarAction}>
              <button
                type="submit"
                className="h-10 w-full rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 transition-colors hover:border-red-900/60 hover:text-red-300"
              >
                Déconnecter Google Calendar
              </button>
            </form>
          ) : (
            <a
              href="/api/google-calendar/connect"
              className={`inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors ${
                missingConfig
                  ? "pointer-events-none bg-zinc-800 text-zinc-500"
                  : "bg-white text-zinc-950 hover:bg-zinc-200"
              }`}
            >
              Connecter Google Calendar
            </a>
          )}

          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/70 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-600">
              Configuration Google
            </p>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              URI de redirection à déclarer dans Google Cloud :
              <span className="mt-1 block font-mono text-zinc-300">
                /api/google-calendar/callback
              </span>
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6">
        <section className="rounded-lg border border-zinc-800/80 bg-zinc-950/60">
          <div className="border-b border-zinc-800/70 px-5 py-4">
            <p className="text-sm font-medium text-white">Créer un événement</p>
            <p className="mt-1 text-xs text-zinc-500">
              L’événement est envoyé dans le calendrier principal connecté.
            </p>
          </div>

          <form action={createAgendaEventAction} className="grid gap-4 p-5">
            <div className="grid gap-4 md:grid-cols-[1fr_190px_130px]">
              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-zinc-500">Titre</span>
                <input
                  name="title"
                  required
                  disabled={!connected}
                  placeholder="Rendez-vous client"
                  className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-600 disabled:opacity-50"
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-zinc-500">Début</span>
                <input
                  name="start"
                  type="datetime-local"
                  required
                  disabled={!connected}
                  defaultValue={defaultStartValue()}
                  className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors focus:border-zinc-600 disabled:opacity-50"
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-zinc-500">Durée</span>
                <select
                  name="duration"
                  disabled={!connected}
                  defaultValue="60"
                  className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors focus:border-zinc-600 disabled:opacity-50"
                >
                  <option value="30">30 min</option>
                  <option value="60">1 h</option>
                  <option value="90">1 h 30</option>
                  <option value="120">2 h</option>
                </select>
              </label>
            </div>

            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-zinc-500">Notes</span>
              <textarea
                name="description"
                disabled={!connected}
                placeholder="Contexte, lien visio, points à préparer..."
                className="min-h-24 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-600 disabled:opacity-50"
              />
            </label>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!connected}
                className="h-10 rounded-lg bg-white px-5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 disabled:opacity-40"
              >
                Ajouter à Google Calendar
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-lg border border-zinc-800/80 bg-zinc-950/60">
          <div className="border-b border-zinc-800/70 px-5 py-4">
            <p className="text-sm font-medium text-white">Prochains événements</p>
            <p className="mt-1 text-xs text-zinc-500">
              Lecture des 12 prochains événements du calendrier principal.
            </p>
          </div>

          {!connected ? (
            <p className="px-5 py-8 text-sm text-zinc-500">
              Connecte Google Calendar pour afficher ton planning.
            </p>
          ) : events.length === 0 ? (
            <p className="px-5 py-8 text-sm text-zinc-500">
              Aucun événement à venir dans Google Calendar.
            </p>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {events.map((event) => (
                <a
                  key={event.id}
                  href={event.htmlLink ?? "#"}
                  target={event.htmlLink ? "_blank" : undefined}
                  rel={event.htmlLink ? "noreferrer" : undefined}
                  className="block px-5 py-4 transition-colors hover:bg-zinc-900/70"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {event.title}
                      </p>
                      {event.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                          {event.description}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 text-xs font-medium text-zinc-400">
                      {formatEventDate(event.start)}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
