import { LaunchSetup } from "@/components/dashboard/launch-setup";

export default function LancementPage() {
  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-zinc-600">
          Outils
        </p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">
          Lancement
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Préparation des lancements, étapes à valider et suivi de mise en ligne.
        </p>
      </div>

      <LaunchSetup />
    </div>
  );
}
