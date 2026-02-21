import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SetupPage({
  searchParams,
}: {
  searchParams?: { error?: string } | Promise<{ error?: string }>;
}) {
  const hasAnyUsers = (await prisma.user.count()) > 0;
  if (hasAnyUsers) {
    redirect("/login");
  }

  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  const hasError = resolvedSearchParams.error === "invalid";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Initial setup</h1>
      <p className="text-sm text-slate-600">
        Create the first Admin account. This page is disabled once any user exists.
      </p>

      {hasError ? (
        <p className="text-sm text-slate-600">Provide email, name, and a password (8+ chars).</p>
      ) : null}

      <form action="/api/auth/setup" method="post" className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm">Admin name</span>
          <input name="displayName" required className="rounded border px-3 py-2" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">Email</span>
          <input
            name="email"
            type="email"
            required
            className="rounded border px-3 py-2"
            autoComplete="email"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">Password</span>
          <input
            name="password"
            type="password"
            required
            className="rounded border px-3 py-2"
            autoComplete="new-password"
          />
          <span className="text-xs text-slate-600">Use 8+ characters.</span>
        </label>

        <button type="submit" className="rounded border px-3 py-2 text-sm">
          Create admin
        </button>
      </form>
    </main>
  );
}
