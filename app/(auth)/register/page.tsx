import Link from "next/link";
import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Créer un compte",
  description: "Créez votre compte Brain pour accéder à votre espace privé.",
  alternates: { canonical: "/register" },
};

export default function RegisterPage() {
  return (
    <div>
      <div className="mb-7">
        <h1 className="text-lg font-medium text-white">Créer un compte</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Quelques secondes suffisent.
        </p>
      </div>

      <RegisterForm />

      <p className="mt-6 text-center text-sm text-zinc-500">
        Déjà un compte ?{" "}
        <Link
          href="/login"
          className="text-zinc-300 underline-offset-4 transition-colors hover:text-white hover:underline"
        >
          Se connecter
        </Link>
      </p>
    </div>
  );
}
