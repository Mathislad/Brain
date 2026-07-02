import { redirect } from "next/navigation";

import { SimulatorTool } from "@/components/dashboard/simulator-tool";
import { getCurrentUser } from "@/lib/session";

export default async function SimulateurPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <SimulatorTool />;
}
