import { NextResponse, type NextRequest } from "next/server";

import { getPublicSiteBySlug } from "@/lib/sites-db";

// API publique en lecture seule : le site live du client (construit séparément)
// consomme ce JSON pour afficher offres/produits/images gérés depuis Brain.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const CACHE_HEADER = "public, s-maxage=60, stale-while-revalidate=300";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  let payload;
  try {
    payload = await getPublicSiteBySlug(slug);
  } catch {
    return NextResponse.json(
      { error: "Service indisponible." },
      { status: 503, headers: CORS_HEADERS },
    );
  }

  if (!payload) {
    return NextResponse.json(
      { error: "Site introuvable." },
      { status: 404, headers: CORS_HEADERS },
    );
  }

  return NextResponse.json(payload, {
    status: 200,
    headers: { ...CORS_HEADERS, "Cache-Control": CACHE_HEADER },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
