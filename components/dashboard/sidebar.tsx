"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import { signOutAction } from "@/app/actions/auth";
import { ClientDetailModal } from "@/components/dashboard/client-detail-modal";
import { STATUS_LABELS } from "@/components/dashboard/status-badge";
import type { ClientWithLinks } from "@/lib/client-types";

interface Props {
  clientRecords: ClientWithLinks[];
  userEmail: string;
  userName: string;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  activePaths?: string[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Organisation",
    items: [
      { label: "Agenda", href: "/dashboard/organisation/agenda" },
      { label: "To Do liste", href: "/dashboard/working/todolist" },
      {
        label: "Réservation",
        href: "/dashboard/module/systeme-reservation",
      },
    ],
  },
  {
    label: "Administratif",
    items: [
      {
        label: "Devis, facture et contrats",
        href: "/dashboard/entreprise/devis-facture",
        activePaths: ["/dashboard/entreprise/contrats"],
      },
      { label: "Comptabilité", href: "/dashboard/entreprise/comptabilite" },
      { label: "Simulateur", href: "/dashboard/entreprise/simulateur" },
    ],
  },
  {
    label: "Prospection",
    items: [
      { label: "CRM", href: "/dashboard/prospection/crm" },
      { label: "Média", href: "/dashboard/prospection/reseaux-sociaux" },
      { label: "Cold Call", href: "/dashboard/prospection/cold-call" },
    ],
  },
  {
    label: "Suivi client",
    items: [
      { label: "Dashboard", href: "/dashboard/suivi-client" },
      { label: "Fiche client", href: "/dashboard/entreprise/client" },
      { label: "Invitations", href: "/dashboard/entreprise/invitations" },
      { label: "Demandes client", href: "/dashboard/entreprise/demandes" },
      { label: "Site internet", href: "/dashboard/working/site-internet" },
    ],
  },
  {
    label: "Bonus",
    items: [{ label: "Prompt", href: "/dashboard/working/prompt" }],
  },
];

const navSingle: NavItem[] = [
  { label: "Paramètres", href: "/dashboard/settings" },
];

interface BodyProps {
  pathname: string;
  clientQuery: string;
  setClientQuery: (v: string) => void;
  clientResults: ClientWithLinks[];
  setOpenClientId: (id: string | null) => void;
  userEmail: string;
  userName: string;
  onLinkClick?: () => void;
}

function SidebarBody({
  pathname,
  clientQuery,
  setClientQuery,
  clientResults,
  setOpenClientId,
  userEmail,
  userName,
  onLinkClick,
}: BodyProps) {
  function itemClass(item: NavItem) {
    const paths = [item.href, ...(item.activePaths ?? [])];
    const isActive = paths.some(
      (href) => pathname === href || pathname.startsWith(href + "/"),
    );
    return `flex items-center rounded-lg px-3 py-1.5 text-sm transition-colors ${
      isActive
        ? "bg-zinc-800 text-white"
        : "text-zinc-500 hover:bg-zinc-900 hover:text-white"
    }`;
  }

  return (
    <>
      <div className="mx-4 h-px bg-zinc-800/60" />

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              {group.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={itemClass(item)}
                  onClick={onLinkClick}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div className="mx-1 my-3 h-px bg-zinc-800/60" />

        <div className="px-1">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
            Fiche client
          </p>
          <input
            value={clientQuery}
            onChange={(e) => setClientQuery(e.target.value)}
            placeholder="Nom, tel, email..."
            className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-xs text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-zinc-600"
          />

          {clientQuery.trim().length >= 2 && (
            <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-zinc-800/80 bg-zinc-950">
              {clientResults.length === 0 ? (
                <p className="px-3 py-3 text-xs text-zinc-600">
                  Aucun prospect trouvé.
                </p>
              ) : (
                <div className="divide-y divide-zinc-800/60">
                  {clientResults.map((client) => {
                    const title = client.entreprise || client.nom;
                    const subtitle = client.entreprise
                      ? client.nom
                      : client.activite;

                    return (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => {
                          setOpenClientId(client.id);
                          setClientQuery("");
                        }}
                        className="w-full px-3 py-2 text-left transition-colors hover:bg-zinc-900"
                      >
                        <p className="truncate text-xs font-medium text-zinc-200">
                          {title}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-zinc-600">
                          {subtitle || STATUS_LABELS[client.status]}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mx-1 my-3 h-px bg-zinc-800/60" />

        <div className="flex flex-col gap-0.5">
          {navSingle.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={itemClass(item)}
              onClick={onLinkClick}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

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
    </>
  );
}

export function Sidebar({
  clientRecords,
  userEmail,
  userName,
  isMobileOpen = false,
  onMobileClose,
}: Props) {
  const pathname = usePathname();
  const [clientQuery, setClientQuery] = useState("");
  const [openClientId, setOpenClientId] = useState<string | null>(null);
  const openClient =
    clientRecords.find((client) => client.id === openClientId) ?? null;

  const clientResults = useMemo(() => {
    const query = clientQuery.trim().toLowerCase();
    if (query.length < 2) return [];
    return clientRecords
      .filter((client) =>
        [
          client.nom,
          client.entreprise,
          client.email,
          client.telephone,
          client.activite,
        ]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(query)),
      )
      .slice(0, 6);
  }, [clientQuery, clientRecords]);

  const bodyProps: BodyProps = {
    pathname,
    clientQuery,
    setClientQuery,
    clientResults,
    setOpenClientId,
    userEmail,
    userName,
  };

  return (
    <>
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden h-screen w-52 shrink-0 flex-col border-r border-zinc-800/60 bg-zinc-950 md:flex">
        <div className="px-5 py-5">
          <Link
            href="/dashboard"
            className="text-sm font-medium tracking-tight text-white"
          >
            Brain
          </Link>
        </div>
        <SidebarBody {...bodyProps} />
      </aside>

      {/* Mobile drawer overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <aside className="absolute inset-y-0 left-0 flex h-full w-72 flex-col overflow-hidden border-r border-zinc-800/60 bg-zinc-950">
            <div className="flex items-center justify-between px-5 py-5">
              <Link
                href="/dashboard"
                className="text-sm font-medium tracking-tight text-white"
                onClick={onMobileClose}
              >
                Brain
              </Link>
              <button
                type="button"
                onClick={onMobileClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-white"
                aria-label="Fermer le menu"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SidebarBody {...bodyProps} onLinkClick={onMobileClose} />
          </aside>
        </div>
      )}

      {openClient && (
        <ClientDetailModal
          client={openClient}
          onClose={() => setOpenClientId(null)}
        />
      )}
    </>
  );
}
