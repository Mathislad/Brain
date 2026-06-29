# Audit Architecture F5L / Brain / F5L Brain

Date de l'audit : 29 juin 2026  
Mode : lecture seule pendant l'audit initial, puis creation de ce document apres validation explicite.

## 1. Resume Executif

Deux projets physiques lies a F5L et Brain ont ete detectes :

- `F5L_agency` : site vitrine public autonome, oriente SEO, conversion, formulaire de brief et prise de rendez-vous.
- `Brain` : application Next.js principale regroupant aujourd'hui le site public F5L, le portail client F5L Brain et l'administration interne Brain.

Aucun dossier separe nomme `Brain F5L` n'a ete detecte. Le portail client F5L Brain est actuellement integre dans `Brain` via les routes `/client/*`.

La recommandation d'architecture est l'option C : conserver `F5L_agency` comme site vitrine separe et faire de `Brain` l'application SaaS unique pour le portail client et l'admin interne.

Constats majeurs :

- `F5L_agency` est le site marketing le plus mature.
- `Brain` contient deja les fondations SaaS : Supabase Auth, Prisma, organisations, membres, invitations, billing, documents, portail client.
- Le portail client F5L Brain est structure mais plusieurs modules utilisent encore des donnees de demonstration si la base est vide.
- La frontiere admin/client existe dans le code, mais doit etre durcie dans certaines Server Actions.
- Les nouvelles tables metier F5L Brain n'ont pas de RLS detectee dans leurs migrations.
- Stripe, Meta Ads, Google Ads et les agents IA reels ne sont pas encore branches.

## 2. Vue D'ensemble Des Projets

| Projet | Chemin | Role | Etat |
| --- | --- | --- | --- |
| `F5L_agency` | `/Users/mathisladouceur_/Desktop/dev/F5L_agency` | Site vitrine public, SEO, leads, Calendly | Fonctionnel et coherent |
| `Brain` public | `/Users/mathisladouceur_/Desktop/dev/Brain` | Nouveau site public F5L integre dans Brain | Fonctionnel, mais formulaire contact non branche |
| `Brain /dashboard` | `/Users/mathisladouceur_/Desktop/dev/Brain/app/dashboard` | Logiciel admin interne | Avance sur CRM/prospection/sites/documents |
| `Brain /client` | `/Users/mathisladouceur_/Desktop/dev/Brain/app/client` | Portail client F5L Brain | Structure solide, donnees encore partielles |

## 3. Stack Technique Detectee

### F5L_agency

- Framework : Next.js `14.2.18`, detecte dans `F5L_agency/package.json`.
- React : `^18.3.1`.
- TypeScript : oui, detecte dans `tsconfig.json`.
- CSS : Tailwind CSS 3, detecte dans `tailwind.config.ts` et `postcss.config.mjs`.
- UI : composants maison + `lucide-react`.
- Formulaires : `react-hook-form` + `zod`.
- SEO : metadata Next, sitemap, robots, OpenGraph, JSON-LD dans `lib/schema.ts`.
- APIs externes : Airtable, n8n, Brevo, Calendly, Plausible.
- Auth : non detectee pour ce projet.
- Base de donnees : non detectee.
- Hebergement prevu : Vercel, documente dans `F5L_agency/README.md`.

### Brain

- Framework : Next.js `^16.2.9`, detecte dans `Brain/package.json`.
- React : `^19.2.7`.
- TypeScript : oui.
- CSS : Tailwind CSS 4 via `@tailwindcss/postcss`, detecte dans `postcss.config.mjs`.
- ORM : Prisma 7 avec client genere dans `/generated/prisma`, detecte dans `prisma/schema.prisma`.
- Base : Supabase PostgreSQL via `DATABASE_URL`.
- Auth : Supabase Auth SSR via `@supabase/ssr`.
- Backend : Next.js App Router, Route Handlers, Server Actions.
- Stockage fichiers : Supabase Storage detecte dans `lib/site-storage.ts`; bucket contrat mentionne dans `prisma/migrations/20260627140000_add_contrat/migration.sql`.
- APIs externes : Google Calendar branche; Stripe, Meta Ads, Google Ads, IA non branches.
- Hebergement prevu : Vercel probable, via Next.js + variables `.env.example`.

## 4. Structure Des Dossiers

### F5L_agency

```txt
F5L_agency/
  app/
    page.tsx
    services/
    merci/
    mentions-legales/
    confidentialite/
    api/lead/route.ts
    sitemap.ts
    robots.ts
    opengraph-image.tsx
  components/
    sections/
    experience/
    Header.tsx
    Footer.tsx
    CalendlyEventListener.tsx
  lib/
    constants.ts
    schema.ts
    validation.ts
    services-content.ts
  public/
    realisations/
    logos
```

Analyse :

- `app/` est propre et oriente pages publiques + SEO.
- `components/sections/` contient les blocs marketing de la landing.
- `lib/constants.ts` centralise les informations de marque, dont `SITE.calendlyUrl`.
- `app/api/lead/route.ts` est l'API centrale de conversion : lead partiel, lead complet, evenement Calendly.
- Aucun doublon auth ou DB detecte dans ce projet.

### Brain

```txt
Brain/
  app/
    (auth)/
    actions/
    api/
    client/
    dashboard/
    page.tsx
    contact/
    offres/
    systeme/
  components/
    auth/
    client/
    dashboard/
    public/
    ui/
  lib/
    auth/
    supabase/
    f5l-portal.ts
    prisma.ts
    clients-db.ts
    prospects-db.ts
    sites-db.ts
  prisma/
    schema.prisma
    migrations/
  public/
    f5l/
```

Analyse :

- `app/(auth)` gere les pages auth admin classiques : login, register, reset password, confirmation email.
- `app/client` gere F5L Brain : login client, onboarding, portail.
- `app/dashboard` gere Brain admin.
- `app/actions` contient beaucoup de logique serveur. Certaines actions admin ne verifient qu'une session et devraient utiliser `requireAdmin()`.
- `components/public` contient un site public F5L integre dans Brain, ce qui cree un doublon avec `F5L_agency`.
- `prisma/schema.prisma` contient a la fois les tables historiques du logiciel personnel et les nouvelles tables SaaS F5L Brain.

## 5. Routes Detectees

### F5L_agency

| Route | Type | Fichier source | Auth | Donnees | Etat |
| --- | --- | --- | --- | --- | --- |
| `/` | Publique | `app/page.tsx` | Non | contenu statique + JSON-LD | Fonctionnel |
| `/services` | Publique SEO | `app/services/page.tsx` | Non | `lib/services-content.ts` | Fonctionnel |
| `/services/[slug]` | Publique SEO | `app/services/[slug]/page.tsx` | Non | `getServiceBySlug()` | Fonctionnel |
| `/merci` | Post-conversion | `app/merci/page.tsx` | Non | Calendly + record Airtable | Fonctionnel |
| `/mentions-legales` | Legal | `app/mentions-legales/page.tsx` | Non | statique | A completer juridiquement |
| `/confidentialite` | Legal | `app/confidentialite/page.tsx` | Non | statique | A completer juridiquement |
| `/api/lead` | API | `app/api/lead/route.ts` | Non | Airtable, n8n, Brevo | Fonctionnel |

### Brain public

| Route | Type | Fichier source | Auth | Donnees | Etat |
| --- | --- | --- | --- | --- | --- |
| `/` | Publique | `app/page.tsx` | Non | `components/public/f5l-site.tsx` | Fonctionnel |
| `/offres` | Publique | `app/offres/page.tsx` | Non | offres statiques | Fonctionnel |
| `/systeme` | Publique | `app/systeme/page.tsx` | Non | `systemSteps` | Fonctionnel |
| `/contact` | Publique | `app/contact/page.tsx` | Non | formulaire local non soumis | Placeholder |
| `/mentions-legales` | Legal | `app/mentions-legales/page.tsx` | Non | statique | Fonctionnel |
| `/confidentialite` | Legal | `app/confidentialite/page.tsx` | Non | statique | Fonctionnel |

### Brain auth

| Route | Type | Fichier source | Auth | Donnees | Etat |
| --- | --- | --- | --- | --- | --- |
| `/login` | Auth admin | `app/(auth)/login/page.tsx` | Non | Supabase Auth | Fonctionnel |
| `/register` | Auth admin | `app/(auth)/register/page.tsx` | Non | Supabase Auth | A remplacer par demande email admin |
| `/forgot-password` | Auth | `app/(auth)/forgot-password/page.tsx` | Non | Supabase Auth | Fonctionnel |
| `/reset-password` | Auth | `app/(auth)/reset-password/page.tsx` | Non | Supabase Auth | Fonctionnel |
| `/confirm-email` | Auth | `app/(auth)/confirm-email/page.tsx` | Non | Supabase OTP | Fonctionnel |

### Brain admin

| Route | Type | Fichier source | Auth | Donnees | Etat |
| --- | --- | --- | --- | --- | --- |
| `/dashboard` | Admin | `app/dashboard/page.tsx` | Admin via layout | session | Fonctionnel |
| `/dashboard/prospection/crm` | Admin CRM | `app/dashboard/prospection/crm/page.tsx` | Admin via layout | `Prospect` | Fonctionnel |
| `/dashboard/prospection/cold-call` | Admin | `app/dashboard/prospection/cold-call/page.tsx` | Admin via layout | prospects + do-not-call | Fonctionnel |
| `/dashboard/prospection/reseaux-sociaux` | Admin | `app/dashboard/prospection/reseaux-sociaux/page.tsx` | Admin via layout | `ContentIdea` | Fonctionnel |
| `/dashboard/working/site-internet` | Admin CMS | `app/dashboard/working/site-internet/page.tsx` | Admin via layout | `Site`, `SiteItem` | Fonctionnel |
| `/dashboard/working/todolist` | Admin | `app/dashboard/working/todolist/page.tsx` | Admin via layout | `TodoItem` | Fonctionnel |
| `/dashboard/working/prompt` | Admin | `app/dashboard/working/prompt/page.tsx` | Admin via layout | `Prompt` | Fonctionnel |
| `/dashboard/organisation/agenda` | Admin | `app/dashboard/organisation/agenda/page.tsx` | Admin via layout | Google Calendar | Fonctionnel |
| `/dashboard/entreprise/client` | Admin clients | `app/dashboard/entreprise/client/page.tsx` | Admin via layout | clients/prospects | Fonctionnel |
| `/dashboard/entreprise/invitations` | Admin onboarding | `app/dashboard/entreprise/invitations/page.tsx` | Admin via layout | invitations | Fonctionnel |
| `/dashboard/entreprise/demandes` | Admin support | `app/dashboard/entreprise/demandes/page.tsx` | `requireAdmin()` | `ClientRequest` | Fonctionnel |
| `/dashboard/module/ads` | Admin module | `app/dashboard/module/ads/page.tsx` | Admin via layout | aucune | Placeholder |
| `/dashboard/module/agent-ia` | Admin module | `app/dashboard/module/agent-ia/page.tsx` | Admin via layout | aucune | Placeholder |
| `/dashboard/module/systeme-reservation` | Admin module | `app/dashboard/module/systeme-reservation/page.tsx` | Admin via layout | aucune | Placeholder |
| `/dashboard/module/carte-fidelite` | Admin module | `app/dashboard/module/carte-fidelite/page.tsx` | Admin via layout | aucune | Placeholder |

### F5L Brain client

| Route | Type | Fichier source | Auth | Donnees | Etat |
| --- | --- | --- | --- | --- | --- |
| `/client/login` | Client auth | `app/client/(auth)/login/page.tsx` | Non | Supabase Auth | Fonctionnel |
| `/client/onboarding/[token]` | Onboarding | `app/client/onboarding/[token]/page.tsx` | Token | `ClientInvitation` | Fonctionnel |
| `/client` | Portail client | `app/client/(portal)/page.tsx` | Client actif | overview, docs, billing | Partiellement mock |
| `/client/services` | Portail client | `app/client/(portal)/services/page.tsx` | Client actif | `F5lService` | Partiellement mock |
| `/client/site-internet` | Portail client | `app/client/(portal)/site-internet/page.tsx` | Client actif | `WebsiteProject` | Partiellement mock |
| `/client/meta-ads` | Portail client | `app/client/(portal)/meta-ads/page.tsx` | Client actif | `AdCampaign` | Partiellement mock |
| `/client/google-ads` | Portail client | `app/client/(portal)/google-ads/page.tsx` | Client actif | `AdCampaign` | Partiellement mock |
| `/client/crm` | Portail client | `app/client/(portal)/crm/page.tsx` | Client actif | `CrmLead` | Partiellement mock |
| `/client/automatisations` | Portail client | `app/client/(portal)/automatisations/page.tsx` | Client actif | `ClientAutomation` | Partiellement mock |
| `/client/agents-ia` | Portail client | `app/client/(portal)/agents-ia/page.tsx` | Client actif | `AiAgent`, `AiAgentLog` | Partiellement mock |
| `/client/documents` | Portail client | `app/client/(portal)/documents/page.tsx` | Client actif | `ClientDocument` | Fonctionnel |
| `/client/billing` | Portail client | `app/client/(portal)/billing/page.tsx` | Client actif | `OrganizationBilling` | Simulation |
| `/client/support` | Portail client | `app/client/(portal)/support/page.tsx` | Client actif | `ClientRequest` | Fonctionnel |

## 6. Fonctionnalites Existantes

### Site vitrine F5L

| Fonctionnalite | Projet | Etat | Fichiers |
| --- | --- | --- | --- |
| Accueil marketing | `F5L_agency` | Fonctionnel | `app/page.tsx` |
| Pages services SEO | `F5L_agency` | Fonctionnel | `app/services/page.tsx`, `app/services/[slug]/page.tsx` |
| Lead capture | `F5L_agency` | Fonctionnel | `components/sections/BriefForm.tsx`, `app/api/lead/route.ts` |
| Calendly | `F5L_agency` | Fonctionnel | `components/sections/CalendlyEmbed.tsx` |
| Pages legales | `F5L_agency` | Present | `app/mentions-legales/page.tsx`, `app/confidentialite/page.tsx` |
| SEO technique | `F5L_agency` | Fonctionnel | `app/sitemap.ts`, `app/robots.ts`, `lib/schema.ts` |
| Site public integre | `Brain` | Present | `app/page.tsx`, `components/public/f5l-site.tsx` |

### F5L Brain client

| Fonctionnalite | Etat | Donnees |
| --- | --- | --- |
| Dashboard client | Present | `getPortalOverview()` |
| Services actifs | Present | `F5lService`, fallback mock |
| Site internet | Present | `WebsiteProject`, `WebsiteTask`, fallback mock |
| Meta Ads | Present | `AdCampaign`, fallback mock |
| Google Ads | Present | `AdCampaign`, fallback mock |
| CRM | Present | `CrmPipelineStage`, `CrmLead`, fallback mock |
| Automatisations | Present | `ClientAutomation`, fallback mock |
| Agents IA | Present | `AiAgent`, `AiAgentLog`, fallback mock |
| Documents | Present | `ClientDocument` |
| Support | Present | `ClientRequest` |
| Facturation | Present mais simule | `OrganizationBilling` |
| Notifications | Present | `ClientNotification`, fallback mock |

### Brain administrateur

| Fonctionnalite | Etat | Donnees |
| --- | --- | --- |
| Dashboard admin | Present | session + clients |
| Prospection CRM | Fonctionnel | `Prospect` |
| Clients | Fonctionnel | `Prospect`, `ClientLink`, `Payment` |
| Comptabilite | Fonctionnel | `AccountingEntry`, `Payment` |
| Documents/devis/factures | Fonctionnel | `Document` |
| Contrats | Fonctionnel | `Contrat` |
| Invitations client | Fonctionnel | `ClientInvitation`, `Organization` |
| Demandes client | Fonctionnel | `ClientRequest` |
| CMS sites clients | Fonctionnel | `Site`, `SiteItem` |
| Agenda Google | Fonctionnel | `GoogleCalendarConnection` |
| Ads admin | Placeholder | Non detecte |
| Agent IA admin | Placeholder | Non detecte |
| Systeme reservation | Placeholder | Non detecte |
| Carte fidelite | Placeholder | Non detecte |

## 7. Fonctionnalites Manquantes

- Auth commune entre `F5L_agency` et `Brain` : non detectee.
- Creation admin securisee par demande email : a mettre en place.
- Stripe reel : manquant, seulement simulation dans `app/api/client/billing/simulate-checkout/route.ts`.
- Popup paiement bloquante post-onboarding : manquante.
- Calendly avant paiement dans F5L Brain : manquant, mais reutilisable depuis `F5L_agency`.
- Meta Ads API : non detectee.
- Google Ads API : non detectee.
- OpenAI/Anthropic ou moteur agents IA : non detecte.
- Tables `profiles`, `audit_logs`, `integrations`, `ad_metrics`, `crm_activities` : non detectees.
- RLS sur nouvelles tables F5L Brain : non detectee.
- Formulaire `/contact` dans Brain : formulaire visuel sans soumission.

## 8. Authentification

### Systeme actuel

L'authentification est geree par Supabase Auth :

- Client serveur : `lib/supabase/server.ts`.
- Client navigateur : `lib/supabase/client.ts`.
- Admin service role : `lib/supabase/admin.ts`.
- Lecture utilisateur courant : `lib/session.ts`.
- Proxy Next 16 : `proxy.ts`.
- Guards roles : `lib/auth/roles.ts`.

Le proxy protege :

- `/dashboard/*` vers `/login` si non connecte.
- `/client/*` vers `/client/login` si non connecte, sauf `/client/login` et `/client/onboarding/*`.

Les roles applicatifs sont stockes dans `OrganizationMember.role` avec l'enum `AppRole` :

- `OWNER`
- `ADMIN`
- `CLIENT`

L'admin est reconnu comme membre `OWNER` ou `ADMIN` de l'organisation interne `org_internal_f5l`, definie dans `lib/auth/roles.ts`.

Le client est reconnu comme membre `CLIENT` d'une organisation active.

### Creation d'un compte administrateur cible

La creation d'un compte administrateur ne doit pas etre ouverte publiquement.

Le bouton "Creer un compte administrateur" doit rediriger vers un email pre-rempli :

```txt
mailto:contact@f5l-agency.fr?subject=Demande de creation de compte administrateur&body=Bonjour, je suis [Nom / Entreprise]. Je souhaiterais obtenir un compte administrateur sur Brain. Merci.
```

Objectifs :

- eviter les inscriptions admin non controlees ;
- garder une validation manuelle par F5L ;
- creer ensuite l'utilisateur admin cote Supabase Auth uniquement apres validation ;
- rattacher l'utilisateur a `org_internal_f5l` avec le role `OWNER` ou `ADMIN`.

Impacts code :

- Remplacer ou masquer `/register` pour les admins, defini dans `app/(auth)/register/page.tsx`.
- Ajouter un CTA "Demander un acces administrateur" sur `app/(auth)/login/page.tsx`.
- Supprimer la possibilite d'auto-inscription admin en production.

### Creation d'un compte client cible

Le client doit suivre ce parcours :

1. F5L cree une invitation depuis `/dashboard/entreprise/invitations/nouveau`.
2. Le client recoit un lien `/client/onboarding/[token]`.
3. Il entre ses informations.
4. Il cree et valide son compte.
5. Les informations sont automatiquement enregistrees.
6. Il arrive dans F5L Brain.
7. Une popup paiement bloque le reste du logiciel tant que l'abonnement n'est pas actif.

Le code actuel couvre deja une partie du flux :

- Page onboarding : `app/client/onboarding/[token]/page.tsx`.
- Wizard client : `components/client/onboarding-wizard.tsx`.
- Creation compte Supabase : `app/api/client/onboarding/create-account/route.ts`.
- Validation code court : `app/api/client/onboarding/validate-code/route.ts`.
- Simulation paiement : `app/api/client/billing/simulate-checkout/route.ts`.

### Popup paiement bloquante cible

Apres creation du compte client, F5L Brain doit afficher une modal bloquante si :

```txt
organization.billing.subscriptionStatus !== "active"
```

Cette fenetre doit bloquer l'utilisation du logiciel jusqu'a paiement ou validation par admin.

Contenu recommande :

- message de bienvenue ;
- rappel qu'il est recommande de prendre rendez-vous avant paiement ;
- offres disponibles ;
- bouton "Prendre rendez-vous avec F5L" ;
- bouton "Continuer vers le paiement Stripe".

Offres a afficher d'apres la capture fournie :

| Offre | Mensuel | Installation | Description |
| --- | ---: | ---: | --- |
| Croissance | 299 EUR/mois | 499 EUR | Essentiel + carte de fidelite numerique + referencement SEO |
| Premium | 599 EUR/mois | 799 EUR | Croissance + repondeur telephonique IA + reservation en ligne |
| Campagne test 45 jours | Des 390 EUR + budget pub | A confirmer | 1 campagne ciblee Meta ou Google, page dediee, suivi des demandes, bilan chiffre |
| Systeme complet F5L Acquisition | 1 500 EUR/mois pendant 3 mois, puis 3 000 EUR/mois | A confirmer | Publicites Meta + Google, pages dediees, CRM, suivi des demandes, reporting mensuel |

### Calendly avant paiement

Avant Stripe, afficher clairement :

```txt
Avant de choisir votre abonnement, il est recommande de reserver un rendez-vous avec F5L afin de valider l'offre la plus adaptee a votre situation.
```

L'integration Calendly existe deja dans `F5L_agency` :

- Embed iframe : `components/sections/CalendlyEmbed.tsx`.
- URL configurable : `lib/constants.ts`, propriete `SITE.calendlyUrl`.
- Variable : `NEXT_PUBLIC_CALENDLY_URL` dans `.env.example`.
- Listener evenement programme : `components/CalendlyEventListener.tsx`.

Variable recommandee dans `Brain/.env.example` :

```txt
NEXT_PUBLIC_CALENDLY_URL=https://calendly.com/f5l-agency/audit-gratuit
```

## 9. Base De Donnees Actuelle

Base detectee : Supabase PostgreSQL via Prisma.

Schema principal : `prisma/schema.prisma`.  
Migrations : `prisma/migrations`.

### Inventaire tables principales

| Table | Projet | Role | Relations | RLS | Etat |
| --- | --- | --- | --- | --- | --- |
| `Prospect` | Brain | CRM/prospection | `ClientLink`, `Payment`, `Document`, `Site`, `Organization` | Oui | Fonctionnel |
| `ClientLink` | Brain | Liens client | `Prospect` | Oui | Fonctionnel |
| `Payment` | Brain | Paiements client historiques | `Prospect` | Oui | Fonctionnel |
| `AccountingEntry` | Brain | Comptabilite | aucune | Oui | Fonctionnel |
| `Document` | Brain | Devis/factures/contrats historiques | `Prospect` | Oui | Fonctionnel |
| `DoNotCall` | Brain | Liste noire telephone | user | Oui | Fonctionnel |
| `TodoItem` | Brain | Taches internes | user | Oui | Fonctionnel |
| `ContentIdea` | Brain | Reseaux sociaux | user | Oui | Fonctionnel |
| `LaunchConfig` | Brain | Sessions lancement | user | Oui | Fonctionnel |
| `GoogleCalendarConnection` | Brain | OAuth Calendar | user | Oui | Fonctionnel |
| `Contrat` | Brain | Contrats | user | Oui | Fonctionnel |
| `Prompt` | Brain | Bibliotheque prompts | user | Oui | Fonctionnel |
| `Site` | Brain | CMS sites clients | `SiteItem`, `Prospect` | Oui | Fonctionnel |
| `SiteItem` | Brain | Offres/produits sites | `Site` | Oui | Fonctionnel |
| `Organization` | F5L Brain | Tenant client/interne | membres, billing, services | Oui | Fonctionnel |
| `OrganizationMember` | F5L Brain | Roles utilisateurs | `Organization` | Oui | Fonctionnel |
| `ClientInvitation` | F5L Brain | Onboarding client | `Organization` | Oui | Fonctionnel |
| `OrganizationBilling` | F5L Brain | Abonnement | `Organization` | Oui | Simulation |
| `ClientDocument` | F5L Brain | Documents client | `Organization`, `F5lService` | Oui | Fonctionnel |
| `OrganizationFeature` | F5L Brain | Feature flags | `Organization` | Oui | Fonctionnel |
| `F5lService` | F5L Brain | Services vendus | `Organization` | Non detecte | A securiser |
| `WebsiteProject` | F5L Brain | Projet site | `F5lService`, `WebsiteTask` | Non detecte | A securiser |
| `WebsiteTask` | F5L Brain | Taches site | `WebsiteProject` | Non detecte | A securiser |
| `AdAccount` | F5L Brain | Comptes pub | `Organization` | Non detecte | A securiser |
| `AdCampaign` | F5L Brain | Campagnes pub | `Organization`, `F5lService` | Non detecte | A securiser |
| `CrmPipelineStage` | F5L Brain | Pipeline CRM client | `Organization` | Non detecte | A securiser |
| `CrmLead` | F5L Brain | Leads client | `Organization` | Non detecte | A securiser |
| `ClientAutomation` | F5L Brain | Automatisations | `Organization` | Non detecte | A securiser |
| `AiAgent` | F5L Brain | Agents IA | `Organization` | Non detecte | A securiser |
| `AiAgentLog` | F5L Brain | Logs IA | `AiAgent`, `Organization` | Non detecte | A securiser |
| `ClientRequest` | F5L Brain | Support/demandes | `Organization` | Non detecte | A securiser |
| `ClientNotification` | F5L Brain | Notifications | `Organization` | Non detecte | A securiser |

## 10. Base De Donnees Cible

| Table cible | Utilite | Relations | Acces | Priorite |
| --- | --- | --- | --- | --- |
| `profiles` | Profil utilisateur Supabase | user auth | soi/admin | V1 |
| `organizations` | Tenant client/interne | membres, services | client/admin | V1 |
| `organization_members` | Roles | organization | client/admin | V1 |
| `subscriptions` | Abonnements Stripe | organization | client read/admin write | V1 |
| `services` | Services F5L actifs | organization | client read/admin write | V1 |
| `website_projects` | Projet site client | service | client read/admin write | V1 |
| `website_tasks` | Avancement site | website project | client read/admin write | V1 |
| `ad_accounts` | Comptes Meta/Google | organization | admin/client read | V2 |
| `ad_campaigns` | Campagnes | ad account/service | client read/admin write | V1 |
| `ad_metrics` | Stats journalieres | campaign | client read/admin/integration write | V2 |
| `crm_pipeline_stages` | Etapes CRM client | organization | client/admin | V1 |
| `crm_leads` | Leads client | organization/stage | client/admin | V1 |
| `crm_activities` | Historique CRM | lead | client/admin | V2 |
| `automations` | Workflows | organization | client read/admin write | V2 |
| `automation_runs` | Executions | automation | admin/client read | V2 |
| `ai_agents` | Agents IA | organization | client read/admin write | V2 |
| `ai_agent_logs` | Historique IA | agent | admin/client read filtre | V2 |
| `documents` | Documents client | organization/service | client/admin | V1 |
| `client_requests` | Demandes support | organization | client/admin | V1 |
| `notifications` | Notifications | organization/user | client/admin | V1 |
| `invoices` | Factures Stripe | subscription | client/admin | V1 |
| `billing_events` | Webhooks Stripe | subscription | admin | V1 |
| `integrations` | Tokens externes | organization/provider | admin | V2 |
| `audit_logs` | Securite/actions | user/org | admin | V1 |

## 11. APIs Actuelles

| API | Methode | Role | Auth | Statut |
| --- | --- | --- | --- | --- |
| `F5L_agency /api/lead` | POST | Leads partiels, complets, RDV Calendly | Non | Fonctionnel |
| `Brain /api/admin/prospects-list` | GET | Liste prospects pour invitation | Session | Doit exiger admin |
| `/api/client/onboarding/create-account` | POST | Cree un user Supabase via admin SDK | Token invitation | Fonctionnel |
| `/api/client/onboarding/update-prospect` | POST | Met a jour infos client | Token invitation | Fonctionnel |
| `/api/client/onboarding/validate-code` | POST | Valide code court | Token invitation | Fonctionnel |
| `/api/client/billing/simulate-checkout` | POST | Active abonnement simule | Client | Placeholder Stripe |
| `/api/public/site/[slug]` | GET/OPTIONS | API publique CMS site | Non | Fonctionnel |
| `/api/google-calendar/connect` | GET | OAuth Google Calendar | Session | Fonctionnel |
| `/api/google-calendar/callback` | GET | Callback OAuth | Session | Fonctionnel |
| `/api/contrats/generate` | POST | Genere PDF contrat | Session | Fonctionnel |
| `/api/contrats/[id]/pdf` | GET | PDF contrat | Session | Fonctionnel |
| `/api/documents/[id]/pdf` | GET | PDF document | Session | Fonctionnel |

## 12. APIs Necessaires

### APIs internes F5L Brain V1

- `GET /api/client/dashboard`
- `GET /api/client/services`
- `GET /api/client/website`
- `GET /api/client/ads`
- `GET /api/client/crm`
- `GET /api/client/documents`
- `POST /api/client/support`
- `POST /api/client/billing/create-checkout`
- `POST /api/stripe/webhook`
- `GET /api/client/billing/portal`
- `POST /api/admin/clients`
- `PATCH /api/admin/services/:id`
- `POST /api/admin/documents`
- `PATCH /api/admin/client-requests/:id`
- `PATCH /api/admin/subscriptions/:id`

### APIs externes futures

- Meta Ads API.
- Google Ads API.
- Stripe Checkout, Billing Portal, Webhooks.
- Calendly embed + webhook.
- Supabase Storage signed URLs.
- Brevo ou Resend pour emails transactionnels.
- OpenAI/Anthropic pour agents IA.
- n8n ou moteur workflow interne pour automatisations.

## 13. Outils Et Dependances

| Outil | Projet | Usage | Critique | Etat | Recommandation |
| --- | --- | --- | --- | --- | --- |
| Next.js 14 | F5L_agency | Site vitrine | Oui | Stable | Garder |
| React 18 | F5L_agency | UI | Oui | Stable | Garder |
| Tailwind 3 | F5L_agency | Design | Oui | Stable | Garder |
| Zod | F5L_agency | Validation lead | Oui | OK | Garder |
| react-hook-form | F5L_agency | Formulaire brief | Oui | OK | Garder |
| Airtable | F5L_agency | Stockage leads | Moyen | OK | Garder tant que CRM non centralise |
| n8n | F5L_agency | Orchestration lead | Moyen | OK | Garder |
| Brevo | F5L_agency | Email/contact | Moyen | OK | Clarifier provider final |
| Calendly | F5L_agency/Brain cible | RDV | Oui | Present dans F5L_agency | Reutiliser dans Brain |
| Next.js 16 | Brain | SaaS | Oui | Recent | Surveiller compatibilite |
| React 19 | Brain | UI | Oui | Recent | Surveiller |
| Prisma 7 | Brain | ORM | Oui | OK | Garder |
| Supabase SSR | Brain | Auth/session | Oui | OK | Garder |
| Supabase Storage | Brain | Fichiers | Oui | Partiel | Formaliser buckets/policies |
| Google Calendar | Brain | Agenda | Moyen | OK | Garder |
| Stripe | Brain | Paiement | Oui | Manquant | Priorite V1 |

## 14. Schema Global Du Systeme

```txt
[Visiteur]
   |
   v
[F5L_agency - Site vitrine SEO/conversion]
   |-- /services
   |-- /merci
   |-- /api/lead -> Airtable + n8n + Brevo
   |-- Calendly
   |
   v
[Brain - App SaaS]
   |-- /login
   |      |-- admin existant -> /dashboard
   |      |-- demande compte admin -> mail pre-rempli a F5L
   |
   |-- /client/login
   |-- /client/onboarding/[token]
          |
          v
[Auth Supabase]
   |-- role OWNER/ADMIN + org_internal_f5l
   |       -> [Brain Admin /dashboard]
   |
   |-- role CLIENT + organization active
           -> [F5L Brain /client]
                |-- popup paiement si abonnement inactif
                |-- Calendly recommande avant Stripe
                |-- Stripe Checkout
                |-- Dashboard
                |-- Services
                |-- Site Internet
                |-- Meta Ads
                |-- Google Ads
                |-- CRM
                |-- Agents IA
                |-- Documents
                |-- Support
```

## 15. Schema Base De Donnees

```txt
organizations
  |-- organization_members
  |-- organization_billing / subscriptions
  |-- invoices
  |-- billing_events
  |-- services
  |     |-- website_projects
  |     |     |-- website_tasks
  |     |-- ad_accounts
  |     |-- ad_campaigns
  |     |     |-- ad_metrics
  |     |-- crm_pipeline_stages
  |     |-- crm_leads
  |     |     |-- crm_activities
  |     |-- automations
  |     |     |-- automation_runs
  |     |-- ai_agents
  |           |-- ai_agent_logs
  |-- documents
  |-- client_requests
  |-- notifications
  |-- integrations
  |-- audit_logs
```

## 16. Securite Et RLS

Points solides :

- `proxy.ts` valide la session Supabase avec `supabase.auth.getUser()`.
- `requireAdmin()` et `requireClient()` existent dans `lib/auth/roles.ts`.
- Beaucoup de tables historiques ont RLS activee dans les migrations.
- Le code court d'invitation a une protection anti brute-force dans `app/api/client/onboarding/validate-code/route.ts`.

Risques :

- RLS non detectee sur les tables creees par `prisma/migrations/20260629180000_add_f5l_brain_models/migration.sql`.
- Certaines Server Actions admin utilisent `getCurrentUser()` sans `requireAdmin()`, par exemple `app/actions/organizations.ts`.
- `/api/admin/prospects-list` verifie une session mais pas explicitement le role admin.
- `/api/public/site/[slug]` expose CORS `*`, acceptable pour contenu public mais a revoir si donnees sensibles.
- Le flux `/register` admin ne doit pas rester public en production.

Regles recommandees :

- Toute action admin doit utiliser `requireAdmin()`.
- Toute action client doit utiliser `requireClient()`.
- Toute table liee a `organizationId` doit avoir RLS fondee sur `OrganizationMember`.
- Les webhooks Stripe doivent etre verifies par signature.
- Les tokens externes doivent etre stockes chiffres ou dans un coffre adapte.

## 17. Problemes Detectes

1. Deux sites publics F5L coexistent : `F5L_agency` et le public de `Brain`.
2. Le formulaire `/contact` dans `Brain` est un placeholder.
3. `/register` permet une logique d'auto-inscription admin qui ne correspond pas a la cible.
4. La popup paiement bloquante n'existe pas encore.
5. Stripe est simule, non branche.
6. F5L Brain utilise encore des mocks sur plusieurs modules.
7. Les nouvelles tables metier F5L Brain n'ont pas de RLS detectee.
8. Certaines actions admin doivent etre durcies.
9. Meta Ads, Google Ads, agents IA et automatisations ne sont pas connectes.
10. Pas de table `profiles`, `integrations`, `audit_logs`, `ad_metrics`, `crm_activities`.

## 18. Recommandations

- Garder `F5L_agency` comme site vitrine officiel.
- Faire de `Brain` l'app SaaS unique pour admin + portail client.
- Supprimer ou limiter le site public integre dans `Brain` si `F5L_agency` reste le site SEO officiel.
- Remplacer `/register` par une demande d'acces administrateur par email pre-rempli.
- Ajouter une modal paiement bloquante apres onboarding client.
- Reutiliser l'integration Calendly de `F5L_agency` dans F5L Brain.
- Brancher Stripe avant toute mise en production client.
- Ajouter RLS aux tables F5L Brain recentes.
- Creer une interface admin pour alimenter les services, campagnes, CRM et documents client.

## 19. Architecture Cible

### Option A - Un seul monorepo avec site vitrine + F5L Brain + Brain

Avantages :

- Partage de composants, types et logique auth.
- Deploiement centralise.

Inconvenients :

- Risque de melanger SEO public et SaaS prive.
- Plus complexe a stabiliser maintenant.

Pertinence : moyenne.

### Option B - Trois projets separes

Avantages :

- Separation maximale.
- Responsabilites tres claires.

Inconvenients :

- Auth commune plus complexe.
- Plus de deploiements, variables et synchronisation.
- Trop lourd pour le stade actuel.

Pertinence : faible a moyenne.

### Option C - Site vitrine separe, Brain/F5L Brain dans la meme app SaaS

Avantages :

- Correspond deja au code actuel.
- Separation claire : marketing public d'un cote, SaaS prive de l'autre.
- Plus simple pour auth, DB et roles.
- Bon equilibre complexite/maintenabilite.

Inconvenients :

- Il faut eviter de dupliquer le site public dans `Brain`.
- Il faut bien separer `/dashboard` et `/client`.

Pertinence : forte.

Recommandation finale : Option C.

## 20. Roadmap D'implementation

### Phase 1 - Clarification architecture

Objectif : stabiliser les frontieres.

Taches :

- Confirmer `F5L_agency` comme site public officiel.
- Confirmer `Brain` comme app SaaS.
- Remplacer l'inscription admin par un mail pre-rempli.
- Ajouter `NEXT_PUBLIC_CALENDLY_URL` dans `Brain/.env.example`.
- Auditer toutes les Server Actions admin.
- Ajouter RLS aux nouvelles tables.

Fichiers concernes :

- `app/(auth)/register/page.tsx`
- `app/(auth)/login/page.tsx`
- `lib/auth/roles.ts`
- `app/actions/*`
- `prisma/migrations/*`

Critere de reussite :

- Aucun compte admin ne peut etre cree sans validation F5L.
- Aucune route admin n'est accessible sans role admin.

### Phase 2 - F5L Brain V1

Objectif : portail client exploitable.

Taches :

- Dashboard client.
- Services actifs.
- Documents.
- Support.
- Site internet.
- CRM read-only.
- Ads read-only.
- Popup paiement bloquante.
- Calendly recommande avant Stripe.

Fichiers concernes :

- `app/client/(portal)/*`
- `components/client/*`
- `lib/f5l-portal.ts`
- `app/api/client/billing/*`

Critere de reussite :

- Un client invite peut creer son compte, prendre RDV, payer, puis acceder au portail.

### Phase 3 - Brain Admin

Objectif : alimenter le portail client depuis l'admin.

Taches :

- CRUD services client.
- CRUD documents client.
- CRUD campagnes manuelles.
- Gestion demandes client.
- Gestion abonnement.
- Reporting simple.

Fichiers concernes :

- `app/dashboard/entreprise/*`
- `app/dashboard/module/*`
- `app/actions/f5l-portal.ts`

Critere de reussite :

- L'admin peut creer et mettre a jour les donnees visibles cote client.

### Phase 4 - Integrations

Objectif : connecter les donnees reelles.

Taches :

- Stripe Checkout.
- Stripe Webhooks.
- Calendly embed dans Brain.
- Meta Ads API.
- Google Ads API.
- Email provider.
- Agents IA.

Critere de reussite :

- Les paiements, rendez-vous et indicateurs campagnes remontent automatiquement.

### Phase 5 - Securite / Production

Objectif : durcir avant production.

Taches :

- RLS complete.
- Tests auth.
- Logs d'audit.
- Monitoring.
- Backups Supabase.
- Verification webhooks.

Critere de reussite :

- Isolation client/admin validee.
- Aucun acces cross-tenant possible.

## 21. Priorites V1

1. Masquer/remplacer `/register` par une demande d'acces admin par email pre-rempli.
2. Ajouter la popup paiement bloquante cote client.
3. Ajouter Calendly dans la popup avant Stripe.
4. Brancher Stripe Checkout et webhooks.
5. Ajouter RLS aux tables F5L Brain recentes.
6. Remplacer `getCurrentUser()` par `requireAdmin()` dans les actions admin sensibles.
7. Creer une interface admin pour gerer `F5lService`.
8. Brancher les documents client sur Supabase Storage ou formaliser les URLs externes.
9. Remplacer les mocks par donnees DB.
10. Ajouter `audit_logs`, `profiles`, `integrations`.

## 22. Questions Ouvertes

- Quel domaine doit porter le SaaS : `app.f5l-agency.fr`, `brain.f5l-agency.fr` ou autre ?
- `F5L_agency` reste-t-il le seul site SEO officiel ?
- Le client doit-il pouvoir modifier ses leads CRM ou seulement les consulter ?
- Les campagnes ads V1 doivent-elles etre saisies manuellement ou synchronisees ?
- Stripe doit-il encaisser installation + abonnement mensuel dans une seule session Checkout ?
- Quel Calendly exact doit etre utilise pour le rendez-vous pre-paiement ?
- Les offres affichees dans la popup doivent-elles etre toutes publiques ou filtrees selon invitation ?
- Les documents clients doivent-ils etre stockes dans Supabase Storage ou seulement lies par URL externe ?

