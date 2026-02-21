import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
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
        layoutId?: string;
        label?: string;
        x?: number;
        y?: number;
        width?: number;
        height?: number;
      }
    | null;

  if (!body?.layoutId || !body.label) {
    return NextResponse.json({ error: "layoutId and label are required" }, { status: 400 });
  }

  const x = parseNumber(body.x);
  const y = parseNumber(body.y);
  const width = parseNumber(body.width);
  const height = parseNumber(body.height);

  if (x === null || y === null || width === null || height === null) {
    return NextResponse.json({ error: "x, y, width, height must be numbers" }, { status: 400 });
  }

  if (!isNormalized(x) || !isNormalized(y) || !isNormalized(width) || !isNormalized(height)) {
    return NextResponse.json({ error: "geometry must be normalized (0..1)" }, { status: 400 });
  }

  if (width <= 0 || height <= 0) {
    return NextResponse.json({ error: "width/height must be > 0" }, { status: 400 });
  }

  const desk = await deskRepo.create(body.layoutId, {
    label: body.label,
    rect: { x, y, width, height },
  });

  return NextResponse.json({ desk });
}
