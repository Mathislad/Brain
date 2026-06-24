import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma 7 génère un client ESM/TS dans /generated ; on évite que Next
  // tente de le bundler côté serveur de façon agressive.
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg"],
};

export default nextConfig;
