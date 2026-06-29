import { redirect } from "next/navigation";

// La homepage est gérée par le middleware (redirect vers /client/login ou /client).
// Ce composant ne s'exécute jamais en conditions normales — fallback de sécurité.
export default function HomePage() {
  redirect("/client/login");
}
