import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { salesTable, saleItemsTable, customersTable, usersTable } from "@workspace/db/schema";
import { eq, and, gte, lte, ilike, count, desc } from "drizzle-orm";
import { authenticate } from "../lib/auth.js";

const router: IRouter = Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query["page"] as string) || 1;
    const limit = parseInt(req.query["limit"] as string) || 10;
    const search = req.query["search"] as string;
    const startDate = req.query["startDate"] as string;
    const endDate = req.query["endDate"] as string;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) conditions.push(ilike(salesTable.invoiceNumber, `%${search}%`));
    if (startDate) conditions.push(gte(salesTable.createdAt, new Date(startDate)));
    if (endDate) conditions.push(lte(salesTable.createdAt, new Date(endDate)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [sales, countResult] = await Promise.all([
      db.select({
        id: salesTable.id,
        invoiceNumber: salesTable.invoiceNumber,
        saleId: salesTable.id,
        customerId: salesTable.customerId,
        subtotal: salesTable.subtotal,
        discount: salesTable.discount,
        tax: salesTable.tax,
        total: salesTable.total,
        paymentMethod: salesTable.paymentMethod,
        notes: salesTable.notes,
        status: salesTable.status,
        createdAt: salesTable.createdAt,
        customerName: customersTable.name,
        customerPhone: customersTable.phone,
        customerEmail: customersTable.email,
      }).from(salesTable)
        .leftJoin(customersTable, eq(salesTable.customerId, customersTable.id))
        .where(whereClause).limit(limit).offset(offset).orderBy(desc(salesTable.createdAt)),
      db.select({ count: count() }).from(salesTable).where(whereClause),
    ]);

    const total = countResult[0]?.count ?? 0;

    const salesWithItems = await Promise.all(sales.map(async (s) => {
      const items = await db.select().from(saleItemsTable).where(eq(saleItemsTable.saleId, s.id));
      return {
        ...s,
        subtotal: parseFloat(s.subtotal),
        discount: parseFloat(s.discount),
        tax: parseFloat(s.tax),
        total: parseFloat(s.total),
        createdAt: s.createdAt.toISOString(),
        items: items.map(i => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: parseFloat(i.unitPrice),
          total: parseFloat(i.total),
        })),
      };
    }));

    res.json({
      data: salesWithItems,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching invoices");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

router.get("/:id", authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    const [sale] = await db.select({
      id: salesTable.id,
      invoiceNumber: salesTable.invoiceNumber,
      saleId: salesTable.id,
      customerId: salesTable.customerId,
      subtotal: salesTable.subtotal,
      discount: salesTable.discount,
      tax: salesTable.tax,
      total: salesTable.total,
      paymentMethod: salesTable.paymentMethod,
      notes: salesTable.notes,
      status: salesTable.status,
      createdAt: salesTable.createdAt,
      customerName: customersTable.name,
      customerPhone: customersTable.phone,
      customerEmail: customersTable.email,
    }).from(salesTable)
      .leftJoin(customersTable, eq(salesTable.customerId, customersTable.id))
      .where(eq(salesTable.id, id)).limit(1);

    if (!sale) { res.status(404).json({ message: "الفاتورة غير موجودة" }); return; }

    const items = await db.select().from(saleItemsTable).where(eq(saleItemsTable.saleId, id));

    res.json({
      ...sale,
      subtotal: parseFloat(sale.subtotal),
      discount: parseFloat(sale.discount),
      tax: parseFloat(sale.tax),
      total: parseFloat(sale.total),
      createdAt: sale.createdAt.toISOString(),
      items: items.map(i => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: parseFloat(i.unitPrice),
        total: parseFloat(i.total),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching invoice");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

export default router;
