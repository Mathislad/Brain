import { NextResponse, type NextRequest } from "next/server";

import type { ContratFormData } from "@/app/actions/contrats";
import { generateContratPdf } from "@/lib/contrat-pdf";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeFilename(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const contrat = await prisma.contrat.findFirst({
    where: { id, userId: user.id },
  });

  if (!contrat) {
    return NextResponse.json({ error: "Contrat introuvable" }, { status: 404 });
  }

  const formData = contrat.formData as unknown as ContratFormData;
  const pdf = generateContratPdf(formData);
  const filename = `contrat_${safeFilename(contrat.clientNom || "client")}.pdf`;

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
