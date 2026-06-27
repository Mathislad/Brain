"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function getLaunchConfigAction() {
  const user = await getCurrentUser();
  if (!user) return null;


  return prisma.launchConfig.findUnique({ where: { userId: user.id } });
}

export async function saveLaunchConfigAction(sessions: unknown) {
  const user = await getCurrentUser();
  if (!user) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = sessions as any;
  await prisma.launchConfig.upsert({
    where: { userId: user.id },
    create: { userId: user.id, sessions: data },
    update: { sessions: data },
  });
}
