"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LaunchKind = "web" | "app";

interface LaunchTarget {
  id: string;
  label: string;
  target: string;
  kind: LaunchKind;
  enabled: boolean;
}

const STORAGE_KEY = "brain-launch-targets-v1";
const WORKSPACE_URL = "vscode://file/Users/mathisladouceur_/Desktop/dev/Brain";

function supabaseDashboardUrl() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const projectRef = supabaseUrl?.match(/^https:\/\/([^.]+)\.supabase\.co/)?.[1];
  return projectRef
    ? `https://supabase.com/dashboard/project/${projectRef}`
    : "https://supabase.com/dashboard/projects";
}

const defaultTargets: LaunchTarget[] = [
  {
    id: "chatgpt",
    label: "ChatGPT",
    target: "https://chatgpt.com",
    kind: "web",
    enabled: true,
  },
  {
    id: "vercel",
    label: "Vercel",
    target: "https://vercel.com/mathislads-projects/brain",
    kind: "web",
    enabled: true,
  },
  {
    id: "github",
    label: "GitHub",
    target: "https://github.com/Mathislad/Brain",
    kind: "web",
    enabled: true,
  },
  {
    id: "supabase",
    label: "Supabase",
    target: supabaseDashboardUrl(),
    kind: "web",
    enabled: true,
  },
  {
    id: "codex",
    label: "Codex",
    target: "codex://",
    kind: "app",
    enabled: true,
  },
  {
    id: "claude",
    label: "Claude",
    target: "claude://",
    kind: "app",
    enabled: true,
  },
  {
    id: "vscode",
    label: "VS Code",
    target: WORKSPACE_URL,
    kind: "app",
    enabled: true,
  },
];

function loadTargets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultTargets;
    const parsed = JSON.parse(raw) as LaunchTarget[];
    if (!Array.isArray(parsed)) return defaultTargets;

    const known = new Map(parsed.map((target) => [target.id, target]));
    return defaultTargets.map((target) => ({
      ...target,
      ...known.get(target.id),
    }));
  } catch {
    return defaultTargets;
  }
}

export function LaunchSetup() {
  const [targets, setTargets] = useState<LaunchTarget[]>(defaultTargets);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setTargets(loadTargets());
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(targets));
  }, [loaded, targets]);

  const activeTargets = useMemo(
    () => targets.filter((target) => target.enabled && target.target.trim()),
    [targets],
  );

  function updateTarget(id: string, patch: Partial<LaunchTarget>) {
    setTargets((current) =>
      current.map((target) =>
        target.id === id ? { ...target, ...patch } : target,
      ),
    );
  }

  function addTarget() {
    setTargets((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        label: "Nouvel outil",
        target: "https://",
        kind: "web",
        enabled: true,
      },
    ]);
    setEditing(true);
  }

  function removeTarget(id: string) {
    setTargets((current) => current.filter((target) => target.id !== id));
  }

  function resetTargets() {
    setTargets(defaultTargets);
    setStatus("Configuration réinitialisée.");
  }

  function launchWorkspace() {
    if (!activeTargets.length) {
      setStatus("Aucun outil actif.");
      return;
    }

    for (const target of activeTargets) {
      window.open(target.target.trim(), "_blank", "noopener,noreferrer");
    }

    setStatus(
      `${activeTargets.length} outil${activeTargets.length > 1 ? "s" : ""} lancé${activeTargets.length > 1 ? "s" : ""}.`,
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-sm font-medium text-zinc-300">
              Session de lancement
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              {activeTargets.length} outil{activeTargets.length > 1 ? "s" : ""} actif
              {activeTargets.length > 1 ? "s" : ""}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            className="h-9 rounded-lg border border-zinc-800 px-3 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
          >
            {editing ? "Fermer" : "Configurer"}
          </button>
        </div>

        <div className="mt-8">
          <Button
            type="button"
            onClick={launchWorkspace}
            className="h-14 text-base"
            disabled={!loaded || !activeTargets.length}
          >
            Mise en place
          </Button>
        </div>

        {status ? (
          <p className="mt-4 text-sm text-zinc-500" role="status">
            {status}
          </p>
        ) : null}

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {targets.map((target) => (
            <div
              key={target.id}
              className="rounded-lg border border-zinc-800/70 bg-zinc-950/40 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-zinc-200">
                    {target.label}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-widest text-zinc-700">
                    {target.kind === "web" ? "Web" : "App"}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={target.enabled}
                  onChange={(event) =>
                    updateTarget(target.id, { enabled: event.target.checked })
                  }
                  className="h-4 w-4 accent-white"
                  aria-label={`Activer ${target.label}`}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <aside className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-zinc-300">
            Configuration
          </h2>
          <button
            type="button"
            onClick={addTarget}
            className="h-8 rounded-lg bg-white px-3 text-xs font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
          >
            Ajouter
          </button>
        </div>

        {editing ? (
          <div className="mt-5 flex flex-col gap-4">
            {targets.map((target) => (
              <div
                key={target.id}
                className="rounded-lg border border-zinc-800/70 bg-zinc-950/40 p-3"
              >
                <div className="mb-3 flex items-center gap-2">
                  <Input
                    value={target.label}
                    onChange={(event) =>
                      updateTarget(target.id, { label: event.target.value })
                    }
                    aria-label="Nom de l'outil"
                    className="h-9"
                  />
                  <button
                    type="button"
                    onClick={() => removeTarget(target.id)}
                    className="h-9 w-9 rounded-lg border border-zinc-800 text-sm text-zinc-500 transition-colors hover:border-red-900/60 hover:text-red-400"
                    aria-label={`Supprimer ${target.label}`}
                  >
                    ×
                  </button>
                </div>
                <Input
                  value={target.target}
                  onChange={(event) =>
                    updateTarget(target.id, { target: event.target.value })
                  }
                  aria-label={`Adresse de ${target.label}`}
                  className="h-9"
                />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(["web", "app"] as const).map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => updateTarget(target.id, { kind })}
                      className={`h-8 rounded-lg border px-3 text-xs transition-colors ${
                        target.kind === kind
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
              onClick={resetTargets}
              className="h-9 rounded-lg border border-zinc-800 px-3 text-sm text-zinc-500 transition-colors hover:border-zinc-700 hover:text-white"
            >
              Réinitialiser
            </button>
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-zinc-800/70 bg-zinc-950/40 px-4 py-5">
            <p className="text-sm text-zinc-500">
              {activeTargets.map((target) => target.label).join(", ")}
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
