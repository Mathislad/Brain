import Link from "next/link";
import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Réinitialiser le mot de passe",
  description: "Entrez votre code de récupération et choisissez un nouveau mot de passe Brain.",
  alternates: { canonical: "/reset-password" },
};

interface Props {
  searchParams: Promise<{ email?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { email } = await searchParams;
  const decodedEmail = email ? decodeURIComponent(email) : "";

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-lg font-medium text-white">
          Nouveau mot de passe
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Entrez le code reçu par email puis choisissez un nouveau mot de passe.
        </p>
      </div>

      <ResetPasswordForm email={decodedEmail} />

      <p className="mt-6 text-center text-sm text-zinc-500">
        <Link
          href="/forgot-password"
          className="text-zinc-300 underline-offset-4 transition-colors hover:text-white hover:underline"
        >
          Recevoir un nouveau code
        </Link>
      </p>
    </div>
  );
}
