import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getSessionDataFromCookies } from "@/lib/session";

export async function getCurrentUser() {
  const session = await getSessionDataFromCookies();
  if (!session.userId) return null;

  return prisma.user.findUnique({
    where: { id: session.userId },
    include: { person: true },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}
