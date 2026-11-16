"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "better-auth";
import { useAccountEntry } from "@/hooks/auth/use-account-entry";
import { useLogOut } from "@/hooks/auth/use-auth";

export function UserAvatarDropdown({
  user,
  compact = false,
}: {
  user: User & { role?: string | null };
  compact?: boolean;
}) {
  const { mutate: logOut, isPending: isSigningOut, isError, reset } = useLogOut();
  const entry = useAccountEntry();
  const dashboardHref = user.role === "student" ? entry.href : undefined;
  const name = user.name.trim() || user.email;
  const initial = Array.from(name)[0]?.toLocaleUpperCase() || "?";

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open && !isSigningOut) reset();
      }}
    >
      <DropdownMenuTrigger
        aria-label={`Account menu for ${name}`}
        className={`flex min-w-0 items-center rounded-full border border-border bg-card p-1.5 text-left transition-colors hover:bg-secondary data-popup-open:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring ${compact ? "max-w-80 gap-2 pr-3" : "max-w-52 gap-3 pr-5"}`}
      >
        <Avatar className={`${compact ? "size-9" : "size-12"} after:border-0`}>
          {user.image ? <AvatarImage src={user.image} alt="" /> : null}
          <AvatarFallback className="bg-accent text-base font-medium text-accent-foreground">
            {initial}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0">
          <span className={`block truncate font-semibold text-primary ${compact ? "text-sm leading-5" : "text-base leading-6"}`}>
            {name}
          </span>
          <span
            className={`block truncate font-normal text-muted-foreground ${compact ? "text-xs leading-4" : "text-sm capitalize leading-5"}`}
            title={compact ? user.email : undefined}
          >
            {compact ? user.email : entry.displayLabel}
          </span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-70 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-none ring-0"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-[18px] pt-3.5 pb-2.5 font-normal">
            <span className="block truncate text-base font-medium text-primary">
              {name}
            </span>
            <span
              className="mt-0.5 block truncate text-sm text-muted-foreground"
              title={user.email}
            >
              {user.email}
            </span>
            <span className="mt-1 block text-xs font-medium capitalize text-functional-teal">
              {entry.displayLabel}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="mx-0 my-1 bg-border" />
          <DropdownMenuItem
            disabled={!dashboardHref}
            render={dashboardHref ? <Link href={dashboardHref} prefetch={false} /> : undefined}
            className="min-h-11 cursor-pointer px-[18px] text-base font-normal"
          >
            {entry.label}
          </DropdownMenuItem>
          {user.role === "student" && <DropdownMenuItem render={<Link href="/profile/edit" prefetch={false} />} className="min-h-11 cursor-pointer px-[18px] text-base font-normal">Edit my profile</DropdownMenuItem>}
          <DropdownMenuItem
            disabled={isSigningOut}
            closeOnClick={false}
            onClick={() => {
              if (!isSigningOut) logOut();
            }}
            className="min-h-11 cursor-pointer px-[18px] text-base font-normal"
          >
            {isSigningOut ? "Signing out…" : "Sign out"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {isError ? (
          <p role="alert" className="px-[18px] py-2 text-sm text-destructive">
            Could not sign out. Please try again.
          </p>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
