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
import { enforceRateLimit } from "@/lib/rate-limit";

const WRITE_LIMIT = { limit: 120, windowMs: 60 * 1000 };

function revalidateClient() {
  revalidatePath("/dashboard/entreprise/client", "layout");
}

function revalidateClientAndAccounting() {
  revalidatePath("/dashboard/entreprise/client", "layout");
  revalidatePath("/dashboard/entreprise/comptabilite", "layout");
}

export async function addClientLinkAction(data: ClientLinkInput): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  enforceRateLimit(`client-link:${user.id}`, WRITE_LIMIT);
  await addClientLink(user.id, data);
  revalidateClient();
}

export async function deleteClientLinkAction(linkId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  enforceRateLimit(`client-link:${user.id}`, WRITE_LIMIT);
  await deleteClientLink(user.id, linkId);
  revalidateClient();
}

// ─── Facturation ──────────────────────────────────────────────────────────────

export async function updateClientBillingAction(data: BillingInput): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  enforceRateLimit(`client-billing:${user.id}`, WRITE_LIMIT);
  await updateClientBilling(user.id, data);
  revalidateClient();
}

export async function addPaymentAction(data: PaymentInput): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  enforceRateLimit(`client-payment:${user.id}`, WRITE_LIMIT);
  await addPayment(user.id, data);
  // Payment partagé avec la Comptabilité → revalider les deux pages
  revalidateClientAndAccounting();
}

export async function deletePaymentAction(paymentId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  enforceRateLimit(`client-payment:${user.id}`, WRITE_LIMIT);
  await deletePayment(user.id, paymentId);
  revalidateClientAndAccounting();
}
