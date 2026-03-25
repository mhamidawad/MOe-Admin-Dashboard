import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { productsTable, categoriesTable, notificationsTable } from "@workspace/db/schema";
import { eq, ilike, or, and, lte, count, desc, sql } from "drizzle-orm";
import { authenticate } from "../lib/auth.js";

const router: IRouter = Router();

function mapProduct(p: any, catName?: string | null) {
  return {
    ...p,
    price: parseFloat(p.price),
    costPrice: parseFloat(p.costPrice),
    categoryName: catName ?? null,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
  };
}

router.get("/", authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query["page"] as string) || 1;
    const limit = parseInt(req.query["limit"] as string) || 10;
    const search = req.query["search"] as string;
    const categoryId = req.query["categoryId"] ? parseInt(req.query["categoryId"] as string) : undefined;
    const lowStock = req.query["lowStock"] === "true";
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) conditions.push(or(ilike(productsTable.name, `%${search}%`), ilike(productsTable.barcode, `%${search}%`)));
    if (categoryId) conditions.push(eq(productsTable.categoryId, categoryId));
    if (lowStock) conditions.push(lte(productsTable.stock, productsTable.minStock));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [products, countResult] = await Promise.all([
      db.select({
        id: productsTable.id,
        name: productsTable.name,
        description: productsTable.description,
        barcode: productsTable.barcode,
        price: productsTable.price,
        costPrice: productsTable.costPrice,
        stock: productsTable.stock,
        minStock: productsTable.minStock,
        imageUrl: productsTable.imageUrl,
        categoryId: productsTable.categoryId,
        isActive: productsTable.isActive,
        createdAt: productsTable.createdAt,
        updatedAt: productsTable.updatedAt,
        categoryName: categoriesTable.name,
      }).from(productsTable)
        .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(productsTable.createdAt)),
      db.select({ count: count() }).from(productsTable).where(whereClause),
    ]);

    const total = countResult[0]?.count ?? 0;
    res.json({
      data: products.map(p => mapProduct(p, p.categoryName)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching products");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

router.post("/", authenticate, async (req, res) => {
  try {
    const { name, description, barcode, price, costPrice, stock, minStock, imageUrl, categoryId, isActive } = req.body;
    if (!name || price == null || costPrice == null || stock == null) {
      res.status(400).json({ message: "الاسم والسعر وسعر التكلفة والمخزون مطلوبة" });
      return;
    }

    const [product] = await db.insert(productsTable).values({
      name, description, barcode, price: price.toString(), costPrice: costPrice.toString(),
      stock, minStock: minStock ?? 5, imageUrl, categoryId, isActive: isActive ?? true,
    }).returning();

    if (!product) { res.status(500).json({ message: "خطأ في إنشاء المنتج" }); return; }

    if (product.stock <= product.minStock) {
      await db.insert(notificationsTable).values({
        type: "low_stock",
        title: "تحذير: مخزون منخفض",
        message: `المنتج "${product.name}" لديه مخزون منخفض (${product.stock} وحدة متبقية)`,
        data: { productId: product.id, stock: product.stock },
      }).catch(() => {});
    }

    const [cat] = categoryId ? await db.select({ name: categoriesTable.name }).from(categoriesTable).where(eq(categoriesTable.id, categoryId)).limit(1) : [null];
    res.status(201).json(mapProduct(product, cat?.name));
  } catch (err) {
    req.log.error({ err }, "Error creating product");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

router.get("/:id", authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    const [product] = await db.select({
      id: productsTable.id,
      name: productsTable.name,
      description: productsTable.description,
      barcode: productsTable.barcode,
      price: productsTable.price,
      costPrice: productsTable.costPrice,
      stock: productsTable.stock,
      minStock: productsTable.minStock,
      imageUrl: productsTable.imageUrl,
      categoryId: productsTable.categoryId,
      isActive: productsTable.isActive,
      createdAt: productsTable.createdAt,
      updatedAt: productsTable.updatedAt,
      categoryName: categoriesTable.name,
    }).from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(eq(productsTable.id, id)).limit(1);

    if (!product) { res.status(404).json({ message: "المنتج غير موجود" }); return; }
    res.json(mapProduct(product, product.categoryName));
  } catch (err) {
    req.log.error({ err }, "Error fetching product");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

router.put("/:id", authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    const { name, description, barcode, price, costPrice, stock, minStock, imageUrl, categoryId, isActive } = req.body;
    const updateData: any = { updatedAt: new Date() };
    if (name != null) updateData.name = name;
    if (description != null) updateData.description = description;
    if (barcode != null) updateData.barcode = barcode;
    if (price != null) updateData.price = price.toString();
    if (costPrice != null) updateData.costPrice = costPrice.toString();
    if (stock != null) updateData.stock = stock;
    if (minStock != null) updateData.minStock = minStock;
    if (imageUrl != null) updateData.imageUrl = imageUrl;
    if (categoryId != null) updateData.categoryId = categoryId;
    if (isActive != null) updateData.isActive = isActive;

    const [product] = await db.update(productsTable).set(updateData).where(eq(productsTable.id, id)).returning();
    if (!product) { res.status(404).json({ message: "المنتج غير موجود" }); return; }

    if (product.stock <= product.minStock) {
      await db.insert(notificationsTable).values({
        type: "low_stock",
        title: "تحذير: مخزون منخفض",
        message: `المنتج "${product.name}" لديه مخزون منخفض (${product.stock} وحدة متبقية)`,
        data: { productId: product.id, stock: product.stock },
      }).catch(() => {});
    }

    const [cat] = product.categoryId ? await db.select({ name: categoriesTable.name }).from(categoriesTable).where(eq(categoriesTable.id, product.categoryId)).limit(1) : [null];
    res.json(mapProduct(product, cat?.name));
  } catch (err) {
    req.log.error({ err }, "Error updating product");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.json({ success: true, message: "تم حذف المنتج بنجاح" });
  } catch (err) {
    req.log.error({ err }, "Error deleting product");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

export default router;
