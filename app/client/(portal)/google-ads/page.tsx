import type { Metadata } from "next";

import { requireClient } from "@/lib/auth/roles";
import { formatMoneyCents, getAdsOverview } from "@/lib/f5l-portal";

export const metadata: Metadata = { title: "Google Ads" };

export default async function ClientGoogleAdsPage() {
  const { organization } = await requireClient();
  const data = await getAdsOverview(organization.id, "google");

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-zinc-600">Acquisition</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">Google Ads</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          Campagnes Search, clics, conversions, budget et recommandations.
        </p>
        {data.source === "mock" && <p className="mt-2 text-xs text-cyan-400/80">Données mockées prêtes pour Google Ads API.</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Budget" value={formatMoneyCents(data.totals.budget)} />
        <Stat label="Dépenses" value={formatMoneyCents(data.totals.spend)} />
        <Stat label="Clics" value={String(data.totals.clicks)} />
        <Stat label="Conversions" value={String(data.totals.conversions)} />
      </div>
      <section className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-6">
        <h2 className="text-base font-medium text-white">Campagnes</h2>
        <div className="mt-5 grid gap-3">
          {data.campaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-lg border border-zinc-800 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">{campaign.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">{campaign.objective ?? "Mots-clés et conversions à connecter."}</p>
                </div>
                <span className="text-xs text-zinc-500">{campaign.status}</span>
              </div>
              <div className="mt-4 grid gap-3 text-xs text-zinc-500 sm:grid-cols-4">
                <span>{formatMoneyCents(campaign.spend)} dépensés</span>
                <span>{campaign.clicks} clics</span>
                <span>{campaign.conversions} conversions</span>
                <span>{campaign.impressions} impressions</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
      <p className="text-xs uppercase tracking-wider text-zinc-600">{label}</p>
      <p className="mt-1 text-xl font-medium text-white">{value}</p>
    </div>
  );
}
