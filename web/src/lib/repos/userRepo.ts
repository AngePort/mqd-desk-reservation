import type { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const userRepo = {
  listAll() {
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { person: true },
    });
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { person: true },
    });
  },

  async createWithPerson(data: {
    email: string;
    displayName: string;
    passwordHash: string;
    role: Role;
  }) {
    const person = await prisma.person.create({
      data: { displayName: data.displayName.trim(), active: true },
    });

    return prisma.user.create({
      data: {
        email: data.email.trim().toLowerCase(),
        passwordHash: data.passwordHash,
        role: data.role,
        personId: person.id,
      },
      include: { person: true },
    });
  },

  setPasswordHash(userId: string, passwordHash: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  },
};
