import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import categoriesRouter from "./categories.js";
import productsRouter from "./products.js";
import customersRouter from "./customers.js";
import salesRouter from "./sales.js";
import invoicesRouter from "./invoices.js";
import reportsRouter from "./reports.js";
import notificationsRouter from "./notifications.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/categories", categoriesRouter);
router.use("/products", productsRouter);
router.use("/customers", customersRouter);
router.use("/sales", salesRouter);
router.use("/invoices", invoicesRouter);
router.use("/reports", reportsRouter);
router.use("/notifications", notificationsRouter);

export default router;
