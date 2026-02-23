import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { layoutRepo } from "@/lib/repos/layoutRepo";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireUser();

  const layout = await layoutRepo.getCurrent();
  if (!layout) {
    return NextResponse.json({ layout: null });
  }

  return NextResponse.json({
    layout: {
      id: layout.id,
      baseImagePath: layout.baseImagePath,
      referenceImagePath: layout.referenceImagePath,
    },
  });
}
