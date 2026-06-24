import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Proxy (ex-middleware, renommé dans Next 16) : protection optimiste des routes
 * basée sur la présence du cookie de session.
 *
 * Important : ceci ne VALIDE pas la session (pas d'appel base depuis l'edge),
 * c'est une redirection rapide. La vérification authoritative se fait dans les
 * pages serveur protégées via `getCurrentUser()`.
 *
 * - routes protégées  → redirigent vers /login si pas de cookie
 * - routes d'auth      → redirigent vers /dashboard si déjà connecté
 */
const PROTECTED_ROUTES = ["/dashboard"];
const AUTH_ROUTES = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(getSessionCookie(request));

  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
