import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deskRepo } from "@/lib/repos/deskRepo";

function parseNumber(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function isNormalized(n: number) {
  return n >= 0 && n <= 1;
}

export async function POST(request: Request) {
  await requireAdmin();

  const body = (await request.json().catch(() => null)) as
    | {
        deskId?: string;
        label?: string;
        enabled?: boolean;
        x?: number;
        y?: number;
        width?: number;
        height?: number;
      }
    | null;

  if (!body?.deskId) {
    return NextResponse.json({ error: "deskId is required" }, { status: 400 });
  }

  const existing = await prisma.desk.findUnique({ where: { id: body.deskId } });
  if (!existing) {
    return NextResponse.json({ error: "desk not found" }, { status: 404 });
  }

  const x = body.x !== undefined ? parseNumber(body.x) : existing.x;
  const y = body.y !== undefined ? parseNumber(body.y) : existing.y;
  const width = body.width !== undefined ? parseNumber(body.width) : existing.width;
  const height = body.height !== undefined ? parseNumber(body.height) : existing.height;

  if (x === null || y === null || width === null || height === null) {
    return NextResponse.json({ error: "x, y, width, height must be numbers" }, { status: 400 });
  }

  if (!isNormalized(x) || !isNormalized(y) || !isNormalized(width) || !isNormalized(height)) {
    return NextResponse.json({ error: "geometry must be normalized (0..1)" }, { status: 400 });
  }

  if (width <= 0 || height <= 0) {
    return NextResponse.json({ error: "width/height must be > 0" }, { status: 400 });
  }

  const desk = await deskRepo.update(body.deskId, {
    ...(body.label !== undefined ? { label: body.label } : null),
    ...(body.enabled !== undefined ? { enabled: body.enabled } : null),
    rect: { x, y, width, height },
  });

  return NextResponse.json({ desk });
}
