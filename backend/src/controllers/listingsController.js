import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { generateUniqueSlug } from "../lib/slugify.js";


const listingSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  price: z.coerce.number().int().positive(),
  bedrooms: z.coerce.number().int().min(0),
  bathrooms: z.coerce.number().int().min(0),
  propertyType: z.string(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  address: z.string(),
});

export async function getListings(req, res) {
  const { minPrice, maxPrice, bedrooms, propertyType, area, status } = req.query;

  // Build the price filter — must merge gte and lte into ONE object,
  // otherwise the second spread silently overwrites the first.
  const priceFilter = {};
  if (minPrice) priceFilter.gte = Number(minPrice);
  if (maxPrice) priceFilter.lte = Number(maxPrice);

  const listings = await prisma.listing.findMany({
    where: {
      status: status || "ACTIVE",
      ...(Object.keys(priceFilter).length > 0 && { price: priceFilter }),
      ...(bedrooms !== undefined && bedrooms !== "" && {
        bedrooms: Number(bedrooms) >= 4 ? { gte: 4 } : Number(bedrooms),
      }),
      ...(propertyType && { propertyType: String(propertyType) }),
      ...(area && { address: { contains: area, mode: "insensitive" } }),
    },
    include: {
      photos: { orderBy: { order: "asc" } },
      landlord: {
        select: {
          id: true,
          fullName: true,
          verification: true,
          avatarUrl: true,
        },
      },
      _count: { select: { savedBy: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ listings });
}

export async function getListing(req, res) {
  const listing = await prisma.listing.findFirst({
    where: {
      OR: [
        { id: req.params.slug },
        { slug: req.params.slug },
      ],
    },
    include: {
      photos: { orderBy: { order: "asc" } },
      landlord: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          verification: true,
          avatarUrl: true,
        },
      },
      _count: { select: { savedBy: true } },
    },
  });

  if (!listing) return res.status(404).json({ error: "Listing not found" });
  res.json({ listing });
}

export async function createListing(req, res) {
  const parsed = listingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const slug = await generateUniqueSlug(prisma, parsed.data.title);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const listing = await prisma.listing.create({
    data: {
      ...parsed.data,
      slug,
      landlordId: req.session.userId,
      expiresAt,
    },
    include: { photos: true },
  });

  res.status(201).json({ listing });
}

export async function updateListing(req, res) {
  const existing = await prisma.listing.findFirst({
    where: {
      OR: [
        { id: req.params.slug },
        { slug: req.params.slug },
      ],
    },
  });
  if (!existing) return res.status(404).json({ error: "Listing not found" });
  if (existing.landlordId !== req.session.userId && !req.session.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const parsed = listingSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const listing = await prisma.listing.update({
    where: { id: existing.id },
    data: parsed.data,
    include: { photos: true },
  });

  res.json({ listing });
}

export async function deleteListing(req, res) {
  const existing = await prisma.listing.findFirst({
    where: {
      OR: [
        { id: req.params.slug },
        { slug: req.params.slug },
      ],
    },
  });
  if (!existing) return res.status(404).json({ error: "Listing not found" });
  if (existing.landlordId !== req.session.userId && !req.session.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await prisma.listing.delete({ where: { id: existing.id } });
  res.json({ ok: true });
}

export async function getMyListings(req, res) {
  const listings = await prisma.listing.findMany({
    where: { landlordId: req.session.userId },
    include: {
      photos: { orderBy: { order: "asc" } },
      _count: { select: { savedBy: true, conversations: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ listings });
}


export async function reportListing(req, res) {
  const { reportType, reason, details } = req.body;

  const VALID_TYPES = ["SCAM", "WRONG_INFO", "ALREADY_RENTED", "INAPPROPRIATE", "OTHER"];

  if (!VALID_TYPES.includes(reportType)) {
    return res.status(400).json({ error: "Invalid report type" });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: req.params.id },
  });
  if (!listing) return res.status(404).json({ error: "Listing not found" });

  const report = await prisma.report.create({
    data: {
      listingId: req.params.id,
      reportedById: req.session.userId,
      reportType,
      reason: reason || reportType,
      details,
    },
  });

  res.status(201).json({ report });
}
