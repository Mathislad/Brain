import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Proxy Next 16 (ex-middleware) : rafraîchit la session Supabase et protège les routes.
//
// IMPORTANT : ne jamais mettre de logique entre createServerClient et
// supabase.auth.getUser() — cela peut provoquer des déconnexions aléatoires.
// On doit toujours retourner `supabaseResponse` (pas NextResponse.next()) pour
// que les cookies de session soient correctement transmis.
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Valide le token JWT côté Supabase — seule méthode fiable.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── Brain dashboard (/dashboard/*) ─────────────────────────────────────────
  // Redirige vers la page de login admin si non authentifié.
  if (!user && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Un admin déjà connecté qui retourne sur /login ou /register → dashboard.
  if (user && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ── Portail client F5L Brain (/client/*) ────────────────────────────────────
  // Routes publiques du portail : login et onboarding (pas de session requise).
  const isPublicClientRoute =
    pathname === "/client/login" ||
    pathname.startsWith("/client/onboarding");

  // Routes protégées /client/* : redirige vers /client/login si non authentifié.
  // La vérification du rôle CLIENT est faite dans le layout (requireClient()).
  if (pathname.startsWith("/client") && !isPublicClientRoute && !user) {
    return NextResponse.redirect(new URL("/client/login", request.url));
  }

  // ── Racine / ──────────────────────────────────────────────────────────────
  // En V1, F5L Brain est la face publique : / → /client/login pour les visiteurs.
  // Les admins accèdent à Brain via /login directement.
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(user ? "/client" : "/client/login", request.url),
    );
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/login",
    "/register",
    "/client/:path*",
  ],
};
