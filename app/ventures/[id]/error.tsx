"use client";
export default function VentureError({ reset }: { reset: () => void }) {
  return <main id="main-content" className="mx-auto max-w-xl space-y-4 p-8"><h1 className="text-2xl font-bold">This idea couldn’t load</h1><p>Please try again.</p><button className="primary-link px-5 py-3" onClick={reset}>Try again</button></main>;
}
