import { prisma } from "@/lib/prisma";

export const personnelRepo = {
  listAll() {
    return prisma.person.findMany({
      orderBy: [{ active: "desc" }, { displayName: "asc" }],
    });
  },

  listActive() {
    return prisma.person.findMany({
      where: { active: true },
      orderBy: { displayName: "asc" },
    });
  },

  create(displayName: string) {
    return prisma.person.create({
      data: { displayName: displayName.trim(), active: true },
    });
  },

  update(id: string, data: { displayName?: string; active?: boolean }) {
    return prisma.person.update({
      where: { id },
      data: {
        ...(data.displayName !== undefined ? { displayName: data.displayName.trim() } : null),
        ...(data.active !== undefined ? { active: data.active } : null),
      },
    });
  },

  deactivate(id: string) {
    return prisma.person.update({
      where: { id },
      data: { active: false },
    });
  },
};
