import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { personnelRepo } from "@/lib/repos/personnelRepo";

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function POST(request: NextRequest) {
  await requireAdmin();

  const formData = await request.formData();
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (!displayName) {
    return redirectTo(request, "/admin/personnel?error=invalid");
  }

  await personnelRepo.create(displayName);
  return redirectTo(request, "/admin/personnel?success=created");
}
