"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

import type { auth } from "@/lib/auth";

/**
 * Client Better Auth (navigateur).
 * `inferAdditionalFields` synchronise les champs personnalisés (ex. `role`)
 * avec le typage du serveur.
 */
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
