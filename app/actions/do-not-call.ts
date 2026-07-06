"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/roles";

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0033")) return `0${digits.slice(4)}`;
  if (digits.startsWith("33") && digits.length === 11) return `0${digits.slice(2)}`;
  return digits;
}

export async function getDoNotCallListAction() {
  const user = await requireAdmin();

  return prisma.doNotCall.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function addDoNotCallAction(phone: string, note: string) {
  const user = await requireAdmin();

  const normalizedPhone = normalizePhone(phone.trim());
  if (!normalizedPhone) return;

  await prisma.doNotCall.upsert({
    where: { userId_normalizedPhone: { userId: user.id, normalizedPhone } },
    create: { userId: user.id, phone: phone.trim(), normalizedPhone, note: note.trim() || null },
    update: { phone: phone.trim(), note: note.trim() || null },
  });

  revalidatePath("/dashboard/prospection/crm");
  revalidatePath("/dashboard/prospection/cold-call");
}

export async function removeDoNotCallAction(id: string) {
  const user = await requireAdmin();

  await prisma.doNotCall.deleteMany({ where: { id, userId: user.id } });

  revalidatePath("/dashboard/prospection/crm");
  revalidatePath("/dashboard/prospection/cold-call");
}

// Retire par numéro (utile en session cold call où l'on n'a pas l'id d'entrée).
export async function removeDoNotCallByPhoneAction(phone: string) {
  const user = await requireAdmin();

  const normalizedPhone = normalizePhone(phone.trim());
  if (!normalizedPhone) return;

  await prisma.doNotCall.deleteMany({ where: { userId: user.id, normalizedPhone } });

  revalidatePath("/dashboard/prospection/crm");
  revalidatePath("/dashboard/prospection/cold-call");
}
