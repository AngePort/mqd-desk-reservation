import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidTimeRange, parseIsoDate } from "@/lib/reservationRules";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  await requireUser();

  const url = new URL(request.url);
  const deskId = url.searchParams.get("deskId");
  const startAt = parseIsoDate(url.searchParams.get("startAt"));
  const endAt = parseIsoDate(url.searchParams.get("endAt"));

  if (!deskId || !startAt || !endAt || !isValidTimeRange({ startAt, endAt })) {
    return NextResponse.json({ error: "deskId, startAt, endAt are required" }, { status: 400 });
  }

  // Keep behavior consistent with /api/availability: expired reservations are deleted.
  const now = new Date();
  await prisma.reservation.deleteMany({
    where: {
      endAt: { lte: now },
    },
  });

  const items = await prisma.reservation.findMany({
    where: {
      deskId,
      // overlap: existing.start < new.end && existing.end > new.start
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
    include: { person: true },
    orderBy: { startAt: "asc" },
  });

  return NextResponse.json(
    {
      items: items.map((r) => ({
        id: r.id,
        personName: r.person.displayName,
        startAt: r.startAt.toISOString(),
        endAt: r.endAt.toISOString(),
      })),
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
