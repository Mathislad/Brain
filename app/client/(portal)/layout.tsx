import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { ClientShell } from "@/components/client/client-shell";
import { requireClient } from "@/lib/auth/roles";

export const metadata: Metadata = {
  title: { default: "Espace client", template: "%s | F5L Brain" },
  robots: { index: false, follow: false },
};

export default async function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const result = await requireClient().catch(() => null);
  if (!result) redirect("/client/login");

  return (
    <ClientShell orgName={result.organization.name} userEmail={result.user.email ?? ""}>
      {children}
    </ClientShell>
  );
}
