import type {
  Prospect,
  ClientLink,
  Payment,
  Document,
} from "@/generated/prisma/client";

export type ClientLinkCategory = "PROJECT" | "FILE" | "WEB" | "CONTACT";

export type ClientWithLinks = Prospect & {
  links: ClientLink[];
  payments: Payment[];
  documents: Document[];
};

export type BillingInput = {
  prospectId: string;
  formule: string | null;
  montantTotal: number | null; // en centimes
  devisSigne: boolean;
};

export type PaymentInput = {
  prospectId: string;
  amount: number; // en centimes
  label: string | null;
  paidAt: string | null; // ISO date "YYYY-MM-DD"
};

/** Paiement client aplati pour la compta (montant en euros, date "YYYY-MM-DD"). */
export type SyncedClientPayment = {
  id: string;
  amount: number; // en euros
  date: string; // "YYYY-MM-DD"
  label: string;
  clientName: string;
};

export const CLIENT_LINK_CATEGORIES: ClientLinkCategory[] = [
  "PROJECT",
  "FILE",
  "WEB",
  "CONTACT",
];

export function isClientLinkCategory(v: unknown): v is ClientLinkCategory {
  return v === "PROJECT" || v === "FILE" || v === "WEB" || v === "CONTACT";
}

export type ClientLinkInput = {
  prospectId: string;
  category: ClientLinkCategory;
  label: string;
  value: string;
};
