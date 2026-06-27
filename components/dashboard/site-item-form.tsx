"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  createSiteItemAction,
  updateSiteItemAction,
  uploadSiteImageAction,
} from "@/app/actions/sites";
import {
  SITE_ITEM_TYPES,
  SITE_ITEM_TYPE_LABELS,
  type SiteItemType,
  type SiteItemView,
} from "@/lib/site-types";

interface Props {
  siteId: string;
  item?: SiteItemView;
  onClose: () => void;
}

const INPUT =
  "w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-600 disabled:opacity-50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </label>
      {children}
    </div>
  );
}

export function SiteItemForm({ siteId, item, onClose }: Props) {
  const router = useRouter();
  const isEdit = !!item;
  const fileInput = useRef<HTMLInputElement>(null);

  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<SiteItemType>(item?.type ?? "OFFER");
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(
    item?.price != null ? String(item.price) : "",
  );
  const [imageUrl, setImageUrl] = useState<string | null>(item?.imageUrl ?? null);
  const [visible, setVisible] = useState(item?.visible ?? true);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("siteId", siteId);
      fd.set("file", file);
      const res = await uploadSiteImageAction(fd);
      if (res.ok && res.url) {
        setImageUrl(res.url);
      } else {
        setError(res.error ?? "Upload échoué.");
      }
    } catch {
      setError("Upload échoué.");
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Le titre est requis.");
      return;
    }
    const parsedPrice =
      price.trim() === "" ? null : parseFloat(price.replace(",", "."));
    if (parsedPrice != null && Number.isNaN(parsedPrice)) {
      setError("Prix invalide.");
      return;
    }
    setError(null);

    const data = {
      type,
      title: title.trim(),
      description: description.trim() || null,
      price: parsedPrice,
      imageUrl,
      visible,
    };

    startTransition(async () => {
      const res = isEdit
        ? await updateSiteItemAction(item.id, data)
        : await createSiteItemAction(siteId, data);
      if (res.ok) {
        router.refresh();
        onClose();
      } else {
        setError(res.error ?? "Impossible d'enregistrer.");
      }
    });
  }

  const busy = isPending || uploading;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-base font-medium text-white">
            {isEdit ? "Modifier l'élément" : "Nouvel élément"}
          </h2>
          <button
            onClick={onClose}
            disabled={busy}
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-5 px-6 py-6">
            <Field label="Type">
              <div className="flex gap-2">
                {SITE_ITEM_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                      type === t
                        ? "border-white bg-white text-black"
                        : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white"
                    }`}
                  >
                    {SITE_ITEM_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Titre *">
              <input
                className={INPUT}
                placeholder="Menu midi, Pack vitrine…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={busy}
                required
              />
            </Field>

            <Field label="Description">
              <textarea
                className={`${INPUT} min-h-[80px] resize-y`}
                placeholder="Détails de l'offre ou du produit…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={busy}
              />
            </Field>

            <Field label="Prix (€)">
              <input
                className={INPUT}
                inputMode="decimal"
                placeholder="14.90"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={busy}
              />
            </Field>

            <Field label="Image">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleFile(f);
                }}
                className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/40 p-4"
              >
                {imageUrl ? (
                  <div className="flex items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt=""
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => fileInput.current?.click()}
                        disabled={busy}
                        className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white disabled:opacity-50"
                      >
                        Remplacer
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageUrl(null)}
                        disabled={busy}
                        className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    disabled={busy}
                    className="flex w-full flex-col items-center justify-center gap-1 py-4 text-center disabled:opacity-50"
                  >
                    <span className="text-sm text-zinc-400">
                      {uploading ? "Envoi…" : "Glisser une image ou cliquer"}
                    </span>
                    <span className="text-xs text-zinc-600">
                      PNG, JPG, WEBP — 5 Mo max
                    </span>
                  </button>
                )}
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/avif"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                  }}
                />
              </div>
            </Field>

            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={visible}
                onChange={(e) => setVisible(e.target.checked)}
                disabled={busy}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900"
              />
              <span className="text-sm text-zinc-300">
                Visible sur le site (sinon masqué de l'API publique)
              </span>
            </label>

            {error && (
              <p role="alert" className="text-sm text-red-400">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-zinc-800 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-lg px-4 py-2 text-sm text-zinc-400 transition-colors hover:text-white disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {isPending && (
                <span className="animate-spin text-base leading-none">↻</span>
              )}
              {isEdit ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
