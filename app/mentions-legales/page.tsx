import type { Metadata } from "next";

import { PublicPageShell } from "@/components/public/f5l-site";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales de F5L : éditeur du site, hébergement et informations légales.",
  alternates: { canonical: "/mentions-legales" },
};

export default function LegalPage() {
  return (
    <PublicPageShell>
      <section className="mx-auto max-w-3xl px-4 pb-20 pt-32 text-sm leading-7 text-zinc-400 sm:px-6">
        <h1 className="text-3xl font-medium tracking-tight text-white">Mentions légales</h1>
        <p className="mt-6">
          Cette page est prête à recevoir les informations légales de F5L : raison sociale, adresse, SIRET, responsable de publication, hébergeur et moyens de contact.
        </p>
        <p className="mt-4">
          Les contenus du site F5L sont fournis à titre d&apos;information commerciale. Les informations définitives seront complétées avec les données administratives officielles de l&apos;entreprise.
        </p>
      </section>
    </PublicPageShell>
  );
}
