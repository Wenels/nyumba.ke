import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { generateUniqueSlug } from "../lib/slugify.js";

const unitTypeSchema = z.object({
  label: z.string().min(1),
  bedroomCount: z.coerce.number().int().min(0),
  bathrooms: z.coerce.number().int().min(0).default(1),
  monthlyRent: z.coerce.number().int().positive(),
  securityDeposit: z.coerce.number().int().min(0),
  description: z.string().optional(),
});

const unitSchema = z.object({
  unitTypeLabel: z.string().optional(),
  unitTypeId: z.string().optional(),
  unitNumber: z.string().min(1),
  floor: z.coerce.number().int().default(1),
  doorNumber: z.string().optional(),
  status: z.enum(["VACANT", "OCCUPIED", "MAINTENANCE", "RESERVED"]).default("VACANT"),
  rentOverride: z.coerce.number().int().optional().nullable(),
  description: z.string().optional(),
});

const createPropertySchema = z.object({
  name: z.string().min(3),
  propertyType: z.string().min(1),
  description: z.string().min(10),
  address: z.string(),
  county: z.string().optional(),
  town: z.string().optional(),
  estate: z.string().optional(),
  ward: z.string().optional(),
  street: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  totalFloors: z.coerce.number().int().default(1),
  totalUnits: z.coerce.number().int().default(1),
  managementType: z.string().default("owner"),
  agentName: z.string().optional(),
  agentContact: z.string().optional(),
  legalName: z.string().optional(),
  idNumber: z.string().optional(),
  contractType: z.string().default("template"),
  rules: z.array(z.string()).default([]),
  unitTypes: z.array(unitTypeSchema).min(1),
  units: z.array(unitSchema).optional(),
});

export async function getProperties(req, res) {
  const { minPrice, maxPrice, bedrooms, propertyType, area, status } = req.query;

  let targetBedrooms = bedrooms !== undefined && bedrooms !== "" ? Number(bedrooms) : undefined;
  let targetPropertyType = propertyType || undefined;

  if (targetPropertyType && targetPropertyType.includes("Bedroom")) {
    const match = targetPropertyType.match(/(\d+)/);
    if (match) {
      targetBedrooms = Number(match[1]);
    }
    targetPropertyType = undefined;
  }

  const andConditions = [
    { status: status || "ACTIVE" },
    ...(targetPropertyType
      ? [{ propertyType: { equals: targetPropertyType, mode: "insensitive" } }]
      : []),
    ...(area
      ? [
          {
            OR: [
              { name: { contains: area, mode: "insensitive" } },
              { address: { contains: area, mode: "insensitive" } },
              { description: { contains: area, mode: "insensitive" } },
              { estate: { contains: area, mode: "insensitive" } },
              { ward: { contains: area, mode: "insensitive" } },
              { town: { contains: area, mode: "insensitive" } },
            ],
          },
        ]
      : []),
  ];

  // Fetch properties matching high-level criteria
  let properties = await prisma.property.findMany({
    where: { AND: andConditions },
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
      unitTypes: {
        include: {
          photos: { orderBy: { order: "asc" } },
          units: {
            select: {
              id: true,
              unitNumber: true,
              floor: true,
              doorNumber: true,
              status: true,
              rentOverride: true,
            },
          },
        },
      },
      _count: { select: { savedBy: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Perform in-memory post-filtering on UnitTypes for minPrice/maxPrice and bedrooms
  if (minPrice || maxPrice || targetBedrooms !== undefined) {
    properties = properties.filter((prop) => {
      return prop.unitTypes.some((ut) => {
        const matchesMin = minPrice ? ut.monthlyRent >= Number(minPrice) : true;
        const matchesMax = maxPrice ? ut.monthlyRent <= Number(maxPrice) : true;
        const matchesBeds =
          targetBedrooms !== undefined
            ? targetBedrooms >= 4
              ? ut.bedroomCount >= 4
              : ut.bedroomCount === targetBedrooms
            : true;
        return matchesMin && matchesMax && matchesBeds;
      });
    });
  }

  // Format response so frontend gets backward-compatible computed fields (price, bedrooms, etc.)
  const formatted = properties.map((prop) => {
    const minRent = prop.unitTypes.length > 0
      ? Math.min(...prop.unitTypes.map((u) => u.monthlyRent))
      : 0;
    const maxRent = prop.unitTypes.length > 0
      ? Math.max(...prop.unitTypes.map((u) => u.monthlyRent))
      : 0;

    const totalVacant = prop.unitTypes.reduce((acc, ut) => {
      return acc + ut.units.filter((u) => u.status === "VACANT").length;
    }, 0);

    const primaryUnitType = prop.unitTypes[0];

    return {
      ...prop,
      title: prop.name, // backward compatibility
      price: minRent,  // starting price
      minRent,
      maxRent,
      bedrooms: primaryUnitType?.bedroomCount || 1,
      bathrooms: primaryUnitType?.bathrooms || 1,
      vacantCount: totalVacant,
    };
  });

  res.json({ listings: formatted, properties: formatted });
}

export async function getProperty(req, res) {
  const property = await prisma.property.findFirst({
    where: {
      OR: [
        { id: req.params.slug },
        { slug: req.params.slug },
      ],
    },
    include: {
      photos: { orderBy: { order: "asc" } },
      amenities: true,
      conditionReport: true,
      landlord: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          verification: true,
          avatarUrl: true,
        },
      },
      unitTypes: {
        include: {
          photos: { orderBy: { order: "asc" } },
          amenities: true,
          conditionReport: true,
          units: {
            include: {
              photos: { orderBy: { order: "asc" } },
              amenities: true,
              conditionReport: true,
            },
          },
        },
      },
      _count: { select: { savedBy: true } },
    },
  });

  if (!property) return res.status(404).json({ error: "Property not found" });

  const minRent = property.unitTypes.length > 0
    ? Math.min(...property.unitTypes.map((u) => u.monthlyRent))
    : 0;
  const maxRent = property.unitTypes.length > 0
    ? Math.max(...property.unitTypes.map((u) => u.monthlyRent))
    : 0;
  const totalVacant = property.unitTypes.reduce((acc, ut) => {
    return acc + ut.units.filter((u) => u.status === "VACANT").length;
  }, 0);
  const primaryUnitType = property.unitTypes[0];

  const formatted = {
    ...property,
    title: property.name,
    price: minRent,
    minRent,
    maxRent,
    bedrooms: primaryUnitType?.bedroomCount || 1,
    bathrooms: primaryUnitType?.bathrooms || 1,
    vacantCount: totalVacant,
  };

  res.json({ listing: formatted, property: formatted });
}

export async function createProperty(req, res) {
  const parsed = createPropertySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const data = parsed.data;
  const slug = await generateUniqueSlug(prisma, data.name);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  // Execute nested creation of Property -> UnitTypes -> Units
  const property = await prisma.property.create({
    data: {
      slug,
      name: data.name,
      propertyType: data.propertyType,
      description: data.description,
      address: data.address,
      county: data.county,
      town: data.town,
      estate: data.estate,
      ward: data.ward,
      street: data.street,
      postalCode: data.postalCode,
      latitude: data.latitude,
      longitude: data.longitude,
      totalFloors: data.totalFloors,
      totalUnits: data.totalUnits,
      managementType: data.managementType,
      agentName: data.agentName,
      agentContact: data.agentContact,
      legalName: data.legalName,
      idNumber: data.idNumber,
      contractType: data.contractType,
      rules: data.rules,
      expiresAt,
      landlordId: req.session.userId,
      unitTypes: {
        create: data.unitTypes.map((ut) => ({
          label: ut.label,
          bedroomCount: ut.bedroomCount,
          bathrooms: ut.bathrooms,
          monthlyRent: ut.monthlyRent,
          securityDeposit: ut.securityDeposit,
          description: ut.description,
        })),
      },
    },
    include: {
      unitTypes: true,
    },
  });

  // If individual units were supplied, create them linked to their corresponding UnitType
  if (data.units && data.units.length > 0) {
    const unitTypeMap = new Map();
    property.unitTypes.forEach((ut) => unitTypeMap.set(ut.label, ut.id));

    for (const unit of data.units) {
      const targetUnitTypeId = unit.unitTypeId || (unit.unitTypeLabel ? unitTypeMap.get(unit.unitTypeLabel) : property.unitTypes[0]?.id);

      if (targetUnitTypeId) {
        await prisma.unit.create({
          data: {
            unitTypeId: targetUnitTypeId,
            unitNumber: unit.unitNumber,
            floor: unit.floor,
            doorNumber: unit.doorNumber,
            status: unit.status,
            rentOverride: unit.rentOverride,
            description: unit.description,
          },
        });
      }
    }
  }

  // Refetch full created structure
  const result = await prisma.property.findUnique({
    where: { id: property.id },
    include: {
      unitTypes: {
        include: { units: true },
      },
    },
  });

  res.status(201).json({ listing: result, property: result });
}

export async function updateProperty(req, res) {
  const existing = await prisma.property.findFirst({
    where: {
      OR: [
        { id: req.params.slug },
        { slug: req.params.slug },
      ],
    },
  });

  if (!existing) return res.status(404).json({ error: "Property not found" });
  if (existing.landlordId !== req.session.userId && !req.session.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const updated = await prisma.property.update({
    where: { id: existing.id },
    data: req.body,
    include: {
      unitTypes: {
        include: { units: true },
      },
    },
  });

  res.json({ listing: updated, property: updated });
}

export async function deleteProperty(req, res) {
  const existing = await prisma.property.findFirst({
    where: {
      OR: [
        { id: req.params.slug },
        { slug: req.params.slug },
      ],
    },
  });

  if (!existing) return res.status(404).json({ error: "Property not found" });
  if (existing.landlordId !== req.session.userId && !req.session.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await prisma.property.delete({ where: { id: existing.id } });
  res.json({ ok: true });
}

export async function getMyProperties(req, res) {
  const properties = await prisma.property.findMany({
    where: { landlordId: req.session.userId },
    include: {
      photos: { orderBy: { order: "asc" } },
      unitTypes: {
        include: {
          units: true,
        },
      },
      _count: { select: { savedBy: true, conversations: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = properties.map((prop) => {
    const minRent = prop.unitTypes.length > 0
      ? Math.min(...prop.unitTypes.map((u) => u.monthlyRent))
      : 0;
    const totalVacant = prop.unitTypes.reduce((acc, ut) => {
      return acc + ut.units.filter((u) => u.status === "VACANT").length;
    }, 0);

    return {
      ...prop,
      title: prop.name,
      price: minRent,
      vacantCount: totalVacant,
    };
  });

  res.json({ listings: formatted, properties: formatted });
}

export async function reportProperty(req, res) {
  const { reportType, reason, details } = req.body;
  const VALID_TYPES = ["SCAM", "WRONG_INFO", "ALREADY_RENTED", "INAPPROPRIATE", "OTHER"];

  if (!VALID_TYPES.includes(reportType)) {
    return res.status(400).json({ error: "Invalid report type" });
  }

  const property = await prisma.property.findUnique({
    where: { id: req.params.id },
  });
  if (!property) return res.status(404).json({ error: "Property not found" });

  const report = await prisma.report.create({
    data: {
      propertyId: req.params.id,
      reportedById: req.session.userId,
      reportType,
      reason: reason || reportType,
      details,
    },
  });

  res.status(201).json({ report });
}
