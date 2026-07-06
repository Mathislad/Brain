// Normalisation de numéro de téléphone (FR) — partagée client + serveur.
// Utilisée pour la liste rouge « ne pas rappeler » et la déduplication.
export function normalizePhone(value: string | null | undefined): string {
  const digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0033")) return `0${digits.slice(4)}`;
  if (digits.startsWith("33") && digits.length === 11) return `0${digits.slice(2)}`;
  return digits;
}
