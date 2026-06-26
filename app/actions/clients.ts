"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  addClientLink,
  deleteClientLink,
  updateClientBilling,
  addPayment,
  deletePayment,
} from "@/lib/clients-db";
import type {
  ClientLinkInput,
  BillingInput,
  PaymentInput,
} from "@/lib/client-types";
import { getCurrentUser } from "@/lib/session";

export async function addClientLinkAction(data: ClientLinkInput): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await addClientLink(user.id, data);
  revalidatePath("/dashboard/entreprise/client", "layout");
}

export async function deleteClientLinkAction(linkId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await deleteClientLink(user.id, linkId);
  revalidatePath("/dashboard/entreprise/client", "layout");
}

// ─── Facturation ──────────────────────────────────────────────────────────────

export async function updateClientBillingAction(data: BillingInput): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await updateClientBilling(user.id, data);
  revalidatePath("/dashboard/entreprise/client", "layout");
}

export async function addPaymentAction(data: PaymentInput): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await addPayment(user.id, data);
  revalidatePath("/dashboard/entreprise/client", "layout");
}

export async function deletePaymentAction(paymentId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await deletePayment(user.id, paymentId);
  revalidatePath("/dashboard/entreprise/client", "layout");
}
