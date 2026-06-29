import { NextResponse } from "next/server";

import { requireClient } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

// V1 : activation locale pour valider le parcours client.
// Remplacer ensuite par :
// 1. POST /api/client/billing/create-checkout -> Stripe Checkout Session
// 2. POST /api/stripe/webhook -> activation apres checkout.session.completed
export async function POST() {
  const { organization, user } = await requireClient();

  const billing = organization.billing;
  if (!billing) {
    return NextResponse.json(
      { error: "Aucun abonnement à activer pour cette organisation." },
      { status: 400 },
    );
  }

  if (billing.subscriptionStatus === "active") {
    return NextResponse.json({ success: true, alreadyActive: true });
  }

  const invitation = await prisma.clientInvitation.findFirst({
    where: {
      organizationId: organization.id,
      contactEmail: user.email ?? undefined,
      status: { in: ["pending", "in_progress"] },
    },
    orderBy: { updatedAt: "desc" },
  });

  await prisma.$transaction([
    prisma.organizationBilling.update({
      where: { organizationId: organization.id },
      data: {
        subscriptionStatus: "active",
        isSimulated: true,
        activatedAt: new Date(),
      },
    }),
    prisma.organization.update({
      where: { id: organization.id },
      data: { status: "active" },
    }),
    ...(invitation
      ? [
          prisma.clientInvitation.update({
            where: { id: invitation.id },
            data: { status: "completed", completedAt: new Date() },
          }),
        ]
      : []),
    ...(organization.prospectId
      ? [
          prisma.prospect.update({
            where: { id: organization.prospectId },
            data: { status: "CLIENT_ACTIF" },
          }),
        ]
      : []),
  ]);

  return NextResponse.json({ success: true });
}
