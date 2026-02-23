import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { getRequestOrigin } from "@/lib/requestOrigin";
import { userRepo } from "@/lib/repos/userRepo";

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, getRequestOrigin(request)));
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return redirectTo(request, "/login");
  if (user.role !== "ADMIN") return redirectTo(request, "/");

  const formData = await request.formData();
  const userId = String(formData.get("userId") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!userId || password.length < 8) {
    return redirectTo(request, "/admin/users?error=invalid");
  }

  const passwordHash = await hashPassword(password);
  await userRepo.setPasswordHash(userId, passwordHash);

  return redirectTo(request, "/admin/users?success=reset");
}
