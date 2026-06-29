"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";

import {
  createPromptAction,
  deletePromptAction,
  getPromptsAction,
  togglePromptFavoriteAction,
} from "@/app/actions/prompts";

interface PromptItem {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  favorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ALL_CATEGORIES = "__all__";
const FAVORITES = "__favorites__";

const defaultCategories = [
  "Admin",
  "Client",
  "Prospection",
  "Réseaux sociaux",
  "Site internet",
];

function splitTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

export function PromptLibrary() {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(defaultCategories[2]);
  const [customCategory, setCustomCategory] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function refresh() {
    const fresh = await getPromptsAction();
    setPrompts(fresh);
  }

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
  }, []);

  const categories = useMemo(() => {
    const stored = prompts.map((p) => p.category).filter(Boolean);
    return Array.from(new Set([...defaultCategories, ...stored])).sort((a, b) =>
      a.localeCompare(b, "fr"),
    );
  }, [prompts]);

  const filteredPrompts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return prompts.filter((prompt) => {
      const matchesCategory =
        categoryFilter === ALL_CATEGORIES ||
        (categoryFilter === FAVORITES && prompt.favorite) ||
        prompt.category === categoryFilter;
      const matchesQuery =
        !normalizedQuery ||
        [prompt.title, prompt.category, prompt.content, ...prompt.tags]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [categoryFilter, prompts, query]);

  function addPrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const finalCategory = customCategory.trim() || category;
    if (!trimmedTitle || !trimmedContent) return;

    startTransition(async () => {
      await createPromptAction({
        title: trimmedTitle,
        category: finalCategory,
        content: trimmedContent,
        tags: splitTags(tags),
      });
      await refresh();
      setTitle("");
      setCategory(finalCategory);
      setCustomCategory("");
      setContent("");
      setTags("");
    });
  }

  function removePrompt(id: string) {
    setPrompts((current) => current.filter((p) => p.id !== id));
    startTransition(async () => {
      await deletePromptAction(id);
    });
  }

  function toggleFavorite(id: string) {
    const prompt = prompts.find((p) => p.id === id);
    if (!prompt) return;
    const next = !prompt.favorite;
    setPrompts((current) =>
      current.map((p) => (p.id === id ? { ...p, favorite: next } : p)),
    );
    startTransition(async () => {
      await togglePromptFavoriteAction(id, next);
    });
  }

  function copyPrompt(prompt: PromptItem) {
    navigator.clipboard.writeText(prompt.content).then(() => {
      setCopiedId(prompt.id);
      window.setTimeout(() => setCopiedId(null), 1400);
    });
  }

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-600">Data</p>
          <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">Prompt</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Bibliothèque de prompts pour raccourcir les tâches répétitives.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <Metric label="Prompts" value={prompts.length} />
          <Metric label="Favoris" value={prompts.filter((p) => p.favorite).length} />
          <Metric label="Catégories" value={categories.length} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(340px,420px)_1fr]">
        <section className="rounded-lg border border-zinc-800/80 bg-zinc-950/60">
          <div className="border-b border-zinc-800/70 px-5 py-4">
            <h2 className="text-base font-medium text-white">Nouveau prompt</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Ajoute les prompts que tu veux réutiliser souvent.
            </p>
          </div>

          <form onSubmit={addPrompt} className="grid gap-4 p-5">
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-zinc-500">Titre</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Relance prospect après audit"
                className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-600"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-zinc-500">Catégorie</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors focus:border-zinc-600"
                >
                  {categories.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-zinc-500">Nouvelle catégorie</span>
                <input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Optionnel"
                  className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-600"
                />
              </label>
            </div>

            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-zinc-500">Prompt</span>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Colle ici le prompt complet..."
                rows={9}
                className="resize-y rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm leading-6 text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-600"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-zinc-500">Tags</span>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="vente, relance, client"
                className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-600"
              />
            </label>

            <button
              type="submit"
              disabled={isPending}
              className="h-10 rounded-lg bg-white px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 disabled:opacity-50"
            >
              {isPending ? "…" : "Ajouter le prompt"}
            </button>
          </form>
        </section>

        <section>
          <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto]">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un prompt, une catégorie ou un tag..."
              className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-600"
            />

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors focus:border-zinc-600"
            >
              <option value={ALL_CATEGORIES}>Toutes les catégories</option>
              <option value={FAVORITES}>Favoris</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {filteredPrompts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-800 px-5 py-12 text-sm text-zinc-500">
              Aucun prompt trouvé.
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredPrompts.map((prompt) => (
                <article
                  key={prompt.id}
                  className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-medium text-white">{prompt.title}</h2>
                        <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400">
                          {prompt.category}
                        </span>
                        {prompt.favorite && (
                          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-200">
                            Favori
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-zinc-600">
                        Mis à jour le {formatDate(prompt.updatedAt)}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleFavorite(prompt.id)}
                        className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
                      >
                        {prompt.favorite ? "Retirer favori" : "Favori"}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyPrompt(prompt)}
                        className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
                      >
                        {copiedId === prompt.id ? "Copié" : "Copier"}
                      </button>
                    </div>
                  </div>

                  <pre className="mt-4 max-h-56 overflow-auto whitespace-pre-wrap rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-xs leading-5 text-zinc-300">
                    {prompt.content}
                  </pre>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      {prompt.tags.length === 0 ? (
                        <span className="text-xs text-zinc-700">Aucun tag</span>
                      ) : (
                        prompt.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-500"
                          >
                            {tag}
                          </span>
                        ))
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removePrompt(prompt.id)}
                      className="rounded-md px-2 py-1 text-xs text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-red-400"
                    >
                      Supprimer
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-24 rounded-lg border border-zinc-800/80 bg-zinc-950/60 px-4 py-3">
      <p className="text-lg font-medium text-white">{value}</p>
      <p className="text-[11px] uppercase tracking-wider text-zinc-600">{label}</p>
    </div>
  );
}
