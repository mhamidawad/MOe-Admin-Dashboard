import jwt from "jsonwebtoken";
import { type Request, type Response, type NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env["JWT_SECRET"] || "pos_secret_key_change_in_production";

export function generateToken(userId: number, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: number; role: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "غير مصرح بالوصول" });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = verifyToken(token!);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId)).limit(1);
    if (!user || !user.isActive) {
      res.status(401).json({ message: "غير مصرح بالوصول" });
      return;
    }
    (req as any).user = user;
    next();
  } catch {
    res.status(401).json({ message: "رمز التحقق غير صالح" });
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || user.role !== "admin") {
    res.status(403).json({ message: "غير مسموح. هذا الإجراء للمسؤولين فقط" });
    return;
  }
  next();
}
