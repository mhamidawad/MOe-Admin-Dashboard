import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { categoriesTable, productsTable } from "@workspace/db/schema";
import { eq, ilike, count, desc } from "drizzle-orm";
import { authenticate } from "../lib/auth.js";

const router: IRouter = Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const search = req.query["search"] as string;

    const categories = await db.select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      description: categoriesTable.description,
      createdAt: categoriesTable.createdAt,
      updatedAt: categoriesTable.updatedAt,
    }).from(categoriesTable)
      .where(search ? ilike(categoriesTable.name, `%${search}%`) : undefined)
      .orderBy(desc(categoriesTable.createdAt));

    const categoryIds = categories.map(c => c.id);
    const productCounts = categoryIds.length > 0 ? await db.select({
      categoryId: productsTable.categoryId,
      count: count(),
    }).from(productsTable).groupBy(productsTable.categoryId) : [];

    const countMap = new Map(productCounts.map(p => [p.categoryId, Number(p.count)]));

    res.json({
      data: categories.map(c => ({
        ...c,
        productCount: countMap.get(c.id) ?? 0,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
      total: categories.length,
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching categories");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

router.post("/", authenticate, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) { res.status(400).json({ message: "اسم الفئة مطلوب" }); return; }

    const [cat] = await db.insert(categoriesTable).values({ name, description }).returning();
    if (!cat) { res.status(500).json({ message: "خطأ في إنشاء الفئة" }); return; }
    res.status(201).json({ ...cat, productCount: 0, createdAt: cat.createdAt.toISOString(), updatedAt: cat.updatedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error creating category");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

router.put("/:id", authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    const { name, description } = req.body;
    if (!name) { res.status(400).json({ message: "اسم الفئة مطلوب" }); return; }

    const [cat] = await db.update(categoriesTable).set({ name, description, updatedAt: new Date() }).where(eq(categoriesTable.id, id)).returning();
    if (!cat) { res.status(404).json({ message: "الفئة غير موجودة" }); return; }
    res.json({ ...cat, productCount: 0, createdAt: cat.createdAt.toISOString(), updatedAt: cat.updatedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error updating category");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
    res.json({ success: true, message: "تم حذف الفئة بنجاح" });
  } catch (err) {
    req.log.error({ err }, "Error deleting category");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

export default router;
