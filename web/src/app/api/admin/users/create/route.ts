import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { userRepo } from "@/lib/repos/userRepo";

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return redirectTo(request, "/login");
  if (user.role !== "ADMIN") return redirectTo(request, "/");

  const formData = await request.formData();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const role = String(formData.get("role") ?? "USER");
  const password = String(formData.get("password") ?? "");

  if (!email || !email.includes("@") || !displayName || password.length < 8) {
    return redirectTo(request, "/admin/users?error=invalid");
  }

  if (role !== "ADMIN" && role !== "USER") {
    return redirectTo(request, "/admin/users?error=invalid");
  }

  const existing = await userRepo.findByEmail(email);
  if (existing) {
    return redirectTo(request, "/admin/users?error=exists");
  }

  const passwordHash = await hashPassword(password);
  await userRepo.createWithPerson({
    email,
    displayName,
    passwordHash,
    role,
  });

  return redirectTo(request, "/admin/users?success=created");
}
