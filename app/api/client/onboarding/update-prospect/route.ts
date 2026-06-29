import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// Mise à jour des infos client pendant l'onboarding (étape 1).
// Whitelist stricte. Les IDs sont résolus depuis le token, JAMAIS depuis le body.

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token : null;
  if (!token) {
    return NextResponse.json({ error: "Token manquant" }, { status: 400 });
  }

  // Résolution depuis le token (jamais depuis le body)
  const inv = await prisma.clientInvitation.findFirst({
    where: { accessToken: token, status: "pending" },
    include: { organization: true },
  });

  if (!inv) {
    return NextResponse.json({ error: "Invitation invalide ou expirée" }, { status: 400 });
  }

  const orgId      = inv.organizationId;
  const prospectId = inv.organization.prospectId;

  // ── Prospect : whitelist nom, telephone ─────────────────────────────────────
  if (prospectId) {
    const prospectUpdate: { nom?: string; telephone?: string } = {};

    if (typeof body.nom === "string") {
      prospectUpdate.nom = body.nom.trim().slice(0, 200);
    }
    if (typeof body.telephone === "string") {
      prospectUpdate.telephone = body.telephone.trim().slice(0, 50);
    }

    if (Object.keys(prospectUpdate).length > 0) {
      await prisma.prospect.update({ where: { id: prospectId }, data: prospectUpdate });
    }
  }

  // ── Organization : whitelist siret, adresse, formeJuridique, representant ──
  const orgUpdate: {
    siret?: string;
    adresse?: string;
    formeJuridique?: string;
    representant?: string;
  } = {};

  if (typeof body.siret === "string")          orgUpdate.siret           = body.siret.trim().slice(0, 50);
  if (typeof body.adresse === "string")        orgUpdate.adresse         = body.adresse.trim().slice(0, 300);
  if (typeof body.formeJuridique === "string") orgUpdate.formeJuridique  = body.formeJuridique.trim().slice(0, 100);
  if (typeof body.representant === "string")   orgUpdate.representant    = body.representant.trim().slice(0, 200);

  if (Object.keys(orgUpdate).length > 0) {
    await prisma.organization.update({ where: { id: orgId }, data: orgUpdate });
  }

  return NextResponse.json({ success: true });
}
