import { prisma } from "../lib/prisma.js";

export async function createBooking(req, res) {
  const { listingId, unitType, moveInDate, leaseDuration, viewingDate } = req.body;

  if (!listingId || !unitType || !moveInDate) {
    return res.status(400).json({ error: "listingId, unitType and moveInDate are required" });
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return res.status(404).json({ error: "Listing not found" });
  if (listing.landlordId === req.session.userId) {
    return res.status(400).json({ error: "You cannot book your own listing" });
  }

  const booking = await prisma.booking.create({
    data: {
      listingId,
      tenantId: req.session.userId,
      landlordId: listing.landlordId,
      unitType,
      moveInDate: new Date(moveInDate),
      leaseDuration: leaseDuration || 12,
      viewingDate: viewingDate ? new Date(viewingDate) : null,
    },
    include: {
      listing: { select: { id: true, title: true, slug: true, address: true, price: true } },
      tenant: { select: { id: true, fullName: true, email: true, phone: true } },
    },
  });

  res.status(201).json({ booking });
}

export async function getTenantBookings(req, res) {
  const bookings = await prisma.booking.findMany({
    where: { tenantId: req.session.userId },
    include: {
      listing: {
        select: { id: true, title: true, slug: true, address: true, price: true, photos: { take: 1, orderBy: { order: "asc" } } },
      },
      contract: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ bookings });
}

export async function getLandlordBookings(req, res) {
  const { status } = req.query;

  const bookings = await prisma.booking.findMany({
    where: {
      landlordId: req.session.userId,
      ...(status && { status }),
    },
    include: {
      listing: { select: { id: true, title: true, slug: true, address: true } },
      tenant: { select: { id: true, fullName: true, email: true, phone: true } },
      contract: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total: bookings.length,
    needReview: bookings.filter((b) => b.status === "NEED_REVIEW").length,
    approved: bookings.filter((b) => b.status === "APPROVED").length,
    viewings: bookings.filter((b) => b.status === "VIEWING_SCHEDULED").length,
  };

  res.json({ bookings, stats });
}

export async function getBooking(req, res) {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: {
      listing: {
        select: { id: true, title: true, slug: true, address: true, price: true, photos: { take: 1, orderBy: { order: "asc" } } },
      },
      tenant: { select: { id: true, fullName: true, email: true, phone: true } },
      landlord: { select: { id: true, fullName: true, email: true, phone: true } },
      contract: true,
    },
  });

  if (!booking) return res.status(404).json({ error: "Booking not found" });

  if (booking.tenantId !== req.session.userId && booking.landlordId !== req.session.userId && !req.session.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  res.json({ booking });
}

export async function updateBookingStatus(req, res) {
  const { status, notes } = req.body;
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });

  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.landlordId !== req.session.userId && !req.session.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const updated = await prisma.booking.update({
    where: { id: req.params.id },
    data: { status, ...(notes && { notes }) },
  });

  // Auto-create contract when approved
  if (status === "APPROVED" && !booking.contract) {
    const listing = await prisma.listing.findUnique({ where: { id: booking.listingId } });
    const startDate = new Date(booking.moveInDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + booking.leaseDuration);

    await prisma.contract.create({
      data: {
        bookingId: booking.id,
        listingId: booking.listingId,
        tenantId: booking.tenantId,
        landlordId: booking.landlordId,
        unitType: booking.unitType,
        monthlyRent: listing.price,
        securityDeposit: listing.price,
        startDate,
        endDate,
        status: "PENDING",
      },
    });
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

  res.json({ booking: updated });
}
