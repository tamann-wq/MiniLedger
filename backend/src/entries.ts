import { Router } from "express";
import { z } from "zod";
import { pool } from "./db.js";
import { authenticate } from "./auth.js";

export const entriesRouter = Router();
entriesRouter.use(authenticate);

const entryInput = z.object({
  friendName: z.string().trim().min(1, "Friend name is required").max(100),
  amount: z.coerce.number().finite().positive("Amount must be greater than zero").max(999999999),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must use YYYY-MM-DD")
});

entriesRouter.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, friend_name AS "friendName", amount::float8 AS amount,
       TO_CHAR(due_date, 'YYYY-MM-DD') AS "dueDate", repaid,
       repaid_at AS "repaidAt", created_at AS "createdAt"
       FROM entries WHERE user_id=$1 ORDER BY repaid ASC, due_date ASC, created_at DESC`,
      [(req as any).userId]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

entriesRouter.post("/", async (req, res, next) => {
  try {
    const parsed = entryInput.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid entry." });
    const { friendName, amount, dueDate } = parsed.data;
    const result = await pool.query(
      `INSERT INTO entries(user_id, friend_name, amount, due_date)
       VALUES($1,$2,$3,$4)
       RETURNING id, friend_name AS "friendName", amount::float8 AS amount,
       TO_CHAR(due_date, 'YYYY-MM-DD') AS "dueDate", repaid, created_at AS "createdAt"`,
      [(req as any).userId, friendName, amount, dueDate]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

entriesRouter.patch("/:id/repay", async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().safeParse(req.params.id);
    if (!id.success) return res.status(400).json({ error: "Invalid entry ID." });
    const result = await pool.query(
      `UPDATE entries SET repaid=TRUE, repaid_at=NOW()
       WHERE id=$1 AND user_id=$2 AND repaid=FALSE
       RETURNING id, friend_name AS "friendName", amount::float8 AS amount,
       TO_CHAR(due_date, 'YYYY-MM-DD') AS "dueDate", repaid, repaid_at AS "repaidAt"`,
      [id.data, (req as any).userId]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Unpaid entry not found." });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});
