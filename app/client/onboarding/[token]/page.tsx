import { notFound } from "next/navigation";

import { OnboardingWizard } from "@/components/client/onboarding-wizard";
import type { OnboardingInitialData } from "@/components/client/onboarding-wizard";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function OnboardingPage({ params }: Props) {
  const { token } = await params;

  const inv = await prisma.clientInvitation.findFirst({
    where: { accessToken: token },
    include: {
      organization: {
        include: {
          prospect: { select: { nom: true, email: true, telephone: true } },
          billing: true,
        },
      },
    },
  });

  if (!inv) notFound();

  if (inv.tokenExpiresAt < new Date() && inv.status === "pending") {
    // Marque expirée
    await prisma.clientInvitation.update({
      where: { id: inv.id },
      data: { status: "expired" },
    });
  }

  if (inv.status === "completed") {
    return (
      <AlreadyCompletedPage orgName={inv.organization.name} />
    );
  }

  if (inv.status === "expired" || (inv.tokenExpiresAt < new Date())) {
    return <ExpiredPage />;
  }

  if (inv.status === "revoked") {
    return <RevokedPage />;
  }

  // Resync email : depuis Prospect tant que status = pending
  const contactEmail =
    inv.status === "pending"
      ? (inv.organization.prospect?.email ?? inv.contactEmail)
      : inv.contactEmail;

  const prefilled = inv.prefilledData as {
    offerKey: string;
    setupAmount: number;
    monthlyAmount: number;
    notesAdmin?: string;
  };

  const initialData: OnboardingInitialData = {
    token,
    contactEmail,
    orgId:          inv.organizationId,
    orgName:        inv.organization.name,
    siret:          inv.organization.siret ?? "",
    adresse:        inv.organization.adresse ?? "",
    formeJuridique: inv.organization.formeJuridique ?? "",
    representant:   inv.organization.representant ?? "",
    prospectNom:    inv.organization.prospect?.nom ?? inv.organization.name,
    telephone:      inv.organization.prospect?.telephone ?? "",
    prefilled: {
      offerKey:      prefilled.offerKey ?? "",
      setupAmount:   prefilled.setupAmount ?? 0,
      monthlyAmount: prefilled.monthlyAmount ?? 0,
      notesAdmin:    prefilled.notesAdmin,
    },
  };

  return (
    <main className="min-h-dvh bg-zinc-950 px-4 py-12 sm:px-6">
      <div className="mx-auto mb-10 max-w-lg text-center">
        <p className="text-xs uppercase tracking-widest text-zinc-600">Portail client</p>
        <h1 className="mt-1 text-xl font-medium tracking-tight text-white">F5L Brain</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Bienvenue — finalisez votre espace client en quelques étapes.
        </p>
      </div>
      <OnboardingWizard initialData={initialData} />
    </main>
  );
}

function AlreadyCompletedPage({ orgName }: { orgName: string }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-zinc-950 px-6 py-12 text-center">
      <p className="text-xs uppercase tracking-widest text-zinc-600">Compte activé</p>
      <h1 className="mt-2 text-xl font-medium text-white">Votre espace {orgName} est déjà actif</h1>
      <p className="mt-2 text-sm text-zinc-500">Connectez-vous pour y accéder.</p>
      <a href="/client/login" className="mt-6 inline-flex h-10 items-center rounded-lg bg-white px-6 text-sm font-medium text-zinc-950 hover:bg-zinc-200 transition-colors">
        Se connecter
      </a>
    </main>
  );
}

function ExpiredPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-zinc-950 px-6 py-12 text-center">
      <p className="text-xl text-white">Lien expiré</p>
      <p className="mt-2 text-sm text-zinc-500">Ce lien d&apos;invitation a expiré (7 jours). Contactez votre conseiller F5L pour en recevoir un nouveau.</p>
    </main>
  );
}

function RevokedPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-zinc-950 px-6 py-12 text-center">
      <p className="text-xl text-white">Invitation révoquée</p>
      <p className="mt-2 text-sm text-zinc-500">Cette invitation a été annulée. Contactez votre conseiller F5L.</p>
    </main>
  );
}
