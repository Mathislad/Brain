import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@/lib/prisma";

/**
 * Instance Better Auth (serveur).
 *
 * - Authentification email/mot de passe (le hachage est géré par Better Auth,
 *   scrypt par défaut, et stocké dans Account.password).
 * - Sessions persistées en base via l'adapter Prisma.
 * - Champ `role` exposé sur l'utilisateur (USER par défaut, non modifiable
 *   par le client à l'inscription).
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "USER",
        input: false, // empêche de définir son propre rôle à l'inscription
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 jours
    updateAge: 60 * 60 * 24, // rafraîchit la session une fois par jour
  },
  // nextCookies doit rester le dernier plugin de la liste.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
