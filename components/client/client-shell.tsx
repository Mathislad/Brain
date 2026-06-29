"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOutClientAction } from "@/app/actions/auth";
import type { FeatureKey } from "@/lib/auth/features";

interface Props {
  orgName:   string;
  userEmail: string;
  features:  Record<FeatureKey, boolean>;
  children:  React.ReactNode;
}

export function ClientShell({ orgName, userEmail, features, children }: Props) {
  const pathname = usePathname();

  // Navigation conditionnée par les feature flags actifs
  const NAV = [
    { label: "Accueil",    href: "/client",     always: true },
    { label: "Documents",  href: "/client/documents", feature: "documents" as FeatureKey },
    { label: "Abonnement", href: "/client/billing",   feature: "billing"   as FeatureKey },
  ].filter((item) => item.always || features[item.feature!]);

  function itemCls(href: string) {
    const active = href === "/client" ? pathname === href : pathname.startsWith(href);
    return `text-sm transition-colors ${
      active ? "text-white font-medium" : "text-zinc-500 hover:text-zinc-300"
    }`;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-950">
      {/* Top nav */}
      <header className="sticky top-0 z-20 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-6 px-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium tracking-tight text-white">F5L Brain</span>
            <span className="hidden text-zinc-700 sm:inline">·</span>
            <span className="hidden text-xs text-zinc-500 sm:inline">{orgName}</span>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-5">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className={itemCls(item.href)}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User */}
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-zinc-600 sm:inline">{userEmail}</span>
            <form action={signOutClientAction}>
              <button type="submit" className="text-xs text-zinc-600 transition-colors hover:text-zinc-300">
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/40 py-6 text-center">
        <p className="text-xs text-zinc-700">F5L Agency · Votre espace client</p>
      </footer>
    </div>
  );
}
