"use client";

export default function MyVenturesError({ reset }: { reset: () => void }) {
  return <main id="main-content" className="mx-auto max-w-xl space-y-4 p-8">
    <h1 className="text-2xl font-bold">Your ventures couldn’t load</h1>
    <p role="alert">Please try again. Your saved ideas have not changed.</p>
    <button type="button" className="primary-link min-h-11 px-5 py-3" onClick={reset}>Try again</button>
  </main>;
}
