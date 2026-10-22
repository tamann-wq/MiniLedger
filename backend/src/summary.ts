import { Router } from "express";
import { pool } from "./db.js";
import { authenticate } from "./auth.js";

export const summaryRouter = Router();
summaryRouter.use(authenticate);
summaryRouter.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
       COALESCE(SUM(amount),0)::float8 AS "totalLent",
       COALESCE(SUM(amount) FILTER (WHERE repaid=TRUE),0)::float8 AS "totalRepaid",
       COALESCE(SUM(amount) FILTER (WHERE repaid=FALSE AND due_date < CURRENT_DATE),0)::float8 AS "overdueAmount"
       FROM entries WHERE user_id=$1`,
      [(req as any).userId]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});
