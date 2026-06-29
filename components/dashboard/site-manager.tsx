"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { SiteItemForm } from "./site-item-form";
import {
  createSiteAction,
  updateSiteAction,
  deleteSiteAction,
  deleteSiteItemAction,
  updateSiteItemAction,
  reorderSiteItemsAction,
} from "@/app/actions/sites";
import {
  SITE_ITEM_TYPE_LABELS,
  type SiteFormData,
  type SiteItemView,
  type SiteView,
} from "@/lib/site-types";

interface ProspectOption {
  id: string;
  label: string;
}

interface Props {
  sites: SiteView[];
  prospects: ProspectOption[];
  baseUrl: string;
}

const INPUT =
  "w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-600 disabled:opacity-50";

function formatPrice(p: number | null): string {
  if (p == null) return "";
  return p.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export function SiteManager({ sites, prospects, baseUrl }: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(
    sites[0]?.id ?? null,
  );
  const [itemForm, setItemForm] = useState<
    { siteId: string; item?: SiteItemView } | null
  >(null);
  const [siteForm, setSiteForm] = useState<{ site?: SiteView } | null>(null);
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  const selectedSite =
    sites.find((s) => s.id === selectedId) ?? sites[0] ?? null;

  function copyApiUrl(slug: string) {
    const url = `${baseUrl}/api/public/site/${slug}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function toggleItemVisible(item: SiteItemView) {
    startTransition(async () => {
      await updateSiteItemAction(item.id, {
        type: item.type,
        title: item.title,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        visible: !item.visible,
      });
      router.refresh();
    });
  }

  function removeItem(id: string) {
    if (!confirm("Supprimer cet élément ?")) return;
    startTransition(async () => {
      await deleteSiteItemAction(id);
      router.refresh();
    });
  }

  function move(site: SiteView, index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= site.items.length) return;
    const ids = site.items.map((i) => i.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    startTransition(async () => {
      await reorderSiteItemsAction(site.id, ids);
      router.refresh();
    });
  }

  function removeSite(site: SiteView) {
    if (!confirm(`Supprimer le site « ${site.name} » et tout son contenu ?`))
      return;
    startTransition(async () => {
      await deleteSiteAction(site.id);
      setSelectedId(null);
      router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
      {/* Colonne gauche : liste des sites */}
      <div className="space-y-3">
        <button
          onClick={() => setSiteForm({})}
          className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90"
        >
          + Nouveau site
        </button>

        <div className="flex flex-col gap-1.5">
          {sites.map((site) => {
            const active = selectedSite?.id === site.id;
            return (
              <button
                key={site.id}
                onClick={() => setSelectedId(site.id)}
                className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  active
                    ? "border-zinc-600 bg-zinc-900"
                    : "border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900/50"
                }`}
              >
                <p className="truncate text-sm font-medium text-white">
                  {site.name}
                </p>
                <p className="mt-0.5 truncate text-xs text-zinc-500">
                  {site.items.length} élément
                  {site.items.length !== 1 ? "s" : ""}
                  {site.prospectName ? ` · ${site.prospectName}` : ""}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Colonne droite : détail du site sélectionné */}
      <div>
        {!selectedSite ? (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 px-6 py-16 text-center">
            <p className="text-sm text-zinc-400">Aucun site pour l&apos;instant.</p>
            <p className="mt-1 text-xs text-zinc-600">
              Crée un site pour commencer à gérer son contenu.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* En-tête du site */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-lg font-medium text-white">
                      {selectedSite.name}
                    </h2>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                        selectedSite.published
                          ? "border-emerald-900/50 bg-emerald-950/60 text-emerald-400"
                          : "border-zinc-700 bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {selectedSite.published ? "Publié" : "Brouillon"}
                    </span>
                  </div>
                  {selectedSite.prospectName && (
                    <p className="mt-1 text-xs text-zinc-500">
                      Client : {selectedSite.prospectName}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => setSiteForm({ site: selectedSite })}
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => removeSite(selectedSite)}
                    className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-red-400 transition-colors hover:border-red-900/60 hover:bg-red-950/30"
                  >
                    Supprimer
                  </button>
                </div>
              </div>

              {/* URL API publique — la « connexion » avec le site live */}
              <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                  API publique (à connecter au site live)
                </p>
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded bg-zinc-900 px-2 py-1.5 text-xs text-emerald-300">
                    {baseUrl}/api/public/site/{selectedSite.slug}
                  </code>
                  <button
                    onClick={() => copyApiUrl(selectedSite.slug)}
                    className="shrink-0 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                  >
                    {copied ? "Copié ✓" : "Copier"}
                  </button>
                </div>
              </div>
            </div>

            {/* Liste des éléments */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-300">
                  Offres & produits
                </h3>
                <button
                  onClick={() => setItemForm({ siteId: selectedSite.id })}
                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-black transition-opacity hover:opacity-90"
                >
                  + Ajouter
                </button>
              </div>

              {selectedSite.items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 px-6 py-12 text-center">
                  <p className="text-sm text-zinc-400">Aucun élément.</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Ajoute une offre ou un produit avec une image.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {selectedSite.items.map((item, index) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-3 ${
                        item.visible ? "" : "opacity-50"
                      }`}
                    >
                      {/* Réordonnancement */}
                      <div className="flex flex-col">
                        <button
                          onClick={() => move(selectedSite, index, -1)}
                          disabled={index === 0}
                          className="text-zinc-600 transition-colors hover:text-white disabled:opacity-30"
                          title="Monter"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => move(selectedSite, index, 1)}
                          disabled={index === selectedSite.items.length - 1}
                          className="text-zinc-600 transition-colors hover:text-white disabled:opacity-30"
                          title="Descendre"
                        >
                          ▼
                        </button>
                      </div>

                      {/* Image */}
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="h-14 w-14 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-700">
                          ▢
                        </div>
                      )}

                      {/* Infos */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                            {SITE_ITEM_TYPE_LABELS[item.type]}
                          </span>
                          <p className="truncate text-sm font-medium text-white">
                            {item.title}
                          </p>
                        </div>
                        {item.description && (
                          <p className="mt-0.5 truncate text-xs text-zinc-500">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Prix */}
                      {item.price != null && (
                        <span className="shrink-0 text-sm font-medium text-zinc-300">
                          {formatPrice(item.price)}
                        </span>
                      )}

                      {/* Actions */}
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => toggleItemVisible(item)}
                          title={item.visible ? "Masquer" : "Afficher"}
                          className="rounded-lg px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
                        >
                          {item.visible ? "👁" : "🚫"}
                        </button>
                        <button
                          onClick={() =>
                            setItemForm({ siteId: selectedSite.id, item })
                          }
                          className="rounded-lg px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="rounded-lg px-2 py-1 text-xs text-red-400 transition-colors hover:bg-red-950/30"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modale élément */}
      {itemForm && (
        <SiteItemForm
          siteId={itemForm.siteId}
          item={itemForm.item}
          onClose={() => setItemForm(null)}
        />
      )}

      {/* Modale site */}
      {siteForm && (
        <SiteFormModal
          site={siteForm.site}
          prospects={prospects}
          onClose={(newId) => {
            setSiteForm(null);
            if (newId) setSelectedId(newId);
          }}
        />
      )}
    </div>
  );
}

// ─── Modale création / édition de site ──────────────────────────────────────

function SiteFormModal({
  site,
  prospects,
  onClose,
}: {
  site?: SiteView;
  prospects: ProspectOption[];
  onClose: (newSelectedId?: string) => void;
}) {
  const router = useRouter();
  const isEdit = !!site;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(site?.name ?? "");
  const [prospectId, setProspectId] = useState(site?.prospectId ?? "");
  const [domain, setDomain] = useState(site?.domain ?? "");
  const [published, setPublished] = useState(site?.published ?? true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Le nom est requis.");
      return;
    }
    setError(null);

    const data: SiteFormData = {
      name: name.trim(),
      prospectId: prospectId || null,
      domain: domain.trim() || null,
      published,
    };

    startTransition(async () => {
      const res = isEdit
        ? await updateSiteAction(site.id, data)
        : await createSiteAction(data);
      if (res.ok) {
        router.refresh();
        onClose(isEdit ? undefined : (res as { id?: string }).id);
      } else {
        setError(res.error ?? "Impossible d'enregistrer.");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && !isPending && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-base font-medium text-white">
            {isEdit ? "Modifier le site" : "Nouveau site"}
          </h2>
          <button
            onClick={() => onClose()}
            disabled={isPending}
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
              Nom du site *
            </label>
            <input
              className={INPUT}
              placeholder="La Constantinoise"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
              Client lié (optionnel)
            </label>
            <select
              className={INPUT}
              value={prospectId}
              onChange={(e) => setProspectId(e.target.value)}
              disabled={isPending}
            >
              <option value="">— Aucun —</option>
              {prospects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
              Domaine du site live (optionnel)
            </label>
            <input
              className={INPUT}
              placeholder="https://laconstantinoise.fr"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              disabled={isPending}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              disabled={isPending}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-900"
            />
            <span className="text-sm text-zinc-300">
              Publié (visible via l&apos;API publique)
            </span>
          </label>

          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => onClose()}
              disabled={isPending}
              className="rounded-lg px-4 py-2 text-sm text-zinc-400 transition-colors hover:text-white disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {isPending && (
                <span className="animate-spin text-base leading-none">↻</span>
              )}
              {isEdit ? "Enregistrer" : "Créer le site"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
