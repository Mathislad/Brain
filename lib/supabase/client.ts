"use client";

import { createBrowserClient } from "@supabase/ssr";

// Client navigateur — utiliser dans les Client Components uniquement.
// Les tokens de session sont automatiquement stockés dans les cookies
// pour que le serveur puisse les lire.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
