"use server";

import { revalidatePath } from "next/cache";

import { generateAccessToken, generateShortCodeSecret, getCurrentCode } from "@/lib/auth/invitation";
import { DEFAULT_FEATURES } from "@/lib/auth/features";
import { requireAdmin } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

// ─── Lecture (admin) ──────────────────────────────────────────────────────────

export async function getInvitationsAction() {
  const user = await requireAdmin();

  const invitations = await prisma.clientInvitation.findMany({
    where: { createdBy: user.id },
    include: { organization: { include: { prospect: true } } },
    orderBy: { createdAt: "desc" },
  });

  return invitations.map((inv) => ({
    ...inv,
    // Resync contactEmail depuis Prospect tant que status = pending
    contactEmail:
      inv.status === "pending"
        ? (inv.organization.prospect?.email ?? inv.contactEmail)
        : inv.contactEmail,
    currentCode: inv.shortCodeSecret ? getCurrentCode(inv.shortCodeSecret) : null,
  }));
}

// ─── Création (admin) ─────────────────────────────────────────────────────────

export async function createInvitationAction(data: {
  prospectId: string;
  offerKey: string;
  setupAmount: number;    // centimes
  monthlyAmount: number;  // centimes
  notesAdmin: string;
}) {
  const user = await requireAdmin();

  const prospect = await prisma.prospect.findFirst({
    where: { id: data.prospectId, userId: user.id },
  });
  if (!prospect) throw new Error("Prospect introuvable");
  if (!prospect.email) throw new Error("Le prospect n'a pas d'email renseigné");

  // Upsert Organisation liée au prospect
  let org = await prisma.organization.findFirst({ where: { prospectId: data.prospectId } });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: prospect.nom,
        type: "client",
        status: "pending",
        prospectId: data.prospectId,
      },
    });

    // Features par défaut
    await prisma.organizationFeature.createMany({
      data: Object.entries(DEFAULT_FEATURES).map(([key, enabled]) => ({
        organizationId: org!.id,
        featureKey: key,
        enabled,
      })),
      skipDuplicates: true,
    });

    // Billing initial
    await prisma.organizationBilling.create({
      data: {
        organizationId: org.id,
        offerKey: data.offerKey,
        setupAmount: data.setupAmount,
        monthlyAmount: data.monthlyAmount,
        subscriptionStatus: "inactive",
        isSimulated: true,
      },
    });
  } else {
    // Met à jour le billing si l'org existait déjà
    await prisma.organizationBilling.upsert({
      where: { organizationId: org.id },
      create: {
        organizationId: org.id,
        offerKey: data.offerKey,
        setupAmount: data.setupAmount,
        monthlyAmount: data.monthlyAmount,
        subscriptionStatus: "inactive",
        isSimulated: true,
      },
      update: {
        offerKey: data.offerKey,
        setupAmount: data.setupAmount,
        monthlyAmount: data.monthlyAmount,
      },
    });
  }

  // Révoque les invitations pending existantes sur cet org
  await prisma.clientInvitation.updateMany({
    where: { organizationId: org.id, status: "pending" },
    data: { status: "revoked" },
  });

  const accessToken     = generateAccessToken();
  const shortCodeSecret = generateShortCodeSecret();
  const tokenExpiresAt  = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invitation = await prisma.clientInvitation.create({
    data: {
      organizationId: org.id,
      contactEmail:   prospect.email,
      accessToken,
      tokenExpiresAt,
      shortCodeSecret,
      prefilledData: {
        offerKey:     data.offerKey,
        setupAmount:  data.setupAmount,
        monthlyAmount: data.monthlyAmount,
        notesAdmin:   data.notesAdmin,
      },
      status: "pending",
      createdBy: user.id,
    },
  });

  revalidatePath("/dashboard/entreprise/invitations");
  return { invitationId: invitation.id, accessToken };
}

// ─── Révocation (admin) ───────────────────────────────────────────────────────

export async function revokeInvitationAction(id: string) {
  const user = await requireAdmin();

  await prisma.clientInvitation.updateMany({
    where: { id, createdBy: user.id, status: { in: ["pending", "in_progress"] } },
    data: { status: "revoked" },
  });

  revalidatePath("/dashboard/entreprise/invitations");
}

// ─── Finalisation onboarding (appelé après signUp côté client) ───────────────

export async function completeSignupAction(token: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié");

  const inv = await prisma.clientInvitation.findFirst({
    where: { accessToken: token, status: "pending" },
    include: { organization: { include: { prospect: true } } },
  });

  if (!inv) throw new Error("Invitation invalide ou déjà utilisée");
  if (inv.tokenExpiresAt < new Date()) throw new Error("Invitation expirée");

  // Vérifie l'email (resync : on lit depuis Prospect si pending)
  const expectedEmail = inv.organization.prospect?.email ?? inv.contactEmail;
  if (user.email?.toLowerCase() !== expectedEmail.toLowerCase()) {
    throw new Error("L'email du compte ne correspond pas à l'invitation");
  }

  // Crée ou retrouve le membership CLIENT
  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: inv.organizationId,
        userId: user.id,
      },
    },
    create: {
      organizationId: inv.organizationId,
      userId: user.id,
      role: "CLIENT",
    },
    update: {},
  });

  // Gèle l'email et passe en in_progress
  await prisma.clientInvitation.update({
    where: { id: inv.id },
    data: {
      status: "in_progress",
      contactEmail: user.email!,
    },
  });
}
