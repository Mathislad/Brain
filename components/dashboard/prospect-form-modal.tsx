"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  createProspectAction,
  updateProspectAction,
} from "@/app/actions/prospects";
import type { ProspectFormData, ProspectStatus } from "@/lib/prospect-types";
import type { Prospect } from "@/lib/prospects-db";

const STATUS_OPTIONS: { value: ProspectStatus; label: string }[] = [
  { value: "TODO", label: "Prospect" },
  { value: "IN_PROGRESS", label: "Rendez-vous" },
  { value: "DONE", label: "Client" },
];

interface Props {
  prospect?: Prospect;
  defaultStatus?: ProspectStatus;
  onClose: () => void;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </label>
      {children}
    </div>
  );
}

const INPUT =
  "w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-600 disabled:opacity-50";

export function ProspectFormModal({ prospect, defaultStatus = "TODO", onClose }: Props) {
  const router = useRouter();
  const isEdit = !!prospect;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const errorId = "prospect-form-error";

  const [form, setForm] = useState<ProspectFormData>({
    nom: prospect?.nom ?? "",
    entreprise: prospect?.entreprise ?? "",
    email: prospect?.email ?? "",
    telephone: prospect?.telephone ?? "",
    activite: prospect?.activite ?? "",
    siteInternet: prospect?.siteInternet ?? "",
    instagram: prospect?.instagram ?? "",
    facebook: prospect?.facebook ?? "",
    linkedin: prospect?.linkedin ?? "",
    prochaineAction: prospect?.prochaineAction ?? "",
    derniereAction: prospect?.derniereAction ?? "",
    status: prospect?.status ?? defaultStatus,
    note: prospect?.note ?? "",
  });

  function set(field: keyof ProspectFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value || null }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nom?.trim()) {
      setError("Le nom est requis.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        if (isEdit) {
          await updateProspectAction(prospect.id, form);
        } else {
          await createProspectAction(form);
        }
        router.refresh();
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Impossible d'enregistrer le prospect.");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && !isPending && onClose()}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-base font-medium text-white">
            {isEdit ? "Modifier le prospect" : "Nouveau prospect"}
          </h2>
          <button
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-5 px-6 py-6">
            {/* Statut */}
            <Field label="Statut">
              <div className="flex gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => set("status", s.value)}
                    className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                      form.status === s.value
                        ? "border-white bg-white text-black"
                        : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Nom / Prénom *">
                <input
                  className={INPUT}
                  placeholder="Jean Dupont"
                  value={form.nom ?? ""}
                  onChange={(e) => set("nom", e.target.value)}
                  disabled={isPending}
                  aria-invalid={!!error}
                  aria-describedby={error ? errorId : undefined}
                  required
                />
              </Field>
              <Field label="Entreprise">
                <input
                  className={INPUT}
                  placeholder="Acme Inc."
                  value={form.entreprise ?? ""}
                  onChange={(e) => set("entreprise", e.target.value)}
                  disabled={isPending}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  className={INPUT}
                  placeholder="jean@acme.com"
                  value={form.email ?? ""}
                  onChange={(e) => set("email", e.target.value)}
                  disabled={isPending}
                />
              </Field>
              <Field label="Téléphone">
                <input
                  className={INPUT}
                  placeholder="+33 6 00 00 00 00"
                  value={form.telephone ?? ""}
                  onChange={(e) => set("telephone", e.target.value)}
                  disabled={isPending}
                />
              </Field>
              <Field label="Niche / Activité">
                <input
                  className={INPUT}
                  placeholder="Restaurant, immobilier, coaching..."
                  value={form.activite ?? ""}
                  onChange={(e) => set("activite", e.target.value)}
                  disabled={isPending}
                />
              </Field>
            </div>

            <Field label="Site internet">
              <input
                className={INPUT}
                placeholder="https://acme.com"
                value={form.siteInternet ?? ""}
                onChange={(e) => set("siteInternet", e.target.value)}
                disabled={isPending}
              />
            </Field>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Instagram">
                <input
                  className={INPUT}
                  placeholder="@handle"
                  value={form.instagram ?? ""}
                  onChange={(e) => set("instagram", e.target.value)}
                  disabled={isPending}
                />
              </Field>
              <Field label="Facebook">
                <input
                  className={INPUT}
                  placeholder="URL ou nom"
                  value={form.facebook ?? ""}
                  onChange={(e) => set("facebook", e.target.value)}
                  disabled={isPending}
                />
              </Field>
              <Field label="LinkedIn">
                <input
                  className={INPUT}
                  placeholder="URL profil"
                  value={form.linkedin ?? ""}
                  onChange={(e) => set("linkedin", e.target.value)}
                  disabled={isPending}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Prochaine action">
                <input
                  className={INPUT}
                  placeholder="Rappeler lundi"
                  value={form.prochaineAction ?? ""}
                  onChange={(e) => set("prochaineAction", e.target.value)}
                  disabled={isPending}
                />
              </Field>
              <Field label="Dernière action">
                <input
                  className={INPUT}
                  placeholder="Email envoyé le 20/06"
                  value={form.derniereAction ?? ""}
                  onChange={(e) => set("derniereAction", e.target.value)}
                  disabled={isPending}
                />
              </Field>
            </div>

            <Field label="Note">
              <textarea
                className={`${INPUT} min-h-[80px] resize-y`}
                placeholder="Notes libres…"
                value={form.note ?? ""}
                onChange={(e) => set("note", e.target.value)}
                disabled={isPending}
              />
            </Field>

            {error && (
              <p id={errorId} role="alert" className="text-sm text-red-400">
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-zinc-800 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg px-4 py-2 text-sm text-zinc-400 transition-colors hover:text-white disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {isPending && (
                <span className="animate-spin text-base leading-none">↻</span>
              )}
              {isEdit ? "Enregistrer" : "Créer le prospect"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
