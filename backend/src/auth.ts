import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { pool } from "./db.js";

export const authRouter = Router();
const otpStore = new Map<string, { code: string; expiresAt: number }>();
const secret = process.env.JWT_SECRET || "local-development-secret";

const phoneSchema = z.string().trim().regex(/^\+?[1-9]\d{7,14}$/, "Enter a valid phone number");
authRouter.post("/request-otp", (req, res) => {
  const parsed = z.object({ phone: phoneSchema }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  const phone = parsed.data.phone;
  const code = String(Math.floor(100000 + Math.random() * 900000));
  otpStore.set(phone, { code, expiresAt: Date.now() + 5 * 60 * 1000 });
  console.log(`[MiniLedger mock OTP] ${phone}: ${code} (expires in 5 minutes)`);
  return res.json({ message: "OTP generated. Check the API server log." });
});

authRouter.post("/verify-otp", async (req, res, next) => {
  try {
    const parsed = z.object({ phone: phoneSchema, otp: z.string().regex(/^\d{6}$/) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Enter a valid phone number and 6-digit OTP." });
    const { phone, otp } = parsed.data;
    const stored = otpStore.get(phone);
    if (!stored || stored.code !== otp || stored.expiresAt < Date.now()) {
      return res.status(401).json({ error: "OTP is invalid or expired. Request a new one." });
    }
    otpStore.delete(phone);
    const result = await pool.query(
      "INSERT INTO users(phone) VALUES($1) ON CONFLICT(phone) DO UPDATE SET phone = EXCLUDED.phone RETURNING id, phone",
      [phone]
    );
    const user = result.rows[0] as { id: string; phone: string };
    console.log("MiniLedger login user:", {
      id: user.id,
      phone: user.phone,
    });
    const token = jwt.sign({ userId: user.id, phone: user.phone }, secret, { expiresIn: "7d" });
    return res.json({ token, user: { phone: user.phone } });
  } catch (err) { next(err); }
});

export function authenticate(req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Missing bearer token." });
  try {
    const payload = jwt.verify(header.slice(7), secret) as jwt.JwtPayload;
    if (!payload.userId) return res.status(401).json({ error: "Invalid token." });
    (req as any).userId = String(payload.userId);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}
