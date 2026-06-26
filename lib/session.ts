import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

// Récupère l'utilisateur connecté côté serveur via Supabase.
// getUser() valide le token JWT auprès de Supabase (plus sûr que getSession()).
// Mis en cache par requête via react/cache pour éviter les appels redondants.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
