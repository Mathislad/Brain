export interface LaunchMusicSettings {
  enabled: boolean;
  appName: string;
  launchUrl: string;
  note: string;
}

export const LAUNCH_MUSIC_SETTINGS_KEY = "brain-launch-music-settings-v1";

export const defaultLaunchMusicSettings: LaunchMusicSettings = {
  enabled: false,
  appName: "Apple Music",
  launchUrl: "music://",
  note: "Lancer la musique avant la session de travail.",
};

export function normalizeLaunchMusicSettings(value: unknown): LaunchMusicSettings {
  if (!value || typeof value !== "object") {
    return defaultLaunchMusicSettings;
  }

  const candidate = value as Partial<LaunchMusicSettings>;
  return {
    enabled: candidate.enabled === true,
    appName: String(candidate.appName || defaultLaunchMusicSettings.appName),
    launchUrl: String(candidate.launchUrl || defaultLaunchMusicSettings.launchUrl),
    note: String(candidate.note || defaultLaunchMusicSettings.note),
  };
}
