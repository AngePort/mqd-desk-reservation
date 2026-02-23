import { sealData, unsealData } from "iron-session";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import { getEnv } from "@/lib/env";

export type SessionData = {
  userId?: string;
};

const SESSION_TTL_SECONDS = 14 * 24 * 60 * 60;

export const sessionOptions = {
  cookieName: "deskres_session",
  ttl: SESSION_TTL_SECONDS,
} as const;

function getSessionPassword() {
  return getEnv().SESSION_PASSWORD;
}

export async function sealSessionData(data: SessionData, password: string, ttlSeconds: number) {
  return sealData(data, {
    password,
    ttl: ttlSeconds,
  });
}

export async function unsealSessionData(seal: string, password: string, ttlSeconds: number): Promise<SessionData | null> {
  try {
    return await unsealData<SessionData>(seal, {
      password,
      ttl: ttlSeconds,
    });
  } catch {
    return null;
  }
}

function getCookieOptions() {
  const ttl = sessionOptions.ttl;
  const maxAge = (ttl === 0 ? 2147483647 : ttl) - 60;

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function getSessionDataFromCookies(): Promise<SessionData> {
  const cookieStore = await cookies();
  const seal = cookieStore.get(sessionOptions.cookieName)?.value;
  if (!seal) return {};

  const session = await unsealSessionData(seal, getSessionPassword(), sessionOptions.ttl);
  return session ?? {};
}

export async function setSessionCookie(response: NextResponse, data: SessionData) {
  const seal = await sealSessionData(data, getSessionPassword(), sessionOptions.ttl);

  response.cookies.set(sessionOptions.cookieName, seal, getCookieOptions());
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(sessionOptions.cookieName, "", {
    ...getCookieOptions(),
    maxAge: 0,
  });
}
