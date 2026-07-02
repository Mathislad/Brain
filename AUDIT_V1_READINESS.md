# Audit V1 Readiness — F5L Brain

Date : 2 juillet 2026
Périmètre : base de données, authentification/sécurité, UX, SEO, connexions entre modules.
Objectif : backend prêt à ~90 % pour publier la V1 officiellement.

---

## Synthèse

| Domaine | Score | Verdict |
|---|---|---|
| Base de données | 9/10 | Prête. RLS 33/33, migrations propres, pooling correct. |
| Authentification / Sécurité | 5/10 | **2 failles critiques** dans les Server Actions. Bloquant V1. |
| Connexions entre modules | 5/10 | Flux onboarding complet, mais **aucun moyen de remplir les données que le portail client affiche**. |
| UX | 7/10 | États vides propres, mobile OK. Manque pages d'erreur et notifications. |
| SEO | 8/10 | Metadata complètes. Sitemap incomplet, /client non exclu de robots. |

**Verdict global : ~70 % prêt.** Les P0 se corrigent en une session ; les P1 en une à deux sessions. Après ça, le backend est publiable.

---

## 1. Sécurité / Authentification

### ✅ Ce qui est solide

- `proxy.ts` : session rafraîchie, `/dashboard/*` et `/client/*` protégés, pattern Supabase SSR correct.
- Guards `requireAdmin()` / `requireClient()` dans les layouts serveur.
- Onboarding : token + code rotatif 15 min, verrouillage après échecs (`failedAttempts`/`lockedUntil`), email figé à la complétion, résolution toujours par token (jamais par body).
- Suppression de compte : re-authentification par mot de passe + rate limit.
- Paiement simulé : vérifie code validé + membership CLIENT de l'org.
- RLS : 33/33 tables, 130 policies, fonctions `SECURITY DEFINER` verrouillées (chantier du 2 juillet).
- `getCurrentUser()` : `getUser()` (validation JWT serveur), pas `getSession()`. Cache par requête.

### 🔴 P0 — Bloquant V1 (privilege escalation)

**P0-1. `ensureInternalMemberAction()` — n'importe quel utilisateur devient admin.**
`app/actions/invitations.ts:222`. Cette action upsert le user courant comme **OWNER
de `org_internal_f5l`** avec pour seule condition d'être authentifié. Un client qui
a complété son onboarding peut l'appeler (les Server Actions exportées sont des
endpoints HTTP) et devenir admin Brain complet.
→ **Correctif** : supprimer l'action (seed runtime obsolète) ou la protéger par un
secret d'environnement + `requireAdmin()`.

**P0-2. `getClientOrgsAction()` et `addClientDocumentAction()` — accès cross-org.**
`app/actions/organizations.ts:50` et `:66`. Simple `getCurrentUser()` :
- un CLIENT peut lister **toutes les organisations** avec billing et membres ;
- un CLIENT peut **écrire un document dans n'importe quelle org** (visible par ce client).
→ **Correctif** : `requireAdmin()` sur les deux.

### 🟠 P1 — À corriger avant ou juste après le lancement

**P1-1. `getInvitationForAdminAction(id)` — non scopé + code morte.**
`app/actions/invitations.ts:35`. Retourne `accessToken` + code courant de
n'importe quelle invitation à tout utilisateur authentifié. L'action n'est
utilisée nulle part → **supprimer**.

**P1-2. Actions admin protégées par session seule.**
Toutes les actions Brain (prospects, contrats, comptabilité, invitations…) sont
scopées par `userId` (un client ne voit pas les données d'un autre user), mais un
compte CLIENT peut techniquement les appeler et créer ses propres données Brain
(prospects, invitations → organisations parasites).
→ **Correctif** : remplacer `getCurrentUser()` par `requireAdmin()` dans les
actions du dashboard (tout sauf `auth.ts`, `f5l-portal.ts`, `organizations.ts`
partie client, `account.ts`).

**P1-3. Pas de rate limit sur le login.**
`checkRateLimit` existe (lib/rate-limit.ts) mais n'est branché que sur la
suppression de compte. Ajouter sur signIn (clé : IP + email). Note : la limite
est en mémoire, donc par instance serverless — acceptable V1 (Supabase a aussi
son propre throttling), à migrer vers Upstash/Redis en V2.

### 🟡 P2

- `ssl: { rejectUnauthorized: false }` dans lib/prisma.ts — MITM théorique ;
  passer au certificat CA Supabase en V2.
- `register` est un mailto (voulu) — RAS.

---

## 2. Base de données — 9/10

- 19 migrations, `prisma migrate status` propre, base reproductible.
- Deux connexions (pooler 6543 runtime / directe 5432 migrations) — conforme.
- Index cohérents sur toutes les tables (userId, organizationId, statuts).
- RLS complète (défense en profondeur, l'app bypasse via postgres).
- Bucket `contrats` privé créé ; `site-images` auto-géré.

Reste (non bloquant V1) : `audit_logs`, `ad_metrics`, `crm_activities`,
`automation_runs` — à créer via migrations Prisma quand les modules arriveront.

---

## 3. Connexions entre modules — 5/10

### ✅ Flux complets et fonctionnels

```
Prospect (CRM) → Invitation (admin) → Onboarding (token+code) → Compte client
→ Organisation + Billing + Features → Paiement simulé → Portail actif
Demande client (portail) → Demandes client (admin, changement de statut)
Paiements client → Comptabilité (sync auto)
Site CMS (admin) → API publique /api/public/site/[slug] → site live
Google Calendar ↔ Agenda
```

### 🔴 P0 fonctionnel — le portail affiche des données que personne ne peut créer

Aucune action ni UI admin ne crée : `F5lService`, `WebsiteProject`, `WebsiteTask`,
`AdCampaign`, `AdAccount`, `CrmLead`, `CrmPipelineStage`, `ClientAutomation`,
`AiAgent`, `ClientNotification`. Depuis la suppression des mocks (2 juillet), le
portail client et le dashboard Suivi client resteront **vides pour toujours**.

→ **Correctif V1 minimal (2 volets)** :
1. **Seed à l'onboarding** : à la complétion d'une invitation, créer les
   `F5lService` correspondant à l'offre choisie (ex. offre site_web → service
   website + WebsiteProject vide).
2. **CRUD admin léger** dans Suivi client → fiche org : créer/éditer services,
   projet site (statuts + URLs + tâches), campagnes (saisie manuelle des chiffres
   en attendant les APIs Meta/Google), notifications client.

### 🟠 P1

- **Formulaire de contact** : la page /contact est un mailto + Calendly. Aucun
  lead entrant n'atterrit dans le CRM Brain. Le formulaire de brief existe dans
  F5L_agency (Airtable/n8n) — décider : brancher un formulaire → `Prospect`
  direct, ou assumer le mailto pour V1.
- **Feature flags** : consommés par le portail (✓) mais aucune UI admin pour les
  modifier après l'onboarding (défauts figés). Ajouter des toggles dans la fiche
  Suivi client.

---

## 4. UX — 7/10

### ✅
- États vides propres partout (depuis le 2 juillet), plus aucune donnée de démo.
- Sidebar réorganisée en 5 sections logiques, drawer mobile.
- Onboarding wizard par étapes, payment gate propre.

### 🟠 P1
- **Aucun `error.tsx`, `not-found.tsx`, `global-error.tsx`, `loading.tsx`**
  dans tout `app/`. Une erreur serveur = page Next.js brute ; un ID inconnu
  = 404 brute. Quick win : 3 fichiers à la racine + un par section majeure.

### 🟡 P2
- `/dashboard` (accueil admin) est quasi vide ("Bonjour, X") — un mini-résumé
  (prospects à relancer, demandes ouvertes, todos du jour) le rendrait utile.
- Aucune notification email (nouvelle demande client, invitation envoyée…) —
  tout repose sur la consultation manuelle. Brancher Brevo en V1.5.
- `ClientNotification` : le client peut les lire mais rien ne les crée (cf. §3).

---

## 5. SEO — 8/10

### ✅
- Metadata complètes sur toutes les pages publiques (title, description, OG,
  twitter, canonical, `metadataBase`).
- `robots.ts` : dashboard + auth exclus, sitemap déclaré.
- Pages privées : `robots: { index: false }` sur le layout dashboard.

### 🟠 P1
- **Sitemap incomplet** : `/a-propos` manque (page créée récemment) ;
  `/mentions-legales` et `/confidentialite` absents (optionnel mais propre).
- **`/client` non exclu dans robots.ts** : le portail client est indexable en
  théorie (les pages redirigent, mais autant l'exclure explicitement).

### 🟡 P2
- Pas d'`opengraph-image` dédiée (F5L_agency en a une) — partage social générique.
- JSON-LD (Organization/LocalBusiness) absent — présent dans F5L_agency,
  à porter si Brain devient le site principal.

---

## Plan d'action vers la V1 (ordre d'exécution)

### Session 1 — Sécurité (P0, bloquant)
1. Supprimer `ensureInternalMemberAction` et `getInvitationForAdminAction`.
2. `requireAdmin()` sur `getClientOrgsAction` + `addClientDocumentAction`.
3. `requireAdmin()` sur toutes les actions du dashboard (P1-2).
4. Rate limit sur le login (P1-3).

### Session 2 — Données portail (P0 fonctionnel)
5. Seed des `F5lService` à la complétion d'onboarding selon l'offre.
6. CRUD admin dans Suivi client : services, projet site + tâches, campagnes
   (saisie manuelle), notifications client.

### Session 3 — Finitions (P1)
7. `error.tsx` / `not-found.tsx` / `loading.tsx`.
8. Sitemap complété + `/client` dans robots.
9. Toggles feature flags dans la fiche Suivi client.
10. Décision formulaire de contact (CRM direct vs mailto).

Après les sessions 1 et 2 : **backend ≈ 90 %**, publiable. La session 3 est de la
qualité de lancement.
