import type { Metadata } from "next";

import { PublicPageShell } from "@/components/public/f5l-site";

export const metadata: Metadata = {
  title: "Confidentialité",
  alternates: { canonical: "/confidentialite" },
};

export default function PrivacyPage() {
  return (
    <PublicPageShell>
      <section className="mx-auto max-w-3xl px-4 pb-20 pt-32 text-sm leading-7 text-zinc-400 sm:px-6">
        <h1 className="text-3xl font-medium tracking-tight text-white">Confidentialité</h1>
        <p className="mt-6">
          F5L collecte uniquement les informations nécessaires au traitement des demandes commerciales, à la gestion des comptes clients et au suivi des services activés.
        </p>
        <p className="mt-4">
          Les données du portail client sont isolées par organisation. Les accès administrateur et client sont séparés, avec vérification du rôle côté serveur sur les espaces privés.
        </p>
      </section>
    </PublicPageShell>
  );
}
