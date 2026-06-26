export type AccountingType = "income" | "expense";

export function isAccountingType(v: unknown): v is AccountingType {
  return v === "income" || v === "expense";
}

/** Entrée envoyée par le client à l'action (montant en CENTIMES). */
export type AccountingEntryInput = {
  type: AccountingType;
  title: string;
  amount: number; // centimes
  date: string; // "YYYY-MM-DD"
  note: string | null;
};

/** Entrée aplatie pour l'outil (montant en EUROS, date "YYYY-MM-DD"). */
export type AccountingEntryItem = {
  id: string;
  type: AccountingType;
  title: string;
  amount: number; // euros
  date: string; // "YYYY-MM-DD"
  note: string;
};
