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
  const personId = String(formData.get("personId") ?? "");

  if (!personId) {
    return redirectTo(request, "/admin/personnel?error=invalid");
  }

  await personnelRepo.deactivate(personId);
  return redirectTo(request, "/admin/personnel?success=deactivated");
}
