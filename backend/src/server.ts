import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db.js";
import { authRouter } from "./auth.js";
import { entriesRouter } from "./entries.js";
import { summaryRouter } from "./summary.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", authRouter);
app.use("/entries", entriesRouter);
app.use("/summary", summaryRouter);
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, "0.0.0.0", () => console.log(`MiniLedger API listening on http://localhost:${port}`));
process.on("SIGINT", async () => {
  await pool.end();
  process.exit(0);
});
