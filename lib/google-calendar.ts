import "server-only";

import crypto from "node:crypto";

import { prisma } from "@/lib/prisma";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const TOKEN_PREFIX = "v1";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

export type GoogleCalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  htmlLink: string | null;
  start: string;
  end: string;
};

type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
};

type GoogleEventResponse = {
  id?: string;
  summary?: string;
  description?: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

export function getGoogleCalendarConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return {
      ok: false as const,
      error:
        "Google Calendar n'est pas configuré. Ajoute GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans les variables d'environnement.",
    };
  }

  return { ok: true as const, clientId, clientSecret };
}

function getEncryptionKey() {
  const secret =
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.DATABASE_URL;

  if (!secret) {
    throw new Error(
      "Clé de chiffrement manquante. Ajoute GOOGLE_TOKEN_ENCRYPTION_KEY ou configure DATABASE_URL côté serveur.",
    );
  }

  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptToken(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    TOKEN_PREFIX,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function decryptToken(value: string) {
  const [version, ivRaw, tagRaw, encryptedRaw] = value.split(":");
  if (version !== TOKEN_PREFIX || !ivRaw || !tagRaw || !encryptedRaw) {
    return value;
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivRaw, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function buildGoogleAuthUrl(origin: string, state: string) {
  const config = getGoogleCalendarConfig();
  if (!config.ok) throw new Error(config.error);

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: `${origin}/api/google-calendar/callback`,
    response_type: "code",
    scope: SCOPES,
    state,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

async function parseGoogleResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const detail =
      typeof payload?.error_description === "string"
        ? payload.error_description
        : typeof payload?.error === "string"
          ? payload.error
          : "Réponse Google invalide.";
    throw new Error(detail);
  }
  return payload as T;
}

export async function exchangeCodeForTokens(code: string, origin: string) {
  const config = getGoogleCalendarConfig();
  if (!config.ok) throw new Error(config.error);

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: `${origin}/api/google-calendar/callback`,
      grant_type: "authorization_code",
    }),
  });

  return parseGoogleResponse<GoogleTokenResponse>(response);
}

export async function refreshAccessToken(userId: string) {
  const config = getGoogleCalendarConfig();
  if (!config.ok) throw new Error(config.error);

  const connection = await prisma.googleCalendarConnection.findUnique({
    where: { userId },
  });
  if (!connection?.refreshToken) {
    throw new Error("Google Calendar doit être reconnecté.");
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: decryptToken(connection.refreshToken),
      grant_type: "refresh_token",
    }),
  });

  const fresh = await parseGoogleResponse<GoogleTokenResponse>(response);
  const expiresAt = fresh.expires_in
    ? new Date(Date.now() + fresh.expires_in * 1000)
    : connection.expiresAt;

  await prisma.googleCalendarConnection.update({
    where: { userId },
    data: {
      accessToken: encryptToken(fresh.access_token),
      tokenType: fresh.token_type ?? connection.tokenType,
      scope: fresh.scope ?? connection.scope,
      expiresAt,
    },
  });

  return fresh.access_token;
}

export async function getValidAccessToken(userId: string) {
  const connection = await prisma.googleCalendarConnection.findUnique({
    where: { userId },
  });
  if (!connection) return null;

  const expiresAt = connection.expiresAt?.getTime() ?? 0;
  const shouldRefresh = expiresAt > 0 && expiresAt < Date.now() + 60_000;
  if (shouldRefresh) return refreshAccessToken(userId);

  return decryptToken(connection.accessToken);
}

export async function getGoogleEmail(accessToken: string) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = await parseGoogleResponse<{ email?: string }>(response);
  return payload.email ?? null;
}

export async function listGoogleCalendarEvents(userId: string) {
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) return [];

  const params = new URLSearchParams({
    timeMin: new Date().toISOString(),
    maxResults: "12",
    singleEvents: "true",
    orderBy: "startTime",
  });

  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/primary/events?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const payload = await parseGoogleResponse<{ items?: GoogleEventResponse[] }>(
    response,
  );

  return (payload.items ?? [])
    .filter((item) => item.id && (item.start?.dateTime || item.start?.date))
    .map((item) => ({
      id: item.id ?? "",
      title: item.summary || "Sans titre",
      description: item.description || null,
      htmlLink: item.htmlLink || null,
      start: item.start?.dateTime || item.start?.date || "",
      end: item.end?.dateTime || item.end?.date || "",
    }));
}

export async function createGoogleCalendarEvent(
  userId: string,
  data: {
    title: string;
    description?: string;
    start: Date;
    end: Date;
  },
) {
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) throw new Error("Google Calendar n'est pas connecté.");

  const response = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: data.title,
      description: data.description || undefined,
      start: {
        dateTime: data.start.toISOString(),
        timeZone: "Europe/Paris",
      },
      end: {
        dateTime: data.end.toISOString(),
        timeZone: "Europe/Paris",
      },
    }),
  });

  await parseGoogleResponse<GoogleEventResponse>(response);
}
