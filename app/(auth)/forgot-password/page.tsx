import Link from "next/link";
import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
  description: "Recevez un lien et un code pour réinitialiser votre mot de passe Brain.",
  alternates: { canonical: "/forgot-password" },
};

export default function ForgotPasswordPage() {
  return (
    <div>
      <div className="mb-7">
        <h1 className="text-lg font-medium text-white">Mot de passe oublié</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Entrez votre email pour recevoir un lien et un code de récupération.
        </p>
      </div>

      <ForgotPasswordForm />

      <p className="mt-6 text-center text-sm text-zinc-500">
        <Link
          href="/login"
          className="text-zinc-300 underline-offset-4 transition-colors hover:text-white hover:underline"
        >
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
