import { prisma } from "../lib/prisma.js";

const DEFAULT_AMENITIES = [
  "Water Supply",
  "Electricity",
  "Parking",
  "Security",
  "WiFi/Internet",
  "Lift/Elevator",
  "Garbage Collection",
  "CCTV",
];

const DEFAULT_CONDITION = {
  floors: {
    items: [
      { name: "Tiling Grout", status: "No issues" },
      { name: "Floor Condition", status: "No issues" },
    ],
  },
  utilities: {
    items: [
      { name: "Plumbing", status: "No issues" },
      { name: "Water Pressure", status: "No issues" },
      { name: "Sockets/Switches", status: "No issues" },
    ],
  },
  walls: {
    items: [
      { name: "Paint Finish", status: "No issues" },
      { name: "Cracks/Damage", status: "No issues" },
      { name: "Structural Integrity", status: "No issues" },
    ],
  },
};

export async function getAmenities(req, res) {
  const amenities = await prisma.amenity.findMany({
    where: { listingId: req.params.listingId },
    orderBy: { name: "asc" },
  });

  res.json({ amenities });
}

export async function upsertAmenities(req, res) {
  const { listingId } = req.params;
  const { amenities } = req.body;

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return res.status(404).json({ error: "Listing not found" });
  if (listing.landlordId !== req.session.userId && !req.session.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // Delete existing and recreate
  await prisma.amenity.deleteMany({ where: { listingId } });

  const created = await prisma.amenity.createMany({
    data: amenities.map((a) => ({
      listingId,
      name: a.name,
      available: a.available ?? true,
    })),
  });

  const all = await prisma.amenity.findMany({ where: { listingId } });
  res.json({ amenities: all });
}

export async function initDefaultAmenities(listingId) {
  await prisma.amenity.createMany({
    data: DEFAULT_AMENITIES.map((name) => ({ listingId, name, available: true })),
  });
}

export async function getConditionReport(req, res) {
  const report = await prisma.conditionReport.findUnique({
    where: { listingId: req.params.listingId },
  });

  res.json({ report: report || null });
}

export async function upsertConditionReport(req, res) {
  const { listingId } = req.params;
  const { floors, utilities, walls } = req.body;

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return res.status(404).json({ error: "Listing not found" });
  if (listing.landlordId !== req.session.userId && !req.session.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const allPassed = [
    ...(floors?.items || []),
    ...(utilities?.items || []),
    ...(walls?.items || []),
  ].every((item) => item.status === "No issues");

  const report = await prisma.conditionReport.upsert({
    where: { listingId },
    update: { floors, utilities, walls, allPassed },
    create: { listingId, floors: floors || DEFAULT_CONDITION.floors, utilities: utilities || DEFAULT_CONDITION.utilities, walls: walls || DEFAULT_CONDITION.walls, allPassed },
  });

  res.json({ report });
}
