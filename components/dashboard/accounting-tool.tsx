"use client";

import { useEffect, useMemo, useState } from "react";

import type { SyncedClientPayment } from "@/lib/client-types";

type AccountingType = "income" | "expense";
type EntrySource = "manual" | "client";

interface AccountingEntry {
  id: string;
  type: AccountingType;
  title: string;
  amount: number;
  date: string;
  note: string;
  createdAt: string;
  source: EntrySource;
}

interface BalanceReport {
  generatedAt: string;
  income: number;
  expenses: number;
  profit: number;
  entriesCount: number;
  incomeCount: number;
  expenseCount: number;
  biggestIncome: AccountingEntry | null;
  biggestExpense: AccountingEntry | null;
}

const STORAGE_KEY = "brain.accounting.entries.v1";

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

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
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function loadEntries(): AccountingEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as AccountingEntry[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry) => ({
        ...entry,
        amount: Number(entry.amount),
        note: entry.note ?? "",
        source: "manual" as const,
      }))
      .filter((entry) => entry.id && entry.title && Number.isFinite(entry.amount));
  } catch {
    return [];
  }
}

function buildThirtyDayReport(entries: AccountingEntry[]): BalanceReport {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 30);
  start.setHours(0, 0, 0, 0);

  const recentEntries = entries.filter((entry) => {
    const date = new Date(`${entry.date}T12:00:00`);
    return date >= start && date <= now;
  });
  const incomeEntries = recentEntries.filter((entry) => entry.type === "income");
  const expenseEntries = recentEntries.filter((entry) => entry.type === "expense");
  const income = incomeEntries.reduce((total, entry) => total + entry.amount, 0);
  const expenses = expenseEntries.reduce((total, entry) => total + entry.amount, 0);

  return {
    generatedAt: new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(now),
    income,
    expenses,
    profit: income - expenses,
    entriesCount: recentEntries.length,
    incomeCount: incomeEntries.length,
    expenseCount: expenseEntries.length,
    biggestIncome:
      incomeEntries.sort((a, b) => b.amount - a.amount)[0] ?? null,
    biggestExpense:
      expenseEntries.sort((a, b) => b.amount - a.amount)[0] ?? null,
  };
}

export function AccountingTool({
  clientPayments = [],
}: {
  clientPayments?: SyncedClientPayment[];
}) {
  const [manualEntries, setManualEntries] = useState<AccountingEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [type, setType] = useState<AccountingType>("income");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<BalanceReport | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setManualEntries(loadEntries());
      setDate(todayInputValue());
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(manualEntries));
  }, [manualEntries, isLoaded]);

  // Paiements clients → entrées synchronisées (lecture seule)
  const syncedEntries = useMemo<AccountingEntry[]>(
    () =>
      clientPayments.map((p) => ({
        id: `client:${p.id}`,
        type: "income" as const,
        title: p.clientName,
        amount: p.amount,
        date: p.date,
        note: p.label,
        createdAt: p.date,
        source: "client" as const,
      })),
    [clientPayments],
  );

  const entries = useMemo(
    () => [...syncedEntries, ...manualEntries],
    [syncedEntries, manualEntries],
  );

  const totals = useMemo(() => {
    const income = entries
      .filter((entry) => entry.type === "income")
      .reduce((total, entry) => total + entry.amount, 0);
    const expenses = entries
      .filter((entry) => entry.type === "expense")
      .reduce((total, entry) => total + entry.amount, 0);
    const clientIncome = syncedEntries.reduce(
      (total, entry) => total + entry.amount,
      0,
    );

    return {
      income,
      expenses,
      profit: income - expenses,
      clientIncome,
    };
  }, [entries, syncedEntries]);

  const sortedEntries = useMemo(
    () =>
      [...entries].sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        return dateCompare !== 0 ? dateCompare : b.createdAt.localeCompare(a.createdAt);
      }),
    [entries],
  );

  function addEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();
    const cleanAmount = Number(amount.replace(",", "."));

    if (!cleanTitle) {
      setError("Ajoutez un intitulé.");
      return;
    }
    if (!Number.isFinite(cleanAmount) || cleanAmount <= 0) {
      setError("Ajoutez un montant supérieur à zéro.");
      return;
    }
    if (!date) {
      setError("Ajoutez une date.");
      return;
    }

    const entry: AccountingEntry = {
      id: createId(),
      type,
      title: cleanTitle,
      amount: Math.round(cleanAmount * 100) / 100,
      date,
      note: note.trim(),
      createdAt: new Date().toISOString(),
      source: "manual",
    };

    setManualEntries((current) => [entry, ...current]);
    setTitle("");
    setAmount("");
    setNote("");
    setError(null);
    setReport(null);
  }

  function removeEntry(id: string) {
    setManualEntries((current) => current.filter((entry) => entry.id !== id));
    setReport(null);
  }

  function generateReport() {
    setReport(buildThirtyDayReport(entries));
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 px-5 py-4">
          <p className="text-xs uppercase tracking-widest text-zinc-600">
            Entrées
          </p>
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
          <p className="text-xs uppercase tracking-widest text-zinc-600">
            Dépenses
          </p>
          <p className="mt-2 text-2xl font-medium text-red-400">
            {formatCurrency(totals.expenses)}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 px-5 py-4">
          <p className="text-xs uppercase tracking-widest text-zinc-600">
            Bénéfice
          </p>
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
            onChange={(event) => setType(event.target.value as AccountingType)}
            className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-zinc-600"
          >
            <option value="income">Entrée</option>
            <option value="expense">Dépense</option>
          </select>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Intitulé"
            className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-600"
          />
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            placeholder="Montant"
            className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-600"
          />
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-zinc-600"
          />
          <button
            type="submit"
            className="h-10 rounded-lg bg-white px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
          >
            Ajouter
          </button>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Note optionnelle"
            className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-600 lg:col-span-4"
          />
          <button
            type="button"
            onClick={generateReport}
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
        {sortedEntries.length === 0 ? (
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
              {sortedEntries.map((entry) => (
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
                        className="rounded px-2 py-1 text-xs text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-red-400"
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
