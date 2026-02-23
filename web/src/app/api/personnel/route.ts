import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { personnelRepo } from "@/lib/repos/personnelRepo";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireUser();

  const people = await personnelRepo.listActive();
  return NextResponse.json({
    items: people.map((p) => ({ id: p.id, displayName: p.displayName })),
  });
}
