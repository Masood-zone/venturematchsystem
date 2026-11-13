import Link from "next/link";
import type { ReactNode } from "react";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";

export function DashboardHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return <div className="max-w-3xl space-y-3">
    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-functional-teal"><MaterialSymbol icon="explore" className="text-lg" />{eyebrow}</p>
    <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">{title}</h1>
    <p className="text-sm leading-7 text-muted-foreground sm:text-base">{children}</p>
  </div>;
}

export function SetupReminder() {
  return <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-functional-teal/15 bg-accent p-5">
    <div><h2 className="font-semibold text-primary">Your setup is saved</h2><p className="mt-1 text-sm text-muted-foreground">Your unfinished profile stays hidden. Continue whenever you’re ready.</p></div>
    <Link href="/onboarding" className="primary-link px-5 py-3">Resume setup<MaterialSymbol icon="arrow_forward" className="text-lg" /></Link>
  </section>;
}

export function DashboardEmpty({ title, children, explore = false }: { title: string; children: ReactNode; explore?: boolean }) {
  return <div className="rounded-2xl border border-dashed border-border bg-white p-6 sm:p-8">
    <h3 className="font-semibold text-primary">{title}</h3>
    <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">{children}</p>
    {explore && <Link href="/explore" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-functional-teal hover:underline">Explore opportunities<MaterialSymbol icon="arrow_forward" className="text-lg" /></Link>}
  </div>;
}
