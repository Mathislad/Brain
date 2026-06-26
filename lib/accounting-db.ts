import "server-only";

import { prisma } from "@/lib/prisma";
import {
  isAccountingType,
  type AccountingEntryInput,
  type AccountingEntryItem,
} from "@/lib/accounting-types";

function dateOnly(value: string): Date {
  // Ancre à minuit UTC ; on ne ressort que la partie "YYYY-MM-DD" → pas de drift.
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) throw new Error("Date invalide.");
  return d;
}

/** Écritures manuelles de l'utilisateur, montant converti en EUROS. */
export async function getAccountingEntries(
  userId: string,
): Promise<AccountingEntryItem[]> {
  const rows = await prisma.accountingEntry.findMany({
    where: { userId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    type: r.type === "expense" ? "expense" : "income",
    title: r.title,
    amount: r.amount / 100,
    date: new Date(r.date).toISOString().slice(0, 10),
    note: r.note ?? "",
  }));
}

function sanitize(input: AccountingEntryInput) {
  if (!isAccountingType(input.type)) throw new Error("Type invalide.");
  const title = (input.title ?? "").trim().slice(0, 200);
  if (!title) throw new Error("L'intitulé est requis.");
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Le montant doit être positif.");
  }
  const amount = Math.min(Math.round(input.amount), 100_000_000_00); // plafond 100M€
  const note = (input.note ?? "").trim().slice(0, 1000) || null;
  return { type: input.type, title, amount, note, date: dateOnly(input.date) };
}

export async function createAccountingEntry(
  userId: string,
  input: AccountingEntryInput,
) {
  const data = sanitize(input);
  return prisma.accountingEntry.create({ data: { userId, ...data } });
}

export async function deleteAccountingEntry(userId: string, id: string) {
  return prisma.accountingEntry.deleteMany({ where: { id, userId } });
}

/** Import en masse (migration des anciennes données localStorage). */
export async function bulkCreateAccountingEntries(
  userId: string,
  inputs: AccountingEntryInput[],
): Promise<number> {
  const data = inputs
    .slice(0, 1000)
    .map((i) => {
      try {
        return { userId, ...sanitize(i) };
      } catch {
        return null;
      }
    })
    .filter((d): d is NonNullable<typeof d> => d !== null);

  if (data.length === 0) return 0;
  const res = await prisma.accountingEntry.createMany({ data });
  return res.count;
}
