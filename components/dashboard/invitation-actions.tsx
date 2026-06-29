"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { revokeInvitationAction } from "@/app/actions/invitations";

interface Props {
  invitationId: string;
  status: string;
  onboardingUrl: string;
  currentCode: string | null;
  secsLeft: number;
}

export function InvitationActions({
  invitationId,
  status,
  onboardingUrl,
  currentCode,
  secsLeft,
}: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isRevoking, startRevoke] = useTransition();

  function copyLink() {
    navigator.clipboard.writeText(onboardingUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function revoke() {
    if (!confirm("Révoquer cette invitation ? Le client ne pourra plus l'utiliser.")) return;
    startRevoke(async () => {
      await revokeInvitationAction(invitationId);
      router.refresh();
    });
  }

  const canAct = status === "pending" || status === "in_progress";

  return (
    <div className="flex shrink-0 items-center gap-3">
      {/* Code TOTP — visible uniquement si pending */}
      {status === "pending" && currentCode && (
        <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5">
          <span className="font-mono text-sm font-semibold tracking-widest text-white">
            {currentCode}
          </span>
          <span className="text-[10px] text-zinc-600">{secsLeft}s</span>
        </div>
      )}

      {/* Copier le lien */}
      {canAct && (
        <button
          type="button"
          onClick={copyLink}
          className="h-8 rounded-lg border border-zinc-700 px-3 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
        >
          {copied ? "Copié !" : "Copier le lien"}
        </button>
      )}

      {/* Révoquer */}
      {canAct && (
        <button
          type="button"
          onClick={revoke}
          disabled={isRevoking}
          className="h-8 rounded-lg border border-red-900/50 px-3 text-xs text-red-400 transition-colors hover:border-red-700 hover:text-red-300 disabled:opacity-50"
        >
          {isRevoking ? "…" : "Révoquer"}
        </button>
      )}
    </div>
  );
}
