import { prisma } from "../lib/prisma.js";

export async function createBooking(req, res) {
  const { propertyId, listingId, unitTypeId, unitType, unitId, moveInDate, leaseDuration, viewingDate } = req.body;

  const targetPropertyId = propertyId || listingId;
  if (!targetPropertyId || (!unitTypeId && !unitType) || !moveInDate) {
    return res.status(400).json({ error: "propertyId, unitTypeId (or unitType) and moveInDate are required" });
  }

  const property = await prisma.property.findUnique({
    where: { id: targetPropertyId },
    include: { unitTypes: true },
  });

  if (!property) return res.status(404).json({ error: "Property not found" });
  if (property.landlordId === req.session.userId) {
    return res.status(400).json({ error: "You cannot book your own property" });
  }

  // Resolve unitTypeId
  let resolvedUnitTypeId = unitTypeId;
  if (!resolvedUnitTypeId && unitType) {
    const match = property.unitTypes.find((ut) => ut.label.toLowerCase() === String(unitType).toLowerCase());
    resolvedUnitTypeId = match ? match.id : property.unitTypes[0]?.id;
  }

  if (!resolvedUnitTypeId) {
    return res.status(400).json({ error: "Invalid unit type specified for this property" });
  }

  const booking = await prisma.booking.create({
    data: {
      propertyId: targetPropertyId,
      unitTypeId: resolvedUnitTypeId,
      unitId: unitId || null,
      tenantId: req.session.userId,
      landlordId: property.landlordId,
      moveInDate: new Date(moveInDate),
      leaseDuration: leaseDuration || 12,
      viewingDate: viewingDate ? new Date(viewingDate) : null,
    },
    include: {
      property: { select: { id: true, name: true, slug: true, address: true } },
      unitType: { select: { id: true, label: true, monthlyRent: true } },
      unit: { select: { id: true, unitNumber: true, floor: true } },
      tenant: { select: { id: true, fullName: true, email: true, phone: true } },
    },
  });

  // Attach backward compatible fields
  const formatted = {
    ...booking,
    listing: {
      id: booking.property.id,
      title: booking.property.name,
      slug: booking.property.slug,
      address: booking.property.address,
      price: booking.unitType.monthlyRent,
    },
    unitType: booking.unitType.label,
  };

  res.status(201).json({ booking: formatted });
}

export async function getTenantBookings(req, res) {
  const bookings = await prisma.booking.findMany({
    where: { tenantId: req.session.userId },
    include: {
      property: {
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          photos: { take: 1, orderBy: { order: "asc" } },
        },
      },
      unitType: { select: { id: true, label: true, monthlyRent: true } },
      unit: { select: { id: true, unitNumber: true, floor: true } },
      contract: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = bookings.map((b) => ({
    ...b,
    listing: {
      id: b.property.id,
      title: b.property.name,
      slug: b.property.slug,
      address: b.property.address,
      price: b.unitType.monthlyRent,
      photos: b.property.photos,
    },
    unitType: b.unitType.label,
  }));

  res.json({ bookings: formatted });
}

export async function getLandlordBookings(req, res) {
  const { status } = req.query;

  const bookings = await prisma.booking.findMany({
    where: {
      landlordId: req.session.userId,
      ...(status && { status }),
    },
    include: {
      property: { select: { id: true, name: true, slug: true, address: true } },
      unitType: {
        include: {
          units: true,
        },
      },
      unit: { select: { id: true, unitNumber: true, floor: true } },
      tenant: { select: { id: true, fullName: true, email: true, phone: true } },
      contract: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = bookings.map((b) => ({
    ...b,
    listing: {
      id: b.property.id,
      title: b.property.name,
      slug: b.property.slug,
      address: b.property.address,
    },
    unitType: b.unitType.label,
  }));

  const stats = {
    total: bookings.length,
    needReview: bookings.filter((b) => b.status === "NEED_REVIEW").length,
    approved: bookings.filter((b) => b.status === "APPROVED").length,
    viewings: bookings.filter((b) => b.status === "VIEWING_SCHEDULED").length,
  };

  res.json({ bookings: formatted, stats });
}

export async function getBooking(req, res) {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: {
      property: {
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          photos: { take: 1, orderBy: { order: "asc" } },
        },
      },
      unitType: true,
      unit: true,
      tenant: { select: { id: true, fullName: true, email: true, phone: true } },
      landlord: { select: { id: true, fullName: true, email: true, phone: true } },
      contract: true,
    },
  });

  if (!booking) return res.status(404).json({ error: "Booking not found" });

  if (booking.tenantId !== req.session.userId && booking.landlordId !== req.session.userId && !req.session.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const formatted = {
    ...booking,
    listing: {
      id: booking.property.id,
      title: booking.property.name,
      slug: booking.property.slug,
      address: booking.property.address,
      price: booking.unitType.monthlyRent,
      photos: booking.property.photos,
    },
    unitType: booking.unitType.label,
  };

  res.json({ booking: formatted });
}

export async function updateBookingStatus(req, res) {
  const { status, notes } = req.body;
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
  });

  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.landlordId !== req.session.userId && !req.session.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const updated = await prisma.booking.update({
    where: { id: req.params.id },
    data: {
      status,
      ...(notes && { notes }),
    },
    include: {
      property: true,
      unitType: true,
      unit: true,
      tenant: { select: { id: true, fullName: true, email: true, phone: true } },
    },
  });

  res.json({ booking: updated });
}

export async function getAvailableUnitsForBooking(req, res) {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: {
      unitType: {
        include: {
          units: {
            where: {
              status: { in: ["VACANT", "RESERVED"] }
            },
            orderBy: [{ floor: "asc" }, { unitNumber: "asc" }],
            include: {
              photos: { take: 1, orderBy: { order: "asc" } },
              amenities: true,
            },
          },
        },
      },
    },
  });

  if (!booking) return res.status(404).json({ error: "Booking not found" });

  const units = booking.unitType?.units || [];
  res.json({ units, unitType: booking.unitType });
}

export async function completeViewing(req, res) {
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) return res.status(404).json({ error: "Booking not found" });

  const isTenant = booking.tenantId === req.session.userId;
  const isLandlord = booking.landlordId === req.session.userId;

  if (!isTenant && !isLandlord && !req.session.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const updated = await prisma.booking.update({
    where: { id: req.params.id },
    data: { status: "VIEWING_COMPLETED" },
    include: {
      property: true,
      unitType: true,
      unit: true,
      tenant: { select: { id: true, fullName: true, email: true, phone: true } },
    },
  });

  res.json({ booking: updated, message: "Physical viewing marked as completed." });
}

export async function selectUnit(req, res) {
  const { unitId } = req.body;
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { unitType: true },
  });

  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.tenantId !== req.session.userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const validStatuses = ["APPROVED", "UNIT_SELECTED", "VIEWING_SCHEDULED", "VIEWING_COMPLETED"];
  if (!validStatuses.includes(booking.status)) {
    return res.status(400).json({ error: "Booking must be approved before selecting a unit" });
  }

  const unit = await prisma.unit.findUnique({ where: { id: unitId } });
  if (!unit || unit.unitTypeId !== booking.unitTypeId) {
    return res.status(400).json({ error: "Selected unit does not belong to this unit category" });
  }

  if (unit.status !== "VACANT" && unit.status !== "RESERVED" && booking.unitId !== unitId) {
    return res.status(400).json({ error: "Selected unit is not currently available" });
  }

  const updated = await prisma.booking.update({
    where: { id: req.params.id },
    data: {
      unitId: unitId,
      status: "UNIT_SELECTED",
    },
    include: {
      property: true,
      unitType: true,
      unit: true,
    },
  });

  res.json({ booking: updated, message: "Unit selected! Landlord will prepare the contract." });
}

export async function cancelBooking(req, res) {
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.tenantId !== req.session.userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const updated = await prisma.booking.update({
    where: { id: req.params.id },
    data: { status: "CANCELLED" },
  });

  // If a unit was assigned, make it VACANT again
  if (booking.unitId) {
    await prisma.unit.update({
      where: { id: booking.unitId },
      data: { status: "VACANT" },
    });
  }

  res.json({ booking: updated });
}
