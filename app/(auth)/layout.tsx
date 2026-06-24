import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <Link
        href="/"
        className="mb-10 text-lg font-medium tracking-tight text-white"
      >
        Brain
      </Link>
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-8 shadow-2xl shadow-black/40 backdrop-blur-sm">
        {children}
      </div>
    </main>
  );
}
