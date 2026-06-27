"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  defaultLaunchMusicSettings,
  LAUNCH_MUSIC_SETTINGS_KEY,
  normalizeLaunchMusicSettings,
  type LaunchMusicSettings,
} from "@/lib/launch-music-settings";

function loadSettings() {
  try {
    const raw = localStorage.getItem(LAUNCH_MUSIC_SETTINGS_KEY);
    if (!raw) return defaultLaunchMusicSettings;
    return normalizeLaunchMusicSettings(JSON.parse(raw));
  } catch {
    return defaultLaunchMusicSettings;
  }
}

export function LaunchMusicSettingsPanel() {
  const [settings, setSettings] = useState<LaunchMusicSettings>(
    defaultLaunchMusicSettings,
  );
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setSettings(loadSettings());
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(LAUNCH_MUSIC_SETTINGS_KEY, JSON.stringify(settings));
  }, [loaded, settings]);

  function updateSettings(patch: Partial<LaunchMusicSettings>) {
    setSettings((current) => ({ ...current, ...patch }));
  }

  function resetSettings() {
    setSettings(defaultLaunchMusicSettings);
  }

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-sm font-medium text-zinc-400">
        Lancement
      </h2>
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-zinc-200">
              Fenêtre musique
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Affiche une proposition de musique avant de lancer une session.
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(event) =>
                updateSettings({ enabled: event.target.checked })
              }
              className="peer sr-only"
              aria-label="Activer la fenêtre musique"
            />
            <span className="h-6 w-11 rounded-full bg-zinc-800 transition-colors peer-checked:bg-white" />
            <span className="absolute left-1 h-4 w-4 rounded-full bg-zinc-500 transition-transform peer-checked:translate-x-5 peer-checked:bg-zinc-950" />
          </label>
        </div>

        <div className="mt-6 grid gap-4">
          <div>
            <label
              htmlFor="music-app-name"
              className="mb-1.5 block text-xs font-medium text-zinc-500"
            >
              Application
            </label>
            <Input
              id="music-app-name"
              value={settings.appName}
              onChange={(event) => updateSettings({ appName: event.target.value })}
              placeholder="Apple Music"
            />
          </div>

          <div>
            <label
              htmlFor="music-launch-url"
              className="mb-1.5 block text-xs font-medium text-zinc-500"
            >
              Lien ou protocole
            </label>
            <Input
              id="music-launch-url"
              value={settings.launchUrl}
              onChange={(event) => updateSettings({ launchUrl: event.target.value })}
              placeholder="music://"
            />
            <p className="mt-1.5 text-xs text-zinc-600">
              Apple Music utilise généralement music:// sur macOS.
            </p>
          </div>

          <div>
            <label
              htmlFor="music-note"
              className="mb-1.5 block text-xs font-medium text-zinc-500"
            >
              Message
            </label>
            <textarea
              id="music-note"
              value={settings.note}
              onChange={(event) => updateSettings({ note: event.target.value })}
              className="min-h-20 w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-3 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={resetSettings}
          className="mt-5 h-9 rounded-lg border border-zinc-800 px-3 text-sm text-zinc-500 transition-colors hover:border-zinc-700 hover:text-white"
        >
          Réinitialiser
        </button>
      </div>
    </section>
  );
}
