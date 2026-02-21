import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { clearSessionCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  clearSessionCookie(response);
  return response;
}
