import { requireClient } from "@/lib/auth/roles";
import { getMyDocumentsAction } from "@/app/actions/organizations";

const CATEGORY_LABELS: Record<string, string> = {
  contrat: "Contrat", facture: "Facture", brief: "Brief", livrable: "Livrable", suivi: "Suivi",
};

export default async function ClientDocumentsPage() {
  await requireClient();
  const documents = await getMyDocumentsAction();

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-zinc-600">Documents</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">Mes documents</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {documents.length} document{documents.length !== 1 ? "s" : ""} disponible{documents.length !== 1 ? "s" : ""}.
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 px-8 py-20 text-center">
          <p className="text-sm text-zinc-500">Aucun document pour le moment.</p>
          <p className="mt-1 text-xs text-zinc-700">
            Votre conseiller F5L partagera vos livrables ici au fil de l&apos;accompagnement.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-start justify-between gap-4 rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-5 py-4">
              <div>
                <p className="font-medium text-white">{doc.title}</p>
                {doc.description && <p className="mt-0.5 text-sm text-zinc-500">{doc.description}</p>}
                <div className="mt-2 flex items-center gap-3">
                  {doc.category && (
                    <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[11px] text-zinc-500">
                      {CATEGORY_LABELS[doc.category] ?? doc.category}
                    </span>
                  )}
                  <span className="text-xs text-zinc-700">
                    {new Intl.DateTimeFormat("fr-FR").format(doc.createdAt)}
                  </span>
                </div>
              </div>
              {doc.externalUrl && (
                <a href={doc.externalUrl} target="_blank" rel="noreferrer"
                  className="inline-flex h-8 items-center rounded-lg border border-zinc-700 px-3 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white">
                  Ouvrir
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
