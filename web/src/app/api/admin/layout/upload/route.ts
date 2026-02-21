import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { layoutRepo } from "@/lib/repos/layoutRepo";

function redirectTo(request: NextRequest, to: string) {
  return NextResponse.redirect(new URL(to, request.url));
}

function getSafeExt(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".png" || ext === ".jpg" || ext === ".jpeg" || ext === ".webp") return ext;
  return ".png";
}

async function persistUpload(file: File, uploadsDirAbs: string) {
  const ext = getSafeExt(file.name);
  const filename = `${randomUUID()}${ext}`;
  const absPath = path.join(uploadsDirAbs, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absPath, buffer);

  return `/uploads/layouts/${filename}`;
}

export async function POST(request: NextRequest) {
  await requireAdmin();

  const formData = await request.formData();
  const base = formData.get("baseImage");
  const reference = formData.get("referenceImage");

  if (!(base instanceof File) || base.size === 0) {
    return redirectTo(request, "/admin/layout?error=invalid");
  }

  const uploadsDirAbs = path.join(process.cwd(), "public", "uploads", "layouts");
  await mkdir(uploadsDirAbs, { recursive: true });

  const baseImagePath = await persistUpload(base, uploadsDirAbs);

  let referenceImagePath: string | null = null;
  if (reference instanceof File && reference.size > 0) {
    referenceImagePath = await persistUpload(reference, uploadsDirAbs);
  }

  await layoutRepo.create({ baseImagePath, referenceImagePath });

  return redirectTo(request, "/admin/layout?success=uploaded");
}
