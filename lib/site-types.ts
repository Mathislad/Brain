// Types neutres pour le CMS « Site internet ».
// Pas de "server-only" ni "use server" ici : ce fichier est importé côté client
// (formulaires) ET côté serveur (db, actions, API publique).

export type SiteItemType = "OFFER" | "PRODUCT";

export const SITE_ITEM_TYPES: SiteItemType[] = ["OFFER", "PRODUCT"];

export const SITE_ITEM_TYPE_LABELS: Record<SiteItemType, string> = {
  OFFER: "Offre",
  PRODUCT: "Produit",
};

// ─── Vues renvoyées à l'UI (prix en euros) ──────────────────────────────────

export interface SiteItemView {
  id: string;
  type: SiteItemType;
  title: string;
  description: string | null;
  price: number | null; // euros
  imageUrl: string | null;
  order: number;
  visible: boolean;
}

export interface SiteView {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logoUrl: string | null;
  published: boolean;
  prospectId: string | null;
  prospectName: string | null;
  items: SiteItemView[];
  updatedAt: string; // ISO
}

// ─── Données de formulaire (prix en euros) ──────────────────────────────────

export interface SiteFormData {
  name: string;
  prospectId?: string | null;
  domain?: string | null;
  logoUrl?: string | null;
  published?: boolean;
}

export interface SiteItemFormData {
  type: SiteItemType;
  title: string;
  description?: string | null;
  price?: number | null; // euros
  imageUrl?: string | null;
  visible?: boolean;
}

// ─── Contrat de l'API publique ──────────────────────────────────────────────

export interface PublicSiteItem {
  type: SiteItemType;
  title: string;
  description: string | null;
  price: number | null; // euros
  imageUrl: string | null;
  order: number;
}

export interface PublicSitePayload {
  name: string;
  logoUrl: string | null;
  updatedAt: string; // ISO
  items: PublicSiteItem[];
}

export function isSiteItemType(value: unknown): value is SiteItemType {
  return value === "OFFER" || value === "PRODUCT";
}
