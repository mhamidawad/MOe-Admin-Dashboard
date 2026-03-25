import app from "./app";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { usersTable, categoriesTable } from "@workspace/db/schema";
import { count } from "drizzle-orm";
import bcrypt from "bcryptjs";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function seedDefaultData() {
  try {
    const [userCount] = await db.select({ count: count() }).from(usersTable);
    if (Number(userCount?.count ?? 0) === 0) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await db.insert(usersTable).values({
        name: "مدير النظام",
        email: "admin@pos.com",
        password: hashedPassword,
        role: "admin",
        isActive: true,
      });

      const cashierPassword = await bcrypt.hash("cashier123", 10);
      await db.insert(usersTable).values({
        name: "موظف المبيعات",
        email: "cashier@pos.com",
        password: cashierPassword,
        role: "user",
        isActive: true,
      });

      logger.info("Default admin and cashier accounts created");
    }

    const [catCount] = await db.select({ count: count() }).from(categoriesTable);
    if (Number(catCount?.count ?? 0) === 0) {
      await db.insert(categoriesTable).values([
        { name: "إلكترونيات", description: "أجهزة إلكترونية وملحقاتها" },
        { name: "ملابس", description: "ملابس رجالية ونسائية" },
        { name: "مواد غذائية", description: "منتجات غذائية ومشروبات" },
        { name: "أدوات منزلية", description: "مستلزمات وأدوات المنزل" },
      ]);
      logger.info("Default categories created");
    }
  } catch (err) {
    logger.error({ err }, "Error seeding default data");
  }
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  await seedDefaultData();
});
