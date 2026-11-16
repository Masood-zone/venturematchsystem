"use client";
import { AccountEntryLink } from "./account-entry-link";
import { useAccountEntry } from "@/hooks/auth/use-account-entry";
import Image from "next/image";
import Link from "next/link";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { UserAvatarDropdown } from "./UserMenu";
import { useSession } from "@/services/auth/auth-client";

export function Brand() {
  return (
    <Link
      href="/"
      className="flex shrink-0 items-center gap-2.5 text-primary"
      aria-label="VentureMatch homepage"
    >
      <Image
        src="/logo.png"
        alt=""
        width={36}
        height={36}
        className="size-8 object-contain sm:size-9"
      />
      <span className="text-base font-bold tracking-tight sm:text-lg">
        VentureMatch
      </span>
    </Link>
  );
}

export function SiteHeader({ auth = false }: { auth?: boolean }) {
  const { data: session, isPending } = useSession();
  return (
    <header className="sticky top-0 z-50 border-b border-primary/5 bg-white/95 backdrop-blur-xl">
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-8 ${auth ? "h-16" : "h-20"}`}
      >
        <div className="flex items-center gap-10">
          <Brand />
          {!auth && (
            <nav
              aria-label="Main navigation"
              className="hidden items-center gap-6 text-sm text-muted-foreground md:flex"
            >
              <Link
                href="/#how-it-works"
                className="hover:text-functional-teal"
              >
                How it works
              </Link>
              <Link
                href="/#why-venturematch"
                className="hover:text-functional-teal"
              >
                Why VentureMatch
              </Link>
            </nav>
          )}
        </div>
        {auth ? (
          <>
            <span className="max-sm:hidden">You&apos;re already Logged In</span>
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-functional-teal"
            >
              <MaterialSymbol icon="arrow_back" className="text-lg" />
              <span className="hidden sm:inline">Back to homepage</span>
            </Link>
          </>
        ) : isPending ? (
          <div
            role="status"
            className="h-15 w-36 shrink-0 animate-pulse rounded-full bg-muted motion-reduce:animate-none"
          >
            <span className="sr-only">
              <span className="animate-spin"></span>
              Loading account
            </span>
          </div>
        ) : session?.user ? (
          <UserAvatarDropdown user={session.user} />
        ) : (
          <div className="flex items-center gap-3 sm:gap-6 text-sm font-semibold">
            <Link
              href="/login"
              className="whitespace-nowrap hover:text-functional-teal"
            >
              Sign in
            </Link>
            <Link href="/register" className="primary-link px-4 py-3 sm:px-5">
              Get started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export function SiteFooter({ auth = false }: { auth?: boolean }) {
  const entry = useAccountEntry();
  return (
    <footer className="mt-auto bg-secondary/70 text-xs text-muted-foreground">
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-8">
        {!auth && (
          <div className="mb-6 flex flex-col justify-between gap-5 border-b border-border pb-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-base font-semibold text-primary">
                VentureMatch{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  · USTED Kumasi
                </span>
              </p>
              <p className="mt-1">Connect Skills. Build Ventures.</p>
            </div>
            <div className="flex gap-6">
              <Link
                href="/#how-it-works"
                className="hover:text-functional-teal"
              >
                How it works
              </Link>
              {!entry.isPending && !entry.isSignedIn && (
                <Link href="/login" className="hover:text-functional-teal">
                  Sign in
                </Link>
              )}
              <AccountEntryLink className="hover:text-functional-teal">
                Create account
              </AccountEntryLink>
            </div>
          </div>
        )}
        <div className="flex flex-col justify-between gap-3 sm:flex-row">
          <p>© 2026 VentureMatch. All rights reserved.</p>
          <p>Designed for university innovation and venture collaboration.</p>
        </div>
      </div>
    </footer>
  );
}
