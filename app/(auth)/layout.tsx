"use client";
import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/components/common/site-shell";
import { useSession } from "@/services/auth/auth-client";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { data: session } = useSession();

  return (
    <>
      <SiteHeader auth={!!session} />
      <main
        id="main-content"
        className="auth-background flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-14"
      >
        {children}
      </main>
      <SiteFooter auth />
    </>
  );
}
