import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-16">
      <main className="mx-auto max-w-4xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-neutral-950 px-3 py-1 text-xs text-white/70">
          <span className="h-2 w-2 rounded-full bg-[var(--accent-green)]" />
          Production-minded modular monolith (Next.js)
        </div>

        <h1 className="mt-6 text-4xl font-semibold tracking-tight">
          pragmas <span className="text-white/50">/</span> Sentinel OS
        </h1>
        <p className="mt-4 text-sm text-white/70 max-w-2xl">
          AI-first investment intelligence platform: portfolio analytics, risk intelligence,
          market research automation, and auditable decision journaling. No trade execution.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            className="inline-flex items-center justify-center rounded-md bg-white text-black px-4 py-2 font-medium hover:bg-white/90"
            href="/dashboard"
          >
            Open Dashboard
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-md border border-white/15 px-4 py-2 text-white hover:border-white/30"
            href="/auth"
          >
            Sign in / Sign up
          </Link>
        </div>
      </main>
    </div>
  );
}
