"use client";

import { useEffect, useMemo, useState } from "react";

import { getLaunchConfigAction, saveLaunchConfigAction } from "@/app/actions/launch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  defaultLaunchMusicSettings,
  LAUNCH_MUSIC_SETTINGS_KEY,
  normalizeLaunchMusicSettings,
  type LaunchMusicSettings,
} from "@/lib/launch-music-settings";

type LaunchKind = "web" | "app";

interface LaunchTarget {
  id: string;
  label: string;
  target: string;
  kind: LaunchKind;
  enabled: boolean;
}

interface LaunchSession {
  id: string;
  name: string;
  description: string;
  targets: LaunchTarget[];
}

const SESSIONS_STORAGE_KEY = "brain-launch-sessions-v1";
const LEGACY_TARGETS_STORAGE_KEY = "brain-launch-targets-v1";
const WORKSPACE_URL = "vscode://file/Users/mathisladouceur_/Desktop/dev/Brain";

function supabaseDashboardUrl() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const projectRef = supabaseUrl?.match(/^https:\/\/([^.]+)\.supabase\.co/)?.[1];
  return projectRef
    ? `https://supabase.com/dashboard/project/${projectRef}`
    : "https://supabase.com/dashboard/projects";
}

function target(
  id: string,
  label: string,
  targetUrl: string,
  kind: LaunchKind,
  enabled = true,
): LaunchTarget {
  return {
    id,
    label,
    target: targetUrl,
    kind,
    enabled,
  };
}

const defaultTargets: LaunchTarget[] = [
  target("chatgpt", "ChatGPT", "https://chatgpt.com", "web"),
  target("vercel", "Vercel", "https://vercel.com/mathislads-projects/brain", "web"),
  target("github", "GitHub", "https://github.com/Mathislad/Brain", "web"),
  target("supabase", "Supabase", supabaseDashboardUrl(), "web"),
  target("codex", "Codex", "codex://", "app"),
  target("claude", "Claude", "claude://", "app"),
  target("vscode", "VS Code", WORKSPACE_URL, "app"),
];

const defaultSessions: LaunchSession[] = [
  {
    id: "full-setup",
    name: "Mise en place complète",
    description: "Tout ouvrir pour travailler sur Brain.",
    targets: defaultTargets,
  },
  {
    id: "dev",
    name: "Développement",
    description: "Code, IA et repo pour avancer sur le produit.",
    targets: [
      target("dev-vscode", "VS Code", WORKSPACE_URL, "app"),
      target("dev-codex", "Codex", "codex://", "app"),
      target("dev-claude", "Claude", "claude://", "app"),
      target("dev-chatgpt", "ChatGPT", "https://chatgpt.com", "web"),
      target("dev-github", "GitHub", "https://github.com/Mathislad/Brain", "web"),
    ],
  },
  {
    id: "deployment",
    name: "Déploiement",
    description: "GitHub, Vercel et Supabase pour vérifier la prod.",
    targets: [
      target("deploy-github", "GitHub", "https://github.com/Mathislad/Brain", "web"),
      target("deploy-vercel", "Vercel", "https://vercel.com/mathislads-projects/brain", "web"),
      target("deploy-supabase", "Supabase", supabaseDashboardUrl(), "web"),
    ],
  },
];

function createEmptySession(): LaunchSession {
  return {
    id: crypto.randomUUID(),
    name: "Nouvelle session",
    description: "Configure les outils à ouvrir pour ce contexte.",
    targets: [
      target(crypto.randomUUID(), "Nouvel outil", "https://", "web"),
    ],
  };
}

function createEmptyTarget(): LaunchTarget {
  return target(crypto.randomUUID(), "Nouvel outil", "https://", "web");
}

function normalizeSessions(value: unknown): LaunchSession[] | null {
  if (!Array.isArray(value)) return null;

  const sessions = value
    .map((session) => {
      if (!session || typeof session !== "object") return null;
      const candidate = session as Partial<LaunchSession>;
      if (!candidate.id || !candidate.name || !Array.isArray(candidate.targets)) {
        return null;
      }

      return {
        id: String(candidate.id),
        name: String(candidate.name),
        description: String(candidate.description ?? ""),
        targets: candidate.targets
          .filter((targetItem): targetItem is LaunchTarget => {
            return (
              !!targetItem &&
              typeof targetItem === "object" &&
              "id" in targetItem &&
              "label" in targetItem &&
              "target" in targetItem
            );
          })
          .map((targetItem) => ({
            id: String(targetItem.id),
            label: String(targetItem.label),
            target: String(targetItem.target),
            kind: targetItem.kind === "app" ? "app" : "web",
            enabled: targetItem.enabled !== false,
          })),
      };
    })
    .filter((session): session is LaunchSession => Boolean(session));

  return sessions.length ? sessions : null;
}

function loadSessions() {
  try {
    const rawSessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (rawSessions) {
      const savedSessions = normalizeSessions(JSON.parse(rawSessions));
      if (savedSessions) return savedSessions;
    }

    const legacyTargets = localStorage.getItem(LEGACY_TARGETS_STORAGE_KEY);
    if (legacyTargets) {
      const savedTargets = JSON.parse(legacyTargets) as LaunchTarget[];
      if (Array.isArray(savedTargets)) {
        return [
          {
            ...defaultSessions[0],
            targets: defaultTargets.map((targetItem) => ({
              ...targetItem,
              ...savedTargets.find((saved) => saved.id === targetItem.id),
            })),
          },
          ...defaultSessions.slice(1),
        ];
      }
    }
  } catch {
    return defaultSessions;
  }

  return defaultSessions;
}

function saveSessionsLocally(sessions: LaunchSession[]) {
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // Local persistence is only a safety net when the server config is unavailable.
  }
}

function enabledTargets(session: LaunchSession) {
  return session.targets.filter((targetItem) => (
    targetItem.enabled && targetItem.target.trim()
  ));
}

export function LaunchSetup() {
  const [sessions, setSessions] = useState<LaunchSession[]>(defaultSessions);
  const [selectedSessionId, setSelectedSessionId] = useState(defaultSessions[0].id);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [musicSettings, setMusicSettings] = useState<LaunchMusicSettings>(
    defaultLaunchMusicSettings,
  );
  const [pendingMusicSession, setPendingMusicSession] =
    useState<LaunchSession | null>(null);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      async function loadInitialConfig() {
        let nextSessions = loadSessions();
        let fallbackMessage: string | null = null;

        try {
          const config = await getLaunchConfigAction();
          const dbSessions = config?.sessions
            ? normalizeSessions(config.sessions as unknown[])
            : null;

          if (dbSessions) {
            nextSessions = dbSessions;
          } else {
            void saveLaunchConfigAction(nextSessions).catch(() => {
              saveSessionsLocally(nextSessions);
            });
          }
        } catch {
          fallbackMessage = "Configuration locale chargée.";
          saveSessionsLocally(nextSessions);
        }

        if (cancelled) return;

        setSessions(nextSessions);
        setSelectedSessionId(nextSessions[0]?.id ?? defaultSessions[0].id);
        setMusicSettings(loadMusicSettings());
        setLoaded(true);

        if (fallbackMessage) {
          setStatus(fallbackMessage);
        }
      }

      void loadInitialConfig();
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveSessionsLocally(sessions);
    void saveLaunchConfigAction(sessions).catch(() => undefined);
  }, [loaded, sessions]);

  const selectedSession = useMemo(() => {
    return (
      sessions.find((session) => session.id === selectedSessionId) ??
      sessions[0] ??
      defaultSessions[0]
    );
  }, [selectedSessionId, sessions]);

  function updateSession(id: string, patch: Partial<LaunchSession>) {
    setSessions((current) =>
      current.map((session) =>
        session.id === id ? { ...session, ...patch } : session,
      ),
    );
  }

  function updateTarget(
    sessionId: string,
    targetId: string,
    patch: Partial<LaunchTarget>,
  ) {
    setSessions((current) =>
      current.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              targets: session.targets.map((targetItem) =>
                targetItem.id === targetId
                  ? { ...targetItem, ...patch }
                  : targetItem,
              ),
            }
          : session,
      ),
    );
  }

  function addSession() {
    const session = createEmptySession();
    setSessions((current) => [...current, session]);
    setSelectedSessionId(session.id);
    setEditing(true);
    setStatus("Nouvelle session créée.");
  }

  function duplicateSession(session: LaunchSession) {
    const duplicated = {
      ...session,
      id: crypto.randomUUID(),
      name: `${session.name} copie`,
      targets: session.targets.map((targetItem) => ({
        ...targetItem,
        id: crypto.randomUUID(),
      })),
    };
    setSessions((current) => [...current, duplicated]);
    setSelectedSessionId(duplicated.id);
    setEditing(true);
    setStatus("Session dupliquée.");
  }

  function removeSession(id: string) {
    setSessions((current) => {
      if (current.length <= 1) return current;
      const next = current.filter((session) => session.id !== id);
      setSelectedSessionId(next[0]?.id ?? defaultSessions[0].id);
      return next;
    });
    setStatus("Session supprimée.");
  }

  function addTarget(sessionId: string) {
    setSessions((current) =>
      current.map((session) =>
        session.id === sessionId
          ? { ...session, targets: [...session.targets, createEmptyTarget()] }
          : session,
      ),
    );
    setEditing(true);
  }

  function removeTarget(sessionId: string, targetId: string) {
    setSessions((current) =>
      current.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              targets: session.targets.filter((targetItem) => targetItem.id !== targetId),
            }
          : session,
      ),
    );
  }

  function resetSessions() {
    setSessions(defaultSessions);
    setSelectedSessionId(defaultSessions[0].id);
    setStatus("Sessions réinitialisées.");
  }

  function loadMusicSettings() {
    try {
      const raw = localStorage.getItem(LAUNCH_MUSIC_SETTINGS_KEY);
      if (!raw) return defaultLaunchMusicSettings;
      return normalizeLaunchMusicSettings(JSON.parse(raw));
    } catch {
      return defaultLaunchMusicSettings;
    }
  }

  function launchTargets(session: LaunchSession) {
    const activeTargets = enabledTargets(session);
    if (!activeTargets.length) {
      setStatus(`Aucun outil actif dans "${session.name}".`);
      return;
    }

    for (const targetItem of activeTargets) {
      window.open(targetItem.target.trim(), "_blank", "noopener,noreferrer");
    }

    setStatus(
      `"${session.name}" : ${activeTargets.length} outil${activeTargets.length > 1 ? "s" : ""} lancé${activeTargets.length > 1 ? "s" : ""}.`,
    );
  }

  function launchSession(session: LaunchSession) {
    const latestMusicSettings = loadMusicSettings();
    setMusicSettings(latestMusicSettings);

    if (latestMusicSettings.enabled) {
      setPendingMusicSession(session);
      return;
    }

    launchTargets(session);
  }

  function continueLaunchWithMusic() {
    if (!pendingMusicSession) return;
    const musicUrl = musicSettings.launchUrl.trim();
    if (musicUrl) {
      window.open(musicUrl, "_blank", "noopener,noreferrer");
    }
    const session = pendingMusicSession;
    setPendingMusicSession(null);
    launchTargets(session);
  }

  function continueLaunchWithoutMusic() {
    if (!pendingMusicSession) return;
    const session = pendingMusicSession;
    setPendingMusicSession(null);
    launchTargets(session);
  }

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-medium text-zinc-300">
              Sessions de lancement
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {sessions.length} session{sessions.length > 1 ? "s" : ""} configurée
              {sessions.length > 1 ? "s" : ""}.
            </p>
          </div>
          <button
            type="button"
            onClick={addSession}
            className="h-9 rounded-lg bg-white px-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
          >
            Nouvelle session
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {sessions.map((session) => {
            const activeTargets = enabledTargets(session);
            const isSelected = selectedSession.id === session.id;

            return (
              <article
                key={session.id}
                className={`rounded-xl border bg-zinc-900/30 p-5 transition-colors ${
                  isSelected
                    ? "border-zinc-600"
                    : "border-zinc-800/80 hover:border-zinc-700"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedSessionId(session.id)}
                  className="block w-full text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-white">
                        {session.name}
                      </h3>
                      <p className="mt-2 text-sm text-zinc-500">
                        {session.description}
                      </p>
                    </div>
                    <span className="rounded-full border border-zinc-800 px-2 py-1 text-xs text-zinc-500">
                      {activeTargets.length}
                    </span>
                  </div>
                </button>

                <div className="mt-5">
                  <Button
                    type="button"
                    onClick={() => launchSession(session)}
                    disabled={!loaded || !activeTargets.length}
                  >
                    Mise en place
                  </Button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {session.targets.map((targetItem) => (
                    <span
                      key={targetItem.id}
                      className={`rounded-full border px-2.5 py-1 text-xs ${
                        targetItem.enabled
                          ? "border-zinc-700 text-zinc-300"
                          : "border-zinc-900 text-zinc-700"
                      }`}
                    >
                      {targetItem.label}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>

        {status ? (
          <p className="text-sm text-zinc-500" role="status">
            {status}
          </p>
        ) : null}
      </section>

      <aside className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-zinc-300">
            Configuration
          </h2>
          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            className="h-8 rounded-lg border border-zinc-800 px-3 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
          >
            {editing ? "Fermer" : "Modifier"}
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <label className="text-xs font-medium text-zinc-500" htmlFor="session-select">
            Session active
          </label>
          <select
            id="session-select"
            value={selectedSession.id}
            onChange={(event) => setSelectedSessionId(event.target.value)}
            className="h-10 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 text-sm text-white outline-none transition-colors focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
          >
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.name}
              </option>
            ))}
          </select>
        </div>

        {editing ? (
          <div className="mt-5 flex flex-col gap-4">
            <Input
              value={selectedSession.name}
              onChange={(event) =>
                updateSession(selectedSession.id, { name: event.target.value })
              }
              aria-label="Nom de la session"
            />

            <textarea
              value={selectedSession.description}
              onChange={(event) =>
                updateSession(selectedSession.id, { description: event.target.value })
              }
              aria-label="Description de la session"
              className="min-h-20 w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-3 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => duplicateSession(selectedSession)}
                className="h-9 flex-1 rounded-lg border border-zinc-800 px-3 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
              >
                Dupliquer
              </button>
              <button
                type="button"
                onClick={() => removeSession(selectedSession.id)}
                disabled={sessions.length <= 1}
                className="h-9 flex-1 rounded-lg border border-zinc-800 px-3 text-sm text-zinc-500 transition-colors hover:border-red-900/60 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Supprimer
              </button>
            </div>

            <div className="h-px bg-zinc-800/70" />

            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-zinc-300">
                Outils
              </h3>
              <button
                type="button"
                onClick={() => addTarget(selectedSession.id)}
                className="h-8 rounded-lg bg-white px-3 text-xs font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
              >
                Ajouter
              </button>
            </div>

            {selectedSession.targets.map((targetItem) => (
              <div
                key={targetItem.id}
                className="rounded-lg border border-zinc-800/70 bg-zinc-950/40 p-3"
              >
                <div className="mb-3 flex items-center gap-2">
                  <Input
                    value={targetItem.label}
                    onChange={(event) =>
                      updateTarget(selectedSession.id, targetItem.id, {
                        label: event.target.value,
                      })
                    }
                    aria-label="Nom de l'outil"
                    className="h-9"
                  />
                  <input
                    type="checkbox"
                    checked={targetItem.enabled}
                    onChange={(event) =>
                      updateTarget(selectedSession.id, targetItem.id, {
                        enabled: event.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-white"
                    aria-label={`Activer ${targetItem.label}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeTarget(selectedSession.id, targetItem.id)}
                    className="h-9 w-9 rounded-lg border border-zinc-800 text-sm text-zinc-500 transition-colors hover:border-red-900/60 hover:text-red-400"
                    aria-label={`Supprimer ${targetItem.label}`}
                  >
                    ×
                  </button>
                </div>
                <Input
                  value={targetItem.target}
                  onChange={(event) =>
                    updateTarget(selectedSession.id, targetItem.id, {
                      target: event.target.value,
                    })
                  }
                  aria-label={`Adresse de ${targetItem.label}`}
                  className="h-9"
                />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(["web", "app"] as const).map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      onClick={() =>
                        updateTarget(selectedSession.id, targetItem.id, { kind })
                      }
                      className={`h-8 rounded-lg border px-3 text-xs transition-colors ${
                        targetItem.kind === kind
                          ? "border-white bg-white text-zinc-950"
                          : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-white"
                      }`}
                    >
                      {kind === "web" ? "Web" : "App"}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={resetSessions}
              className="h-9 rounded-lg border border-zinc-800 px-3 text-sm text-zinc-500 transition-colors hover:border-zinc-700 hover:text-white"
            >
              Réinitialiser toutes les sessions
            </button>
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-zinc-800/70 bg-zinc-950/40 px-4 py-5">
            <p className="text-sm font-medium text-zinc-200">
              {selectedSession.name}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              {selectedSession.description}
            </p>
            <p className="mt-4 text-xs uppercase tracking-widest text-zinc-700">
              {enabledTargets(selectedSession).length} outils actifs
            </p>
          </div>
        )}
        </aside>
      </div>

      {pendingMusicSession ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <p className="text-xs uppercase tracking-widest text-zinc-600">
              Mise en place
            </p>
            <h2 className="mt-2 text-xl font-medium tracking-tight text-white">
              Lancer {musicSettings.appName} ?
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              {musicSettings.note}
            </p>
            <p className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-500">
              Session : {pendingMusicSession.name}
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <Button type="button" onClick={continueLaunchWithMusic}>
                Lancer {musicSettings.appName}
              </Button>
              <button
                type="button"
                onClick={continueLaunchWithoutMusic}
                className="h-11 rounded-lg border border-zinc-800 px-4 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
              >
                Continuer sans musique
              </button>
              <button
                type="button"
                onClick={() => setPendingMusicSession(null)}
                className="h-10 text-sm text-zinc-600 transition-colors hover:text-zinc-400"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
