"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { deleteProspectsForUser } from "@/lib/prospects-db";
import { checkRateLimit } from "@/lib/rate-limit";

export async function deleteAccountAction({
  emailConfirmation,
  password,
}: {
  emailConfirmation: string;
  password: string;
}): Promise<{ error: string } | never> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const rateLimit = checkRateLimit(`delete-account:${user.id}`, {
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    return {
      error: `Trop de tentatives. Réessayez dans ${rateLimit.retryAfterSeconds} secondes.`,
    };
  }

  const userEmail = user.email?.trim().toLowerCase();
  if (!userEmail || emailConfirmation.trim().toLowerCase() !== userEmail) {
    return { error: "L'adresse email de confirmation ne correspond pas." };
  }

  if (!password) {
    return { error: "Veuillez saisir votre mot de passe." };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: userEmail,
    password,
  });

  if (signInError) {
    return { error: "Mot de passe incorrect." };
  }

  try {
    await deleteProspectsForUser(user.id);
  } catch {
    return { error: "Impossible de supprimer le compte. Réessayez." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return { error: "Impossible de supprimer le compte. Réessayez." };
  }

  await supabase.auth.signOut().catch(() => {});
  redirect("/login");
}
