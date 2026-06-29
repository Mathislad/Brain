"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { completeSignupAction } from "@/app/actions/invitations";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PrefilledData {
  offerKey:     string;
  setupAmount:  number;
  monthlyAmount: number;
  notesAdmin?:  string;
}

export interface OnboardingInitialData {
  token:       string;
  contactEmail: string;
  orgId:       string;
  orgName:     string;
  siret:       string;
  adresse:     string;
  formeJuridique: string;
  representant: string;
  prospectNom:  string;
  telephone:   string;
  prefilled:   PrefilledData;
}

const STEPS = ["Informations", "Mot de passe", "Activation"];

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-zinc-500">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-600";

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-300">
      {msg}
    </div>
  );
}

// ─── Étape 1 — Confirmation des informations ──────────────────────────────────

function StepInfos({
  data,
  token,
  onNext,
}: {
  data: OnboardingInitialData;
  token: string;
  onNext: () => void;
}) {
  const [nom, setNom]               = useState(data.prospectNom);
  const [telephone, setTelephone]   = useState(data.telephone);
  const [siret, setSiret]           = useState(data.siret);
  const [adresse, setAdresse]       = useState(data.adresse);
  const [formeJur, setFormeJur]     = useState(data.formeJuridique);
  const [representant, setRepresentant] = useState(data.representant);
  const [error, setError]           = useState<string | null>(null);
  const [isPending, start]          = useTransition();

  function save() {
    start(async () => {
      try {
        const res = await fetch("/api/client/onboarding/update-prospect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, nom, telephone, siret, adresse, formeJuridique: formeJur, representant }),
        });
        const json = await res.json();
        if (!res.ok) { setError(json.error ?? "Erreur"); return; }
        onNext();
      } catch (e) {
        setError(String(e));
      }
    });
  }

  return (
    <div className="grid gap-5">
      <p className="text-sm text-zinc-400">
        Vérifiez et complétez vos informations. Ces données figureront sur vos documents contractuels.
      </p>

      <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-5">
        <p className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-600">Contact</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom / Raison sociale *">
            <input className={inputCls} value={nom} onChange={e => setNom(e.target.value)} />
          </Field>
          <Field label="Téléphone">
            <input className={inputCls} value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="06 XX XX XX XX" />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Email (identifiant de connexion)">
            <input className={`${inputCls} text-zinc-600`} value={data.contactEmail} readOnly />
          </Field>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-5">
        <p className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-600">Entité légale</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="SIRET / SIREN">
            <input className={inputCls} value={siret} onChange={e => setSiret(e.target.value)} placeholder="00000000000000" />
          </Field>
          <Field label="Forme juridique">
            <select className={inputCls} value={formeJur} onChange={e => setFormeJur(e.target.value)}>
              {["", "EI", "EIRL", "EURL", "SARL", "SAS", "SASU", "SA", "Auto-entrepreneur", "Association"].map(v => (
                <option key={v} value={v}>{v || "— Sélectionner —"}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label="Représentant légal">
            <input className={inputCls} value={representant} onChange={e => setRepresentant(e.target.value)} placeholder="Jean Dupont — Gérant" />
          </Field>
          <Field label="Adresse siège social">
            <input className={inputCls} value={adresse} onChange={e => setAdresse(e.target.value)} placeholder="12 rue de la Paix, 75001 Paris" />
          </Field>
        </div>
      </div>

      {error && <ErrorBox msg={error} />}

      <button type="button" onClick={save} disabled={isPending || !nom.trim()}
        className="h-10 w-full rounded-lg bg-white text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 disabled:opacity-50">
        {isPending ? "Enregistrement…" : "Confirmer et continuer →"}
      </button>
    </div>
  );
}

// ─── Étape 2 — Création du mot de passe ───────────────────────────────────────

function StepPassword({
  token,
  email,
  onNext,
}: {
  token: string;
  email: string;
  onNext: () => void;
}) {
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [error, setError]         = useState<string | null>(null);
  const [isPending, start]        = useTransition();

  function createAccount() {
    if (password.length < 8) { setError("Mot de passe trop court (8 caractères minimum)"); return; }
    if (password !== confirm)  { setError("Les mots de passe ne correspondent pas"); return; }
    setError(null);

    start(async () => {
      try {
        // 1. Création du compte Supabase Auth via admin SDK (sans confirmation email)
        const res = await fetch("/api/client/onboarding/create-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password }),
        });
        const json = await res.json();
        if (!res.ok) { setError(json.error ?? "Erreur de création de compte"); return; }

        // 2. Connexion automatique
        const supabase = createClient();
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) { setError(signInErr.message); return; }

        // 3. Finalise le membership côté serveur
        await completeSignupAction(token);

        onNext();
      } catch (e) {
        setError(String(e));
      }
    });
  }

  return (
    <div className="grid gap-5">
      <p className="text-sm text-zinc-400">
        Choisissez votre mot de passe pour accéder à votre espace F5L Brain.
      </p>

      <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-5">
        <div className="mb-3">
          <Field label="Email (identifiant)">
            <input className={`${inputCls} text-zinc-600`} value={email} readOnly />
          </Field>
        </div>
        <div className="grid gap-4">
          <Field label="Mot de passe *">
            <input className={inputCls} type="password" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="8 caractères minimum" />
          </Field>
          <Field label="Confirmer le mot de passe *">
            <input className={inputCls} type="password" value={confirm}
              onChange={e => setConfirm(e.target.value)} />
          </Field>
        </div>
      </div>

      {error && <ErrorBox msg={error} />}

      <button type="button" onClick={createAccount} disabled={isPending || !password || !confirm}
        className="h-10 w-full rounded-lg bg-white text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 disabled:opacity-50">
        {isPending ? "Création du compte…" : "Créer mon compte →"}
      </button>
    </div>
  );
}

// ─── Étape 3 — Confirmation ───────────────────────────────────────────────────

function StepConfirmation({ orgName }: { orgName: string }) {
  const router = useRouter();

  return (
    <div className="grid gap-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-900/50 bg-emerald-950/30">
        <span className="text-xl">✓</span>
      </div>
      <div>
        <h2 className="text-xl font-medium text-white">Espace activé !</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Bienvenue dans votre espace <strong className="text-white">{orgName}</strong> sur F5L Brain.
          Votre compte est prêt. Une fenêtre d&apos;activation vous guidera ensuite vers le rendez-vous recommandé et le paiement.
        </p>
      </div>
      <button type="button" onClick={() => router.push("/client")}
        className="mx-auto h-10 rounded-lg bg-white px-8 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200">
        Accéder à mon espace →
      </button>
    </div>
  );
}

// ─── Wizard principal ─────────────────────────────────────────────────────────

export function OnboardingWizard({ initialData }: { initialData: OnboardingInitialData }) {
  const [step, setStep] = useState(0);
  const next = () => setStep(s => s + 1);

  const stepContent = [
    <StepInfos key="infos" data={initialData} token={initialData.token} onNext={next} />,
    <StepPassword key="pwd" token={initialData.token} email={initialData.contactEmail} onNext={next} />,
    <StepConfirmation key="done" orgName={initialData.orgName} />,
  ];

  return (
    <div className="mx-auto max-w-lg">
      {/* Stepper */}
      <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-1">
        {STEPS.map((label, i) => (
          <div key={i} className="flex shrink-0 items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-medium ${
              i === step ? "border-white bg-white text-zinc-950"
              : i < step  ? "border-emerald-600 text-emerald-400"
              : "border-zinc-800 text-zinc-700"
            }`}>
              {i < step ? "✓" : i + 1}
            </div>
            <span className={`text-sm ${i === step ? "text-white" : "text-zinc-600"}`}>{label}</span>
            {i < STEPS.length - 1 && <span className="text-zinc-800">›</span>}
          </div>
        ))}
      </div>

      {/* Contenu de l'étape */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-6">
        {stepContent[step]}
      </div>
    </div>
  );
}
