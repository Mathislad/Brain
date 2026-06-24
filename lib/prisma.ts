import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 : la connexion passe par un driver adapter (ici PostgreSQL via `pg`).
// L'URL n'est plus dans schema.prisma mais lue ici depuis l'environnement.
function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// Singleton compatible avec le hot reload en développement :
// on réutilise l'instance attachée au scope global pour éviter d'ouvrir
// trop de connexions à chaque rechargement.
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
