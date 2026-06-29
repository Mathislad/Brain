import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <Link
        href="/"
        className="mb-10 text-lg font-medium tracking-tight text-white"
      >
        Brain Admin
      </Link>
      <div className="w-full max-w-sm rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-6 shadow-2xl shadow-black/40 backdrop-blur-sm sm:rounded-2xl sm:p-8">
        {children}
      </div>
    </main>
  );
}
