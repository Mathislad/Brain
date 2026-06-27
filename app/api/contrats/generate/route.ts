import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

import { createContratAction } from "@/app/actions/contrats";
import { getCurrentUser } from "@/lib/session";

const PYTHON_SERVICE = process.env.PYTHON_SERVICE_URL ?? "http://localhost:8001";

const supabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let formData: Record<string, unknown>;
  try {
    formData = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  // 1. Appeler le service Python
  let docxBytes: ArrayBuffer;
  try {
    const pyRes = await fetch(`${PYTHON_SERVICE}/fill-contract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!pyRes.ok) {
      const detail = await pyRes.json().catch(() => ({ detail: "Erreur inconnue" }));
      return NextResponse.json(
        { error: detail.detail ?? "Erreur du service Python" },
        { status: 502 },
      );
    }

    docxBytes = await pyRes.arrayBuffer();
  } catch (err) {
    return NextResponse.json(
      {
        error:
          "Service Python inaccessible. Lance : cd python-service && python3 -m uvicorn main:app --port 8001",
        detail: String(err),
      },
      { status: 503 },
    );
  }

  // 2. Upload dans Supabase Storage
  const clientSlug = String(formData.client_nom ?? "client")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40);
  const timestamp = Date.now();
  const filename = `contrat_${clientSlug}_${timestamp}.docx`;
  const storagePath = `${user.id}/${filename}`;

  let uploadedPath: string | undefined;
  try {
    const supabase = supabaseAdmin();
    const { error: uploadErr } = await supabase.storage
      .from("contrats")
      .upload(storagePath, Buffer.from(docxBytes), {
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        upsert: false,
      });

    if (!uploadErr) {
      uploadedPath = storagePath;
    }
    // Si le bucket n'existe pas encore on continue sans storage
  } catch {
    // pas bloquant
  }

  // 3. Enregistrer en DB
  let contratId: string;
  try {
    contratId = await createContratAction(
      formData as unknown as Parameters<typeof createContratAction>[0],
      uploadedPath,
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  // 4. Signed URL (60 min) si upload OK
  let downloadUrl: string | null = null;
  if (uploadedPath) {
    try {
      const supabase = supabaseAdmin();
      const { data } = await supabase.storage
        .from("contrats")
        .createSignedUrl(uploadedPath, 3600);
      downloadUrl = data?.signedUrl ?? null;
    } catch {
      // pas bloquant
    }
  }

  // 5. Fallback : retourner le docx directement si pas de storage
  if (!downloadUrl) {
    return new NextResponse(docxBytes, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Contrat-Id": contratId,
      },
    });
  }

  return NextResponse.json({ id: contratId, downloadUrl, filename });
}
