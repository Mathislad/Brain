"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/roles";

export async function getPromptsAction() {
  const user = await requireAdmin();

  return prisma.prompt.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function createPromptAction(data: {
  title: string;
  category: string;
  content: string;
  tags: string[];
}) {
  const user = await requireAdmin();

  return prisma.prompt.create({
    data: {
      userId: user.id,
      title: data.title.trim(),
      category: data.category.trim(),
      content: data.content.trim(),
      tags: data.tags,
    },
  });
}

export async function togglePromptFavoriteAction(id: string, favorite: boolean) {
  const user = await requireAdmin();

  await prisma.prompt.updateMany({
    where: { id, userId: user.id },
    data: { favorite },
  });
}

export async function deletePromptAction(id: string) {
  const user = await requireAdmin();

  await prisma.prompt.deleteMany({ where: { id, userId: user.id } });
}
