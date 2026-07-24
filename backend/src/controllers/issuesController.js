import { prisma } from "../lib/prisma.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/issues/";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `issue-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

export const uploadIssuePhotos = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Images only"));
  },
}).array("photos", 5);

export async function createIssue(req, res) {
  const { propertyId, listingId, unitId, category, subject, description, priority, reportedTo } = req.body;

  const targetPropertyId = propertyId || listingId;

  if (!targetPropertyId || !category || !subject || !description) {
    return res.status(400).json({ error: "propertyId, category, subject, description are required" });
  }

  const property = await prisma.property.findUnique({ where: { id: targetPropertyId } });
  if (!property) return res.status(404).json({ error: "Property not found" });

  const issue = await prisma.issue.create({
    data: {
      propertyId: targetPropertyId,
      unitId: unitId || null,
      tenantId: req.session.userId,
      landlordId: property.landlordId,
      category,
      subject,
      description,
      priority: priority || "MODERATE",
      reportedTo: reportedTo || "LANDLORD",
    },
  });

  // Upload photos if any
  if (req.files && req.files.length > 0) {
    await prisma.issuePhoto.createMany({
      data: req.files.map((file) => ({
        issueId: issue.id,
        url: `/uploads/issues/${file.filename}`,
      })),
    });
  }

  const full = await prisma.issue.findUnique({
    where: { id: issue.id },
    include: { photos: true },
  });

  res.status(201).json({ issue: full });
}

export async function getTenantIssues(req, res) {
  const { status, priority } = req.query;

  const issues = await prisma.issue.findMany({
    where: {
      tenantId: req.session.userId,
      ...(status && { status }),
      ...(priority && { priority }),
    },
    include: {
      photos: true,
      property: { select: { id: true, name: true, address: true } },
      unit: { select: { id: true, unitNumber: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = issues.map((i) => ({
    ...i,
    listing: {
      id: i.property.id,
      title: i.property.name,
      address: i.property.address,
    },
  }));

  const stats = {
    total: issues.length,
    open: issues.filter((i) => i.status === "OPEN").length,
    critical: issues.filter((i) => i.priority === "CRITICAL").length,
    resolved: issues.filter((i) => i.status === "RESOLVED").length,
  };

  res.json({ issues: formatted, stats });
}

export async function getLandlordIssues(req, res) {
  const { status, priority } = req.query;

  const issues = await prisma.issue.findMany({
    where: {
      landlordId: req.session.userId,
      ...(status && { status }),
      ...(priority && { priority }),
    },
    include: {
      photos: true,
      property: { select: { id: true, name: true, address: true } },
      unit: { select: { id: true, unitNumber: true } },
      tenant: { select: { id: true, fullName: true, email: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = issues.map((i) => ({
    ...i,
    listing: {
      id: i.property.id,
      title: i.property.name,
      address: i.property.address,
    },
  }));

  const stats = {
    total: issues.length,
    open: issues.filter((i) => i.status === "OPEN").length,
    critical: issues.filter((i) => i.priority === "CRITICAL").length,
    resolved: issues.filter((i) => i.status === "RESOLVED").length,
  };

  res.json({ issues: formatted, stats });
}

export async function updateIssueStatus(req, res) {
  const { status } = req.body;
  const issue = await prisma.issue.findUnique({ where: { id: req.params.id } });

  if (!issue) return res.status(404).json({ error: "Issue not found" });
  if (issue.landlordId !== req.session.userId && !req.session.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const updated = await prisma.issue.update({
    where: { id: req.params.id },
    data: {
      status,
      ...(status === "RESOLVED" && { resolvedAt: new Date() }),
    },
  });

  res.json({ issue: updated });
}
