import { redirect } from "next/navigation";

import { SocialPlanner } from "@/components/dashboard/social-planner";
import { getCurrentUser } from "@/lib/session";

export default async function ReseauxSociauxPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <SocialPlanner />;
}
