import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidTimeRange, isWithinMaxDuration, MAX_RESERVATION_MINUTES, parseIsoDate } from "@/lib/reservationRules";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as
    | {
        deskId?: string;
        personId?: string;
        startAt?: string;
        endAt?: string;
      }
    | null;

  const deskId = body?.deskId;
  const requestedPersonId = body?.personId;
  const startAt = parseIsoDate(body?.startAt);
  const endAt = parseIsoDate(body?.endAt);

  if (!deskId || !requestedPersonId || !startAt || !endAt || !isValidTimeRange({ startAt, endAt })) {
    return NextResponse.json({ error: "deskId, personId, startAt, endAt are required" }, { status: 400 });
  }

  if (!isWithinMaxDuration({ startAt, endAt }, MAX_RESERVATION_MINUTES)) {
    return NextResponse.json({ error: `max reservation length is ${MAX_RESERVATION_MINUTES} minutes` }, { status: 400 });
  }

  const desk = await prisma.desk.findUnique({ where: { id: deskId } });
  if (!desk || !desk.enabled) {
    return NextResponse.json({ error: "desk not available" }, { status: 400 });
  }

  // User rules
  if (user.role === "USER") {
    if (!user.personId) {
      return NextResponse.json({ error: "user is not linked to a person" }, { status: 400 });
    }

    if (requestedPersonId !== user.personId) {
      return NextResponse.json({ error: "users can only reserve for themselves" }, { status: 403 });
    }

    const now = new Date();
    const activeCount = await prisma.reservation.count({
      where: {
        createdByUserId: user.id,
        endAt: { gt: now },
      },
    });

    if (activeCount > 0) {
      return NextResponse.json({ error: "user already has an active reservation" }, { status: 409 });
    }
  }

  // Conflict detection
  const conflict = await prisma.reservation.findFirst({
    where: {
      deskId,
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
  });

  if (conflict) {
    return NextResponse.json({ error: "desk already reserved" }, { status: 409 });
  }

  const reservation = await prisma.reservation.create({
    data: {
      deskId,
      personId: requestedPersonId,
      startAt,
      endAt,
      createdByUserId: user.id,
    },
    include: { person: true, desk: true },
  });

  return NextResponse.json({ reservation });
}
