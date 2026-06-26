"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOutAction } from "@/app/actions/auth";

interface Props {
  userEmail: string;
  userName: string;
}

interface NavItem {
  label: string;
  href: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Prospection",
    items: [
      { label: "CRM", href: "/dashboard/prospection/crm" },
      { label: "Cold Call", href: "/dashboard/prospection/cold-call" },
      { label: "Réseaux sociaux", href: "/dashboard/prospection/reseaux-sociaux" },
    ],
  },
  {
    label: "Entreprise",
    items: [
      { label: "Comptabilité", href: "/dashboard/entreprise/comptabilite" },
      { label: "Devis & facture", href: "/dashboard/entreprise/devis-facture" },
      { label: "Client", href: "/dashboard/entreprise/client" },
    ],
  },
];

const navSingle: NavItem[] = [
  { label: "Paramètres", href: "/dashboard/settings" },
];

export function Sidebar({ userEmail, userName }: Props) {
  const pathname = usePathname();

  function itemClass(href: string) {
    const isActive = pathname === href || pathname.startsWith(href + "/");
    return `flex items-center rounded-lg px-3 py-1.5 text-sm transition-colors ${
      isActive
        ? "bg-zinc-800 text-white"
        : "text-zinc-500 hover:bg-zinc-900 hover:text-white"
    }`;
  }

  return (
    <aside className="flex h-screen w-52 shrink-0 flex-col border-r border-zinc-800/60 bg-zinc-950">
      {/* Logo */}
      <div className="px-5 py-5">
        <Link
          href="/dashboard"
          className="text-sm font-medium tracking-tight text-white"
        >
          Brain
        </Link>
      </div>

      <div className="mx-4 h-px bg-zinc-800/60" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* Groupes avec label */}
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              {group.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <Link key={item.href} href={item.href} className={itemClass(item.href)}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div className="mx-1 my-3 h-px bg-zinc-800/60" />

        {/* Items simples */}
        <div className="flex flex-col gap-0.5">
          {navSingle.map((item) => (
            <Link key={item.href} href={item.href} className={itemClass(item.href)}>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="mx-4 h-px bg-zinc-800/60" />
      <div className="flex flex-col gap-2 px-5 py-4">
        {userName && (
          <p className="truncate text-xs font-medium text-zinc-400">
            {userName}
          </p>
        )}
        <p className="truncate text-xs text-zinc-600">{userEmail}</p>
        <form action={signOutAction} className="mt-1">
          <button
            type="submit"
            className="text-xs text-zinc-600 underline-offset-4 transition-colors hover:text-zinc-400 hover:underline"
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </aside>
  );
}
