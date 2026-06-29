"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { formatCents, offerLabel, PORTAL_OFFERS } from "@/lib/offers";

type PaymentGateProps = {
  orgName: string;
  billing: {
    offerKey: string | null;
    setupAmount: number | null;
    monthlyAmount: number | null;
    subscriptionStatus: string;
    isSimulated: boolean;
  } | null;
};

function calendlyUrl() {
  const raw =
    process.env.NEXT_PUBLIC_CALENDLY_URL ||
    "https://calendly.com/f5l-agency/audit-gratuit";
  const value = raw.trim();
  const absolute = /^https?:\/\//i.test(value)
    ? value
    : `https://calendly.com/${value.replace(/^\/+/, "")}`;

  const params = new URLSearchParams({
    hide_gdpr_banner: "1",
    primary_color: "3B6BFF",
    background_color: "09090b",
    text_color: "F4F4F5",
  });

  return `${absolute.replace(/\/+$/, "")}?${params.toString()}`;
}

export function PaymentGate({ orgName, billing }: PaymentGateProps) {
  const router = useRouter();
  const [showCalendly, setShowCalendly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const bookingUrl = useMemo(() => calendlyUrl(), []);

  if (billing?.subscriptionStatus === "active") return null;

  function activate() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/client/billing/activate-current", {
          method: "POST",
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Impossible d'activer l'abonnement.");
          return;
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur réseau.");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/90 px-4 py-6 backdrop-blur-sm sm:px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-gate-title"
    >
      <div className="mx-auto grid min-h-full max-w-5xl place-items-center">
        <section className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[0.86fr_1.14fr]">
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-600">
                Activation F5L Brain
              </p>
              <h2
                id="payment-gate-title"
                className="mt-2 text-2xl font-medium tracking-tight text-white"
              >
                Finalisez votre accès, {orgName}
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Votre compte client est créé. Avant de prendre un abonnement,
                il est recommandé de réserver un rendez-vous avec F5L pour
                choisir l&apos;offre la plus adaptée à votre situation.
              </p>

              {billing && (
                <div className="mt-5 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
                  <p className="text-xs uppercase tracking-widest text-zinc-600">
                    Offre préparée
                  </p>
                  <p className="mt-1 text-base font-medium text-white">
                    {billing.offerKey ? offerLabel(billing.offerKey) : "À définir"}
                  </p>
                  <div className="mt-3 grid gap-2 text-sm">
                    {billing.setupAmount !== null && billing.setupAmount > 0 && (
                      <div className="flex justify-between gap-4">
                        <span className="text-zinc-500">Installation</span>
                        <span className="text-zinc-200">
                          {formatCents(billing.setupAmount)}
                        </span>
                      </div>
                    )}
                    {billing.monthlyAmount !== null && (
                      <div className="flex justify-between gap-4">
                        <span className="text-zinc-500">Mensualité</span>
                        <span className="text-zinc-200">
                          {formatCents(billing.monthlyAmount)}/mois
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={() => setShowCalendly((value) => !value)}
                  className="h-11 rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
                >
                  {showCalendly ? "Masquer le calendrier" : "Prendre rendez-vous avant de payer"}
                </button>
                <button
                  type="button"
                  onClick={activate}
                  disabled={isPending || !billing}
                  className="h-11 rounded-lg bg-white px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? "Activation…" : "Continuer vers le paiement"}
                </button>
              </div>

              <p className="mt-3 text-xs leading-5 text-zinc-700">
                V1 : ce bouton active l&apos;espace avec le flux de test actuel.
                La prochaine étape technique est de remplacer cette activation
                par Stripe Checkout et les webhooks Stripe.
              </p>

              {error && (
                <p className="mt-3 rounded-lg border border-red-900/50 bg-red-950/20 px-3 py-2 text-sm text-red-300">
                  {error}
                </p>
              )}
            </div>

            <div className="grid gap-4">
              {showCalendly ? (
                <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
                  <iframe
                    src={bookingUrl}
                    title="Prendre rendez-vous avec F5L"
                    className="h-[620px] w-full border-0"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="grid gap-3">
                  {PORTAL_OFFERS.map((offer) => {
                    const selected = billing?.offerKey === offer.key;
                    return (
                      <article
                        key={offer.key}
                        className={`rounded-lg border p-4 ${
                          selected
                            ? "border-blue-500/70 bg-blue-950/20"
                            : offer.highlighted
                              ? "border-zinc-700 bg-zinc-900/50"
                              : "border-zinc-800 bg-zinc-900/30"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-medium text-white">{offer.title}</h3>
                            <p className="mt-2 text-sm leading-6 text-zinc-400">
                              {offer.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-blue-300">
                              {offer.monthlyLabel}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {offer.setupLabel}
                            </p>
                          </div>
                        </div>
                        {selected && (
                          <p className="mt-3 text-xs font-medium text-blue-300">
                            Offre préparée pour votre compte
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
