import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { getRequestOrigin } from "@/lib/requestOrigin";
import { setSessionCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return NextResponse.redirect(
      new URL("/login?error=invalid", getRequestOrigin(request)),
    );
  }

  const isValid = await verifyPassword(user.passwordHash, password);
  if (!isValid) {
    return NextResponse.redirect(
      new URL("/login?error=invalid", getRequestOrigin(request)),
    );
  }

  const response = NextResponse.redirect(new URL("/", getRequestOrigin(request)));
  await setSessionCookie(response, { userId: user.id });
  return response;
}
