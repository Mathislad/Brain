import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mot de passe réinitialisé",
  description: "Votre mot de passe Brain a été réinitialisé.",
  alternates: { canonical: "/reset-password/success" },
};

export default function ResetPasswordSuccessPage() {
  return (
    <div>
      <div className="mb-7">
        <h1 className="text-lg font-medium text-white">
          Mot de passe réinitialisé
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Votre nouveau mot de passe est actif. Vous pouvez maintenant vous connecter.
        </p>
      </div>

      <Link
        href="/login"
        className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-white px-5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
      >
        Revenir à la connexion
      </Link>
    </div>
  );
}
