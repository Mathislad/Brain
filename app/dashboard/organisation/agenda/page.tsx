import { redirect } from "next/navigation";

import { AgendaPlanner } from "@/components/dashboard/agenda-planner";
import {
  getGoogleCalendarConfig,
  listGoogleCalendarEvents,
  type GoogleCalendarEvent,
} from "@/lib/google-calendar";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const GOOGLE_MESSAGES: Record<string, string> = {
  connected: "Google Calendar est connecté.",
  disconnected: "Google Calendar a été déconnecté.",
  "event-created": "L'événement a été ajouté à Google Calendar.",
};

const GOOGLE_ERRORS: Record<string, string> = {
  cancelled: "Connexion Google annulée.",
  "invalid-state": "Connexion Google refusée par sécurité. Relance la connexion.",
  error: "Impossible de connecter Google Calendar pour le moment.",
  "missing-config":
    "Google Calendar n'est pas configuré. Ajoute les variables Google dans Vercel.",
  "event-invalid": "Titre ou date manquante pour créer l'événement.",
  "event-error": "Impossible de créer l'événement dans Google Calendar.",
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AgendaPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = searchParams ? await searchParams : {};
  const googleStatus = firstParam(params.google);
  const config = getGoogleCalendarConfig();
  const connection = await prisma.googleCalendarConnection.findUnique({
    where: { userId: user.id },
  });

  let events: GoogleCalendarEvent[] = [];
  let loadError: string | null = null;

  if (connection && config.ok) {
    try {
      events = await listGoogleCalendarEvents(user.id);
    } catch {
      loadError = "Impossible de lire les événements Google Calendar.";
    }
  }

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-zinc-600">
          Organisation
        </p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">
          Agenda
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">
          Centralise les rendez-vous, sessions de travail et échéances importantes
          avec une synchronisation Google Calendar.
        </p>
      </div>

      <AgendaPlanner
        connected={Boolean(connection)}
        googleEmail={connection?.googleEmail ?? null}
        events={events}
        error={
          loadError ||
          (googleStatus ? GOOGLE_ERRORS[googleStatus] ?? null : null)
        }
        message={googleStatus ? GOOGLE_MESSAGES[googleStatus] ?? null : null}
        missingConfig={!config.ok}
      />
    </div>
  );
}
