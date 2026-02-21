import { requireUser } from "@/lib/auth";
import Link from "next/link";
import { layoutRepo } from "@/lib/repos/layoutRepo";
import { ReservationMap } from "@/components/reservation/ReservationMap";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireUser();
  const layout = await layoutRepo.getCurrent();

  const baseSrc = layout?.baseImagePath ?? "/so-office-layout/so-office-layout.png";
  const referenceSrc = layout?.referenceImagePath ?? "/so-office-layout/so-office-layout-desks.png";

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Desk Reservation (MVP)</h1>
        <p className="text-sm text-slate-600">
          Select a time range, click a desk, and confirm.
        </p>

        <p className="text-xs text-slate-600">Signed in as {user.email}</p>

        {user.role === "ADMIN" ? (
          <div className="mt-2 flex gap-2">
            <Link href="/admin/users" className="w-fit rounded border px-3 py-2 text-sm">
              Admin: Users
            </Link>

            <Link href="/admin/personnel" className="w-fit rounded border px-3 py-2 text-sm">
              Admin: Personnel
            </Link>

            <Link href="/admin/layout" className="w-fit rounded border px-3 py-2 text-sm">
              Admin: Layout
            </Link>

            <Link href="/admin/desks" className="w-fit rounded border px-3 py-2 text-sm">
              Admin: Desks
            </Link>
          </div>
        ) : null}

        <form action="/api/auth/logout" method="post">
          <button type="submit" className="mt-2 w-fit rounded border px-3 py-2 text-sm">
            Sign out
          </button>
        </form>
      </header>

      {layout ? (
        <ReservationMap
          layoutId={layout.id}
          baseSrc={baseSrc}
          referenceSrc={referenceSrc}
          currentUser={{ id: user.id, role: user.role, personId: user.personId ?? null }}
        />
      ) : (
        <p className="text-sm text-slate-600">
          No layout configured yet. Admins can upload one in <Link className="underline" href="/admin/layout">Admin: Layout</Link>.
        </p>
      )}
    </main>
  );
}
