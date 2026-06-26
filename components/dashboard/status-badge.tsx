"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { updateProspectStatusAction } from "@/app/actions/prospects";
import type { ProspectStatus } from "@/lib/prospect-types";

const CYCLE: ProspectStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

export const STATUS_LABELS: Record<ProspectStatus, string> = {
  TODO: "Prospect",
  IN_PROGRESS: "Rendez-vous",
  DONE: "Client",
};

const STYLES: Record<ProspectStatus, string> = {
  TODO: "bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-zinc-500",
  IN_PROGRESS:
    "bg-yellow-950/60 text-yellow-400 border-yellow-900/50 hover:border-yellow-700",
  DONE: "bg-emerald-950/60 text-emerald-400 border-emerald-900/50 hover:border-emerald-700",
};

interface Props {
  recordId: string;
  status: ProspectStatus;
}

export function StatusBadge({ recordId, status: initial }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<ProspectStatus>(initial);
  const [isPending, startTransition] = useTransition();

  function cycle() {
    const next = CYCLE[(CYCLE.indexOf(status) + 1) % CYCLE.length];
    setStatus(next);
    startTransition(async () => {
      await updateProspectStatusAction(recordId, next);
      router.refresh();
    });
  }

  return (
    <button
      onClick={cycle}
      disabled={isPending}
      title="Cliquer pour changer le statut"
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors disabled:opacity-60 ${STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </button>
  );
}
