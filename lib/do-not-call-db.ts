import "server-only";

import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";

// Ensemble des numéros normalisés en liste rouge pour un utilisateur.
export async function getDoNotCallPhones(userId: string): Promise<Set<string>> {
  const rows = await prisma.doNotCall.findMany({
    where: { userId },
    select: { normalizedPhone: true },
  });
  return new Set(rows.map((r) => r.normalizedPhone));
}

// Retire d'une liste les enregistrements dont le téléphone est en liste rouge.
// Un enregistrement sans téléphone n'est jamais bloqué (la liste rouge est par numéro).
export function excludeDoNotCall<T extends { telephone: string | null }>(
  items: T[],
  blocked: Set<string>,
): T[] {
  if (blocked.size === 0) return items;
  return items.filter((item) => {
    const n = normalizePhone(item.telephone);
    return !(n && blocked.has(n));
  });
}
