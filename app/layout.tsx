import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  applicationName: "F5L",
  title: {
    default: "F5L Agency | Acquisition client, CRM et IA",
    template: "%s | F5L",
  },
  description:
    "F5L construit les systèmes qui transforment votre visibilité en clients : sites, publicités, CRM, automatisations et IA.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "F5L Agency",
    title: "F5L Agency | Acquisition client, CRM et IA",
    description:
      "Sites, Meta Ads, Google Ads, CRM, automatisations et agents IA réunis dans une infrastructure claire.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "F5L Agency | Acquisition client, CRM et IA",
    description:
      "Une agence premium pour structurer votre acquisition client.",
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#09090b",
};

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "F5L",
      url: siteUrl,
      description:
        "F5L construit les systèmes qui transforment votre visibilité en clients : sites, publicités, CRM, automatisations et IA.",
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "F5L",
      inLanguage: "fr-FR",
      publisher: { "@id": `${siteUrl}/#organization` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
