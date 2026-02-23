import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidTimeRange, isWithinMaxDuration, MAX_RESERVATION_MINUTES, parseIsoDate } from "@/lib/reservationRules";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as
    | {
        reservationId?: string;
        deskId?: string;
        personId?: string;
        startAt?: string;
        endAt?: string;
      }
    | null;

  const reservationId = body?.reservationId;
  const deskId = body?.deskId;
  const personId = body?.personId;
  const startAt = parseIsoDate(body?.startAt);
  const endAt = parseIsoDate(body?.endAt);

  if (!reservationId || !deskId || !personId || !startAt || !endAt || !isValidTimeRange({ startAt, endAt })) {
    return NextResponse.json(
      { error: "reservationId, deskId, personId, startAt, endAt are required" },
      { status: 400 },
    );
  }

  if (!isWithinMaxDuration({ startAt, endAt }, MAX_RESERVATION_MINUTES)) {
    return NextResponse.json({ error: `max reservation length is ${MAX_RESERVATION_MINUTES} minutes` }, { status: 400 });
  }

  const desk = await prisma.desk.findUnique({ where: { id: deskId } });
  if (!desk || !desk.enabled) {
    return NextResponse.json({ error: "desk not available" }, { status: 400 });
  }

  // Conflict detection (exclude self)
  const conflict = await prisma.reservation.findFirst({
    where: {
      id: { not: reservationId },
      deskId,
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
  });

  if (conflict) {
    return NextResponse.json({ error: "desk already reserved" }, { status: 409 });
  }

  const updated = await prisma.reservation.update({
    where: { id: reservationId },
    data: { deskId, personId, startAt, endAt },
    include: { person: true, desk: true },
  });

  return NextResponse.json({ reservation: updated });
}
