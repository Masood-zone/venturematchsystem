"use client";
export default function ContinueError({ reset }: { reset: () => void }) {
  return <main id="main-content" className="mx-auto max-w-xl space-y-4 p-8"><h1 className="text-2xl font-bold">We couldn’t open your account</h1><p>Please retry opening your account and saved setup.</p><button className="primary-link px-5 py-3" onClick={reset}>Try again</button></main>;
}
