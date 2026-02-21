import { prisma } from "@/lib/prisma";

export const layoutRepo = {
  getCurrent() {
    return prisma.layout.findFirst({
      orderBy: { createdAt: "desc" },
    });
  },

  create(data: { baseImagePath: string; referenceImagePath?: string | null }) {
    return prisma.layout.create({
      data: {
        baseImagePath: data.baseImagePath,
        referenceImagePath: data.referenceImagePath ?? null,
      },
    });
  },
};
