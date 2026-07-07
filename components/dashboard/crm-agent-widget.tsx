"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  applyCrmAgentProposalAction,
  askCrmAgentAction,
  type CrmAgentMessage,
  type CrmAgentProposal,
} from "@/app/actions/crm-agent";

type ChatItem =
  | { role: "user" | "assistant"; content: string; proposals?: CrmAgentProposal[] }
  | { role: "system"; content: string };

const starterPrompts = [
  "Analyse le CRM et propose les corrections les plus utiles.",
  "Trouve les prospects mal rangés après import CSV.",
  "Repère les niches manquantes ou incohérentes.",
];

function proposalActionLabel(proposal: CrmAgentProposal) {
  if (proposal.action.type === "UPDATE_PROSPECT") return "Modifier le prospect";
  if (proposal.action.type === "ROLLBACK_CSV_IMPORT") return "Annuler l'import";
  return "Information";
}

function riskClass(risk: CrmAgentProposal["risk"]) {
  if (risk === "high") return "border-red-900/50 bg-red-950/30 text-red-200";
  if (risk === "medium") return "border-amber-900/50 bg-amber-950/30 text-amber-200";
  return "border-emerald-900/50 bg-emerald-950/20 text-emerald-200";
}

export function CrmAgentWidget() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [items, setItems] = useState<ChatItem[]>([
    {
      role: "assistant",
      content:
        "Je peux analyser le CRM et proposer des corrections. Rien n'est appliqué sans ton accord.",
    },
  ]);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const history = useMemo<CrmAgentMessage[]>(
    () =>
      items
        .filter((item): item is Extract<ChatItem, { role: "user" | "assistant" }> =>
          item.role === "user" || item.role === "assistant",
        )
        .map((item) => ({ role: item.role, content: item.content }))
        .slice(-6),
    [items],
  );

  function ask(message: string) {
    const trimmed = message.trim();
    if (!trimmed || isPending) return;

    setInput("");
    setItems((current) => [...current, { role: "user", content: trimmed }]);

    startTransition(async () => {
      const response = await askCrmAgentAction({ message: trimmed, history });
      setItems((current) => [
        ...current,
        {
          role: "assistant",
          content: response.error
            ? `${response.message}\n${response.error}`
            : response.message,
          proposals: response.proposals,
        },
      ]);
    });
  }

  function applyProposal(proposal: CrmAgentProposal) {
    if (proposal.action.type === "NONE" || applied.has(proposal.id)) return;

    const ok = confirm(`${proposal.title}\n\n${proposal.rationale}\n\nAppliquer cette proposition ?`);
    if (!ok) return;

    startTransition(async () => {
      const result = await applyCrmAgentProposalAction(proposal);
      setItems((current) => [
        ...current,
        { role: "system", content: result.message },
      ]);
      if (result.ok) {
        setApplied((current) => new Set(current).add(proposal.id));
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-zinc-700 bg-white text-sm font-semibold text-zinc-950 shadow-2xl shadow-black/40 transition-transform hover:scale-105"
        title="Agent IA CRM"
      >
        IA
      </button>
    );
  }

  return (
    <section className="fixed bottom-5 right-5 z-40 flex h-[620px] max-h-[calc(100vh-2.5rem)] w-[420px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-600">Agent IA</p>
          <h2 className="text-sm font-medium text-white">Assistant CRM</h2>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-2 py-1 text-sm text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          Fermer
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {items.map((item, index) => (
          <article key={index} className="space-y-2">
            <div
              className={`rounded-lg border px-3 py-2 text-sm ${
                item.role === "user"
                  ? "ml-8 border-zinc-700 bg-zinc-900 text-white"
                  : item.role === "system"
                    ? "border-emerald-900/50 bg-emerald-950/30 text-emerald-200"
                    : "mr-8 border-zinc-800 bg-zinc-950 text-zinc-300"
              }`}
            >
              <p className="whitespace-pre-wrap">{item.content}</p>
            </div>

            {"proposals" in item && item.proposals && item.proposals.length > 0 && (
              <div className="space-y-2">
                {item.proposals.map((proposal) => {
                  const done = applied.has(proposal.id);
                  return (
                    <div
                      key={proposal.id}
                      className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-sm font-medium text-white">{proposal.title}</h3>
                          <p className="mt-1 text-xs leading-5 text-zinc-500">
                            {proposal.rationale}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase ${riskClass(proposal.risk)}`}
                        >
                          {proposal.risk}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="text-xs text-zinc-600">
                          {proposalActionLabel(proposal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => applyProposal(proposal)}
                          disabled={isPending || done || proposal.action.type === "NONE"}
                          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {done ? "Appliqué" : "Appliquer"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>
        ))}
        {isPending && (
          <p className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-500">
            Analyse en cours...
          </p>
        )}
      </div>

      <div className="border-t border-zinc-800 p-3">
        <div className="mb-2 flex flex-wrap gap-2">
          {starterPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => ask(prompt)}
              disabled={isPending}
              className="rounded-full border border-zinc-800 px-2.5 py-1 text-xs text-zinc-500 transition-colors hover:border-zinc-600 hover:text-white disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            ask(input);
          }}
          className="flex gap-2"
        >
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={2}
            placeholder="Demande une analyse ou une correction..."
            className="min-h-11 flex-1 resize-none rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors focus:border-zinc-600"
          />
          <button
            type="submit"
            disabled={isPending || !input.trim()}
            className="h-11 rounded-lg bg-white px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Envoyer
          </button>
        </form>
      </div>
    </section>
  );
}
