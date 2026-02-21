import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidTimeRange, parseIsoDate } from "@/lib/reservationRules";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireUser();

  type DeskRow = Awaited<ReturnType<typeof prisma.desk.findMany>>[number];

  const url = new URL(request.url);
  const layoutId = url.searchParams.get("layoutId");
  const startAt = parseIsoDate(url.searchParams.get("startAt"));
  const endAt = parseIsoDate(url.searchParams.get("endAt"));

  if (!layoutId || !startAt || !endAt || !isValidTimeRange({ startAt, endAt })) {
    return NextResponse.json({ error: "layoutId, startAt, endAt are required" }, { status: 400 });
  }

  const desks = await prisma.desk.findMany({
    where: { layoutId, enabled: true },
    orderBy: { label: "asc" },
  });

  const reservations = await prisma.reservation.findMany({
    where: {
      desk: { layoutId },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
    include: { person: true, desk: true },
    orderBy: { startAt: "asc" },
  });

  const reservedByDeskId: Record<
    string,
    { reservationId: string; personName: string; startAt: string; endAt: string }
  > = {};
  for (const r of reservations) {
    if (!reservedByDeskId[r.deskId]) {
      reservedByDeskId[r.deskId] = {
        reservationId: r.id,
        personName: r.person.displayName,
        startAt: r.startAt.toISOString(),
        endAt: r.endAt.toISOString(),
      };
    }
  }

  return NextResponse.json({
    desks: desks.map((d: DeskRow) => ({
      id: d.id,
      label: d.label,
      x: d.x,
      y: d.y,
      width: d.width,
      height: d.height,
      reserved: Boolean(reservedByDeskId[d.id]),
      reservation: reservedByDeskId[d.id] ?? null,
    })),
  });
}
