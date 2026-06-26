import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Sidebar } from "@/components/dashboard/sidebar";
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

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userEmail={userEmail} userName={userName} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
