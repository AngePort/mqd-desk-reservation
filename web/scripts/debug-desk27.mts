import prismaModule from "../src/lib/prisma";

const prisma = (prismaModule as any).prisma;
if (!prisma) {
  throw new Error("Failed to load prisma client from ../src/lib/prisma");
}

const now = new Date();
console.log("now", now.toISOString());

const desk = await prisma.desk.findFirst({
  where: { label: "Desk 27" },
  include: {
    reservations: {
      include: { person: true },
      orderBy: { startAt: "asc" },
    },
  },
});

console.log("desk", desk?.id, "enabled=", desk?.enabled);

if (desk) {
  for (const r of desk.reservations) {
    console.log(
      "reservation",
      r.id,
      "person=",
      r.person.displayName,
      "start=",
      r.startAt.toISOString(),
      "end=",
      r.endAt.toISOString(),
      "ended?",
      r.endAt.getTime() <= now.getTime(),
    );
  }
}

await prisma.$disconnect();
