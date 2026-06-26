"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  updateClientBillingAction,
  addPaymentAction,
  deletePaymentAction,
} from "@/app/actions/clients";
import type { ClientWithLinks } from "@/lib/client-types";

type PaymentRecord = ClientWithLinks["payments"][number];

const INPUT =
  "w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-600";

function euros(cents: number | null | undefined): string {
  const n = (cents ?? 0) / 100;
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function toCents(input: string): number | null {
  const cleaned = input.replace(/\s/g, "").replace(",", ".");
  if (cleaned === "") return null;
  const n = Number.parseFloat(cleaned);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ClientBillingSection({ client }: { client: ClientWithLinks }) {
  const total = client.montantTotal ?? 0;
  const paid = client.payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = total - paid;
  const fullyPaid = total > 0 && remaining <= 0;

  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-600">
        <span aria-hidden>💶</span>
        Facturation
      </h3>

      <div className="space-y-4 rounded-xl border border-zinc-800/60 bg-zinc-900/20 px-4 py-4">
        {/* Résumé + édition */}
        <BillingSummary client={client} />

        {/* Indicateurs */}
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Total" value={total ? euros(total) : "—"} />
          <Stat label="Payé" value={euros(paid)} tone="ok" />
          <Stat
            label="Reste"
            value={total ? euros(Math.max(0, remaining)) : "—"}
            tone={fullyPaid ? "ok" : remaining > 0 ? "warn" : undefined}
          />
        </div>

        {/* Barre de progression */}
        {total > 0 && (
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className={`h-full rounded-full transition-all ${
                fullyPaid ? "bg-emerald-500" : "bg-zinc-400"
              }`}
              style={{ width: `${Math.min(100, (paid / total) * 100)}%` }}
            />
          </div>
        )}

        {/* Paiements */}
        <PaymentsList prospectId={client.id} payments={client.payments} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn";
}) {
  const color =
    tone === "ok"
      ? "text-emerald-400"
      : tone === "warn"
        ? "text-amber-400"
        : "text-zinc-200";
  return (
    <div className="rounded-lg bg-zinc-900/60 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-zinc-600">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function BillingSummary({ client }: { client: ClientWithLinks }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [formule, setFormule] = useState(client.formule ?? "");
  const [montant, setMontant] = useState(
    client.montantTotal != null ? String(client.montantTotal / 100) : "",
  );
  const [devisSigne, setDevisSigne] = useState(client.devisSigne);
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await updateClientBillingAction({
        prospectId: client.id,
        formule: formule.trim() || null,
        montantTotal: toCents(montant),
        devisSigne,
      });
      router.refresh();
      setEditing(false);
    });
  }

  if (!editing) {
    return (
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm text-zinc-300">
            <span className="text-zinc-600">Formule : </span>
            {client.formule || <span className="text-zinc-600">non définie</span>}
          </p>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
              client.devisSigne
                ? "bg-emerald-950/60 text-emerald-400"
                : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {client.devisSigne ? "Devis signé ✓" : "Devis non signé"}
          </span>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="shrink-0 text-xs text-zinc-500 transition-colors hover:text-white"
        >
          Modifier
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-600">
            Formule
          </label>
          <input
            className={INPUT}
            placeholder="Pack Premium, Abonnement…"
            value={formule}
            onChange={(e) => setFormule(e.target.value)}
            disabled={isPending}
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-600">
            Montant total (€)
          </label>
          <input
            className={INPUT}
            placeholder="1500"
            inputMode="decimal"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            disabled={isPending}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setDevisSigne((v) => !v)}
        disabled={isPending}
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
          devisSigne
            ? "border-emerald-900/50 bg-emerald-950/40 text-emerald-400"
            : "border-zinc-700 text-zinc-400 hover:text-white"
        }`}
      >
        <span
          className={`flex h-3.5 w-3.5 items-center justify-center rounded-sm border ${
            devisSigne ? "border-emerald-500 bg-emerald-500 text-black" : "border-zinc-600"
          }`}
        >
          {devisSigne ? "✓" : ""}
        </span>
        Devis signé
      </button>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setEditing(false)}
          disabled={isPending}
          className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:text-white disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}

function PaymentsList({
  prospectId,
  payments,
}: {
  prospectId: string;
  payments: PaymentRecord[];
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-zinc-600">
          Paiements ({payments.length})
        </p>
        <button
          onClick={() => setAdding((v) => !v)}
          className="text-xs text-zinc-500 transition-colors hover:text-white"
        >
          {adding ? "Annuler" : "+ Encaisser"}
        </button>
      </div>

      <div className="space-y-1.5">
        {payments.map((p) => (
          <PaymentRow key={p.id} payment={p} />
        ))}

        {payments.length === 0 && !adding && (
          <p className="rounded-lg border border-dashed border-zinc-800/80 px-3 py-2 text-xs text-zinc-600">
            Aucun paiement enregistré.
          </p>
        )}

        {adding && (
          <AddPaymentForm prospectId={prospectId} onDone={() => setAdding(false)} />
        )}
      </div>
    </div>
  );
}

function PaymentRow({ payment }: { payment: PaymentRecord }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      await deletePaymentAction(payment.id);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-3 py-2">
      <span className="text-sm font-semibold text-emerald-400">
        {euros(payment.amount)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-zinc-400">
          {payment.label || "Paiement"}
        </p>
        <p className="text-[10px] text-zinc-600">{formatDate(payment.paidAt)}</p>
      </div>
      <button
        onClick={remove}
        disabled={isPending}
        className="shrink-0 rounded p-1 text-zinc-700 transition-colors hover:bg-zinc-800 hover:text-red-400 disabled:opacity-50"
        title="Supprimer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14H6L5 6" />
        </svg>
      </button>
    </div>
  );
}

function AddPaymentForm({
  prospectId,
  onDone,
}: {
  prospectId: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const cents = toCents(amount);
    if (cents == null || cents <= 0) {
      setError("Montant invalide.");
      return;
    }
    setError(null);
    startTransition(async () => {
      await addPaymentAction({
        prospectId,
        amount: cents,
        label: label.trim() || null,
        paidAt: paidAt || null,
      });
      router.refresh();
      onDone();
    });
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-2 rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-3"
    >
      <div className="grid grid-cols-2 gap-2">
        <input
          className={INPUT}
          placeholder="Montant (€)"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isPending}
          autoFocus
        />
        <input
          type="date"
          className={INPUT}
          value={paidAt}
          onChange={(e) => setPaidAt(e.target.value)}
          disabled={isPending}
        />
      </div>
      <input
        className={INPUT}
        placeholder="Libellé (acompte, solde…) — facultatif"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        disabled={isPending}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          disabled={isPending}
          className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:text-white disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {isPending ? "Ajout…" : "Encaisser"}
        </button>
      </div>
    </form>
  );
}
