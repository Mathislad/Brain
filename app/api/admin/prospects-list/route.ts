import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { excludeDoNotCall, getDoNotCallPhones } from "@/lib/do-not-call-db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const [prospects, blocked] = await Promise.all([
    prisma.prospect.findMany({
      where: { userId: user.id },
      select: { id: true, nom: true, email: true, entreprise: true, telephone: true },
      orderBy: { nom: "asc" },
    }),
    getDoNotCallPhones(user.id),
  ]);

  // Exclut les numéros en liste rouge, puis retire le téléphone de la réponse.
  const visible = excludeDoNotCall(prospects, blocked).map((p) => ({
    id: p.id,
    nom: p.nom,
    email: p.email,
    entreprise: p.entreprise,
  }));

  return NextResponse.json(visible);
}
