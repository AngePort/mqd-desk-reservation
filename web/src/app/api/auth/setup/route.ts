import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { getRequestOrigin } from "@/lib/requestOrigin";
import { setSessionCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    return NextResponse.redirect(new URL("/login", getRequestOrigin(request)));
  }

  const formData = await request.formData();

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !displayName || password.length < 8) {
    return NextResponse.redirect(
      new URL("/setup?error=invalid", getRequestOrigin(request)),
    );
  }

  const passwordHash = await hashPassword(password);

  try {
    const person = await prisma.person.create({
      data: { displayName, active: true },
    });

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "ADMIN",
        personId: person.id,
      },
    });

    const response = NextResponse.redirect(new URL("/", getRequestOrigin(request)));
    await setSessionCookie(response, { userId: user.id });
    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/setup?error=invalid", getRequestOrigin(request)),
    );
  }
}
