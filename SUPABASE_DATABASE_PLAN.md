# SUPABASE_DATABASE_PLAN — F5L Brain

Date : 2 juillet 2026
Basé sur : audit code (AUDIT_ARCHITECTURE_F5L_BRAIN.md), 17 migrations Prisma, diagnostic SQL Editor exécuté par Mathis le 2 juillet 2026.

---

## 1. Principe directeur

**Prisma est la source de vérité du schéma.** La base existe déjà (33 tables PascalCase,
82 policies), elle est en production depuis le 1er juillet. On ne crée AUCUNE table
snake_case parallèle (`profiles`, `organizations`, …) : les équivalents existent déjà
(`Organization`, `OrganizationMember`, `OrganizationBilling`, `CrmLead`, …).

**Rôle de la RLS dans ce projet : défense en profondeur.**
L'application se connecte via Prisma en rôle `postgres`, qui **bypasse la RLS**.
La vraie barrière applicative reste `requireAdmin()` / `requireClient()`
(lib/auth/roles.ts). La RLS ferme l'accès via l'API PostgREST (`anon` /
`authenticated`) de Supabase. Activer la RLS ne peut donc **pas casser l'app** —
c'est le point qui rend ce chantier sûr.

**Modèle de rôles existant (on ne le change pas) :**
- Pas de table `profiles` : les rôles vivent dans `OrganizationMember.role`
  (`OWNER` | `ADMIN` | `CLIENT`).
- Admin Brain = membre OWNER/ADMIN de l'org interne `org_internal_f5l`.
- Client = membre CLIENT de son organisation.
- Isolation par `organizationId` (tables portail) ou `userId` (tables historiques).

---

## 2. État actuel (confirmé par diagnostic du 2 juillet)

### Tables : 33 dans `public`

**Avec RLS (confirmé)** : AccountingEntry, ClientDocument, ClientInvitation,
ClientLink, ContentIdea, Contrat, Organization, OrganizationMember,
OrganizationBilling, OrganizationFeature, Prospect, Payment, Document, Site,
SiteItem, DoNotCall, TodoItem, LaunchConfig, Prompt, GoogleCalendarConnection
(liste issue des migrations ; le diagnostic partiel n'a pas contredit).

**Sans RLS (confirmé sur capture)** — les 12 tables métier F5L Brain de la
migration `20260629180000_add_f5l_brain_models` :

| Table | Colonne d'isolation |
|---|---|
| F5lService | organizationId |
| WebsiteProject | organizationId |
| WebsiteTask | websiteProjectId → WebsiteProject.organizationId |
| AdAccount | organizationId |
| AdCampaign | organizationId |
| CrmPipelineStage | organizationId |
| CrmLead | organizationId |
| ClientAutomation | organizationId |
| AiAgent | organizationId |
| AiAgentLog | organizationId |
| ClientRequest | organizationId |
| ClientNotification | organizationId (+ userId optionnel) |

### Fonctions : 2

- `is_org_admin(p_org_id text)` — SECURITY DEFINER, **search_path non verrouillé** ⚠️
- `is_org_member(p_org_id text)` — SECURITY DEFINER, **search_path non verrouillé** ⚠️

Utilisées par les policies existantes → on les corrige par `CREATE OR REPLACE`
**sans changer la signature** (les dépendances des policies sont préservées).

### Triggers : aucun (normal — Prisma gère `updatedAt` côté app)

### Storage : à re-vérifier (requêtes exécutées ensemble, résultat masqué)

Attendu d'après le code : `site-images` (public, créé par lib/site-storage.ts) ;
`contrats` (privé, création commentée dans la migration — existence incertaine).

---

## 3. Cible

1. Fonctions `is_org_admin` / `is_org_member` avec `search_path` verrouillé. ✅ Bloc 2
2. RLS activée + policies sur les 12 tables métier. ✅ Blocs 3–4
3. Buckets vérifiés, RLS Storage si nécessaire. ✅ Bloc 5
4. **Non créés en V1** (pas de consommateur dans le code aujourd'hui) :
   `ad_metrics`, `crm_activities`, `automation_runs`, `integrations`,
   `audit_logs`, `profiles`. → V2, quand un module les consommera réellement,
   via migration **Prisma** (pas via SQL Editor) pour garder la source de vérité unique.

## 4. Écart existant / cible

| Élément | Existe ? | État | Action | Priorité |
|---|---|---|---|---|
| Tables cœur (org, membres, billing, invitations) | Oui | RLS OK | Rien | — |
| 12 tables métier F5L Brain | Oui | **RLS absente** | Activer RLS + policies | **P1** |
| is_org_admin / is_org_member | Oui | search_path nu | CREATE OR REPLACE sécurisé | **P1** |
| Bucket site-images | Probable | À confirmer | Vérifier, policies si besoin | P2 |
| Bucket contrats | Incertain | À confirmer | Créer via dashboard si absent | P2 |
| Buckets client-documents / avatars / reports | Non | — | V2, quand l'app les consommera | P3 |
| audit_logs, integrations, ad_metrics, crm_activities, automation_runs | Non | — | V2 via migration Prisma | P3 |
| Triggers updated_at | Non | Prisma gère | Rien | — |
| Durcissement Server Actions (requireAdmin) | Partiel | Hors SQL | Chantier code séparé | P2 |

## 5. Ordre d'exécution (SQL Editor, bloc par bloc, validation entre chaque)

| Bloc | Contenu | Destructif ? |
|---|---|---|
| 1 | Diagnostic lecture seule | Non — ✅ fait le 2 juillet |
| 2 | CREATE OR REPLACE des 2 fonctions (search_path) | Non (remplace le corps, même signature) |
| 2b | Re-vérification Storage (2 requêtes séparées) | Non |
| 3 | ENABLE ROW LEVEL SECURITY sur les 12 tables | Non (l'app bypasse ; PostgREST passe de "tout ouvert" à "tout fermé") |
| 4 | CREATE POLICY sur les 12 tables | Non |
| 5 | Storage : buckets manquants via dashboard + policies | Non |
| 6 | Vérification finale (re-diagnostic + tests par rôle) | Non |

**Pas de bloc "types/enums"** : `AppRole` et `ProspectStatus` existent déjà (Prisma).
**Pas de bloc seed** : la prod contient des données réelles.

## 6. Modèle de policies pour les 12 tables (Bloc 4, aperçu)

Pattern identique aux policies existantes de `20260629010000_add_portal_tables` :

- **SELECT** : `is_org_member("organizationId") OR is_org_admin('org_internal_f5l')`
  (le client voit ses données, l'admin Brain voit tout)
- **INSERT / UPDATE / DELETE** : `is_org_admin('org_internal_f5l')` seul
  (les clients ne pilotent pas campagnes/services/agents via PostgREST)
- Exceptions :
  - `ClientRequest` INSERT : aussi `is_org_member` (un client crée ses demandes)
  - `ClientNotification` UPDATE : aussi `is_org_member` (marquer comme lue)
  - `WebsiteTask` : pas d'organizationId → EXISTS sur `WebsiteProject`

## 7. Risques et retour arrière

- **Bloc 2** : `CREATE OR REPLACE` conserve l'OID de la fonction → les 82 policies
  restent valides, zéro interruption. Retour arrière : rejouer l'ancienne version
  (conservée en commentaire dans le script).
- **Blocs 3–4** : la RLS ne s'applique pas au rôle `postgres` de Prisma → l'app
  (admin + portail) n'est pas affectée. Retour arrière :
  `ALTER TABLE "X" DISABLE ROW LEVEL SECURITY;` (à n'utiliser qu'en dépannage).
- **Interdits confirmés** : aucun DROP TABLE, aucun DROP COLUMN, aucun
  DROP POLICY sur les 82 policies existantes, aucune modification de données.

## 8. Synchronisation avec le repo

Chaque bloc validé dans le SQL Editor sera **aussi** enregistré dans
`prisma/migrations/<timestamp>_<nom>/migration.sql` puis marqué comme appliqué
(`prisma migrate resolve --applied`), pour que `prisma migrate status` reste
propre et que la base soit reproductible. C'est le même procédé que les RLS
historiques du projet.
