import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq, ilike, or, count, desc } from "drizzle-orm";
import { authenticate, requireAdmin } from "../lib/auth.js";

const router: IRouter = Router();

router.get("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query["page"] as string) || 1;
    const limit = parseInt(req.query["limit"] as string) || 10;
    const search = req.query["search"] as string;
    const offset = (page - 1) * limit;

    let whereClause = undefined;
    if (search) {
      whereClause = or(ilike(usersTable.name, `%${search}%`), ilike(usersTable.email, `%${search}%`));
    }

    const [usersResult, countResult] = await Promise.all([
      db.select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
        isActive: usersTable.isActive,
        createdAt: usersTable.createdAt,
        updatedAt: usersTable.updatedAt,
      }).from(usersTable).where(whereClause).limit(limit).offset(offset).orderBy(desc(usersTable.createdAt)),
      db.select({ count: count() }).from(usersTable).where(whereClause),
    ]);

    const total = countResult[0]?.count ?? 0;
    res.json({
      data: usersResult.map(u => ({ ...u, createdAt: u.createdAt.toISOString(), updatedAt: u.updatedAt.toISOString() })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching users");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

router.post("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      res.status(400).json({ message: "جميع الحقول مطلوبة" });
      return;
    }

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing) {
      res.status(409).json({ message: "البريد الإلكتروني مستخدم بالفعل" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({ name, email, password: hashedPassword, role }).returning();
    if (!user) { res.status(500).json({ message: "خطأ في إنشاء المستخدم" }); return; }

    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive, createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error creating user");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

router.get("/:id", authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    const [user] = await db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role, isActive: usersTable.isActive, createdAt: usersTable.createdAt, updatedAt: usersTable.updatedAt })
      .from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!user) { res.status(404).json({ message: "المستخدم غير موجود" }); return; }
    res.json({ ...user, createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error fetching user");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

router.put("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    const { name, email, role, isActive, password } = req.body;
    const updateData: any = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (typeof isActive === "boolean") updateData.isActive = isActive;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, id)).returning();
    if (!user) { res.status(404).json({ message: "المستخدم غير موجود" }); return; }
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive, createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error updating user");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    const currentUser = (req as any).user;
    if (currentUser.id === id) {
      res.status(400).json({ message: "لا يمكنك حذف حسابك الخاص" });
      return;
    }
    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.json({ success: true, message: "تم حذف المستخدم بنجاح" });
  } catch (err) {
    req.log.error({ err }, "Error deleting user");
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

export default router;
