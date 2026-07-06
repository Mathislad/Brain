"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/roles";

export async function getContentIdeasAction() {
  const user = await requireAdmin();

  return prisma.contentIdea.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function createContentIdeaAction(data: {
  title: string;
  angle?: string;
  format: string;
  platform: string;
}) {
  const user = await requireAdmin();

  const idea = await prisma.contentIdea.create({
    data: {
      userId: user.id,
      title: data.title.trim(),
      angle: data.angle?.trim() || null,
      format: data.format,
      platform: data.platform,
      steps: { script: false, tournage: false, montage: false, publication: false },
    },
  });

  revalidatePath("/dashboard/prospection/reseaux-sociaux");
  return idea;
}

export async function updateContentIdeaAction(
  id: string,
  data: Partial<{
    title: string;
    angle: string;
    format: string;
    platform: string;
    plannedSlotId: string | null;
    steps: Record<string, boolean>;
  }>,
) {
  const user = await requireAdmin();

  await prisma.contentIdea.updateMany({
    where: { id, userId: user.id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.angle !== undefined && { angle: data.angle || null }),
      ...(data.format !== undefined && { format: data.format }),
      ...(data.platform !== undefined && { platform: data.platform }),
      ...(data.plannedSlotId !== undefined && { plannedSlotId: data.plannedSlotId }),
      ...(data.steps !== undefined && { steps: data.steps }),
    },
  });

  revalidatePath("/dashboard/prospection/reseaux-sociaux");
}

export async function deleteContentIdeaAction(id: string) {
  const user = await requireAdmin();

  await prisma.contentIdea.deleteMany({ where: { id, userId: user.id } });

  revalidatePath("/dashboard/prospection/reseaux-sociaux");
}
