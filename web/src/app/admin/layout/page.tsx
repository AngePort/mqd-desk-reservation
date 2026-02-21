import Link from "next/link";

import { OfficeMapPreview } from "@/components/OfficeMapPreview";
import { requireAdmin } from "@/lib/auth";
import { layoutRepo } from "@/lib/repos/layoutRepo";

export const dynamic = "force-dynamic";

function getMessage(params: { success?: string; error?: string }) {
  if (params.success === "uploaded") return "Layout uploaded.";
  if (params.error === "invalid") return "Please choose a base image to upload.";
  return null;
}

export default async function AdminLayoutPage({
  searchParams,
}: {
  searchParams?: { success?: string; error?: string } | Promise<{ success?: string; error?: string }>;
}) {
  await requireAdmin();

  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  const message = getMessage(resolvedSearchParams);

  const layout = await layoutRepo.getCurrent();

  const baseSrc = layout?.baseImagePath ?? "/so-office-layout/so-office-layout.png";
  const referenceSrc = layout?.referenceImagePath ?? "/so-office-layout/so-office-layout-desks.png";

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Admin: Office Layout</h1>
          <p className="text-sm text-slate-600">Upload the base layout and optional desk-highlight reference.</p>
        </div>

        <Link href="/" className="rounded border px-3 py-2 text-sm">
          Back
        </Link>
      </header>

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}

      <section className="rounded border p-4">
        <h2 className="text-lg font-semibold">Upload layout</h2>
        <form action="/api/admin/layout/upload" method="post" encType="multipart/form-data" className="mt-3 grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm">Base layout image (required)</span>
            <input name="baseImage" type="file" accept="image/*" required className="text-sm" />
          </label>

          <label className="grid gap-1">
            <span className="text-sm">Desk highlight overlay (optional)</span>
            <input name="referenceImage" type="file" accept="image/*" className="text-sm" />
          </label>

          <button type="submit" className="w-fit rounded border px-3 py-2 text-sm">
            Upload
          </button>
        </form>
      </section>

      <section className="rounded border p-4">
        <h2 className="text-lg font-semibold">Current layout preview</h2>
        <div className="mt-3">
          <OfficeMapPreview baseSrc={baseSrc} referenceSrc={referenceSrc} />
        </div>
      </section>
    </main>
  );
}
