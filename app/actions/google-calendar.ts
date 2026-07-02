"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createGoogleCalendarEvent } from "@/lib/google-calendar";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/roles";

function parseDateTime(value: FormDataEntryValue | null) {
  const raw = typeof value === "string" ? value : "";
  if (!raw) return null;

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function createAgendaEventAction(formData: FormData) {
  const user = await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const start = parseDateTime(formData.get("start"));
  const duration = Number.parseInt(String(formData.get("duration") ?? "60"), 10);

  if (!title || !start) {
    redirect("/dashboard/organisation/agenda?google=event-invalid");
  }

  const safeDuration = Number.isFinite(duration)
    ? Math.min(480, Math.max(15, duration))
    : 60;
  const end = new Date(start.getTime() + safeDuration * 60_000);

  try {
    await createGoogleCalendarEvent(user.id, {
      title,
      description,
      start,
      end,
    });
  } catch {
    redirect("/dashboard/organisation/agenda?google=event-error");
  }

  revalidatePath("/dashboard/organisation/agenda");
  redirect("/dashboard/organisation/agenda?google=event-created");
}

export async function disconnectGoogleCalendarAction() {
  const user = await requireAdmin();

  await prisma.googleCalendarConnection.deleteMany({
    where: { userId: user.id },
  });

  revalidatePath("/dashboard/organisation/agenda");
  redirect("/dashboard/organisation/agenda?google=disconnected");
}
