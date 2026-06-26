import Link from "next/link";
import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre espace privé Brain.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return (
    <div>
      <div className="mb-7">
        <h1 className="text-lg font-medium text-white">Connexion</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Accédez à votre espace privé.
        </p>
      </div>

      <LoginForm />

      <p className="mt-6 text-center text-sm text-zinc-500">
        Pas encore de compte ?{" "}
        <Link
          href="/register"
          className="text-zinc-300 underline-offset-4 transition-colors hover:text-white hover:underline"
        >
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
