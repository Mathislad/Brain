import Link from "next/link";
import type { Metadata } from "next";

import { ConfirmEmailForm } from "@/components/auth/confirm-email-form";

export const metadata: Metadata = {
  title: "Confirmation email",
  description: "Confirmez votre adresse email pour activer votre compte Brain.",
  alternates: { canonical: "/confirm-email" },
};

// searchParams est une Promise dans Next 15+.
interface Props {
  searchParams: Promise<{ email?: string }>;
}

export default async function ConfirmEmailPage({ searchParams }: Props) {
  const { email } = await searchParams;
  const decodedEmail = email ? decodeURIComponent(email) : "";

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-lg font-medium text-white">
          Vérifiez votre email
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {decodedEmail ? (
            <>
              Un code à 8 chiffres a été envoyé à{" "}
              <span className="text-zinc-300">{decodedEmail}</span>.
            </>
          ) : (
            "Saisissez votre email et le code reçu."
          )}
        </p>
      </div>

      <ConfirmEmailForm email={decodedEmail} />

      <p className="mt-6 text-center text-sm text-zinc-500">
        <Link
          href="/login"
          className="text-zinc-400 underline-offset-4 transition-colors hover:text-white hover:underline"
        >
          ← Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
