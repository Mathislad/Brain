import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demande d'accès administrateur",
  description: "Demandez la création d'un compte administrateur Brain.",
  alternates: { canonical: "/register" },
};

const adminRequestEmail = "contact@f5l-agency.fr";
const adminRequestSubject = "Demande de création de compte administrateur";
const adminRequestBody = [
  "Bonjour,",
  "",
  "Je suis [votre nom] de [votre entreprise].",
  "Je souhaiterais obtenir un compte administrateur sur Brain.",
  "",
  "Merci.",
].join("\n");

const adminRequestHref = `mailto:${adminRequestEmail}?subject=${encodeURIComponent(
  adminRequestSubject,
)}&body=${encodeURIComponent(adminRequestBody)}`;

export default function RegisterPage() {
  return (
    <div>
      <div className="mb-7">
        <h1 className="text-lg font-medium text-white">
          Demande d&apos;accès administrateur
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Les comptes administrateurs sont validés manuellement par F5L pour
          protéger l&apos;accès à Brain.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
        <p className="text-sm leading-6 text-zinc-400">
          Envoyez une demande avec votre nom et votre entreprise. Une fois
          validée, F5L créera votre accès administrateur et vous indiquera la
          marche à suivre.
        </p>

        <a
          href={adminRequestHref}
          className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-lg bg-white px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
        >
          Envoyer la demande
        </a>
      </div>

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
