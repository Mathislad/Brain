import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";

/**
 * Récupère la session courante côté serveur (vérification authoritative en base).
 * Mis en cache par requête via `react/cache` pour éviter les appels redondants.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/**
 * Raccourci : retourne l'utilisateur connecté, ou `null`.
 */
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  return session?.user ?? null;
});
