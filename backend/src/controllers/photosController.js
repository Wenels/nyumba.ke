import multer from "multer";
import path from "path";
import fs from "fs";
import { prisma } from "../lib/prisma.js";

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
  limits: { fileSize: 5 * 1024 * 1024 },
});

export async function uploadPhotos(req, res) {
  const { id } = req.params;

  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) return res.status(404).json({ error: "Property not found" });
  if (property.landlordId !== req.session.userId && !req.session.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  const existingCount = await prisma.propertyPhoto.count({ where: { propertyId: id } });

  await prisma.propertyPhoto.createMany({
    data: req.files.map((file, i) => ({
      propertyId: id,
      url: `/uploads/${file.filename}`,
      order: existingCount + i,
    })),
  });

  const updatedPhotos = await prisma.propertyPhoto.findMany({
    where: { propertyId: id },
    orderBy: { order: "asc" },
  });

  res.status(201).json({ photos: updatedPhotos });
}

export async function deletePhoto(req, res) {
  const photo = await prisma.propertyPhoto.findUnique({
    where: { id: req.params.photoId },
    include: { property: true },
  });

  if (!photo) return res.status(404).json({ error: "Photo not found" });
  if (photo.property.landlordId !== req.session.userId && !req.session.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const filePath = `.${photo.url}`;
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  await prisma.propertyPhoto.delete({ where: { id: req.params.photoId } });
  res.json({ ok: true });
}
