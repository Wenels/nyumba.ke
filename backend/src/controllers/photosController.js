import multer from "multer";
import path from "path";
import fs from "fs";
import { prisma } from "../lib/prisma.js";

// Store uploads in /backend/uploads/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only JPEG, PNG, and WebP images are allowed"), false);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export async function uploadPhotos(req, res) {
  const { id } = req.params;

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return res.status(404).json({ error: "Listing not found" });
  if (listing.landlordId !== req.session.userId && !req.session.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  const existingCount = await prisma.photo.count({ where: { listingId: id } });

  const photos = await prisma.photo.createMany({
    data: req.files.map((file, i) => ({
      listingId: id,
      url: `/uploads/${file.filename}`,
      order: existingCount + i,
    })),
  });

  const updatedPhotos = await prisma.photo.findMany({
    where: { listingId: id },
    orderBy: { order: "asc" },
  });

  res.status(201).json({ photos: updatedPhotos });
}

export async function deletePhoto(req, res) {
  const photo = await prisma.photo.findUnique({
    where: { id: req.params.photoId },
    include: { listing: true },
  });

  if (!photo) return res.status(404).json({ error: "Photo not found" });
  if (photo.listing.landlordId !== req.session.userId && !req.session.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // Delete file from disk
  const filePath = `.${photo.url}`;
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  await prisma.photo.delete({ where: { id: req.params.photoId } });
  res.json({ ok: true });
}
