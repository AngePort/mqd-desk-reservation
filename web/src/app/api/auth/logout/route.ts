import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getRequestOrigin } from "@/lib/requestOrigin";
import { clearSessionCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", getRequestOrigin(request)));
  clearSessionCookie(response);
  return response;
}
