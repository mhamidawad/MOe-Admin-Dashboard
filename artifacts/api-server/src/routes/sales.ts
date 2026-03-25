import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { salesTable, saleItemsTable, productsTable, customersTable, usersTable, notificationsTable } from "@workspace/db/schema";
import { eq, and, gte, lte, ilike, count, desc, sql } from "drizzle-orm";
import { authenticate } from "../lib/auth.js";

const router: IRouter = Router();

function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${year}${month}${day}-${rand}`;
}

async function getSaleDetails(saleId: number) {
  const [sale] = await db.select({
    id: salesTable.id,
    invoiceNumber: salesTable.invoiceNumber,
    customerId: salesTable.customerId,
    userId: salesTable.userId,
    subtotal: salesTable.subtotal,
    discount: salesTable.discount,
    tax: salesTable.tax,
    total: salesTable.total,
    paymentMethod: salesTable.paymentMethod,
    notes: salesTable.notes,
    status: salesTable.status,
    createdAt: salesTable.createdAt,
    updatedAt: salesTable.updatedAt,
    customerName: customersTable.name,
    userName: usersTable.name,
  }).from(salesTable)
    .leftJoin(customersTable, eq(salesTable.customerId, customersTable.id))
    .leftJoin(usersTable, eq(salesTable.userId, usersTable.id))
    .where(eq(salesTable.id, saleId)).limit(1);

  if (!sale) return null;

  const items = await db.select().from(saleItemsTable).where(eq(saleItemsTable.saleId, saleId));

  return {
    ...sale,
    subtotal: parseFloat(sale.subtotal),
    discount: parseFloat(sale.discount),
    tax: parseFloat(sale.tax),
    total: parseFloat(sale.total),
    createdAt: sale.createdAt.toISOString(),
    updatedAt: sale.updatedAt.toISOString(),
    items: items.map(i => ({
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity,
      unitPrice: parseFloat(i.unitPrice),
      total: parseFloat(i.total),
    })),
  };
}

router.get("/", authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query["page"] as string) || 1;
    const limit = parseInt(req.query["limit"] as string) || 10;
    const search = req.query["search"] as string;
    const startDate = req.query["startDate"] as string;
    const endDate = req.query["endDate"] as string;
    const customerId = req.query["customerId"] ? parseInt(req.query["customerId"] as string) : undefined;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) conditions.push(ilike(salesTable.invoiceNumber, `%${search}%`));
    if (startDate) conditions.push(gte(salesTable.createdAt, new Date(startDate)));
    if (endDate) conditions.push(lte(salesTable.createdAt, new Date(endDate)));
    if (customerId) conditions.push(eq(salesTable.customerId, customerId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [sales, countResult] = await Promise.all([
      db.select({
        id: salesTable.id,
        invoiceNumber: salesTable.invoiceNumber,
        customerId: salesTable.customerId,
        userId: salesTable.userId,
        subtotal: salesTable.subtotal,
        discount: salesTable.discount,
        tax: salesTable.tax,
        total: salesTable.total,
        paymentMethod: salesTable.paymentMethod,
        notes: salesTable.notes,
        status: salesTable.status,
        createdAt: salesTable.createdAt,
        updatedAt: salesTable.updatedAt,
        customerName: customersTable.name,
        userName: usersTable.name,
      }).from(salesTable)
        .leftJoin(customersTable, eq(salesTable.customerId, customersTable.id))
        .leftJoin(usersTable, eq(salesTable.userId, usersTable.id))
        .where(whereClause).limit(limit).offset(offset).orderBy(desc(salesTable.createdAt)),
      db.select({ count: count() }).from(salesTable).where(whereClause),
    ]);

    const saleIds = sales.map(s => s.id);
    const allItems = saleIds.length > 0
      ? await db.select().from(saleItemsTable).where(sql`${saleItemsTable.saleId} = ANY(ARRAY[${sql.join(saleIds.map(id => sql`${id}`), sql`, `)}]::int[])`)
      : [];

    const itemsBySale = new Map<number, typeof allItems>();
    for (const item of allItems) {
      const existing = itemsBySale.get(item.saleId) ?? [];
      existing.push(item);
      itemsBySale.set(item.saleId, existing);
    }

    const total = countResult[0]?.count ?? 0;
    res.json({
      data: sales.map(s => ({
        ...s,
        subtotal: parseFloat(s.subtotal),
        discount: parseFloat(s.discount),
        tax: parseFloat(s.tax),
        total: parseFloat(s.total),
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        items: (itemsBySale.get(s.id) ?? []).map(i => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: parseFloat(i.unitPrice),
          total: parseFloat(i.total),
        })),
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching sales");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

router.post("/", authenticate, async (req, res) => {
  try {
    const { customerId, items, discount = 0, tax = 0, paymentMethod, notes } = req.body;
    const currentUser = (req as any).user;

    if (!items || items.length === 0) {
      res.status(400).json({ message: "يجب إضافة منتج واحد على الأقل" });
      return;
    }
    if (!paymentMethod) {
      res.status(400).json({ message: "طريقة الدفع مطلوبة" });
      return;
    }

    const productIds = items.map((i: any) => i.productId);
    const products = await db.select().from(productsTable)
      .where(sql`${productsTable.id} = ANY(ARRAY[${sql.join(productIds.map((id: number) => sql`${id}`), sql`, `)}]::int[])`);

    const productMap = new Map(products.map(p => [p.id, p]));

    let subtotal = 0;
    const saleItemsData = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        res.status(400).json({ message: `المنتج ${item.productId} غير موجود` });
        return;
      }
      if (product.stock < item.quantity) {
        res.status(400).json({ message: `المخزون غير كافٍ للمنتج: ${product.name}` });
        return;
      }
      const unitPrice = parseFloat(product.price);
      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;
      saleItemsData.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        costPrice: product.costPrice,
        total: itemTotal.toFixed(2),
      });
    }

    const discountAmount = parseFloat(discount.toString());
    const taxAmount = parseFloat(tax.toString());
    const total = subtotal - discountAmount + taxAmount;
    const invoiceNumber = generateInvoiceNumber();

    const [sale] = await db.insert(salesTable).values({
      invoiceNumber,
      customerId: customerId ?? null,
      userId: currentUser.id,
      subtotal: subtotal.toFixed(2),
      discount: discountAmount.toFixed(2),
      tax: taxAmount.toFixed(2),
      total: total.toFixed(2),
      paymentMethod,
      notes,
      status: "completed",
    }).returning();

    if (!sale) { res.status(500).json({ message: "خطأ في إنشاء المبيعة" }); return; }

    await db.insert(saleItemsTable).values(saleItemsData.map(item => ({ ...item, saleId: sale.id })));

    for (const item of items) {
      const product = productMap.get(item.productId)!;
      const newStock = product.stock - item.quantity;
      await db.update(productsTable).set({ stock: newStock, updatedAt: new Date() }).where(eq(productsTable.id, item.productId));
      if (newStock <= product.minStock) {
        await db.insert(notificationsTable).values({
          type: "low_stock",
          title: "تحذير: مخزون منخفض",
          message: `المنتج "${product.name}" لديه مخزون منخفض (${newStock} وحدة متبقية)`,
          data: { productId: product.id, stock: newStock },
        }).catch(() => {});
      }
    }

    await db.insert(notificationsTable).values({
      type: "sale_completed",
      title: "تمت عملية البيع",
      message: `تمت عملية البيع بنجاح - فاتورة رقم ${invoiceNumber} بإجمالي ${total.toFixed(2)} ر.س`,
      data: { saleId: sale.id, total },
    }).catch(() => {});

    const saleDetails = await getSaleDetails(sale.id);
    res.status(201).json(saleDetails);
  } catch (err) {
    req.log.error({ err }, "Error creating sale");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

router.get("/:id", authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    const sale = await getSaleDetails(id);
    if (!sale) { res.status(404).json({ message: "المبيعة غير موجودة" }); return; }
    res.json(sale);
  } catch (err) {
    req.log.error({ err }, "Error fetching sale");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    await db.delete(salesTable).where(eq(salesTable.id, id));
    res.json({ success: true, message: "تم حذف المبيعة بنجاح" });
  } catch (err) {
    req.log.error({ err }, "Error deleting sale");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

export default router;
