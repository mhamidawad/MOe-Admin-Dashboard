import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { customersTable, salesTable } from "@workspace/db/schema";
import { eq, ilike, or, count, desc, sum } from "drizzle-orm";
import { authenticate } from "../lib/auth.js";

const router: IRouter = Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query["page"] as string) || 1;
    const limit = parseInt(req.query["limit"] as string) || 10;
    const search = req.query["search"] as string;
    const offset = (page - 1) * limit;

    const whereClause = search ? or(
      ilike(customersTable.name, `%${search}%`),
      ilike(customersTable.phone, `%${search}%`),
      ilike(customersTable.email, `%${search}%`)
    ) : undefined;

    const [customers, countResult] = await Promise.all([
      db.select().from(customersTable).where(whereClause).limit(limit).offset(offset).orderBy(desc(customersTable.createdAt)),
      db.select({ count: count() }).from(customersTable).where(whereClause),
    ]);

    const total = countResult[0]?.count ?? 0;

    const purchaseStats = await db.select({
      customerId: salesTable.customerId,
      totalPurchases: count(),
      totalSpent: sum(salesTable.total),
    }).from(salesTable)
      .where(eq(salesTable.status, "completed"))
      .groupBy(salesTable.customerId);

    const statsMap = new Map(purchaseStats.map(s => [s.customerId, s]));

    res.json({
      data: customers.map(c => {
        const stats = statsMap.get(c.id);
        return {
          ...c,
          totalPurchases: Number(stats?.totalPurchases ?? 0),
          totalSpent: parseFloat(String(stats?.totalSpent ?? "0")),
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        };
      }),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching customers");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

router.post("/", authenticate, async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    if (!name) { res.status(400).json({ message: "اسم العميل مطلوب" }); return; }

    const [customer] = await db.insert(customersTable).values({ name, phone, email, address }).returning();
    if (!customer) { res.status(500).json({ message: "خطأ في إنشاء العميل" }); return; }
    res.status(201).json({ ...customer, totalPurchases: 0, totalSpent: 0, createdAt: customer.createdAt.toISOString(), updatedAt: customer.updatedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error creating customer");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

router.get("/:id", authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, id)).limit(1);
    if (!customer) { res.status(404).json({ message: "العميل غير موجود" }); return; }

    const [stats] = await db.select({ totalPurchases: count(), totalSpent: sum(salesTable.total) })
      .from(salesTable).where(eq(salesTable.customerId, id));

    res.json({
      ...customer,
      totalPurchases: Number(stats?.totalPurchases ?? 0),
      totalSpent: parseFloat(String(stats?.totalSpent ?? "0")),
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching customer");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

router.put("/:id", authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    const { name, phone, email, address } = req.body;
    if (!name) { res.status(400).json({ message: "اسم العميل مطلوب" }); return; }

    const [customer] = await db.update(customersTable).set({ name, phone, email, address, updatedAt: new Date() })
      .where(eq(customersTable.id, id)).returning();
    if (!customer) { res.status(404).json({ message: "العميل غير موجود" }); return; }
    res.json({ ...customer, totalPurchases: 0, totalSpent: 0, createdAt: customer.createdAt.toISOString(), updatedAt: customer.updatedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error updating customer");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    await db.delete(customersTable).where(eq(customersTable.id, id));
    res.json({ success: true, message: "تم حذف العميل بنجاح" });
  } catch (err) {
    req.log.error({ err }, "Error deleting customer");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

export default router;
