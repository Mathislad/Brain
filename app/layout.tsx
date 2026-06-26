import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  applicationName: "Brain",
  title: {
    default: "Brain | Prospection CRM",
    template: "%s | Brain",
  },
  description:
    "Brain centralise la prospection, le CRM et les actions commerciales dans un espace privé.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Brain",
    title: "Brain | Prospection CRM",
    description:
      "Un espace privé pour organiser vos prospects, rendez-vous, clients et actions commerciales.",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "Brain | Prospection CRM",
    description:
      "Un espace privé pour organiser vos prospects, rendez-vous, clients et actions commerciales.",
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
