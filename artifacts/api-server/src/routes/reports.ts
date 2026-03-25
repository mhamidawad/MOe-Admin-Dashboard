import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { salesTable, saleItemsTable, productsTable, customersTable, usersTable, categoriesTable } from "@workspace/db/schema";
import { eq, and, gte, lte, count, sum, desc, sql } from "drizzle-orm";
import { authenticate } from "../lib/auth.js";

const router: IRouter = Router();

router.get("/dashboard", authenticate, async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayStats, monthStats, productStats, customerCount, userCount] = await Promise.all([
      db.select({ total: sum(salesTable.total), count: count() }).from(salesTable)
        .where(and(gte(salesTable.createdAt, todayStart), eq(salesTable.status, "completed"))),
      db.select({ total: sum(salesTable.total), count: count() }).from(salesTable)
        .where(and(gte(salesTable.createdAt, monthStart), eq(salesTable.status, "completed"))),
      db.select({ total: count(), lowStock: sql<number>`count(*) filter (where ${productsTable.stock} <= ${productsTable.minStock})` }).from(productsTable),
      db.select({ count: count() }).from(customersTable),
      db.select({ count: count() }).from(usersTable),
    ]);

    const recentSales = await db.select({
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
      .orderBy(desc(salesTable.createdAt)).limit(5);

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000);
      const [daySales] = await db.select({ total: sum(salesTable.total), count: count() })
        .from(salesTable).where(and(gte(salesTable.createdAt, day), lte(salesTable.createdAt, nextDay), eq(salesTable.status, "completed")));
      last7Days.push({
        date: day.toISOString().split("T")[0],
        total: parseFloat(String(daySales?.total ?? "0")),
        count: Number(daySales?.count ?? 0),
      });
    }

    res.json({
      todaySales: parseFloat(String(todayStats[0]?.total ?? "0")),
      todayTransactions: Number(todayStats[0]?.count ?? 0),
      monthSales: parseFloat(String(monthStats[0]?.total ?? "0")),
      monthTransactions: Number(monthStats[0]?.count ?? 0),
      totalProducts: Number(productStats[0]?.total ?? 0),
      lowStockProducts: Number(productStats[0]?.lowStock ?? 0),
      totalCustomers: Number(customerCount[0]?.count ?? 0),
      totalUsers: Number(userCount[0]?.count ?? 0),
      recentSales: recentSales.map(s => ({
        ...s,
        subtotal: parseFloat(s.subtotal),
        discount: parseFloat(s.discount),
        tax: parseFloat(s.tax),
        total: parseFloat(s.total),
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        items: [],
      })),
      salesChartData: last7Days,
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching dashboard stats");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

router.get("/daily", authenticate, async (req, res) => {
  try {
    const dateStr = req.query["date"] as string;
    const date = dateStr ? new Date(dateStr) : new Date();
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const [stats] = await db.select({ total: sum(salesTable.total), count: count() })
      .from(salesTable).where(and(gte(salesTable.createdAt, dayStart), lte(salesTable.createdAt, dayEnd), eq(salesTable.status, "completed")));

    const salesOfDay = await db.select({ id: salesTable.id, total: salesTable.total, createdAt: salesTable.createdAt })
      .from(salesTable).where(and(gte(salesTable.createdAt, dayStart), lte(salesTable.createdAt, dayEnd), eq(salesTable.status, "completed")));

    const saleIds = salesOfDay.map(s => s.id);
    const allItems = saleIds.length > 0
      ? await db.select({ productId: saleItemsTable.productId, productName: saleItemsTable.productName, quantity: saleItemsTable.quantity, total: saleItemsTable.total, costPrice: saleItemsTable.costPrice })
          .from(saleItemsTable).where(sql`${saleItemsTable.saleId} = ANY(ARRAY[${sql.join(saleIds.map(id => sql`${id}`), sql`, `)}]::int[])`)
      : [];

    const productMap = new Map<number, { productName: string; quantitySold: number; revenue: number }>();
    for (const item of allItems) {
      const pid = item.productId ?? -1;
      const existing = productMap.get(pid) ?? { productName: item.productName, quantitySold: 0, revenue: 0 };
      existing.quantitySold += item.quantity;
      existing.revenue += parseFloat(item.total);
      productMap.set(pid, existing);
    }

    const topProducts = Array.from(productMap.entries())
      .map(([pid, d]) => ({ productId: pid, ...d }))
      .sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    const salesByHour: { hour: number; total: number; count: number }[] = [];
    for (let h = 0; h < 24; h++) {
      const hourSales = salesOfDay.filter(s => s.createdAt.getHours() === h);
      salesByHour.push({
        hour: h,
        total: hourSales.reduce((sum, s) => sum + parseFloat(s.total), 0),
        count: hourSales.length,
      });
    }

    const totalRevenue = parseFloat(String(stats?.total ?? "0"));
    const totalCost = allItems.reduce((sum, i) => sum + parseFloat(i.costPrice) * i.quantity, 0);

    res.json({
      date: dayStart.toISOString().split("T")[0],
      totalSales: totalRevenue,
      totalTransactions: Number(stats?.count ?? 0),
      totalProfit: totalRevenue - totalCost,
      averageOrderValue: Number(stats?.count ?? 0) > 0 ? totalRevenue / Number(stats?.count ?? 1) : 0,
      topProducts,
      salesByHour,
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching daily report");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

router.get("/monthly", authenticate, async (req, res) => {
  try {
    const now = new Date();
    const year = req.query["year"] ? parseInt(req.query["year"] as string) : now.getFullYear();
    const month = req.query["month"] ? parseInt(req.query["month"] as string) : now.getMonth() + 1;
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    const [stats] = await db.select({ total: sum(salesTable.total), count: count() })
      .from(salesTable).where(and(gte(salesTable.createdAt, monthStart), lte(salesTable.createdAt, monthEnd), eq(salesTable.status, "completed")));

    const salesOfMonth = await db.select({ id: salesTable.id, total: salesTable.total, createdAt: salesTable.createdAt })
      .from(salesTable).where(and(gte(salesTable.createdAt, monthStart), lte(salesTable.createdAt, monthEnd), eq(salesTable.status, "completed")));

    const saleIds = salesOfMonth.map(s => s.id);
    const allItems = saleIds.length > 0
      ? await db.select({ productId: saleItemsTable.productId, productName: saleItemsTable.productName, quantity: saleItemsTable.quantity, total: saleItemsTable.total, costPrice: saleItemsTable.costPrice })
          .from(saleItemsTable).where(sql`${saleItemsTable.saleId} = ANY(ARRAY[${sql.join(saleIds.map(id => sql`${id}`), sql`, `)}]::int[])`)
      : [];

    const productMap = new Map<number, { productName: string; quantitySold: number; revenue: number }>();
    for (const item of allItems) {
      const pid = item.productId ?? -1;
      const existing = productMap.get(pid) ?? { productName: item.productName, quantitySold: 0, revenue: 0 };
      existing.quantitySold += item.quantity;
      existing.revenue += parseFloat(item.total);
      productMap.set(pid, existing);
    }

    const topProducts = Array.from(productMap.entries())
      .map(([pid, d]) => ({ productId: pid, ...d }))
      .sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    const daysInMonth = new Date(year, month, 0).getDate();
    const salesByDay = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const daySales = salesOfMonth.filter(s => s.createdAt.getDate() === day);
      return { day, total: daySales.reduce((sum, s) => sum + parseFloat(s.total), 0), count: daySales.length };
    });

    const totalRevenue = parseFloat(String(stats?.total ?? "0"));
    const totalCost = allItems.reduce((sum, i) => sum + parseFloat(i.costPrice) * i.quantity, 0);

    res.json({
      year,
      month,
      totalSales: totalRevenue,
      totalTransactions: Number(stats?.count ?? 0),
      totalProfit: totalRevenue - totalCost,
      averageOrderValue: Number(stats?.count ?? 0) > 0 ? totalRevenue / Number(stats?.count ?? 1) : 0,
      topProducts,
      salesByDay,
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching monthly report");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

router.get("/top-products", authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query["limit"] as string) || 10;
    const startDate = req.query["startDate"] as string;
    const endDate = req.query["endDate"] as string;

    const conditions = [eq(salesTable.status, "completed")];
    if (startDate) conditions.push(gte(salesTable.createdAt, new Date(startDate)));
    if (endDate) conditions.push(lte(salesTable.createdAt, new Date(endDate)));

    const sales = await db.select({ id: salesTable.id }).from(salesTable).where(and(...conditions));
    const saleIds = sales.map(s => s.id);

    if (saleIds.length === 0) { res.json({ data: [] }); return; }

    const items = await db.select({
      productId: saleItemsTable.productId,
      productName: saleItemsTable.productName,
      quantity: saleItemsTable.quantity,
      total: saleItemsTable.total,
      costPrice: saleItemsTable.costPrice,
      categoryId: productsTable.categoryId,
      categoryName: categoriesTable.name,
    }).from(saleItemsTable)
      .leftJoin(productsTable, eq(saleItemsTable.productId, productsTable.id))
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(sql`${saleItemsTable.saleId} = ANY(ARRAY[${sql.join(saleIds.map(id => sql`${id}`), sql`, `)}]::int[])`);

    const productMap = new Map<number, { productName: string; categoryName: string | null; quantitySold: number; revenue: number; profit: number }>();
    for (const item of items) {
      const pid = item.productId ?? -1;
      const existing = productMap.get(pid) ?? { productName: item.productName, categoryName: item.categoryName, quantitySold: 0, revenue: 0, profit: 0 };
      const itemRevenue = parseFloat(item.total);
      const itemCost = parseFloat(item.costPrice) * item.quantity;
      existing.quantitySold += item.quantity;
      existing.revenue += itemRevenue;
      existing.profit += itemRevenue - itemCost;
      productMap.set(pid, existing);
    }

    const data = Array.from(productMap.entries())
      .map(([pid, d]) => ({ productId: pid, ...d }))
      .sort((a, b) => b.revenue - a.revenue).slice(0, limit);

    res.json({ data });
  } catch (err) {
    req.log.error({ err }, "Error fetching top products");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

export default router;
