import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { ClientShell } from "@/components/client/client-shell";
import { requireClient } from "@/lib/auth/roles";

export const metadata: Metadata = {
  title: { default: "Espace client", template: "%s | F5L Brain" },
  robots: { index: false, follow: false },
};

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, organization } = await requireClient().catch(() => {
    redirect("/client/login");
  }) as Awaited<ReturnType<typeof requireClient>>;

  return (
    <ClientShell orgName={organization.name} userEmail={user.email ?? ""}>
      {children}
    </ClientShell>
  );
}
