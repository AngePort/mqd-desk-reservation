import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as { reservationId?: string } | null;
  if (!body?.reservationId) {
    return NextResponse.json({ error: "reservationId is required" }, { status: 400 });
  }

  await prisma.reservation.delete({ where: { id: body.reservationId } });
  return NextResponse.json({ ok: true });
}
