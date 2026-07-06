"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/roles";

export async function getTodosAction() {
  const user = await requireAdmin();

  return prisma.todoItem.findMany({
    where: { userId: user.id },
    include: {
      prospect: {
        select: {
          id: true,
          nom: true,
          entreprise: true,
          telephone: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createTodoAction(data: {
  title: string;
  context?: string;
  priority: string;
  dueDate?: string;
  prospectId?: string;
}) {
  const user = await requireAdmin();
  const title = data.title.trim();
  const priority = ["LOW", "MEDIUM", "HIGH"].includes(data.priority)
    ? data.priority
    : "MEDIUM";

  if (!title) {
    throw new Error("Le titre de la tâche est requis.");
  }

  if (data.prospectId) {
    const prospect = await prisma.prospect.findFirst({
      where: { id: data.prospectId, userId: user.id },
      select: { id: true },
    });

    if (!prospect) {
      throw new Error("Prospect introuvable.");
    }
  }

  await prisma.todoItem.create({
    data: {
      userId: user.id,
      prospectId: data.prospectId || null,
      title,
      context: data.context?.trim() || null,
      priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
  });

  revalidatePath("/dashboard/working/todolist");
  revalidatePath("/dashboard/prospection", "layout");
}

export async function updateTodoStatusAction(id: string, status: string) {
  const user = await requireAdmin();

  await prisma.todoItem.updateMany({
    where: { id, userId: user.id },
    data: { status },
  });

  revalidatePath("/dashboard/working/todolist");
}

export async function deleteTodoAction(id: string) {
  const user = await requireAdmin();

  await prisma.todoItem.deleteMany({ where: { id, userId: user.id } });

  revalidatePath("/dashboard/working/todolist");
}
