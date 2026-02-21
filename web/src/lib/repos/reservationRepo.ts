import { prisma } from "@/lib/prisma";

export const reservationRepo = {
  listForDeskBetween(deskId: string, startAt: Date, endAt: Date) {
    return prisma.reservation.findMany({
      where: {
        deskId,
        // overlap: existing.start < new.end && existing.end > new.start
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      include: { person: true },
      orderBy: { startAt: "asc" },
    });
  },

  create(data: {
    deskId: string;
    personId: string;
    startAt: Date;
    endAt: Date;
    createdByUserId?: string | null;
  }) {
    return prisma.reservation.create({
      data: {
        deskId: data.deskId,
        personId: data.personId,
        startAt: data.startAt,
        endAt: data.endAt,
        createdByUserId: data.createdByUserId ?? null,
      },
    });
  },

  delete(id: string) {
    return prisma.reservation.delete({
      where: { id },
    });
  },
};
