import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";

// Crée le compte Supabase Auth via admin SDK (email_confirm: true → pas de mail de vérification).
// L'invitation contrôlée par token + code court remplace le flow de confirmation email.

export async function POST(req: NextRequest) {
  let body: { token?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const { token, password } = body;
  if (!token || !password) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Mot de passe trop court (8 caractères minimum)" }, { status: 400 });
  }

  // Résolution depuis le token (jamais depuis le body)
  const inv = await prisma.clientInvitation.findFirst({
    where: { accessToken: token, status: "pending" },
    include: { organization: { include: { prospect: true } } },
  });

  if (!inv) {
    return NextResponse.json({ error: "Invitation invalide ou expirée" }, { status: 400 });
  }
  if (inv.tokenExpiresAt < new Date()) {
    return NextResponse.json({ error: "Invitation expirée" }, { status: 400 });
  }

  // Resync : email depuis Prospect si pending
  const email = inv.organization.prospect?.email ?? inv.contactEmail;
  if (!email) {
    return NextResponse.json({ error: "Email introuvable sur l'invitation" }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();

  // Tente la création — Supabase retourne une erreur si l'email existe déjà.
  const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createErr) {
    // "User already registered" → 409
    const status = createErr.message.toLowerCase().includes("already") ? 409 : 400;
    return NextResponse.json({ error: createErr.message }, { status });
  }

  return NextResponse.json({ success: true });
}
