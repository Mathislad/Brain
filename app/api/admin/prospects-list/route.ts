import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const prospects = await prisma.prospect.findMany({
    where: { userId: user.id },
    select: { id: true, nom: true, email: true, entreprise: true },
    orderBy: { nom: "asc" },
  });

  return NextResponse.json(prospects);
}
