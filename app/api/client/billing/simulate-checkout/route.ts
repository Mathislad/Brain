import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

// TODO Stripe V3 :
// 1. POST /api/client/billing/create-checkout → Stripe Checkout Session
//    (mode subscription, setup fee via add_invoice_items, SCA automatique via Checkout)
// 2. POST /api/stripe/webhook → vérif signature HMAC, events à gérer :
//    - checkout.session.completed  → subscriptionStatus = 'active'
//    - invoice.paid                → maintien active
//    - invoice.payment_failed      → subscriptionStatus = 'past_due'
//    - customer.subscription.deleted → subscriptionStatus = 'canceled'
// 3. Stripe Customer Portal → bouton "Gérer mon abonnement" dans /client/billing
// Le budget publicitaire (Meta/Google) reste payé DIRECTEMENT par le client sur les
// plateformes, jamais avancé par F5L (risque trésorerie micro-entreprise BNC).

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const { token } = body;
  if (!token) {
    return NextResponse.json({ error: "Token manquant" }, { status: 400 });
  }

  const inv = await prisma.clientInvitation.findFirst({
    where: { accessToken: token, status: "in_progress" },
    include: { organization: { include: { billing: true } } },
  });

  if (!inv) {
    return NextResponse.json({ error: "Invitation invalide" }, { status: 400 });
  }

  // Le code doit avoir été validé avant le paiement
  if (!inv.codeValidatedAt) {
    return NextResponse.json(
      { error: "Le code de vérification doit être validé avant le paiement" },
      { status: 400 },
    );
  }

  // Vérifie que l'utilisateur est bien membre CLIENT de cette org
  const membership = await prisma.organizationMember.findFirst({
    where: { organizationId: inv.organizationId, userId: user.id, role: "CLIENT" },
  });
  if (!membership) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // V1 — simulation : tout s'active atomiquement
  await prisma.$transaction([
    prisma.organizationBilling.update({
      where: { organizationId: inv.organizationId },
      data: {
        subscriptionStatus: "active",
        isSimulated: true,
        activatedAt: new Date(),
      },
    }),
    prisma.organization.update({
      where: { id: inv.organizationId },
      data: { status: "active" },
    }),
    prisma.clientInvitation.update({
      where: { id: inv.id },
      data: { status: "completed", completedAt: new Date() },
    }),
    ...(inv.organization.prospectId
      ? [
          prisma.prospect.update({
            where: { id: inv.organization.prospectId },
            data: { status: "CLIENT_ACTIF" },
          }),
        ]
      : []),
  ]);

  return NextResponse.json({ success: true });
}
