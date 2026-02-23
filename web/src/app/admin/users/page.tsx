import Link from "next/link";

import { requireAdmin } from "@/lib/auth";
import { userRepo } from "@/lib/repos/userRepo";

export const dynamic = "force-dynamic";

type UserRow = Awaited<ReturnType<typeof userRepo.listAll>>[number];

function getMessage(params: { success?: string; error?: string }) {
  if (params.success === "created") return "User created.";
  if (params.success === "reset") return "Password reset.";
  if (params.error === "invalid") return "Please fill out all fields correctly.";
  if (params.error === "exists") return "That email already exists.";
  return null;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: { success?: string; error?: string } | Promise<{ success?: string; error?: string }>;
}) {
  await requireAdmin();

  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  const message = getMessage(resolvedSearchParams);

  const users = await userRepo.listAll();

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Admin: Users</h1>
          <p className="text-sm text-slate-600">Create accounts and reset passwords.</p>
        </div>

        <Link href="/" className="rounded border px-3 py-2 text-sm">
          Back
        </Link>
      </header>

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}

      <section className="rounded border p-4">
        <h2 className="text-lg font-semibold">Create user</h2>
        <form action="/api/admin/users/create" method="post" className="mt-3 grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm">Email</span>
            <input name="email" type="email" required className="rounded border px-3 py-2" />
          </label>

          <label className="grid gap-1">
            <span className="text-sm">Display name</span>
            <input name="displayName" required className="rounded border px-3 py-2" />
          </label>

          <label className="grid gap-1">
            <span className="text-sm">Role</span>
            <select name="role" className="rounded border px-3 py-2 text-sm">
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-sm">Initial password</span>
            <input name="password" type="password" minLength={8} required className="rounded border px-3 py-2" />
          </label>

          <button type="submit" className="w-fit rounded border px-3 py-2 text-sm">
            Create
          </button>
        </form>
      </section>

      <section className="rounded border p-4">
        <h2 className="text-lg font-semibold">Existing users</h2>
        <div className="mt-3 overflow-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="text-left">
                <th className="border-b p-2">Email</th>
                <th className="border-b p-2">Name</th>
                <th className="border-b p-2">Role</th>
                <th className="border-b p-2">Reset password</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: UserRow) => (
                <tr key={u.id}>
                  <td className="border-b p-2">{u.email}</td>
                  <td className="border-b p-2">{u.person?.displayName ?? "—"}</td>
                  <td className="border-b p-2">{u.role}</td>
                  <td className="border-b p-2">
                    <form action="/api/admin/users/reset-password" method="post" className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={u.id} />
                      <input
                        name="password"
                        type="password"
                        minLength={8}
                        required
                        placeholder="New password"
                        className="w-48 rounded border px-3 py-2"
                      />
                      <button type="submit" className="rounded border px-3 py-2">
                        Reset
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
