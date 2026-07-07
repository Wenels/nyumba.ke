import { prisma } from "../lib/prisma.js";

export async function getSaved(req, res) {
  const saved = await prisma.savedListing.findMany({
    where: { userId: req.session.userId },
    include: {
      listing: {
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
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ saved: saved.map((s) => s.listing) });
}

export async function saveListing(req, res) {
  const { listingId } = req.params;

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return res.status(404).json({ error: "Listing not found" });

  const existing = await prisma.savedListing.findUnique({
    where: { userId_listingId: { userId: req.session.userId, listingId } },
  });

  if (existing) {
    return res.status(409).json({ error: "Already saved" });
  }

  await prisma.savedListing.create({
    data: { userId: req.session.userId, listingId },
  });

  res.status(201).json({ ok: true });
}

export async function unsaveListing(req, res) {
  const { listingId } = req.params;

  await prisma.savedListing.deleteMany({
    where: { userId: req.session.userId, listingId },
  });

  res.json({ ok: true });
}

export async function checkSaved(req, res) {
  const { listingId } = req.params;

  const saved = await prisma.savedListing.findUnique({
    where: { userId_listingId: { userId: req.session.userId, listingId } },
  });

  res.json({ saved: !!saved });
}
