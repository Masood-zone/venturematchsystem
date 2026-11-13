"use client";
import Link from "next/link";

export default function ProfileError({ reset }: { reset: () => void }) {
  return <main id="main-content" className="mx-auto max-w-xl space-y-4 p-8">
    <h1 className="text-2xl font-bold">Your profile couldn’t load</h1>
    <p role="alert">Please try again. Your saved profile has not changed.</p>
    <div className="flex flex-wrap gap-4"><button type="button" className="primary-link min-h-11 px-5 py-3" onClick={reset}>Try again</button><Link href="/explore" className="inline-flex min-h-11 items-center text-sm font-semibold text-functional-teal underline">Back to Explore</Link></div>
  </main>;
}
