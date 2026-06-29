import { NextRequest, NextResponse } from "next/server";

import { validateCode } from "@/lib/auth/invitation";
import { prisma } from "@/lib/prisma";

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  let body: { token?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const { token, code } = body;
  if (!token || !code) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const inv = await prisma.clientInvitation.findFirst({
    where: { accessToken: token, status: "in_progress" },
  });

  if (!inv || !inv.shortCodeSecret) {
    return NextResponse.json({ error: "Invitation invalide" }, { status: 400 });
  }

  // Vérification du verrou anti-brute-force
  if (inv.lockedUntil && inv.lockedUntil > new Date()) {
    const mins = Math.ceil((inv.lockedUntil.getTime() - Date.now()) / 60_000);
    return NextResponse.json(
      { error: `Trop de tentatives. Réessaie dans ${mins} minute(s).` },
      { status: 429 },
    );
  }

  const valid = validateCode(inv.shortCodeSecret, code.trim());

  if (!valid) {
    const newAttempts = inv.failedAttempts + 1;
    const shouldLock  = newAttempts >= MAX_ATTEMPTS;

    await prisma.clientInvitation.update({
      where: { id: inv.id },
      data: {
        failedAttempts: newAttempts,
        lockedUntil: shouldLock ? new Date(Date.now() + LOCK_DURATION_MS) : null,
      },
    });

    if (shouldLock) {
      return NextResponse.json(
        { error: "5 tentatives échouées — compte bloqué 15 minutes." },
        { status: 429 },
      );
    }

    const remaining = MAX_ATTEMPTS - newAttempts;
    return NextResponse.json(
      { error: `Code incorrect. ${remaining} tentative(s) restante(s).` },
      { status: 400 },
    );
  }

  // Succès
  await prisma.clientInvitation.update({
    where: { id: inv.id },
    data: { failedAttempts: 0, lockedUntil: null, codeValidatedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
