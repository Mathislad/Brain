import { redirect } from "next/navigation";

import { DocumentsManager } from "@/components/dashboard/documents-manager";
import { getCurrentUser } from "@/lib/session";
import { getDocuments } from "@/lib/documents-db";
import { getProspects } from "@/lib/prospects-db";
import type {
  DocumentKind,
  DocumentListItem,
  DocumentStatus,
  ProspectOption,
} from "@/lib/document-templates";

export default async function DevisFacturePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [docs, prospects] = await Promise.all([
    getDocuments(user.id),
    getProspects(user.id),
  ]);

  const documents: DocumentListItem[] = docs.map((d) => ({
    id: d.id,
    type: d.type as DocumentKind,
    templateId: d.templateId,
    reference: d.reference,
    title: d.title,
    status: d.status as DocumentStatus,
    amount: d.amount,
    issuedAt: new Date(d.issuedAt).toISOString().slice(0, 10),
    clientId: d.prospect.id,
    clientName: d.prospect.entreprise || d.prospect.nom,
  }));

  const prospectOptions: ProspectOption[] = prospects.map((p) => ({
    id: p.id,
    name: p.entreprise ? `${p.entreprise} — ${p.nom}` : p.nom,
  }));

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-zinc-600">
          Entreprise
        </p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">
          Devis &amp; facture
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Devis, factures et contrats — classés par client et par date.
        </p>
      </div>

      <DocumentsManager documents={documents} prospects={prospectOptions} />
    </div>
  );
}
