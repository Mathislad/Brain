"use client";

import Link from "next/link";
import { useState } from "react";

import { Sidebar } from "@/components/dashboard/sidebar";
import type { ClientWithLinks } from "@/lib/client-types";

interface Props {
  clientRecords: ClientWithLinks[];
  userEmail: string;
  userName: string;
  children: React.ReactNode;
}

export function DashboardShell({
  clientRecords,
  userEmail,
  userName,
  children,
}: Props) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        clientRecords={clientRecords}
        userEmail={userEmail}
        userName={userName}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Mobile header — hidden on md+ */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800/60 bg-zinc-950 px-4 md:hidden">
          <Link
            href="/dashboard"
            className="text-sm font-medium tracking-tight text-white"
          >
            Brain
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
            aria-label="Ouvrir le menu"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
