import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { getRequestOrigin } from "@/lib/requestOrigin";
import { personnelRepo } from "@/lib/repos/personnelRepo";

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, getRequestOrigin(request)));
}

export async function POST(request: NextRequest) {
  await requireAdmin();

  const formData = await request.formData();
  const personId = String(formData.get("personId") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (!personId || !displayName) {
    return redirectTo(request, "/admin/personnel?error=invalid");
  }

  await personnelRepo.update(personId, { displayName });
  return redirectTo(request, "/admin/personnel?success=updated");
}
