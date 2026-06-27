"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";

import {
  createContentIdeaAction,
  deleteContentIdeaAction,
  getContentIdeasAction,
  updateContentIdeaAction,
} from "@/app/actions/content-ideas";

type ContentFormat = "simple" | "short";
type ContentStep = "script" | "tournage" | "montage" | "publication";
type PlannerView = "posts" | "planning";
type SlotType = "simple-1" | "simple-2" | "short";

interface ContentIdea {
  id: string;
  title: string;
  angle: string;
  format: ContentFormat;
  platform: string;
  plannedSlotId?: string;
  steps: Record<ContentStep, boolean>;
}

interface PlanningSlot {
  id: string;
  dateKey: string;
  type: SlotType;
  label: string;
  format: ContentFormat;
}

const stepLabels: Record<ContentStep, string> = {
  script: "Script",
  tournage: "Tournage",
  montage: "Montage",
  publication: "Publication",
};

const slotTemplates: Array<Pick<PlanningSlot, "type" | "label" | "format">> = [
  { type: "simple-1", label: "Post simple 1", format: "simple" },
  { type: "simple-2", label: "Post simple 2", format: "simple" },
  { type: "short", label: "Short vidéo", format: "short" },
];

const platforms = ["Instagram", "LinkedIn", "TikTok", "Facebook", "YouTube"];

function emptySteps(): Record<ContentStep, boolean> {
  return { script: false, tournage: false, montage: false, publication: false };
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(date);
}

function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function buildWeekSlots(today: Date): PlanningSlot[] {
  return Array.from({ length: 7 }, (_, dayIndex) => {
    const day = new Date(today);
    day.setDate(today.getDate() + dayIndex);
    const key = dateKey(day);
    return slotTemplates.map((slot) => ({
      id: `${key}-${slot.type}`,
      dateKey: key,
      ...slot,
    }));
  }).flat();
}

function countDone(idea: ContentIdea) {
  return Object.values(idea.steps).filter(Boolean).length;
}

function progressLabel(idea: ContentIdea) {
  const done = countDone(idea);
  if (done === 0) return "Idée";
  if (done === 4) return "Publié";
  return `${done}/4`;
}

function dbToLocal(db: {
  id: string;
  title: string;
  angle: string | null;
  format: string;
  platform: string;
  plannedSlotId: string | null;
  steps: unknown;
}): ContentIdea {
  const rawSteps = db.steps as Record<string, boolean> | null;
  return {
    id: db.id,
    title: db.title,
    angle: db.angle ?? "",
    format: db.format as ContentFormat,
    platform: db.platform,
    plannedSlotId: db.plannedSlotId ?? undefined,
    steps: { ...emptySteps(), ...rawSteps },
  };
}

export function SocialPlanner() {
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [title, setTitle] = useState("");
  const [angle, setAngle] = useState("");
  const [format, setFormat] = useState<ContentFormat>("simple");
  const [platform, setPlatform] = useState(platforms[0]);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [activeView, setActiveView] = useState<PlannerView>("posts");
  const [today] = useState(() => new Date());
  const [isPending, startTransition] = useTransition();

  async function refresh() {
    const fresh = await getContentIdeasAction();
    setIdeas(fresh.map(dbToLocal));
  }

  useEffect(() => {
    refresh();
  }, []);

  const slots = useMemo(() => buildWeekSlots(today), [today]);
  const slotById = useMemo(() => new Map(slots.map((slot) => [slot.id, slot])), [slots]);
  const todayKey = dateKey(today);
  const plannedIdeaIds = new Set(ideas.filter((idea) => idea.plannedSlotId).map((idea) => idea.id));

  const availableSlots = slots.filter((slot) => {
    const assigned = ideas.find((idea) => idea.plannedSlotId === slot.id);
    return !assigned && slot.format === format;
  });

  function addIdea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    startTransition(async () => {
      const created = await createContentIdeaAction({
        title: trimmedTitle,
        angle: angle.trim() || undefined,
        format,
        platform,
      });
      if (created && selectedSlotId) {
        await updateContentIdeaAction(created.id, { plannedSlotId: selectedSlotId });
      }
      await refresh();
      setTitle("");
      setAngle("");
      setFormat("simple");
      setPlatform(platforms[0]);
      setSelectedSlotId("");
    });
  }

  function toggleStep(id: string, step: ContentStep) {
    const idea = ideas.find((i) => i.id === id);
    if (!idea) return;
    const newSteps = { ...idea.steps, [step]: !idea.steps[step] };
    setIdeas((current) => current.map((i) => (i.id === id ? { ...i, steps: newSteps } : i)));
    startTransition(async () => {
      await updateContentIdeaAction(id, { steps: newSteps });
    });
  }

  function assignSlot(id: string, slotId: string) {
    setIdeas((current) =>
      current.map((idea) => {
        if (idea.plannedSlotId === slotId && idea.id !== id) return { ...idea, plannedSlotId: undefined };
        if (idea.id === id) return { ...idea, plannedSlotId: slotId || undefined };
        return idea;
      }),
    );
    startTransition(async () => {
      const prevAssigned = ideas.find((i) => i.plannedSlotId === slotId && i.id !== id);
      if (prevAssigned) {
        await updateContentIdeaAction(prevAssigned.id, { plannedSlotId: null });
      }
      await updateContentIdeaAction(id, { plannedSlotId: slotId || null });
    });
  }

  function removeIdea(id: string) {
    setIdeas((current) => current.filter((i) => i.id !== id));
    startTransition(async () => {
      await deleteContentIdeaAction(id);
    });
  }

  function ideaForSlot(slotId: string) {
    return ideas.find((idea) => idea.plannedSlotId === slotId);
  }

  const totalPublished = ideas.filter((idea) => idea.steps.publication).length;

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-600">Prospection</p>
          <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">Réseaux sociaux</h1>
          <p className="mt-1 text-sm text-zinc-500">Planning depuis le {formatFullDate(today)}</p>
          <div className="mt-4 grid h-10 w-fit grid-cols-2 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
            {[
              ["posts", "Posts"],
              ["planning", "Planning"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setActiveView(value as PlannerView)}
                className={`rounded-md px-5 text-sm transition-colors ${
                  activeView === value ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <Metric label="Idées" value={ideas.length} />
          <Metric label="Planifiés" value={plannedIdeaIds.size} />
          <Metric label="Publiés" value={totalPublished} />
        </div>
      </div>

      {activeView === "posts" ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(360px,420px)_1fr]">
          <section className="rounded-lg border border-zinc-800/80 bg-zinc-950/60">
            <div className="border-b border-zinc-800/70 px-5 py-4">
              <h2 className="text-base font-medium text-white">Nouveau post</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Une idée peut être gardée en brouillon ou envoyée au planning.
              </p>
            </div>

            <form onSubmit={addIdea} className="grid gap-4 p-5">
              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-zinc-500">Idée</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Avant / après d'un audit Instagram"
                  className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-600"
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-zinc-500">Angle</span>
                <textarea
                  value={angle}
                  onChange={(e) => setAngle(e.target.value)}
                  placeholder="Hook, promesse, CTA ou notes de script"
                  rows={4}
                  className="resize-none rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-600"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-zinc-500">Format</span>
                  <select
                    value={format}
                    onChange={(e) => {
                      setFormat(e.target.value as ContentFormat);
                      setSelectedSlotId("");
                    }}
                    className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors focus:border-zinc-600"
                  >
                    <option value="simple">Post simple</option>
                    <option value="short">Short vidéo</option>
                  </select>
                </label>

                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-zinc-500">Plateforme</span>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors focus:border-zinc-600"
                  >
                    {platforms.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-zinc-500">Créneau planning</span>
                <select
                  value={selectedSlotId}
                  onChange={(e) => setSelectedSlotId(e.target.value)}
                  className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors focus:border-zinc-600"
                >
                  <option value="">À planifier plus tard</option>
                  {availableSlots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.dateKey} · {slot.label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                disabled={isPending}
                className="h-10 rounded-lg bg-white px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 disabled:opacity-50"
              >
                {isPending ? "…" : "Ajouter le post"}
              </button>
            </form>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-medium text-white">Posts</h2>
                <p className="mt-1 text-xs text-zinc-500">Suivi de production et affectation au planning.</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveView("planning")}
                className="rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
              >
                Voir le planning
              </button>
            </div>

            {ideas.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-800 px-5 py-10 text-sm text-zinc-500">
                Aucun post pour le moment.
              </div>
            ) : (
              <div className="grid gap-3">
                {ideas.map((idea) => {
                  const assignedSlot = idea.plannedSlotId ? slotById.get(idea.plannedSlotId) : undefined;
                  return (
                    <article
                      key={idea.id}
                      className="rounded-lg border border-zinc-800/70 bg-zinc-950/60 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-sm font-medium text-white">{idea.title}</h3>
                            <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400">
                              {idea.format === "short" ? "Short" : "Simple"}
                            </span>
                            <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400">
                              {progressLabel(idea)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-zinc-500">
                            {idea.platform}
                            {assignedSlot ? ` · ${assignedSlot.dateKey} · ${assignedSlot.label}` : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeIdea(idea.id)}
                          className="rounded-md px-2 py-1 text-xs text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                        >
                          Supprimer
                        </button>
                      </div>

                      {idea.angle && (
                        <p className="mt-3 rounded-md bg-zinc-950 px-3 py-2 text-xs leading-5 text-zinc-400">
                          {idea.angle}
                        </p>
                      )}

                      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                        {(Object.keys(stepLabels) as ContentStep[]).map((step) => (
                          <button
                            key={step}
                            type="button"
                            onClick={() => toggleStep(idea.id, step)}
                            className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                              idea.steps[step]
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                                : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                            }`}
                          >
                            {stepLabels[step]}
                          </button>
                        ))}
                      </div>

                      <label className="mt-4 grid gap-1.5">
                        <span className="text-xs font-medium text-zinc-500">Planning</span>
                        <select
                          value={idea.plannedSlotId ?? ""}
                          onChange={(e) => assignSlot(idea.id, e.target.value)}
                          className="h-9 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-xs text-white outline-none transition-colors focus:border-zinc-600"
                        >
                          <option value="">Non planifié</option>
                          {slots
                            .filter((slot) => slot.format === idea.format)
                            .map((slot) => {
                              const slotIdea = ideaForSlot(slot.id);
                              const isTaken = slotIdea && slotIdea.id !== idea.id;
                              return (
                                <option key={slot.id} value={slot.id} disabled={isTaken}>
                                  {slot.dateKey} · {slot.label}
                                  {isTaken ? " · occupé" : ""}
                                </option>
                              );
                            })}
                        </select>
                      </label>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      ) : (
        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-medium text-white">Planning de publication</h2>
              <p className="mt-1 text-xs text-zinc-500">2 posts simples et 1 short par jour.</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveView("posts")}
              className="h-9 rounded-lg border border-zinc-800 px-3 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
            >
              Créer un post
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-zinc-800/80 bg-zinc-950/40">
            <div className="grid min-w-[980px] grid-cols-7 divide-x divide-zinc-800/70">
              {Array.from({ length: 7 }, (_, index) => {
                const day = new Date(today);
                day.setDate(today.getDate() + index);
                const key = dateKey(day);
                const daySlots = slots.filter((slot) => slot.dateKey === key);
                return (
                  <div key={key} className={key === todayKey ? "bg-zinc-900/45" : ""}>
                    <div className="border-b border-zinc-800/70 px-3 py-3">
                      <p className="text-sm font-medium capitalize text-white">{formatDayLabel(day)}</p>
                      <p className="mt-0.5 text-[11px] text-zinc-600">
                        {key === todayKey ? "Aujourd'hui" : key}
                      </p>
                    </div>

                    <div className="grid gap-2 p-2">
                      {daySlots.map((slot) => {
                        const assignedIdea = ideaForSlot(slot.id);
                        return (
                          <div
                            key={slot.id}
                            className="min-h-28 rounded-lg border border-zinc-800 bg-zinc-950/70 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[11px] font-medium text-zinc-500">
                                {slot.type === "short" ? "Short" : slot.label}
                              </p>
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  slot.format === "short" ? "bg-sky-400" : "bg-zinc-500"
                                }`}
                              />
                            </div>

                            {assignedIdea ? (
                              <div className="mt-3">
                                <p className="line-clamp-2 text-sm font-medium leading-5 text-white">
                                  {assignedIdea.title}
                                </p>
                                <p className="mt-1 text-[11px] text-zinc-500">
                                  {assignedIdea.platform} · {progressLabel(assignedIdea)}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => assignSlot(assignedIdea.id, "")}
                                  className="mt-3 text-xs text-zinc-600 underline-offset-4 transition-colors hover:text-zinc-300 hover:underline"
                                >
                                  Retirer
                                </button>
                              </div>
                            ) : (
                              <label className="mt-3 block">
                                <select
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value) assignSlot(e.target.value, slot.id);
                                  }}
                                  className="h-8 w-full rounded-md border border-zinc-800 bg-zinc-950 px-2 text-xs text-zinc-400 outline-none transition-colors focus:border-zinc-600"
                                >
                                  <option value="">Ajouter</option>
                                  {ideas
                                    .filter((idea) => idea.format === slot.format)
                                    .map((idea) => (
                                      <option key={idea.id} value={idea.id}>
                                        {idea.title}
                                      </option>
                                    ))}
                                </select>
                              </label>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
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
