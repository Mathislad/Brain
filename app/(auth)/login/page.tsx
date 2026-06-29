import Link from "next/link";
import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Connexion administrateur",
  description: "Connectez-vous à l'espace administrateur Brain.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return (
    <div>
      <div className="mb-7">
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
          <Link
            href="/client/login"
            className="rounded-md px-3 py-2 text-center text-xs font-medium text-zinc-500 transition-colors hover:text-white"
          >
            Client
          </Link>
          <span className="rounded-md bg-white px-3 py-2 text-center text-xs font-medium text-zinc-950">
            Admin
          </span>
        </div>
        <h1 className="text-lg font-medium text-white">Connexion administrateur</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Accédez à Brain admin.
        </p>
        <p className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs leading-5 text-zinc-500">
          Par sécurité, cette page demande une identification à chaque passage.
        </p>
      </div>

      <LoginForm />

      <p className="mt-6 text-center text-sm text-zinc-500">
        Première connexion ?{" "}
        <Link
          href="/register"
          className="text-zinc-300 underline-offset-4 transition-colors hover:text-white hover:underline"
        >
          Première inscription
        </Link>
      </p>
    </div>
  );
}
