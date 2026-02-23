import Link from "next/link";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string } | Promise<{ error?: string }>;
}) {
  const hasAnyUsers = (await prisma.user.count()) > 0;
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  const hasError = resolvedSearchParams.error === "invalid";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Sign in</h1>

      {!hasAnyUsers ? (
        <p className="text-sm text-slate-600">
          No users exist yet. Create the initial admin account in{" "}
          <Link className="underline" href="/setup">
            setup
          </Link>
          .
        </p>
      ) : null}

      {hasError ? <p className="text-sm text-slate-600">Invalid email or password.</p> : null}

      <form action="/api/auth/login" method="post" className="flex flex-col gap-3">
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
            autoComplete="current-password"
          />
        </label>

        <button type="submit" className="rounded border px-3 py-2 text-sm">
          Sign in
        </button>
      </form>

      <p className="text-xs text-slate-600">
        Admins create accounts; password reset is admin-managed in the MVP.
      </p>
    </main>
  );
}
