import type { Metadata } from "next";

import { requireClient } from "@/lib/auth/roles";
import { formatMoneyCents, getAdsOverview } from "@/lib/f5l-portal";

export const metadata: Metadata = { title: "Meta Ads" };

export default async function ClientMetaAdsPage() {
  const { organization } = await requireClient();
  const data = await getAdsOverview(organization.id, "meta");

  return <AdsPage title="Meta Ads" text="Campagnes Facebook et Instagram, budget, leads et coût par lead." data={data} cta="Créatifs et audiences à connecter." />;
}

function AdsPage({ title, text, data, cta }: { title: string; text: string; cta: string; data: Awaited<ReturnType<typeof getAdsOverview>> }) {
  return (
    <div className="grid gap-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-zinc-600">Acquisition</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">{text}</p>
        {data.source === "mock" && <p className="mt-2 text-xs text-cyan-400/80">Données mockées prêtes pour l&apos;API publicitaire.</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Budget" value={formatMoneyCents(data.totals.budget)} />
        <Stat label="Dépenses" value={formatMoneyCents(data.totals.spend)} />
        <Stat label="Leads" value={String(data.totals.leads)} />
        <Stat label="Clics" value={String(data.totals.clicks)} />
      </div>
      <section className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-6">
        <h2 className="text-base font-medium text-white">Campagnes</h2>
        <div className="mt-5 grid gap-3">
          {data.campaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-lg border border-zinc-800 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">{campaign.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">{campaign.objective ?? cta}</p>
                </div>
                <span className="text-xs text-zinc-500">{campaign.status}</span>
              </div>
              <div className="mt-4 grid gap-3 text-xs text-zinc-500 sm:grid-cols-4">
                <span>{formatMoneyCents(campaign.spend)} dépensés</span>
                <span>{campaign.leads} leads</span>
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
