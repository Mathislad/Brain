"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/roles";

export type ContratStatut = "brouillon" | "envoye" | "signe" | "archive";

export interface ContratFormData {
  client_nom: string;
  client_forme_juridique: string;
  client_siret: string;
  client_adresse: string;
  client_representant: string;
  client_email: string;
  client_telephone: string;
  lieu_signature: string;
  date_signature: string;
  services_souscrits: string[];
  prix_site: string;
  prix_seo: string;
  prix_ads: string;
  prix_fidelite: string;
  prix_ia: string;
  prix_social: string;
  total_mensuel: string;
  duree_mois: "1" | "3" | "6" | "12";
  date_debut: string;
  date_fin: string;
  mode_facturation: "debut" | "fin";
  site_type?: string;
  site_nb_pages?: string;
  site_delai?: string;
  site_hebergement?: string;
  site_maintenance?: string;
  seo_zone?: string;
  seo_keywords?: string;
  seo_rapport?: string;
  ads_plateformes?: string;
  ads_budget?: string;
  ads_objectif?: string;
  ads_zone?: string;
  ads_rapport?: string;
  fidelite_plateforme?: string;
  fidelite_maintenance?: string;
  fidelite_acces?: string;
  ia_usecases?: string;
  ia_numero?: string;
  ia_rapport?: string;
  social_plateformes?: string;
  social_frequence?: string;
  social_contenus?: string;
  social_visuels?: string;
  social_validation?: string;
  social_rapport?: string;
}

export async function getContratsAction() {
  const user = await requireAdmin();
  return prisma.contrat.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function getContratAction(id: string) {
  const user = await requireAdmin();
  return prisma.contrat.findFirst({ where: { id, userId: user.id } });
}

export async function createContratAction(
  formData: ContratFormData,
  storagePath?: string,
): Promise<string> {
  const user = await requireAdmin();

  const contrat = await prisma.contrat.create({
    data: {
      userId: user.id,
      clientNom: formData.client_nom,
      clientSiret: formData.client_siret || null,
      services: formData.services_souscrits,
      total: formData.total_mensuel || null,
      dureeMois: parseInt(formData.duree_mois, 10),
      dateDebut: formData.date_debut
        ? new Date(formData.date_debut.split("/").reverse().join("-"))
        : null,
      dateSig: formData.date_signature
        ? new Date(formData.date_signature.split("/").reverse().join("-"))
        : null,
      storagePath: storagePath ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formData: formData as any,
    },
  });

  revalidatePath("/dashboard/entreprise/contrats");
  return contrat.id;
}

export async function updateContratStatutAction(id: string, statut: ContratStatut) {
  const user = await requireAdmin();
  await prisma.contrat.updateMany({
    where: { id, userId: user.id },
    data: { statut },
  });
  revalidatePath("/dashboard/entreprise/contrats");
}

export async function updateContratNotesAction(id: string, notes: string) {
  const user = await requireAdmin();
  await prisma.contrat.updateMany({
    where: { id, userId: user.id },
    data: { notes },
  });
  revalidatePath(`/dashboard/entreprise/contrats/${id}`);
}

export async function deleteContratAction(id: string) {
  const user = await requireAdmin();
  await prisma.contrat.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/dashboard/entreprise/contrats");
}
