import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

export async function requestPasswordReset(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to prevent email enumeration
  if (!user) return res.json({ ok: true });

  // Invalidate old tokens
  await prisma.passwordReset.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.passwordReset.create({
    data: { userId: user.id, token, expiresAt },
  });

  // In production this would send an email via Resend
  // For now, return the token in dev mode only
  if (process.env.NODE_ENV !== "production") {
    return res.json({ ok: true, debug_token: token });
  }

  res.json({ ok: true });
}

export async function resetPassword(req, res) {
  const { token, newPassword } = req.body;

  if (!token || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const resetRecord = await prisma.passwordReset.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetRecord) {
    return res.status(400).json({ error: "Invalid or expired reset link" });
  }

  if (resetRecord.used) {
    return res.status(400).json({ error: "Reset link has already been used" });
  }

  if (new Date() > resetRecord.expiresAt) {
    return res.status(400).json({ error: "Reset link has expired" });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: resetRecord.userId },
    data: { passwordHash },
  });

  await prisma.passwordReset.update({
    where: { token },
    data: { used: true },
  });

  res.json({ ok: true });
}
