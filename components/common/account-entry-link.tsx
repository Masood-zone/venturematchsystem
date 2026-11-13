"use client";

import Link from "next/link";
import { entryHref } from "@/lib/student-entry";
import type { Goal } from "@/lib/onboarding";
import { useAccountEntry } from "@/hooks/auth/use-account-entry";
import { MaterialSymbol } from "./MaterialSymbol";

export function AccountEntryLink({
  children,
  className,
  arrow = false,
  goal,
}: {
  children: React.ReactNode;
  className?: string;
  arrow?: boolean;
  goal?: Goal;
}) {
  const entry = useAccountEntry();
  if (entry.isPending) {
    return <span className={className} role="status">Loading account…</span>;
  }
  return (
    <Link href={goal ? entryHref(entry.isSignedIn ? "/auth/continue" : "/register", { goal }) : entry.href} prefetch={entry.isSignedIn ? false : undefined} className={className}>
      <span>{!goal && entry.isSignedIn ? entry.label : children}</span>
      {arrow && <MaterialSymbol className="text-[18px]" icon="arrow_forward" />}
    </Link>
  );
}

export function StartingPointsHint() {
  const entry = useAccountEntry();
  if (entry.isPending) return <span role="status">Loading your next step…</span>;
  return <span>{entry.isSignedIn
    ? "You can do both. Choose a starting point and finish your profile if needed."
    : "You can do both. Choose where to start after creating your account."}</span>;
}
