"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/roles";

export async function getTodosAction() {
  const user = await requireAdmin();


  return prisma.todoItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function createTodoAction(data: {
  title: string;
  context?: string;
  priority: string;
  dueDate?: string;
}) {
  const user = await requireAdmin();


  await prisma.todoItem.create({
    data: {
      userId: user.id,
      title: data.title.trim(),
      context: data.context?.trim() || null,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
  });

  revalidatePath("/dashboard/working/todolist");
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
