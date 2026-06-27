import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getProspectsWithClientDetails } from "@/lib/clients-db";
import type { ClientWithLinks } from "@/lib/client-types";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: {
    default: "Tableau de bord",
    template: "%s | Tableau de bord | Brain",
  },
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const userName =
    (user.user_metadata?.name as string | undefined) ?? "";
  const userEmail = user.email ?? "";
  let clientRecords: ClientWithLinks[] = [];

  try {
    clientRecords = await getProspectsWithClientDetails(user.id);
  } catch {
    clientRecords = [];
  }

  return (
    <DashboardShell
      clientRecords={clientRecords}
      userEmail={userEmail}
      userName={userName}
    >
      {children}
    </DashboardShell>
  );
}
