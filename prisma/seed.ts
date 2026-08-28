import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 12);

  const [alice, bob, carla] = await Promise.all(
    [
      { name: "Alice Chen", email: "alice@example.com" },
      { name: "Bob Martinez", email: "bob@example.com" },
      { name: "Carla Singh", email: "carla@example.com" },
    ].map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: { ...u, passwordHash: password },
      })
    )
  );

  const group = await prisma.group.upsert({
    where: { id: "demo-goa-trip" },
    update: {},
    create: {
      id: "demo-goa-trip",
      name: "Goa Trip",
      createdBy: alice.id,
      members: {
        create: [{ userId: alice.id }, { userId: bob.id }, { userId: carla.id }],
      },
    },
  });

  // Only seed expenses if this group doesn't already have any
  // (keeps `npm run prisma:seed` idempotent).
  const existingExpenses = await prisma.expense.count({ where: { groupId: group.id } });
  if (existingExpenses === 0) {
    await prisma.expense.create({
      data: {
        groupId: group.id,
        paidById: alice.id,
        description: "Hotel (3 nights)",
        amount: 240,
        splitType: "EQUAL",
        splits: {
          create: [
            { userId: alice.id, shareAmount: 80 },
            { userId: bob.id, shareAmount: 80 },
            { userId: carla.id, shareAmount: 80 },
          ],
        },
      },
    });

    await prisma.expense.create({
      data: {
        groupId: group.id,
        paidById: bob.id,
        description: "Scooter rental",
        amount: 45,
        splitType: "EQUAL",
        splits: {
          create: [
            { userId: alice.id, shareAmount: 15 },
            { userId: bob.id, shareAmount: 15 },
            { userId: carla.id, shareAmount: 15 },
          ],
        },
      },
    });

    await prisma.expense.create({
      data: {
        groupId: group.id,
        paidById: carla.id,
        description: "Dinner at the beach shack",
        amount: 60,
        splitType: "EXACT",
        splits: {
          create: [
            { userId: alice.id, shareAmount: 25 },
            { userId: bob.id, shareAmount: 20 },
            { userId: carla.id, shareAmount: 15 },
          ],
        },
      },
    });
  }

  console.log("Seed complete. Demo login: alice@example.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
