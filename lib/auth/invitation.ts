import "server-only";

import { createHmac, randomBytes } from "crypto";

// ─── Token d'accès (long, 7 jours) ───────────────────────────────────────────

export function generateAccessToken(): string {
  return randomBytes(32).toString("base64url");
}

// ─── Code court TOTP-like (6 chiffres, rotation 15 min) ──────────────────────
// Algorithme : HMAC-SHA256(secret, période) → troncature dynamique (HOTP).
// Le secret est stocké en hex sur l'invitation. Le code n'est jamais stocké.

export function generateShortCodeSecret(): string {
  return randomBytes(32).toString("hex");
}

function currentPeriod(): number {
  return Math.floor(Date.now() / (15 * 60 * 1000));
}

function computeCode(hexSecret: string, period: number): string {
  const hmac = createHmac("sha256", Buffer.from(hexSecret, "hex"));
  hmac.update(period.toString());
  const hash = hmac.digest();
  const offset = hash[hash.length - 1] & 0x0f;
  const code =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);
  return String(code % 1_000_000).padStart(6, "0");
}

export function getCurrentCode(hexSecret: string): string {
  return computeCode(hexSecret, currentPeriod());
}

export function validateCode(hexSecret: string, submitted: string): boolean {
  const p = currentPeriod();
  // Accepte la période courante ± 1 (tolérance 15 min)
  return [p - 1, p, p + 1].some((period) => computeCode(hexSecret, period) === submitted);
}

// Secondes restantes avant rotation du code courant
export function secondsUntilNextCode(): number {
  const periodMs = 15 * 60 * 1000;
  return Math.ceil((periodMs - (Date.now() % periodMs)) / 1000);
}
