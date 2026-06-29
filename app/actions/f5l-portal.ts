"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin, requireClient } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export async function createClientRequestAction(formData: FormData) {
  const { user, organization } = await requireClient();
  const category = String(formData.get("category") ?? "support").trim();
  const priority = String(formData.get("priority") ?? "normal").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title || !description) {
    throw new Error("Titre et description requis.");
  }

  await prisma.clientRequest.create({
    data: {
      organizationId: organization.id,
      userId: user.id,
      category,
      priority,
      title,
      description,
      status: "open",
    },
  });

  revalidatePath("/client");
  revalidatePath("/client/support");
  revalidatePath("/dashboard/entreprise/demandes");
}

export async function updateClientRequestStatusAction(formData: FormData) {
  const user = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "open");

  if (!id) throw new Error("Demande introuvable.");

  await prisma.clientRequest.update({
    where: { id },
    data: { status },
  });

  void user;
  revalidatePath("/dashboard/entreprise/demandes");
}
