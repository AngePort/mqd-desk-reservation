import Link from "next/link";

import { DeskOverlayEditor } from "@/components/DeskOverlayEditor";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { layoutRepo } from "@/lib/repos/layoutRepo";

export const dynamic = "force-dynamic";

type DeskRow = Awaited<ReturnType<typeof prisma.desk.findMany>>[number];

export default async function AdminDesksPage() {
  await requireAdmin();

  const layout = await layoutRepo.getCurrent();
  if (!layout) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-4 p-6">
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">Admin: Desks</h1>
            <p className="text-sm text-slate-600">Upload a layout first.</p>
          </div>

          <Link href="/" className="rounded border px-3 py-2 text-sm">
            Back
          </Link>
        </header>

        <p className="text-sm text-slate-600">
          No layout is configured yet. Go to <Link className="underline" href="/admin/layout">Admin: Layout</Link>.
        </p>
      </main>
    );
  }

  const desks = await prisma.desk.findMany({
    where: { layoutId: layout.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Admin: Desks</h1>
          <p className="text-sm text-slate-600">Define which rectangles on the map are reservable desks.</p>
        </div>

        <Link href="/" className="rounded border px-3 py-2 text-sm">
          Back
        </Link>
      </header>

      <DeskOverlayEditor
        layoutId={layout.id}
        baseSrc={layout.baseImagePath}
        referenceSrc={layout.referenceImagePath}
        initialDesks={desks.map((d: DeskRow) => ({
          id: d.id,
          label: d.label,
          enabled: d.enabled,
          x: d.x,
          y: d.y,
          width: d.width,
          height: d.height,
        }))}
      />
    </main>
  );
}
