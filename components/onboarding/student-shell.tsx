"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand, SiteFooter } from "@/components/common/site-shell";
import { UserAvatarDropdown } from "@/components/common/UserMenu";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { useSession } from "@/services/auth/auth-client";

const links = [
  { href: "/explore", label: "Explore", icon: "explore" },
  { href: "/ventures", label: "My ventures", icon: "work_outline" },
] as const;
const notifications = { href: "/ventures/notifications", label: "Notifications", icon: "notifications" } as const;

type SectionLink = { id: string; label: string };

function SectionLinks({ sections }: { sections: readonly SectionLink[] }) {
  return (
    <ul className="space-y-1">
      {sections.map(({ id, label }) => (
        <li key={id}>
          <a href={`#${id}`} className="flex min-h-11 items-center rounded-lg px-3 text-sm text-muted-foreground hover:bg-secondary hover:text-primary">
            {label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function StudentShell({
  children,
  sections,
}: {
  children: ReactNode;
  sections?: readonly SectionLink[];
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const active = (href: string) =>
    pathname === href || (href === "/ventures" && pathname.startsWith("/ventures/") && pathname !== notifications.href);

  return (
    <div className="flex min-h-dvh flex-col bg-background pb-20 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-primary/5 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <Brand />
          <div className="flex min-w-0 items-center gap-2">
            <Link href={notifications.href} aria-label={notifications.label} aria-current={active(notifications.href) ? "page" : undefined} className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-primary hover:bg-secondary md:hidden">
              <MaterialSymbol icon={notifications.icon} className="text-2xl" />
            </Link>
            {session?.user ? <UserAvatarDropdown compact user={session.user} /> : <span role="status" className="text-xs text-muted-foreground">Loading account…</span>}
          </div>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-7xl flex-1 content-start md:grid-cols-[13rem_minmax(0,1fr)] md:px-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="sticky top-24 mt-8 hidden max-h-[calc(100dvh-7rem)] self-start overflow-y-auto rounded-2xl border border-border bg-card p-3 md:block">
          <nav aria-label="Student workspace" className="space-y-1">
            {[...links, notifications].map(({ href, label, icon }) => (
              <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${active(href) ? "bg-primary text-white" : "text-muted-foreground hover:bg-secondary hover:text-primary"}`}>
                <MaterialSymbol icon={icon} className="text-xl" />
                {label}
              </Link>
            ))}
          </nav>
          {sections?.length ? (
            <nav aria-label="On this page" className="mt-3 border-t border-border pt-3">
              <p className="px-3 pb-1 text-xs font-semibold text-primary">On this page</p>
              <SectionLinks sections={sections} />
            </nav>
          ) : null}
        </aside>
        <div className="min-w-0">
          {sections?.length ? (
            <details className="mx-4 mt-4 rounded-xl border border-border bg-card px-2 sm:mx-8 md:hidden">
              <summary className="min-h-11 cursor-pointer px-2 py-3 text-sm font-semibold text-primary">On this page</summary>
              <nav aria-label="On this page" className="pb-2">
                <SectionLinks sections={sections} />
              </nav>
            </details>
          ) : null}
          {children}
        </div>
      </div>
      <SiteFooter auth />
      <nav aria-label="Mobile student navigation" className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {links.map(({ href, label, icon }) => <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}
          className={`flex min-h-18 flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold ${active(href) ? "bg-accent/60 text-functional-teal" : "text-muted-foreground"}`}>
          <MaterialSymbol icon={icon} className="text-2xl" />{label}
        </Link>)}
      </nav>
    </div>
  );
}
