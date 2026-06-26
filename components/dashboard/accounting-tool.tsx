"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  createAccountingEntryAction,
  deleteAccountingEntryAction,
  migrateAccountingEntriesAction,
} from "@/app/actions/accounting";
import type { AccountingEntryItem, AccountingType } from "@/lib/accounting-types";
import type { SyncedClientPayment } from "@/lib/client-types";

type EntrySource = "manual" | "client";

interface Row {
  id: string;
  type: AccountingType;
  title: string;
  amount: number; // euros
  date: string; // YYYY-MM-DD
  note: string;
  source: EntrySource;
}

interface BalanceReport {
  generatedAt: string;
  income: number;
  expenses: number;
  profit: number;
  incomeCount: number;
  expenseCount: number;
  biggestIncome: Row | null;
  biggestExpense: Row | null;
}

const LEGACY_STORAGE_KEY = "brain.accounting.entries.v1";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function formatDate(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function buildThirtyDayReport(rows: Row[]): BalanceReport {
  const start = new Date();
  start.setDate(start.getDate() - 30);
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const recent = rows.filter((r) => {
    const d = new Date(`${r.date}T12:00:00`);
    return d >= start && d <= end;
  });
  const incomeEntries = recent.filter((r) => r.type === "income");
  const expenseEntries = recent.filter((r) => r.type === "expense");
  const income = incomeEntries.reduce((t, r) => t + r.amount, 0);
  const expenses = expenseEntries.reduce((t, r) => t + r.amount, 0);

  return {
    generatedAt: new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date()),
    income,
    expenses,
    profit: income - expenses,
    incomeCount: incomeEntries.length,
    expenseCount: expenseEntries.length,
    biggestIncome: [...incomeEntries].sort((a, b) => b.amount - a.amount)[0] ?? null,
    biggestExpense: [...expenseEntries].sort((a, b) => b.amount - a.amount)[0] ?? null,
  };
}

export function AccountingTool({
  entries = [],
  clientPayments = [],
}: {
  entries?: AccountingEntryItem[];
  clientPayments?: SyncedClientPayment[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<AccountingType>("income");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayInputValue);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<BalanceReport | null>(null);

  // Migration unique des anciennes écritures localStorage → DB
  useEffect(() => {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const inputs = (Array.isArray(parsed) ? parsed : [])
        .filter((e) => e?.title && Number.isFinite(Number(e.amount)) && Number(e.amount) > 0)
        .map((e) => ({
          type: e.type === "expense" ? ("expense" as const) : ("income" as const),
          title: String(e.title),
          amount: Math.round(Number(e.amount) * 100),
          date: typeof e.date === "string" && e.date ? e.date : todayInputValue(),
          note: e.note ? String(e.note) : null,
        }));
      if (inputs.length === 0) {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        return;
      }
      startTransition(async () => {
        await migrateAccountingEntriesAction(inputs);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        router.refresh();
      });
    } catch {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const manualRows = useMemo<Row[]>(
    () => entries.map((e) => ({ ...e, source: "manual" as const })),
    [entries],
  );

  const syncedRows = useMemo<Row[]>(
    () =>
      clientPayments.map((p) => ({
        id: `client:${p.id}`,
        type: "income" as const,
        title: p.clientName,
        amount: p.amount,
        date: p.date,
        note: p.label,
        source: "client" as const,
      })),
    [clientPayments],
  );

  const rows = useMemo(() => [...syncedRows, ...manualRows], [syncedRows, manualRows]);

  const totals = useMemo(() => {
    const income = rows.filter((r) => r.type === "income").reduce((t, r) => t + r.amount, 0);
    const expenses = rows.filter((r) => r.type === "expense").reduce((t, r) => t + r.amount, 0);
    const clientIncome = syncedRows.reduce((t, r) => t + r.amount, 0);
    return { income, expenses, profit: income - expenses, clientIncome };
  }, [rows, syncedRows]);

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => b.date.localeCompare(a.date)),
    [rows],
  );

  function addEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();
    const cleanAmount = Number(amount.replace(",", "."));

    if (!cleanTitle) return setError("Ajoutez un intitulé.");
    if (!Number.isFinite(cleanAmount) || cleanAmount <= 0)
      return setError("Ajoutez un montant supérieur à zéro.");
    if (!date) return setError("Ajoutez une date.");

    setError(null);
    startTransition(async () => {
      const res = await createAccountingEntryAction({
        type,
        title: cleanTitle,
        amount: Math.round(cleanAmount * 100),
        date,
        note: note.trim() || null,
      });
      if (!res.ok) {
        setError(res.error ?? "Erreur");
        return;
      }
      setTitle("");
      setAmount("");
      setNote("");
      setReport(null);
      router.refresh();
    });
  }

  function removeEntry(id: string) {
    startTransition(async () => {
      await deleteAccountingEntryAction(id);
      setReport(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 px-5 py-4">
          <p className="text-xs uppercase tracking-widest text-zinc-600">Entrées</p>
          <p className="mt-2 text-2xl font-medium text-emerald-400">
            {formatCurrency(totals.income)}
          </p>
          {totals.clientIncome > 0 && (
            <p className="mt-1 text-xs text-zinc-600">
              dont {formatCurrency(totals.clientIncome)} synchronisés clients
            </p>
          )}
        </div>
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 px-5 py-4">
          <p className="text-xs uppercase tracking-widest text-zinc-600">Dépenses</p>
          <p className="mt-2 text-2xl font-medium text-red-400">
            {formatCurrency(totals.expenses)}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 px-5 py-4">
          <p className="text-xs uppercase tracking-widest text-zinc-600">Bénéfice</p>
          <p
            className={`mt-2 text-2xl font-medium ${
              totals.profit >= 0 ? "text-white" : "text-red-400"
            }`}
          >
            {formatCurrency(totals.profit)}
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-5">
        <form onSubmit={addEntry} className="grid gap-3 lg:grid-cols-[150px_1fr_150px_160px_auto]">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AccountingType)}
            disabled={isPending}
            className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-zinc-600 disabled:opacity-50"
          >
            <option value="income">Entrée</option>
            <option value="expense">Dépense</option>
          </select>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Intitulé"
            disabled={isPending}
            className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-600 disabled:opacity-50"
          />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="Montant (€)"
            disabled={isPending}
            className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-600 disabled:opacity-50"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={isPending}
            className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-zinc-600 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isPending}
            className="h-10 rounded-lg bg-white px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 disabled:opacity-50"
          >
            {isPending ? "…" : "Ajouter"}
          </button>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note optionnelle"
            disabled={isPending}
            className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-600 disabled:opacity-50 lg:col-span-4"
          />
          <button
            type="button"
            onClick={() => setReport(buildThirtyDayReport(rows))}
            className="h-10 rounded-lg border border-zinc-800 px-4 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
          >
            Générer bilan 30 jours
          </button>
        </form>

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-400">
            {error}
          </p>
        )}
      </section>

      {report && (
        <section className="rounded-xl border border-zinc-800/80 bg-zinc-950 p-5">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-600">
                Bilan 30 derniers jours
              </p>
              <h2 className="mt-1 text-xl font-medium text-white">
                {formatCurrency(report.profit)} de bénéfice
              </h2>
            </div>
            <p className="text-xs text-zinc-600">Généré le {report.generatedAt}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs text-zinc-600">Entrées</p>
              <p className="mt-1 text-sm font-medium text-emerald-400">
                {formatCurrency(report.income)}
              </p>
              <p className="mt-0.5 text-xs text-zinc-600">
                {report.incomeCount} ligne{report.incomeCount !== 1 ? "s" : ""}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-600">Dépenses</p>
              <p className="mt-1 text-sm font-medium text-red-400">
                {formatCurrency(report.expenses)}
              </p>
              <p className="mt-0.5 text-xs text-zinc-600">
                {report.expenseCount} ligne{report.expenseCount !== 1 ? "s" : ""}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-600">Plus grosse entrée</p>
              <p className="mt-1 truncate text-sm text-zinc-300">
                {report.biggestIncome
                  ? `${report.biggestIncome.title} · ${formatCurrency(report.biggestIncome.amount)}`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-600">Plus grosse dépense</p>
              <p className="mt-1 truncate text-sm text-zinc-300">
                {report.biggestExpense
                  ? `${report.biggestExpense.title} · ${formatCurrency(report.biggestExpense.amount)}`
                  : "—"}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="overflow-x-auto rounded-xl border border-zinc-800/80">
        {sortedRows.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-zinc-500">
              Aucune ligne de comptabilité pour le moment.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60">
                {["Date", "Type", "Intitulé", "Note", "Montant", ""].map((heading) => (
                  <th
                    key={heading}
                    className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {sortedRows.map((entry) => (
                <tr
                  key={entry.id}
                  className="bg-zinc-900/10 transition-colors hover:bg-zinc-800/20"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-400">
                    {formatDate(entry.date)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        entry.type === "income"
                          ? "bg-emerald-950/60 text-emerald-400"
                          : "bg-red-950/60 text-red-400"
                      }`}
                    >
                      {entry.type === "income" ? "Entrée" : "Dépense"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{entry.title}</span>
                      {entry.source === "client" && (
                        <span className="inline-flex rounded-full bg-blue-950/50 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
                          Client
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="max-w-[260px] px-4 py-3">
                    <p className="truncate text-zinc-500">{entry.note || "—"}</p>
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-3 font-mono ${
                      entry.type === "income" ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {entry.type === "income" ? "+" : "-"}
                    {formatCurrency(entry.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {entry.source === "client" ? (
                      <span
                        className="text-xs text-zinc-700"
                        title="Géré depuis la fiche client"
                      >
                        auto
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => removeEntry(entry.id)}
                        disabled={isPending}
                        className="rounded px-2 py-1 text-xs text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-red-400 disabled:opacity-50"
                      >
                        Supprimer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
