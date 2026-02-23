import { prisma } from "@/lib/prisma";

export type NormalizedRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const deskRepo = {
  listEnabledByLayout(layoutId: string) {
    return prisma.desk.findMany({
      where: { layoutId, enabled: true },
      orderBy: { label: "asc" },
    });
  },

  create(layoutId: string, data: { label: string; rect: NormalizedRect }) {
    return prisma.desk.create({
      data: {
        layoutId,
        label: data.label.trim(),
        enabled: true,
        x: data.rect.x,
        y: data.rect.y,
        width: data.rect.width,
        height: data.rect.height,
      },
    });
  },

  update(id: string, data: { label?: string; enabled?: boolean; rect?: NormalizedRect }) {
    return prisma.desk.update({
      where: { id },
      data: {
        ...(data.label !== undefined ? { label: data.label.trim() } : null),
        ...(data.enabled !== undefined ? { enabled: data.enabled } : null),
        ...(data.rect
          ? {
              x: data.rect.x,
              y: data.rect.y,
              width: data.rect.width,
              height: data.rect.height,
            }
          : null),
      },
    });
  },

  disable(id: string) {
    return prisma.desk.update({
      where: { id },
      data: { enabled: false },
    });
  },

  enable(id: string) {
    return prisma.desk.update({
      where: { id },
      data: { enabled: true },
    });
  },

  delete(id: string) {
    return prisma.desk.delete({
      where: { id },
    });
  },
};
