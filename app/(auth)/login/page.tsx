import { Suspense } from "react";
import AuthSwitchLink from "@/components/common/auth-switch-link";
import type { Metadata } from "next";
import Link from "next/link";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import LoginForm from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="w-full max-w-lg">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 px-1 text-xs">
        <Link href="/" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-functional-teal"><MaterialSymbol icon="arrow_back" className="text-lg" />Back to public homepage</Link>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[11px] font-medium text-functional-teal"><span className="size-1.5 rounded-full bg-functional-teal" />USTED Kumasi</span>
      </div>
      <div className="auth-card space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary"><MaterialSymbol icon="account_circle" className="text-2xl" /></span><span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground"><MaterialSymbol icon="school" className="text-base text-functional-teal" />Kumasi Campus</span></div>
          <div className="space-y-2"><h1 className="text-[28px] leading-tight font-bold tracking-tight text-primary sm:text-[32px]">Welcome back to VentureMatch</h1><p className="text-sm leading-relaxed text-muted-foreground">Sign in with your student email and password to continue to your ventures and collaborator network.</p></div>
        </div>
        <Suspense fallback={<p role="status">Loading form…</p>}><LoginForm /></Suspense>
        <div className="flex items-start gap-3 rounded-xl bg-secondary/70 p-3.5"><MaterialSymbol icon="verified_user" className="mt-0.5 text-xl text-functional-teal" /><p className="text-xs leading-relaxed text-muted-foreground"><strong className="font-semibold text-foreground">Your campus collaboration starts here.</strong> Connect with complementary skills, explore ideas, and try working together.</p></div>
        <p className="text-center text-sm text-muted-foreground">Don&apos;t have an account yet? <Suspense fallback={<span>Continue with your account</span>}><AuthSwitchLink href="/register" className="font-semibold text-functional-teal hover:underline">Create account</AuthSwitchLink></Suspense></p>
      </div>
    </div>
  );
}
