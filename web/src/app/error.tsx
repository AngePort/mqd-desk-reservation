"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <pre className="overflow-auto rounded border p-3 text-xs">
        {error.message}
      </pre>
      <button
        type="button"
        className="w-fit rounded border px-3 py-2 text-sm"
        onClick={reset}
      >
        Try again
      </button>
    </main>
  );
}
