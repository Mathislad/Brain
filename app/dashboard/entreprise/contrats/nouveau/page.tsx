"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceKey = "site" | "seo" | "ads" | "fidelite" | "ia" | "social";
type Duree = "1" | "3" | "6" | "12";
type ModeFacturation = "debut" | "fin";

interface FormState {
  // Client
  client_nom: string;
  client_forme_juridique: string;
  client_siret: string;
  client_adresse: string;
  client_representant: string;
  client_email: string;
  client_telephone: string;
  lieu_signature: string;
  date_signature: string;
  // Services
  services_souscrits: ServiceKey[];
  prix_site: string;
  prix_seo: string;
  prix_ads: string;
  prix_fidelite: string;
  prix_ia: string;
  prix_social: string;
  // Durée
  duree_mois: Duree;
  date_debut: string;
  mode_facturation: ModeFacturation;
  // Annexe A
  site_type: string;
  site_nb_pages: string;
  site_delai: string;
  site_hebergement: string;
  site_maintenance: string;
  seo_zone: string;
  seo_keywords: string;
  seo_rapport: string;
  ads_plateformes: string;
  ads_budget: string;
  ads_objectif: string;
  ads_zone: string;
  ads_rapport: string;
  fidelite_plateforme: string;
  fidelite_maintenance: string;
  fidelite_acces: string;
  ia_usecases: string;
  ia_numero: string;
  ia_rapport: string;
  social_plateformes: string;
  social_frequence: string;
  social_contenus: string;
  social_visuels: string;
  social_validation: string;
  social_rapport: string;
}

const SERVICES_META: Record<ServiceKey, { label: string; default_price: string }> = {
  site:     { label: "Création de site internet",      default_price: "990 €" },
  seo:      { label: "Référencement SEO local",        default_price: "199 €/mois" },
  ads:      { label: "Google Ads & Meta Ads",          default_price: "299 €/mois" },
  fidelite: { label: "Carte de fidélité digitale",     default_price: "99 €/mois" },
  ia:       { label: "Agent téléphonique IA",          default_price: "149 €/mois" },
  social:   { label: "Gestion réseaux sociaux",        default_price: "249 €/mois" },
};

const DUREE_LABELS: Record<Duree, string> = {
  "1": "1 mois (sans engagement)",
  "3": "3 mois",
  "6": "6 mois",
  "12": "12 mois",
};

const INITIAL: FormState = {
  client_nom: "", client_forme_juridique: "", client_siret: "",
  client_adresse: "", client_representant: "", client_email: "", client_telephone: "",
  lieu_signature: "Le Puy-en-Velay", date_signature: "",
  services_souscrits: [], prix_site: "", prix_seo: "", prix_ads: "",
  prix_fidelite: "", prix_ia: "", prix_social: "",
  duree_mois: "1", date_debut: "", mode_facturation: "debut",
  site_type: "Vitrine", site_nb_pages: "5 pages", site_delai: "4 semaines",
  site_hebergement: "Via Vercel (domaine client)", site_maintenance: "Inclus 3 mois",
  seo_zone: "", seo_keywords: "", seo_rapport: "Oui — envoi le 5 de chaque mois",
  ads_plateformes: "Google Ads + Meta Ads", ads_budget: "", ads_objectif: "Leads",
  ads_zone: "", ads_rapport: "Oui — envoi le 5 de chaque mois",
  fidelite_plateforme: "Stamp Me", fidelite_maintenance: "Oui",
  fidelite_acces: "Transmis au Client",
  ia_usecases: "Prise de RDV, FAQ, Renvoi de messages",
  ia_numero: "Fourni par le Prestataire", ia_rapport: "Oui",
  social_plateformes: "Instagram + Facebook", social_frequence: "3 posts/semaine",
  social_contenus: "Visuels + Stories", social_visuels: "Par le Prestataire",
  social_validation: "Validation client avant publication",
  social_rapport: "Oui — envoi le 5 de chaque mois",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addMonths(dateStr: string, months: number): string {
  if (!dateStr) return "";
  const [d, m, y] = dateStr.split("/").map(Number);
  if (!d || !m || !y) return "";
  const date = new Date(y, m - 1 + months, d);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

function parseDecimal(value: string): number | null {
  const match = value.match(/\d[\d\s]*(?:[,.]\d+)?/);
  if (!match) return null;
  const amount = Number.parseFloat(match[0].replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(amount) ? amount : null;
}

function parseServicePrice(str: string): number | null {
  const value = str.trim();
  if (!value) return 0;

  const lower = value.toLowerCase();
  if (/\b(offert|offerte|gratuit|gratuite)\b/.test(lower)) return 0;

  const hasPaymentTiers =
    /\b(puis|pendant|palier|paliers|premiers?\s+mois)\b/.test(lower) ||
    /\d+\s*(m|mois)\s+à/.test(lower) ||
    value.includes("+");

  if (hasPaymentTiers) return null;

  const amount = parseDecimal(value);
  if (amount == null) return null;

  const discountMatch = lower.match(/-?\s*(\d+(?:[,.]\d+)?)\s*%/);
  if (!discountMatch) return amount;

  const discount = Number.parseFloat(discountMatch[1].replace(",", "."));
  if (!Number.isFinite(discount)) return amount;

  const clampedDiscount = Math.min(100, Math.max(0, discount));
  return amount * (1 - clampedDiscount / 100);
}

function computeTotal(form: FormState): string {
  let hasComplexPricing = false;
  const sum = form.services_souscrits.reduce((acc, key) => {
    const raw = form[`prix_${key}` as keyof FormState] as string;
    const parsed = parseServicePrice(raw);
    if (parsed == null) {
      hasComplexPricing = true;
      return acc;
    }
    return acc + parsed;
  }, 0);
  const rounded = Math.round(sum * 100) / 100;
  const formatted = rounded.toLocaleString("fr-FR", {
    maximumFractionDigits: 2,
  });

  if (rounded > 0 && hasComplexPricing) return `${formatted} €/mois + paliers`;
  if (rounded > 0) return `${formatted} €/mois`;
  if (hasComplexPricing) return "Selon paliers";
  return "";
}

// ─── Input components ─────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-zinc-500">{label}</span>
      {children}
    </label>
  );
}

const inputCls = "h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-600";
const selectCls = "h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors focus:border-zinc-600";

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = ["Client", "Services", "Durée", "Annexe A", "Récapitulatif"];

function StepClient({ form, set }: { form: FormState; set: (k: keyof FormState, v: string) => void }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Raison sociale / Nom *">
          <input className={inputCls} value={form.client_nom} onChange={e => set("client_nom", e.target.value)} placeholder="Boulangerie Martin SAS" />
        </Field>
        <Field label="Forme juridique">
          <select className={selectCls} value={form.client_forme_juridique} onChange={e => set("client_forme_juridique", e.target.value)}>
            {["","EI","EIRL","EURL","SARL","SAS","SASU","SA","Auto-entrepreneur","Association"].map(v => <option key={v} value={v}>{v || "— Sélectionner —"}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="SIRET / SIREN">
          <input className={inputCls} value={form.client_siret} onChange={e => set("client_siret", e.target.value)} placeholder="00000000000000" />
        </Field>
        <Field label="Représentant légal *">
          <input className={inputCls} value={form.client_representant} onChange={e => set("client_representant", e.target.value)} placeholder="Jean Martin — Gérant" />
        </Field>
      </div>
      <Field label="Adresse siège social">
        <input className={inputCls} value={form.client_adresse} onChange={e => set("client_adresse", e.target.value)} placeholder="12 rue de la Paix, 75001 Paris" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email de facturation">
          <input className={inputCls} type="email" value={form.client_email} onChange={e => set("client_email", e.target.value)} placeholder="compta@client.fr" />
        </Field>
        <Field label="Téléphone">
          <input className={inputCls} value={form.client_telephone} onChange={e => set("client_telephone", e.target.value)} placeholder="06 XX XX XX XX" />
        </Field>
      </div>
      <div className="mt-2 border-t border-zinc-800 pt-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-600">Signature</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Lieu de signature">
            <input className={inputCls} value={form.lieu_signature} onChange={e => set("lieu_signature", e.target.value)} />
          </Field>
          <Field label="Date de signature (JJ/MM/AAAA)">
            <input className={inputCls} value={form.date_signature} onChange={e => set("date_signature", e.target.value)} placeholder="27/06/2026" />
          </Field>
        </div>
      </div>
    </div>
  );
}

function StepServices({ form, set, toggle }: {
  form: FormState;
  set: (k: keyof FormState, v: string) => void;
  toggle: (k: ServiceKey) => void;
}) {
  const total = computeTotal(form);
  return (
    <div className="grid gap-4">
      {(Object.entries(SERVICES_META) as [ServiceKey, { label: string; default_price: string }][]).map(([key, meta]) => {
        const active = form.services_souscrits.includes(key);
        const priceKey = `prix_${key}` as keyof FormState;
        return (
          <div key={key} className={`rounded-lg border p-4 transition-colors ${active ? "border-blue-600/60 bg-blue-950/10" : "border-zinc-800 bg-zinc-950/40"}`}>
            <div className="flex items-center justify-between gap-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggle(key)}
                  className="h-4 w-4 accent-blue-500"
                />
                <span className="text-sm font-medium text-white">{meta.label}</span>
              </label>
              {active && (
                <input
                  className="h-9 w-36 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-zinc-500"
                  value={form[priceKey] as string}
                  onChange={e => set(priceKey, e.target.value)}
                  placeholder={`${meta.default_price}, offert, -20%`}
                />
              )}
            </div>
          </div>
        );
      })}
      {total && (
        <div className="mt-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-right">
          <span className="text-xs text-zinc-500">Total mensuel : </span>
          <span className="text-base font-semibold text-white">{total}</span>
        </div>
      )}
    </div>
  );
}

function StepDuree({ form, set }: { form: FormState; set: (k: keyof FormState, v: string) => void }) {
  const dateFin = addMonths(form.date_debut, parseInt(form.duree_mois, 10));
  return (
    <div className="grid gap-5">
      <Field label="Durée d'engagement">
        <div className="grid gap-2">
          {(["1","3","6","12"] as Duree[]).map(d => (
            <label key={d} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${form.duree_mois === d ? "border-blue-600/60 bg-blue-950/10" : "border-zinc-800"}`}>
              <input type="radio" name="duree" value={d} checked={form.duree_mois === d} onChange={() => set("duree_mois", d)} className="accent-blue-500" />
              <span className="text-sm text-white">{DUREE_LABELS[d]}</span>
            </label>
          ))}
        </div>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date de début (JJ/MM/AAAA)">
          <input className={inputCls} value={form.date_debut} onChange={e => set("date_debut", e.target.value)} placeholder="01/09/2026" />
        </Field>
        <Field label="Date de fin (calculée)">
          <input className={`${inputCls} text-zinc-500`} value={dateFin} readOnly />
        </Field>
      </div>
      <Field label="Mode de facturation">
        <div className="grid gap-2 sm:grid-cols-2">
          {(["debut","fin"] as ModeFacturation[]).map(m => (
            <label key={m} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${form.mode_facturation === m ? "border-blue-600/60 bg-blue-950/10" : "border-zinc-800"}`}>
              <input type="radio" name="facturation" value={m} checked={form.mode_facturation === m} onChange={() => set("mode_facturation", m)} className="accent-blue-500" />
              <span className="text-sm text-white">{m === "debut" ? "Début de mois (mois à venir)" : "Fin de mois (mois écoulé)"}</span>
            </label>
          ))}
        </div>
      </Field>
    </div>
  );
}

function AnnexeSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
      <p className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">{title}</p>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

function StepAnnexe({ form, set }: { form: FormState; set: (k: keyof FormState, v: string) => void }) {
  const s = form.services_souscrits;
  if (s.length === 0) {
    return <p className="text-sm text-zinc-500">Aucun service sélectionné à l&apos;étape 2.</p>;
  }
  return (
    <div className="grid gap-5">
      {s.includes("site") && (
        <AnnexeSection title="Site internet">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Type de site"><select className={selectCls} value={form.site_type} onChange={e => set("site_type", e.target.value)}><option>Vitrine</option><option>E-commerce</option><option>Landing page</option></select></Field>
            <Field label="Nombre de pages"><input className={inputCls} value={form.site_nb_pages} onChange={e => set("site_nb_pages", e.target.value)} /></Field>
            <Field label="Délai de livraison"><input className={inputCls} value={form.site_delai} onChange={e => set("site_delai", e.target.value)} /></Field>
            <Field label="Hébergement"><input className={inputCls} value={form.site_hebergement} onChange={e => set("site_hebergement", e.target.value)} /></Field>
          </div>
          <Field label="Maintenance incluse"><input className={inputCls} value={form.site_maintenance} onChange={e => set("site_maintenance", e.target.value)} /></Field>
        </AnnexeSection>
      )}
      {s.includes("seo") && (
        <AnnexeSection title="SEO local">
          <Field label="Zone géographique ciblée"><input className={inputCls} value={form.seo_zone} onChange={e => set("seo_zone", e.target.value)} placeholder="Le Puy-en-Velay et alentours 30km" /></Field>
          <Field label="Mots-clés cibles"><input className={inputCls} value={form.seo_keywords} onChange={e => set("seo_keywords", e.target.value)} placeholder="boulangerie le puy, pain artisanal auvergne" /></Field>
          <Field label="Rapport mensuel"><input className={inputCls} value={form.seo_rapport} onChange={e => set("seo_rapport", e.target.value)} /></Field>
        </AnnexeSection>
      )}
      {s.includes("ads") && (
        <AnnexeSection title="Google Ads & Meta Ads">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Plateformes"><select className={selectCls} value={form.ads_plateformes} onChange={e => set("ads_plateformes", e.target.value)}><option>Google Ads + Meta Ads</option><option>Google Ads</option><option>Meta Ads</option></select></Field>
            <Field label="Objectif"><select className={selectCls} value={form.ads_objectif} onChange={e => set("ads_objectif", e.target.value)}><option>Leads</option><option>Appels</option><option>Ventes en ligne</option><option>Notoriété</option></select></Field>
          </div>
          <Field label="Budget publicitaire mensuel"><input className={inputCls} value={form.ads_budget} onChange={e => set("ads_budget", e.target.value)} placeholder="500 € — réglé directement par le Client" /></Field>
          <Field label="Zone de ciblage"><input className={inputCls} value={form.ads_zone} onChange={e => set("ads_zone", e.target.value)} placeholder="Rayon 20km autour du Puy-en-Velay" /></Field>
          <Field label="Rapport mensuel"><input className={inputCls} value={form.ads_rapport} onChange={e => set("ads_rapport", e.target.value)} /></Field>
        </AnnexeSection>
      )}
      {s.includes("fidelite") && (
        <AnnexeSection title="Carte de fidélité">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Plateforme"><input className={inputCls} value={form.fidelite_plateforme} onChange={e => set("fidelite_plateforme", e.target.value)} /></Field>
            <Field label="Maintenance mensuelle"><select className={selectCls} value={form.fidelite_maintenance} onChange={e => set("fidelite_maintenance", e.target.value)}><option>Oui</option><option>Non</option></select></Field>
          </div>
          <Field label="Accès tableau de bord"><select className={selectCls} value={form.fidelite_acces} onChange={e => set("fidelite_acces", e.target.value)}><option>Transmis au Client</option><option>Géré exclusivement par le Prestataire</option></select></Field>
        </AnnexeSection>
      )}
      {s.includes("ia") && (
        <AnnexeSection title="Agent téléphonique IA">
          <Field label="Cas d'usage"><input className={inputCls} value={form.ia_usecases} onChange={e => set("ia_usecases", e.target.value)} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Numéro de téléphone"><select className={selectCls} value={form.ia_numero} onChange={e => set("ia_numero", e.target.value)}><option>Fourni par le Prestataire</option><option>Numéro existant du Client (portabilité)</option></select></Field>
            <Field label="Rapport mensuel"><select className={selectCls} value={form.ia_rapport} onChange={e => set("ia_rapport", e.target.value)}><option>Oui</option><option>Non</option></select></Field>
          </div>
        </AnnexeSection>
      )}
      {s.includes("social") && (
        <AnnexeSection title="Réseaux sociaux">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Plateformes"><select className={selectCls} value={form.social_plateformes} onChange={e => set("social_plateformes", e.target.value)}><option>Instagram + Facebook</option><option>Instagram</option><option>Facebook</option></select></Field>
            <Field label="Fréquence"><input className={inputCls} value={form.social_frequence} onChange={e => set("social_frequence", e.target.value)} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Types de contenus"><input className={inputCls} value={form.social_contenus} onChange={e => set("social_contenus", e.target.value)} /></Field>
            <Field label="Fourniture visuels"><select className={selectCls} value={form.social_visuels} onChange={e => set("social_visuels", e.target.value)}><option>Par le Prestataire</option><option>Par le Client</option><option>Mixte</option></select></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Validation"><select className={selectCls} value={form.social_validation} onChange={e => set("social_validation", e.target.value)}><option>Validation client avant publication</option><option>Publication directe</option></select></Field>
            <Field label="Rapport mensuel"><input className={inputCls} value={form.social_rapport} onChange={e => set("social_rapport", e.target.value)} /></Field>
          </div>
        </AnnexeSection>
      )}
    </div>
  );
}

function StepRecap({ form }: { form: FormState }) {
  const total = computeTotal(form);
  const dateFin = addMonths(form.date_debut, parseInt(form.duree_mois, 10));
  return (
    <div className="grid gap-5">
      <RecapSection title="Client">
        <RecapRow label="Nom" value={form.client_nom} />
        <RecapRow label="Forme juridique" value={form.client_forme_juridique} />
        <RecapRow label="SIRET" value={form.client_siret} />
        <RecapRow label="Représentant" value={form.client_representant} />
        <RecapRow label="Email" value={form.client_email} />
        <RecapRow label="Téléphone" value={form.client_telephone} />
        <RecapRow label="Signature" value={`${form.lieu_signature}, le ${form.date_signature}`} />
      </RecapSection>
      <RecapSection title="Services souscrits">
        {form.services_souscrits.length === 0 ? (
          <p className="text-sm text-zinc-500">Aucun service sélectionné.</p>
        ) : (
          form.services_souscrits.map(key => (
            <RecapRow key={key} label={SERVICES_META[key as ServiceKey].label} value={form[`prix_${key}` as keyof FormState] as string} />
          ))
        )}
        {total && <RecapRow label="Total mensuel" value={total} highlight />}
      </RecapSection>
      <RecapSection title="Durée & facturation">
        <RecapRow label="Engagement" value={DUREE_LABELS[form.duree_mois]} />
        <RecapRow label="Début" value={form.date_debut} />
        <RecapRow label="Fin" value={dateFin} />
        <RecapRow label="Facturation" value={form.mode_facturation === "debut" ? "Début de mois" : "Fin de mois"} />
      </RecapSection>
    </div>
  );
}

function RecapSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40">
      <p className="border-b border-zinc-800 px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{title}</p>
      <div className="divide-y divide-zinc-800/40">{children}</div>
    </div>
  );
}

function RecapRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`text-right text-sm ${highlight ? "font-semibold text-white" : "text-zinc-300"}`}>{value || "—"}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function NouveauContratPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function set(key: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function toggle(key: ServiceKey) {
    setForm(prev => {
      const has = prev.services_souscrits.includes(key);
      const next = has
        ? prev.services_souscrits.filter(k => k !== key)
        : [...prev.services_souscrits, key];
      return { ...prev, services_souscrits: next };
    });
  }

  const payload = useMemo(() => {
    const dateFin = addMonths(form.date_debut, parseInt(form.duree_mois, 10));
    return { ...form, total_mensuel: computeTotal(form), date_fin: dateFin };
  }, [form]);

  function submit() {
    if (!form.client_nom.trim()) { setError("Le nom du client est requis."); setStep(0); return; }
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/contrats/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.headers.get("Content-Type")?.includes("application/pdf")) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `contrat_${form.client_nom}.pdf`;
          a.click();
          const id = res.headers.get("X-Contrat-Id");
          if (id) router.push(`/dashboard/entreprise/contrats/${id}`);
          else router.push("/dashboard/entreprise/contrats");
          return;
        }

        const data = await res.json();
        if (!res.ok) { setError(data.error ?? "Erreur inconnue"); return; }

        if (data.downloadUrl) {
          window.open(data.downloadUrl, "_blank");
        }
        router.push(`/dashboard/entreprise/contrats/${data.id}`);
      } catch (err) {
        setError(String(err));
      }
    });
  }

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-zinc-600">Entreprise</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">Nouveau contrat</h1>
      </div>

      {/* Stepper */}
      <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-1">
        {STEPS.map((label, i) => (
          <div key={i} className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-medium transition-colors ${
                i === step ? "border-white bg-white text-zinc-950"
                : i < step ? "border-zinc-600 text-zinc-400 hover:border-zinc-400"
                : "border-zinc-800 text-zinc-700"
              }`}
            >
              {i + 1}
            </button>
            <span className={`text-sm ${i === step ? "text-white" : "text-zinc-600"}`}>{label}</span>
            {i < STEPS.length - 1 && <span className="text-zinc-800">→</span>}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-6">
        {step === 0 && <StepClient form={form} set={set} />}
        {step === 1 && <StepServices form={form} set={set} toggle={toggle} />}
        {step === 2 && <StepDuree form={form} set={set} />}
        {step === 3 && <StepAnnexe form={form} set={set} />}
        {step === 4 && <StepRecap form={form} />}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => step > 0 ? setStep(s => s - 1) : router.push("/dashboard/entreprise/contrats")}
          className="h-10 rounded-lg border border-zinc-800 px-5 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
        >
          {step === 0 ? "Annuler" : "Retour"}
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep(s => s + 1)}
            className="h-10 rounded-lg bg-white px-6 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
          >
            Suivant
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={isPending}
            className="h-10 rounded-lg bg-white px-6 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 disabled:opacity-50"
          >
            {isPending ? "Génération…" : "Générer le PDF"}
          </button>
        )}
      </div>
    </div>
  );
}
