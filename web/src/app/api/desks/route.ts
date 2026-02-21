import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireUser();

  const url = new URL(request.url);
  const layoutId = url.searchParams.get("layoutId");
  if (!layoutId) {
    return NextResponse.json({ error: "layoutId is required" }, { status: 400 });
  }

  const desks = await prisma.desk.findMany({
    where: { layoutId, enabled: true },
    orderBy: { label: "asc" },
  });

  return NextResponse.json({
    items: desks.map((d) => ({
      id: d.id,
      label: d.label,
      enabled: d.enabled,
      x: d.x,
      y: d.y,
      width: d.width,
      height: d.height,
    })),
  });
}
