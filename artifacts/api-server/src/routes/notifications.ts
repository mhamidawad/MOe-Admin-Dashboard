import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { authenticate } from "../lib/auth.js";

const router: IRouter = Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const unreadOnly = req.query["unreadOnly"] === "true";

    const notifications = await db.select().from(notificationsTable)
      .where(unreadOnly ? eq(notificationsTable.isRead, false) : undefined)
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);

    const [unreadCount] = await db.select({ count: count() }).from(notificationsTable)
      .where(eq(notificationsTable.isRead, false));

    res.json({
      data: notifications.map(n => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount: Number(unreadCount?.count ?? 0),
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching notifications");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

router.put("/:id/read", authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.id, id));
    res.json({ success: true, message: "تم تعليم الإشعار كمقروء" });
  } catch (err) {
    req.log.error({ err }, "Error marking notification read");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

router.put("/read-all", authenticate, async (req, res) => {
  try {
    await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.isRead, false));
    res.json({ success: true, message: "تم تعليم جميع الإشعارات كمقروءة" });
  } catch (err) {
    req.log.error({ err }, "Error marking all notifications read");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

export default router;
