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

export default function StudentShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const active = (href: string) => pathname === href || (pathname.startsWith(`${href}/`) && pathname !== "/ventures/notifications");
  return <div className="flex min-h-dvh flex-col bg-background pb-20 md:pb-0">
    <header className="sticky top-0 z-40 border-b border-primary/5 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
        <div className="flex items-center gap-10">
          <Brand />
          <nav aria-label="Student navigation" className="hidden items-center gap-2 md:flex">
            {links.map(({ href, label }) => <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}
              className={`rounded-xl px-5 py-3 text-sm font-semibold transition-colors ${active(href) ? "bg-primary text-white" : "text-muted-foreground hover:bg-secondary hover:text-primary"}`}>{label}</Link>)}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/ventures/notifications" aria-label="Notifications" aria-current={pathname === "/ventures/notifications" ? "page" : undefined} className="inline-flex size-11 items-center justify-center rounded-xl text-primary hover:bg-secondary">
            <MaterialSymbol icon="notifications" className="text-2xl" />
          </Link>
          {session?.user ? <UserAvatarDropdown compact user={session.user} dashboardHref="/auth/continue" dashboardLabel="My starting page" /> : <span role="status" className="text-xs text-muted-foreground">Loading account…</span>}
        </div>
      </div>
    </header>
    {children}
    <SiteFooter auth />
    <nav aria-label="Mobile student navigation" className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      {links.map(({ href, label, icon }) => <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}
        className={`flex min-h-18 flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold ${active(href) ? "bg-accent/60 text-functional-teal" : "text-muted-foreground"}`}>
        <MaterialSymbol icon={icon} className="text-2xl" />{label}
      </Link>)}
    </nav>
  </div>;
}
