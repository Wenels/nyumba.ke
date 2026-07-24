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
  const { status, notes, unitId } = req.body;
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { unitType: { include: { units: true } } },
  });

  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.landlordId !== req.session.userId && !req.session.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // Resolve assigned unit
  let assignedUnitId = unitId || booking.unitId;

  // If landlord didn't pick a specific unit, auto-pick the first VACANT unit in this UnitType
  if (status === "APPROVED" && !assignedUnitId) {
    const vacantUnit = booking.unitType.units.find((u) => u.status === "VACANT");
    if (vacantUnit) {
      assignedUnitId = vacantUnit.id;
    }
  }

  const updated = await prisma.booking.update({
    where: { id: req.params.id },
    data: {
      status,
      ...(notes && { notes }),
      ...(assignedUnitId && { unitId: assignedUnitId }),
    },
    include: {
      property: true,
      unitType: true,
      unit: true,
    },
  });

  // On approval, mark assigned unit as RESERVED and auto-generate contract
  if (status === "APPROVED") {
    if (assignedUnitId) {
      await prisma.unit.update({
        where: { id: assignedUnitId },
        data: { status: "RESERVED" },
      });
    }

    if (!booking.contract && assignedUnitId) {
      const assignedUnit = await prisma.unit.findUnique({ where: { id: assignedUnitId } });
      const rent = assignedUnit?.rentOverride || booking.unitType.monthlyRent;
      const deposit = booking.unitType.securityDeposit;

      const startDate = new Date(booking.moveInDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + booking.leaseDuration);

      await prisma.contract.create({
        data: {
          bookingId: booking.id,
          propertyId: booking.propertyId,
          unitTypeId: booking.unitTypeId,
          unitId: assignedUnitId,
          tenantId: booking.tenantId,
          landlordId: booking.landlordId,
          monthlyRent: rent,
          securityDeposit: deposit,
          startDate,
          endDate,
          status: "PENDING",
        },
      });
    }
  }

  res.json({ booking: updated });
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
