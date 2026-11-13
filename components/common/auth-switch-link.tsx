"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { entryContext, entryHref } from "@/lib/student-entry";

export default function AuthSwitchLink({ href, className, children }: { href: "/login" | "/register"; className?: string; children: React.ReactNode }) {
  const params = useSearchParams();
  return <Link href={entryHref(href, entryContext(params))} className={className}>{children}</Link>;
}
