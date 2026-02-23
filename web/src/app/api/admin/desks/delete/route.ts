import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { deskRepo } from "@/lib/repos/deskRepo";

export async function POST(request: Request) {
  await requireAdmin();

  const body = (await request.json().catch(() => null)) as { deskId?: string } | null;
  if (!body?.deskId) {
    return NextResponse.json({ error: "deskId is required" }, { status: 400 });
  }

  await deskRepo.delete(body.deskId);
  return NextResponse.json({ ok: true });
}
