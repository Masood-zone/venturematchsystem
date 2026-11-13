"use client";
export default function ExploreError({ reset }: { reset: () => void }) {
  return <main id="main-content" className="mx-auto max-w-xl space-y-4 p-8"><h1 className="text-2xl font-bold">Opportunities couldn’t load</h1><p>Please try again. Your saved setup has not changed.</p><button className="primary-link px-5 py-3" onClick={reset}>Try again</button></main>;
}
