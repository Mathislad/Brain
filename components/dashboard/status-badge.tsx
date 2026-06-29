"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { updateProspectStatusAction } from "@/app/actions/prospects";
import type { ProspectStatus } from "@/lib/prospect-types";

export const STATUS_LABELS: Record<ProspectStatus, string> = {
  TODO: "Prospect",
  IN_PROGRESS: "Rendez-vous",
  DONE: "Client",
  CLIENT_ACTIF: "Client actif",
};

const STYLES: Record<ProspectStatus, string> = {
  TODO: "border-zinc-700 bg-zinc-800 text-zinc-300",
  IN_PROGRESS: "border-yellow-900/50 bg-yellow-950/60 text-yellow-400",
  DONE: "border-emerald-900/50 bg-emerald-950/60 text-emerald-400",
  CLIENT_ACTIF: "border-blue-900/50 bg-blue-950/60 text-blue-300",
};

const OPTIONS: ProspectStatus[] = ["TODO", "IN_PROGRESS", "DONE", "CLIENT_ACTIF"];

interface Props {
  recordId: string;
  status: ProspectStatus;
}

export function StatusBadge({ recordId, status: initial }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<ProspectStatus>(initial);
  const [isPending, startTransition] = useTransition();

  function handleChange(next: ProspectStatus) {
    if (next === status) return;
    const prev = status;
    setStatus(next);
    startTransition(async () => {
      try {
        await updateProspectStatusAction(recordId, next);
        router.refresh();
      } catch {
        setStatus(prev);
      }
    });
  }

  return (
    <select
      value={status}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value as ProspectStatus)}
      className={`h-7 cursor-pointer rounded-full border px-2.5 text-xs font-medium outline-none transition-colors disabled:opacity-60 ${STYLES[status]}`}
    >
      {OPTIONS.map((s) => (
        <option key={s} value={s} className="bg-zinc-900 text-zinc-200">
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
