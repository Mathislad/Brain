import type { AuthError } from "@supabase/supabase-js";

// En développement, affiche l'erreur brute dans la console pour faciliter le diagnostic.
export function devLogAuthError(context: string, error: AuthError) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[Auth – ${context}]`, {
      status: error.status,
      message: error.message,
      name: error.name,
      code: "code" in error ? (error as { code: unknown }).code : undefined,
    });
  }
}

// Lecture défensive du code erreur Supabase.
// `code` existe sur AuthApiError mais pas sur toutes les sous-classes d'AuthError,
// donc on le lit sans casser le typage strict.
function code(error: AuthError): string {
  return ("code" in error ? String((error as { code: unknown }).code) : "")
    .toLowerCase();
}
function msg(error: AuthError): string {
  return error.message.toLowerCase();
}
function isRateLimit(error: AuthError): boolean {
  return (
    error.status === 429 ||
    msg(error).includes("rate limit") ||
    msg(error).includes("too many")
  );
}
function isServerError(error: AuthError): boolean {
  return typeof error.status === "number" && error.status >= 500;
}

// ---------------------------------------------------------------------------
// Inscription — signUp
// ---------------------------------------------------------------------------
export function getRegisterError(error: AuthError): string {
  const c = code(error);
  const m = msg(error);

  if (isServerError(error)) {
    return "Le serveur est momentanément indisponible. Réessayez dans quelques instants.";
  }
  if (c.includes("over_email_send_rate_limit") || (m.includes("email") && m.includes("rate"))) {
    return "Un email vient d'être envoyé. Patientez quelques minutes avant d'en demander un autre.";
  }
  if (isRateLimit(error)) {
    return "Trop de tentatives. Patientez quelques minutes avant de réessayer.";
  }
  if (c.includes("user_already_exists") || m.includes("already registered") || m.includes("already exists")) {
    return "Un compte existe déjà avec cette adresse email. Connectez-vous ou utilisez une autre adresse.";
  }
  if (c.includes("weak_password") || (m.includes("password") && (m.includes("weak") || m.includes("strong")))) {
    return "Le mot de passe n'est pas assez sécurisé. Essayez d'y ajouter des chiffres ou des caractères spéciaux.";
  }
  if (m.includes("invalid") && m.includes("email")) {
    return "L'adresse email n'est pas valide. Vérifiez la saisie.";
  }
  if (c.includes("signup_disabled") || (m.includes("signup") && m.includes("disabled")) || m.includes("signups not allowed")) {
    return "Les inscriptions sont actuellement désactivées.";
  }

  return "Impossible de créer le compte. Vérifiez vos informations et réessayez.";
}

// ---------------------------------------------------------------------------
// Connexion — signInWithPassword
// ---------------------------------------------------------------------------
export type LoginErrorResult = {
  message: string;
  emailNotConfirmed?: boolean; // si vrai, afficher un lien vers /confirm-email
};

export function getLoginError(error: AuthError): LoginErrorResult {
  const c = code(error);
  const m = msg(error);

  if (isServerError(error)) {
    return { message: "Le serveur est momentanément indisponible. Réessayez dans quelques instants." };
  }
  if (isRateLimit(error)) {
    return { message: "Trop de tentatives de connexion. Patientez quelques minutes avant de réessayer." };
  }
  if (c.includes("email_not_confirmed") || m.includes("email not confirmed") || m.includes("not confirmed")) {
    return {
      message: "Votre adresse email n'a pas encore été confirmée.",
      emailNotConfirmed: true,
    };
  }
  // "Invalid login credentials" couvre : mauvais mot de passe ET email inexistant
  // (Supabase les fusionne volontairement pour éviter l'énumération d'emails).
  if (c.includes("invalid_credentials") || m.includes("invalid login") || m.includes("invalid credentials") || error.status === 400) {
    return { message: "Email ou mot de passe incorrect. Vérifiez vos identifiants." };
  }

  return { message: "Connexion impossible. Réessayez." };
}

// ---------------------------------------------------------------------------
// Vérification OTP — verifyOtp
// ---------------------------------------------------------------------------
export function getOtpError(error: AuthError): string {
  const c = code(error);
  const m = msg(error);

  if (isRateLimit(error)) {
    return "Trop de tentatives. Demandez un nouveau code et réessayez.";
  }
  if (c.includes("otp_expired") || m.includes("expired")) {
    return "Ce code a expiré. Cliquez sur « Renvoyer le code » pour en recevoir un nouveau.";
  }
  if (m.includes("invalid") || m.includes("token") || c.includes("otp_disabled")) {
    return "Code incorrect. Vérifiez le code saisi et réessayez.";
  }

  return "La vérification a échoué. Demandez un nouveau code et réessayez.";
}

// ---------------------------------------------------------------------------
// Renvoi du code — resend
// ---------------------------------------------------------------------------
export function getResendError(error: AuthError): string {
  const c = code(error);
  const m = msg(error);

  if (c.includes("over_email_send_rate_limit") || isRateLimit(error) || (m.includes("email") && m.includes("rate"))) {
    return "Un code vient d'être envoyé. Patientez quelques minutes avant d'en demander un autre.";
  }

  return "Impossible de renvoyer le code. Vérifiez l'adresse email et réessayez.";
}

// ---------------------------------------------------------------------------
// Réinitialisation mot de passe — resetPasswordForEmail / updateUser
// ---------------------------------------------------------------------------
export function getPasswordResetRequestError(error: AuthError): string {
  const c = code(error);
  const m = msg(error);

  if (isServerError(error)) {
    return "Le serveur est momentanément indisponible. Réessayez dans quelques instants.";
  }
  if (c.includes("over_email_send_rate_limit") || isRateLimit(error) || (m.includes("email") && m.includes("rate"))) {
    return "Un email vient d'être envoyé. Patientez quelques minutes avant d'en demander un autre.";
  }
  if (m.includes("invalid") && m.includes("email")) {
    return "L'adresse email n'est pas valide. Vérifiez la saisie.";
  }

  return "Impossible d'envoyer l'email de récupération. Vérifiez l'adresse et réessayez.";
}

export function getPasswordUpdateError(error: AuthError): string {
  const c = code(error);
  const m = msg(error);

  if (isServerError(error)) {
    return "Le serveur est momentanément indisponible. Réessayez dans quelques instants.";
  }
  if (isRateLimit(error)) {
    return "Trop de tentatives. Patientez quelques minutes avant de réessayer.";
  }
  if (c.includes("weak_password") || (m.includes("password") && (m.includes("weak") || m.includes("strong")))) {
    return "Le mot de passe n'est pas assez sécurisé. Essayez d'y ajouter des chiffres ou des caractères spéciaux.";
  }

  return "Impossible de mettre à jour le mot de passe. Demandez un nouveau code et réessayez.";
}
