import Link from "next/link";

import { requireAdmin } from "@/lib/auth";
import { personnelRepo } from "@/lib/repos/personnelRepo";

export const dynamic = "force-dynamic";

type PersonRow = Awaited<ReturnType<typeof personnelRepo.listAll>>[number];

function getMessage(params: { success?: string; error?: string }) {
  if (params.success === "created") return "Person created.";
  if (params.success === "updated") return "Person updated.";
  if (params.success === "deactivated") return "Person deactivated.";
  if (params.error === "invalid") return "Please fill out all fields correctly.";
  return null;
}

export default async function AdminPersonnelPage({
  searchParams,
}: {
  searchParams?: { success?: string; error?: string } | Promise<{ success?: string; error?: string }>;
}) {
  await requireAdmin();

  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  const message = getMessage(resolvedSearchParams);

  const people = await personnelRepo.listAll();

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Admin: Personnel</h1>
          <p className="text-sm text-slate-600">Manage the personnel dropdown for reservations.</p>
        </div>

        <div className="flex gap-2">
          <Link href="/" className="rounded border px-3 py-2 text-sm">
            Back
          </Link>
        </div>
      </header>

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}

      <section className="rounded border p-4">
        <h2 className="text-lg font-semibold">Add person</h2>
        <form action="/api/admin/personnel/create" method="post" className="mt-3 grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm">Display name</span>
            <input name="displayName" required className="rounded border px-3 py-2" />
          </label>

          <button type="submit" className="w-fit rounded border px-3 py-2 text-sm">
            Create
          </button>
        </form>
      </section>

      <section className="rounded border p-4">
        <h2 className="text-lg font-semibold">People</h2>
        <div className="mt-3 overflow-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="text-left">
                <th className="border-b p-2">Name</th>
                <th className="border-b p-2">Active</th>
                <th className="border-b p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {people.map((p: PersonRow) => (
                <tr key={p.id}>
                  <td className="border-b p-2">
                    <form action="/api/admin/personnel/update" method="post" className="flex items-center gap-2">
                      <input type="hidden" name="personId" value={p.id} />
                      <input
                        name="displayName"
                        defaultValue={p.displayName}
                        className="w-64 rounded border px-3 py-2"
                        disabled={!p.active}
                      />
                      <button type="submit" className="rounded border px-3 py-2" disabled={!p.active}>
                        Save
                      </button>
                    </form>
                  </td>
                  <td className="border-b p-2">{p.active ? "Yes" : "No"}</td>
                  <td className="border-b p-2">
                    {p.active ? (
                      <form action="/api/admin/personnel/deactivate" method="post">
                        <input type="hidden" name="personId" value={p.id} />
                        <button type="submit" className="rounded border px-3 py-2">
                          Deactivate
                        </button>
                      </form>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-slate-600">
          Deactivated people will not be returned by the active personnel API.
        </p>
      </section>
    </main>
  );
}
