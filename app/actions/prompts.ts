"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function getPromptsAction() {
  const user = await getCurrentUser();
  if (!user) return [];

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
  const user = await getCurrentUser();
  if (!user) return null;

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
  const user = await getCurrentUser();
  if (!user) return;

  await prisma.prompt.updateMany({
    where: { id, userId: user.id },
    data: { favorite },
  });
}

export async function deletePromptAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return;

  await prisma.prompt.deleteMany({ where: { id, userId: user.id } });
}
