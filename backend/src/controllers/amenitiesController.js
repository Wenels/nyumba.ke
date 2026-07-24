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
  const propertyId = req.params.listingId || req.params.propertyId;
  const amenities = await prisma.propertyAmenity.findMany({
    where: { propertyId },
    orderBy: { name: "asc" },
  });

  res.json({ amenities });
}

export async function upsertAmenities(req, res) {
  const propertyId = req.params.listingId || req.params.propertyId;
  const { amenities } = req.body;

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return res.status(404).json({ error: "Property not found" });
  if (property.landlordId !== req.session.userId && !req.session.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await prisma.propertyAmenity.deleteMany({ where: { propertyId } });

  await prisma.propertyAmenity.createMany({
    data: amenities.map((a) => ({
      propertyId,
      name: a.name,
      available: a.available ?? true,
    })),
  });

  const all = await prisma.propertyAmenity.findMany({ where: { propertyId } });
  res.json({ amenities: all });
}

export async function initDefaultAmenities(propertyId) {
  await prisma.propertyAmenity.createMany({
    data: DEFAULT_AMENITIES.map((name) => ({ propertyId, name, available: true })),
  });
}

export async function getConditionReport(req, res) {
  const propertyId = req.params.listingId || req.params.propertyId;
  const report = await prisma.propertyConditionReport.findUnique({
    where: { propertyId },
  });

  res.json({ report: report || null });
}

export async function upsertConditionReport(req, res) {
  const propertyId = req.params.listingId || req.params.propertyId;
  const { floors, utilities, walls } = req.body;

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return res.status(404).json({ error: "Property not found" });
  if (property.landlordId !== req.session.userId && !req.session.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const allPassed = [
    ...(floors?.items || []),
    ...(utilities?.items || []),
    ...(walls?.items || []),
  ].every((item) => item.status === "No issues");

  const report = await prisma.propertyConditionReport.upsert({
    where: { propertyId },
    update: { floors, utilities, walls, allPassed },
    create: { propertyId, floors: floors || DEFAULT_CONDITION.floors, utilities: utilities || DEFAULT_CONDITION.utilities, walls: walls || DEFAULT_CONDITION.walls, allPassed },
  });

  res.json({ report });
}
