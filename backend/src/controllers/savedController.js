import { prisma } from "../lib/prisma.js";

export async function getSaved(req, res) {
  const saved = await prisma.savedProperty.findMany({
    where: { userId: req.session.userId },
    include: {
      property: {
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
          unitTypes: true,
          _count: { select: { savedBy: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = saved.map((s) => {
    const p = s.property;
    const minRent = p.unitTypes.length > 0 ? Math.min(...p.unitTypes.map((u) => u.monthlyRent)) : 0;
    const primaryUnitType = p.unitTypes[0];
    return {
      ...p,
      title: p.name,
      price: minRent,
      bedrooms: primaryUnitType?.bedroomCount || 1,
      bathrooms: primaryUnitType?.bathrooms || 1,
    };
  });

  res.json({ saved: formatted });
}

export async function saveListing(req, res) {
  const listingId = req.params.listingId || req.params.propertyId;

  const property = await prisma.property.findUnique({ where: { id: listingId } });
  if (!property) return res.status(404).json({ error: "Property not found" });

  const existing = await prisma.savedProperty.findUnique({
    where: { userId_propertyId: { userId: req.session.userId, propertyId: listingId } },
  });

  if (existing) {
    return res.status(409).json({ error: "Already saved" });
  }

  await prisma.savedProperty.create({
    data: { userId: req.session.userId, propertyId: listingId },
  });

  res.status(201).json({ ok: true });
}

export async function unsaveListing(req, res) {
  const listingId = req.params.listingId || req.params.propertyId;

  await prisma.savedProperty.deleteMany({
    where: { userId: req.session.userId, propertyId: listingId },
  });

  res.json({ ok: true });
}

export async function checkSaved(req, res) {
  const listingId = req.params.listingId || req.params.propertyId;

  const saved = await prisma.savedProperty.findUnique({
    where: { userId_propertyId: { userId: req.session.userId, propertyId: listingId } },
  });

  res.json({ saved: !!saved });
}
