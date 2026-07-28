import { prisma } from "../lib/prisma.js";

export async function getStats(req, res) {
  const [users, properties, reports, pendingVerifications] = await Promise.all([
    prisma.user.count(),
    prisma.property.count(),
    prisma.report.count({ where: { resolved: false } }),
    prisma.user.count({ where: { verification: "PENDING" } }),
  ]);

  res.json({ stats: { users, listings: properties, reports, pendingVerifications } });
}

export async function getUsers(req, res) {
  const { search, role } = req.query;

  const users = await prisma.user.findMany({
    where: {
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(role && { role }),
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      isAdmin: true,
      verification: true,
      phoneVerified: true,
      createdAt: true,
      _count: { select: { properties: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ users });
}

export async function updateUser(req, res) {
  const { id } = req.params;
  const { role, isAdmin, verification } = req.body;

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(role && { role }),
      ...(isAdmin !== undefined && { isAdmin }),
      ...(verification && { verification }),
    },
  });

  res.json({ user });
}

export async function deleteUser(req, res) {
  const { id } = req.params;

  if (id === req.session.userId) {
    return res.status(400).json({ error: "Cannot delete your own account" });
  }

  await prisma.user.delete({ where: { id } });
  res.json({ ok: true });
}

export async function getAdminListings(req, res) {
  const { search, status } = req.query;

  const properties = await prisma.property.findMany({
    where: {
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { address: { contains: search, mode: "insensitive" } },
          { town: { contains: search, mode: "insensitive" } },
          { estate: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      photos: { take: 1, orderBy: { order: "asc" } },
      landlord: {
        select: {
          id: true,
          fullName: true,
          email: true,
          verification: true,
        },
      },
      unitTypes: {
        include: {
          photos: true,
          _count: { select: { units: true } },
        },
      },
      _count: { select: { savedBy: true, conversations: true, unitTypes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Compute vacantCount for each property in-memory
  const listings = await Promise.all(
    properties.map(async (p) => {
      const vacantCount = await prisma.unit.count({
        where: {
          unitType: { propertyId: p.id },
          status: "VACANT",
        },
      });
      return { ...p, vacantCount };
    })
  );

  res.json({ listings });
}

export async function updateListingStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  const property = await prisma.property.update({
    where: { id },
    data: { status },
  });

  res.json({ listing: property });
}

export async function deleteAdminListing(req, res) {
  await prisma.property.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
}

export async function getReports(req, res) {
  const { resolved } = req.query;

  const reports = await prisma.report.findMany({
    where: {
      ...(resolved !== undefined && { resolved: resolved === "true" }),
    },
    include: {
      reportedBy: {
        select: { id: true, fullName: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ reports });
}

export async function resolveReport(req, res) {
  const { id } = req.params;

  const report = await prisma.report.update({
    where: { id },
    data: { resolved: true },
  });

  res.json({ report });
}

export async function getVerifications(req, res) {
  const users = await prisma.user.findMany({
    where: { verification: "PENDING" },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      createdAt: true,
      verificationDocs: true,
      _count: { select: { properties: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  res.json({ users });
}

export async function updateVerification(req, res) {
  const { id } = req.params;
  const { verification } = req.body;

  if (!["VERIFIED", "REJECTED"].includes(verification)) {
    return res.status(400).json({ error: "Invalid verification status" });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { verification },
  });

  res.json({ user });
}

export async function approveListing(req, res) {
  const { id } = req.params;
  const { action } = req.body; // "approve" or "reject"

  const newStatus = action === "approve" ? "ACTIVE" : "REMOVED";

  const property = await prisma.property.update({
    where: { id },
    data: { status: newStatus },
    include: {
      photos: true,
      landlord: { select: { id: true, fullName: true, email: true } },
      _count: { select: { savedBy: true, conversations: true } },
    },
  });

  res.json({ listing: property });
}

export async function getListingDetail(req, res) {
  const { id } = req.params;

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { order: "asc" } },
      landlord: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          verification: true,
          avatarUrl: true,
          createdAt: true,
          _count: { select: { properties: true } },
        },
      },
      unitTypes: {
        include: {
          photos: true,
          amenities: true,
          units: { select: { id: true, unitNumber: true, floor: true, status: true } },
        },
      },
      amenities: true,
      _count: { select: { savedBy: true, conversations: true } },
      reports: {
        include: {
          reportedBy: { select: { id: true, fullName: true, email: true } },
        },
      },
    },
  });

  if (!property) return res.status(404).json({ error: "Property not found" });
  res.json({ listing: property });
}

export async function updatePropertyInspection(req, res) {
  const { id } = req.params;
  const { amenities, conditionReport } = req.body;

  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) return res.status(404).json({ error: "Property not found" });

  // Update property amenities
  if (Array.isArray(amenities)) {
    await prisma.propertyAmenity.deleteMany({ where: { propertyId: id } });
    await prisma.propertyAmenity.createMany({
      data: amenities.map((a) => ({
        propertyId: id,
        name: a.name,
        available: a.available ?? true,
      })),
    });
  }

  // Update condition report
  if (conditionReport) {
    const { floors, utilities, walls } = conditionReport;
    const allPassed = [
      ...(floors?.items || []),
      ...(utilities?.items || []),
      ...(walls?.items || []),
    ].every((item) => item.status === "No issues");

    await prisma.propertyConditionReport.upsert({
      where: { propertyId: id },
      update: { floors, utilities, walls, allPassed },
      create: {
        propertyId: id,
        floors: floors || { items: [] },
        utilities: utilities || { items: [] },
        walls: walls || { items: [] },
        allPassed,
      },
    });
  }

  const updatedProperty = await prisma.property.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { order: "asc" } },
      amenities: true,
      conditionReport: true,
      unitTypes: {
        include: { photos: true, amenities: true, conditionReport: true },
      },
    },
  });

  res.json({ property: updatedProperty });
}

export async function uploadInspectionPhoto(req, res) {
  const { propertyId, unitTypeId, category } = req.body;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  const roomCategory = category || "General";

  if (unitTypeId) {
    const existingCount = await prisma.unitTypePhoto.count({ where: { unitTypeId } });
    await prisma.unitTypePhoto.createMany({
      data: req.files.map((file, i) => ({
        unitTypeId,
        url: `/uploads/${file.filename}`,
        category: roomCategory,
        order: existingCount + i,
      })),
    });
    const photos = await prisma.unitTypePhoto.findMany({ where: { unitTypeId }, orderBy: { order: "asc" } });
    return res.status(201).json({ photos });
  }

  if (propertyId) {
    const existingCount = await prisma.propertyPhoto.count({ where: { propertyId } });
    await prisma.propertyPhoto.createMany({
      data: req.files.map((file, i) => ({
        propertyId,
        url: `/uploads/${file.filename}`,
        category: roomCategory,
        order: existingCount + i,
      })),
    });
    const photos = await prisma.propertyPhoto.findMany({ where: { propertyId }, orderBy: { order: "asc" } });
    return res.status(201).json({ photos });
  }

  return res.status(400).json({ error: "propertyId or unitTypeId required" });
}

export async function deleteInspectionPhoto(req, res) {
  const { photoId } = req.params;
  const { type } = req.query; // "property" or "unitType"

  try {
    if (type === "unitType") {
      await prisma.unitTypePhoto.deleteMany({ where: { id: photoId } });
    } else if (type === "property") {
      await prisma.propertyPhoto.deleteMany({ where: { id: photoId } });
    } else {
      const resProp = await prisma.propertyPhoto.deleteMany({ where: { id: photoId } });
      if (resProp.count === 0) {
        await prisma.unitTypePhoto.deleteMany({ where: { id: photoId } });
      }
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("deleteInspectionPhoto error:", err);
    await prisma.propertyPhoto.deleteMany({ where: { id: photoId } }).catch(() => {});
    await prisma.unitTypePhoto.deleteMany({ where: { id: photoId } }).catch(() => {});
    res.json({ ok: true });
  }
}

