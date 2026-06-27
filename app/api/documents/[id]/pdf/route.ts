import { NextResponse, type NextRequest } from "next/server";

import { generateDocumentPdf } from "@/lib/document-pdf";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, String(item ?? "")]),
  );
}

function filename(value: string) {
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
  const document = await prisma.document.findFirst({
    where: { id, userId: user.id },
    include: {
      prospect: {
        select: {
          nom: true,
          entreprise: true,
          email: true,
          telephone: true,
          ville: true,
          activite: true,
        },
      },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }

  const pdf = generateDocumentPdf({
    type: document.type,
    templateId: document.templateId,
    reference: document.reference,
    title: document.title,
    status: document.status,
    amount: document.amount,
    data: asRecord(document.data),
    issuedAt: document.issuedAt,
    prospect: document.prospect,
  });
  const safeName = filename(`${document.reference}-${document.title}`) || "document";

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${safeName}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
