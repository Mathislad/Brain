# F5L Brain — Guide développeur

## Stack

- **Framework** : Next.js 16 (App Router, Turbopack)
- **Auth** : Supabase Auth (JWT, cookies SSR via `@supabase/ssr`)
- **Base de données** : PostgreSQL via Prisma 7 + adaptateur `@prisma/adapter-pg`
- **Style** : Tailwind CSS 4
- **Déploiement** : Vercel

## Structure des routes

```
/                    → Vitrine Brain (publique)
/a-propos            → Présentation F5L (publique)
/contact             → Contact + Calendly (publique)
/offres              → Services F5L (publique)
/login               → Connexion admin Brain
/register            → Demande d'accès admin (mailto uniquement — pas d'auto-création)
/client/login        → Connexion portail client
/client/onboarding/[token] → Onboarding par invitation
/client/*            → Portail client (protégé, rôle CLIENT)
/dashboard/*         → Dashboard admin (protégé, rôle OWNER/ADMIN)
```

## Auth — deux parcours distincts

| Parcours | Route | Guard | Redirection si échec |
|----------|-------|-------|----------------------|
| Admin Brain | `/dashboard/*` | `requireAdmin()` | `/login` |
| Portail client | `/client/*` | `requireClient()` | `/client/login` |

Les guards sont définis dans `lib/auth/roles.ts` et appelés dans chaque layout serveur.

## Variables d'environnement

Copier `.env.example` en `.env.local` et remplir toutes les valeurs. Voir `.env.example` pour le détail.

Variables obligatoires au démarrage :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

Variables optionnelles (fonctionnalités dégradées si absentes) :
- `NEXT_PUBLIC_CALENDLY_URL` — fallback codé en dur si absent
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google Calendar désactivé si absent
- `GOOGLE_TOKEN_ENCRYPTION_KEY` — chiffrement tokens Google

## Commandes

```bash
pnpm dev          # Développement (Turbopack)
pnpm build        # Build production
pnpm typecheck    # Vérification TypeScript
pnpm lint         # ESLint
pnpm db:migrate   # Migrations Prisma (DIRECT_URL requis)
pnpm db:generate  # Génère le client Prisma
```

---

## ⚠️ Pièges connus

### 1. Next.js 16 — `proxy.ts` remplace `middleware.ts`

**Description** : Next.js 16 a renommé la convention du fichier middleware.
- L'ancien fichier `middleware.ts` est maintenant **déprécié**.
- Le nouveau fichier s'appelle **`proxy.ts`** à la racine du projet.

**Symptôme si mal configuré** : Si `middleware.ts` et `proxy.ts` coexistent, le serveur démarre mais **refuse silencieusement toutes les requêtes** (hang total, 0 réponse HTTP). Aucun message d'erreur dans la console browser, juste un timeout.

**Règle absolue** :
- Ne jamais créer `middleware.ts` dans ce projet.
- Toute logique de proxy/middleware va dans `proxy.ts` uniquement.
- Le fichier `proxy.ts` exporte `proxy` (fonction handler) et `config` (matcher).

```ts
// proxy.ts — pattern correct pour Next.js 16
export async function proxy(request: NextRequest) { ... }
export const config = { matcher: ["/dashboard/:path*", "/client/:path*", ...] }
```

**Source** : Erreur détectée en session juin 2026. Message Next.js :
> `Both middleware file "./middleware.ts" and proxy file "./proxy.ts" are detected. Please use "./proxy.ts" only.`

---

### 2. Supabase — getUser() peut hanger si les env vars sont vides

`supabase.auth.getUser()` dans `proxy.ts` ne retourne pas d'erreur immédiate si `NEXT_PUBLIC_SUPABASE_URL` est vide — il peut hanger indéfiniment. S'assurer que les variables d'environnement sont toujours définies avant de lancer le serveur.

---

### 3. Onboarding client — par invitation uniquement

Les clients ne peuvent pas créer de compte librement. Le flux est :
1. Admin crée une invitation depuis `/dashboard/entreprise/invitations`
2. Le client reçoit un lien vers `/client/onboarding/[token]`
3. Il saisit le code à 6 chiffres rotatif (valide 15 min, tolérance ±1 période)
4. Il crée son compte, il est redirigé vers `/client`

Ne jamais exposer une route de signup public pour les clients.

---

### 4. Admins — création manuelle uniquement

Les comptes admin sont créés manuellement par un admin existant dans Supabase Dashboard ou via l'API admin. La page `/register` est un simple mailto (pas de formulaire actif).

---

### 5. Prisma — deux connexions PostgreSQL

- `DATABASE_URL` → pooler Supabase (port 6543, mode transaction) — pour le runtime Vercel
- `DIRECT_URL` → connexion directe (port 5432) — uniquement pour `prisma migrate deploy`

Ne jamais utiliser `DIRECT_URL` en runtime, ni `DATABASE_URL` pour les migrations.
