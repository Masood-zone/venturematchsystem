"use client";
export default function OnboardingError({ reset }: { reset: () => void }) {
  return <main id="main-content" className="mx-auto max-w-xl space-y-4 p-8"><h1 className="text-2xl font-bold">We couldn’t load your setup</h1><p>Your saved information is safe. Please try again.</p><button className="primary-link px-5 py-3" onClick={reset}>Try again</button></main>;
}
