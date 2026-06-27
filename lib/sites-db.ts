import "server-only";

import { prisma } from "@/lib/prisma";
import {
  isSiteItemType,
  type PublicSitePayload,
  type SiteFormData,
  type SiteItemFormData,
  type SiteItemType,
  type SiteItemView,
  type SiteView,
} from "@/lib/site-types";

// ─── Conversions centimes ↔ euros ───────────────────────────────────────────

function toEuros(cents: number | null): number | null {
  return cents == null ? null : Math.round(cents) / 100;
}

function toCents(euros: number | null | undefined): number | null {
  if (euros == null || Number.isNaN(euros)) return null;
  return Math.round(euros * 100);
}

// ─── Slug ───────────────────────────────────────────────────────────────────

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "site";
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

// ─── Sanitisation ───────────────────────────────────────────────────────────

function clean(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function normalizeType(value: SiteItemType | undefined): SiteItemType {
  return isSiteItemType(value) ? value : "OFFER";
}

// ─── Mapping DB → vue ───────────────────────────────────────────────────────

type DbSiteItem = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  price: number | null;
  imageUrl: string | null;
  order: number;
  visible: boolean;
};

function mapItem(item: DbSiteItem): SiteItemView {
  return {
    id: item.id,
    type: normalizeType(item.type as SiteItemType),
    title: item.title,
    description: item.description,
    price: toEuros(item.price),
    imageUrl: item.imageUrl,
    order: item.order,
    visible: item.visible,
  };
}

// ─── Lecture (owner) ────────────────────────────────────────────────────────

export async function getSites(userId: string): Promise<SiteView[]> {
  const sites = await prisma.site.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: { orderBy: { order: "asc" } },
      prospect: { select: { nom: true, entreprise: true } },
    },
  });

  return sites.map((site) => ({
    id: site.id,
    name: site.name,
    slug: site.slug,
    domain: site.domain,
    logoUrl: site.logoUrl,
    published: site.published,
    prospectId: site.prospectId,
    prospectName:
      site.prospect?.entreprise?.trim() ||
      site.prospect?.nom?.trim() ||
      null,
    items: site.items.map(mapItem),
    updatedAt: site.updatedAt.toISOString(),
  }));
}

export async function getSiteById(
  userId: string,
  id: string,
): Promise<SiteView | null> {
  const site = await prisma.site.findFirst({
    where: { id, userId },
    include: {
      items: { orderBy: { order: "asc" } },
      prospect: { select: { nom: true, entreprise: true } },
    },
  });
  if (!site) return null;
  return {
    id: site.id,
    name: site.name,
    slug: site.slug,
    domain: site.domain,
    logoUrl: site.logoUrl,
    published: site.published,
    prospectId: site.prospectId,
    prospectName:
      site.prospect?.entreprise?.trim() || site.prospect?.nom?.trim() || null,
    items: site.items.map(mapItem),
    updatedAt: site.updatedAt.toISOString(),
  };
}

// ─── Lecture publique (API) ─────────────────────────────────────────────────

export async function getPublicSiteBySlug(
  slug: string,
): Promise<PublicSitePayload | null> {
  const site = await prisma.site.findFirst({
    where: { slug, published: true },
    include: {
      items: {
        where: { visible: true },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!site) return null;

  return {
    name: site.name,
    logoUrl: site.logoUrl,
    updatedAt: site.updatedAt.toISOString(),
    items: site.items.map((item) => ({
      type: normalizeType(item.type as SiteItemType),
      title: item.title,
      description: item.description,
      price: toEuros(item.price),
      imageUrl: item.imageUrl,
      order: item.order,
    })),
  };
}

// ─── Écriture : Site ────────────────────────────────────────────────────────

export async function createSite(
  userId: string,
  data: SiteFormData,
): Promise<string> {
  const name = clean(data.name) ?? "Nouveau site";
  const base = slugify(name);

  // Très faible probabilité de collision ; on réessaie avec un nouveau suffixe.
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = `${base}-${randomSuffix()}`;
    try {
      const site = await prisma.site.create({
        data: {
          userId,
          name,
          slug,
          prospectId: clean(data.prospectId),
          domain: clean(data.domain),
          logoUrl: clean(data.logoUrl),
          published: data.published ?? true,
        },
      });
      return site.id;
    } catch (e) {
      if (isUniqueViolation(e) && attempt < 4) continue;
      throw e;
    }
  }
  throw new Error("Impossible de générer un identifiant de site unique.");
}

export async function updateSite(
  userId: string,
  id: string,
  data: SiteFormData,
): Promise<void> {
  const result = await prisma.site.updateMany({
    where: { id, userId },
    data: {
      name: clean(data.name) ?? "Nouveau site",
      prospectId: clean(data.prospectId),
      domain: clean(data.domain),
      logoUrl: clean(data.logoUrl),
      ...(data.published === undefined ? {} : { published: data.published }),
    },
  });
  if (result.count === 0) throw new Error("Site introuvable.");
}

export async function deleteSite(userId: string, id: string): Promise<void> {
  const result = await prisma.site.deleteMany({ where: { id, userId } });
  if (result.count === 0) throw new Error("Site introuvable.");
}

// ─── Écriture : SiteItem ────────────────────────────────────────────────────

async function assertSiteOwnership(userId: string, siteId: string): Promise<void> {
  const site = await prisma.site.findFirst({
    where: { id: siteId, userId },
    select: { id: true },
  });
  if (!site) throw new Error("Site introuvable.");
}

export async function createSiteItem(
  userId: string,
  siteId: string,
  data: SiteItemFormData,
): Promise<void> {
  await assertSiteOwnership(userId, siteId);

  const last = await prisma.siteItem.findFirst({
    where: { siteId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const nextOrder = (last?.order ?? -1) + 1;

  await prisma.siteItem.create({
    data: {
      userId,
      siteId,
      type: normalizeType(data.type),
      title: clean(data.title) ?? "Sans titre",
      description: clean(data.description),
      price: toCents(data.price),
      imageUrl: clean(data.imageUrl),
      order: nextOrder,
      visible: data.visible ?? true,
    },
  });
}

export async function updateSiteItem(
  userId: string,
  id: string,
  data: SiteItemFormData,
): Promise<void> {
  const result = await prisma.siteItem.updateMany({
    where: { id, userId },
    data: {
      type: normalizeType(data.type),
      title: clean(data.title) ?? "Sans titre",
      description: clean(data.description),
      price: toCents(data.price),
      imageUrl: clean(data.imageUrl),
      ...(data.visible === undefined ? {} : { visible: data.visible }),
    },
  });
  if (result.count === 0) throw new Error("Élément introuvable.");
}

export async function deleteSiteItem(userId: string, id: string): Promise<void> {
  const result = await prisma.siteItem.deleteMany({ where: { id, userId } });
  if (result.count === 0) throw new Error("Élément introuvable.");
}

export async function reorderSiteItems(
  userId: string,
  siteId: string,
  orderedIds: string[],
): Promise<void> {
  await assertSiteOwnership(userId, siteId);
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.siteItem.updateMany({
        where: { id, userId, siteId },
        data: { order: index },
      }),
    ),
  );
}

// ─── Util ───────────────────────────────────────────────────────────────────

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "P2002"
  );
}
