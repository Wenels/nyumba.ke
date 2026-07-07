import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  role: z.enum(["TENANT", "LANDLORD"]).default("TENANT"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function register(req, res) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password, fullName, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, fullName, role },
  });

  req.session.userId = user.id;
  req.session.role = user.role;
  req.session.isAdmin = user.isAdmin;

  res.status(201).json({ user: sanitizeUser(user) });
}

export async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  req.session.userId = user.id;
  req.session.role = user.role;
  req.session.isAdmin = user.isAdmin;

  res.json({ user: sanitizeUser(user) });
}

export async function logout(req, res) {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
}

export async function me(req, res) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  res.json({ user: sanitizeUser(user) });
}

function sanitizeUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}





export async function updateProfile(req, res) {
  const { fullName, phone } = req.body;

  if (!fullName || fullName.trim().length < 2) {
    return res.status(400).json({ error: "Full name is required" });
  }

  const user = await prisma.user.update({
    where: { id: req.session.userId },
    data: {
      fullName: fullName.trim(),
      ...(phone !== undefined && { phone: phone.trim() || null }),
    },
  });

  req.session.role = user.role;
  res.json({ user: sanitizeUser(user) });
}

export async function updatePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: "Invalid password data" });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
  });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Current password is incorrect" });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: req.session.userId },
    data: { passwordHash },
  });

  res.json({ ok: true });
}



export async function requestVerification(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
  });

  if (user.verification === "VERIFIED") {
    return res.status(400).json({ error: "Already verified" });
  }

  if (user.verification === "PENDING") {
    return res.status(400).json({ error: "Verification already pending" });
  }

  await prisma.user.update({
    where: { id: req.session.userId },
    data: { verification: "PENDING" },
  });

  res.json({ ok: true });
}
