export type ProspectStatus = "TODO" | "IN_PROGRESS" | "DONE" | "CLIENT_ACTIF";

export type ProspectFormData = {
  nom: string;
  entreprise?: string | null;
  email?: string | null;
  telephone?: string | null;
  siteInternet?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  linkedin?: string | null;
  prochaineAction?: string | null;
  derniereAction?: string | null;
  status?: ProspectStatus;
  ville?: string | null;
  activite?: string | null;
  note?: string | null;
};
