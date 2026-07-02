# Plan V1 F5L Brain — consolidé (4 agents)

Issu de l'audit AUDIT_V1_READINESS.md + 4 analyses spécialisées (sécurité, données, UX, SEO).
Objectif : backend ≈90 %, publiable. Exécution par vagues.

## Vague 1 — SÉCURITÉ (P0, bloquant, à faire en premier)

Failles ouvertes en prod. Aucune nouvelle action admin ne doit être créée avant.

- **S1** Supprimer `ensureInternalMemberAction` (invitations.ts:219) — escalade CLIENT→admin. Dead code.
- **S2** Supprimer `getInvitationForAdminAction` (invitations.ts:35) — fuite token/code cross-tenant. Dead code.
- **S3** Supprimer `addClientDocumentAction` (organizations.ts:66) — écriture cross-org. Dead code.
- **S4** `requireAdmin()` sur `getClientOrgsAction` (organizations.ts:50) — lecture cross-org.
- **S5** `requireAdmin()` sur toutes les actions dashboard (prospects, contrats, accounting, sites, todos,
  documents, clients, prompts, content-ideas, do-not-call, launch, google-calendar, invitations admin).
  NE PAS toucher : completeSignupAction, organizations client, f5l-portal, account, auth.
- **S6** Rate-limit login : Option A retenue (throttling Supabase natif, décision documentée). Login
  est client-side, pas de Server Action — Option B (conversion) reportée V2.

## Vague 2 — DONNÉES & CONNEXIONS (P0/P1, le cœur fonctionnel)

Toute nouvelle action dans f5l-admin.ts commence par requireAdmin().

- **D1** Mapping offre→services/features : `lib/offer-blueprint.ts` (neutre, pas server-only).
- **D2** Seed F5lService (+ WebsiteProject vide) dans completeSignupAction, idempotent, transaction.
- **D3** `lib/f5l-portal.ts` getOrganizationDetail : ajouter `features: true` (déjà présent — à vérifier).
- **D4** `app/actions/f5l-admin.ts` : CRUD F5lService (create/update/delete).
- **D5** f5l-admin : upsert WebsiteProject + CRUD WebsiteTask ; SiteTab gère project==null.
- **D6** f5l-admin : CRUD AdCampaign (saisie manuelle centimes) + AdAccount léger.
- **D7** f5l-admin : createClientNotification (push notif portail).
- **D8** f5l-admin : setOrganizationFeatureAction (toggles) + UI onglet Réglages.
- **D9** Features dérivées de l'offre à createInvitationAction (P1).
- **D10** CRM/Automation/AiAgent CRUD (P2, reportable V1.5).
- **D11** Contact→CRM : décision = mailto V1 conservé (Prospect.userId requis = surface risquée).

## Vague 3 — UX (P1)

- **U1** global-error.tsx racine (rend son propre html/body, style inline).
- **U2** error.tsx + not-found.tsx racine.
- **U3** dashboard/error.tsx + dashboard/not-found.tsx (dans le shell).
- **U4** client/(portal)/error.tsx + not-found.tsx (ton client, lien support).
- **U5** (auth)/error.tsx.
- **U6** client/(portal)/loading.tsx (skeleton).
- **U7** dashboard/loading.tsx (skeleton).
- **U8** Enrichir /dashboard : 4 StatusCard + listes todos/demandes (P2).
- **U9** Passe cohérence visuelle (P2).

## Vague 4 — SEO (P1)

- **O1** Corriger NEXT_PUBLIC_SITE_URL (slash final) OU normaliser dans sitemap/robots.
- **O2** Compléter sitemap : /a-propos, /mentions-legales, /confidentialite.
- **O3** robots.ts : exclure /client.
- **O4** app/opengraph-image.tsx (porté de F5L_agency) + twitter summary_large_image.
- **O5** JSON-LD Organization + WebSite dans layout.
- **O6** Descriptions meta sur mentions-legales + confidentialite.
- **O7** app/icon.png (favicon).
