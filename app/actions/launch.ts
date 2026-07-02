"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/roles";

export async function getLaunchConfigAction() {
  const user = await requireAdmin();


  return prisma.launchConfig.findUnique({ where: { userId: user.id } });
}

export async function saveLaunchConfigAction(sessions: unknown) {
  const user = await requireAdmin();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = sessions as any;
  await prisma.launchConfig.upsert({
    where: { userId: user.id },
    create: { userId: user.id, sessions: data },
    update: { sessions: data },
  });
}
