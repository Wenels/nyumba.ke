import { prisma } from "../lib/prisma.js";

export async function getTenantContracts(req, res) {
  const contracts = await prisma.contract.findMany({
    where: { tenantId: req.session.userId },
    include: {
      property: { select: { id: true, name: true, slug: true, address: true, photos: { take: 1 } } },
      unit: { select: { id: true, unitNumber: true, floor: true } },
      landlord: { select: { id: true, fullName: true, email: true, phone: true } },
      booking: { select: { id: true, moveInDate: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = contracts.map((c) => ({
    ...c,
    listing: {
      id: c.property.id,
      title: c.property.name,
      slug: c.property.slug,
      address: c.property.address,
      photos: c.property.photos,
    },
    unitNumber: c.unit?.unitNumber,
  }));

  const stats = {
    total: contracts.length,
    active: contracts.filter((c) => c.status === "ACTIVE").length,
    pending: contracts.filter((c) => c.status === "PENDING").length,
    locked: contracts.filter((c) => c.status === "LOCKED").length,
  };

  res.json({ contracts: formatted, stats });
}

export async function getLandlordContracts(req, res) {
  const contracts = await prisma.contract.findMany({
    where: { landlordId: req.session.userId },
    include: {
      property: { select: { id: true, name: true, slug: true, address: true } },
      unit: { select: { id: true, unitNumber: true, floor: true } },
      tenant: { select: { id: true, fullName: true, email: true, phone: true } },
      booking: { select: { id: true, moveInDate: true } },
      rentPayments: { orderBy: { dueDate: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = contracts.map((c) => ({
    ...c,
    listing: {
      id: c.property.id,
      title: c.property.name,
      slug: c.property.slug,
      address: c.property.address,
    },
    unitNumber: c.unit?.unitNumber,
  }));

  res.json({ contracts: formatted });
}

export async function getContract(req, res) {
  const contract = await prisma.contract.findUnique({
    where: { id: req.params.id },
    include: {
      property: { select: { id: true, name: true, slug: true, address: true } },
      unit: { select: { id: true, unitNumber: true, floor: true } },
      tenant: { select: { id: true, fullName: true, email: true, phone: true } },
      landlord: { select: { id: true, fullName: true, email: true, phone: true } },
      booking: true,
      rentPayments: { orderBy: { dueDate: "asc" } },
    },
  });

  if (!contract) return res.status(404).json({ error: "Contract not found" });
  if (contract.tenantId !== req.session.userId && contract.landlordId !== req.session.userId && !req.session.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const formatted = {
    ...contract,
    listing: {
      id: contract.property.id,
      title: contract.property.name,
      slug: contract.property.slug,
      address: contract.property.address,
    },
    unitNumber: contract.unit?.unitNumber,
  };

  res.json({ contract: formatted });
}

export async function prepareContract(req, res) {
  const { bookingId, unitId, monthlyRent, securityDeposit, startDate, leaseDuration } = req.body;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { unitType: true, contract: true },
  });

  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.landlordId !== req.session.userId && !req.session.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const assignedUnitId = unitId || booking.unitId;
  if (!assignedUnitId) {
    return res.status(400).json({ error: "A specific unit must be selected or assigned" });
  }

  const unit = await prisma.unit.findUnique({ where: { id: assignedUnitId } });
  if (!unit) return res.status(404).json({ error: "Assigned unit not found" });

  const finalRent = monthlyRent ? parseInt(monthlyRent) : (unit.rentOverride || booking.unitType.monthlyRent);
  const finalDeposit = securityDeposit ? parseInt(securityDeposit) : booking.unitType.securityDeposit;

  const sDate = startDate ? new Date(startDate) : new Date(booking.moveInDate);
  const duration = leaseDuration ? parseInt(leaseDuration) : booking.leaseDuration;
  const eDate = new Date(sDate);
  eDate.setMonth(eDate.getMonth() + duration);

  // Reserve unit in system
  await prisma.unit.update({
    where: { id: assignedUnitId },
    data: { status: "RESERVED" },
  });

  let contract;
  if (booking.contract) {
    contract = await prisma.contract.update({
      where: { id: booking.contract.id },
      data: {
        unitId: assignedUnitId,
        monthlyRent: finalRent,
        securityDeposit: finalDeposit,
        startDate: sDate,
        endDate: eDate,
        signedByLandlord: true,
        signedByTenant: false,
        status: "PENDING",
      },
    });
  } else {
    contract = await prisma.contract.create({
      data: {
        bookingId: booking.id,
        propertyId: booking.propertyId,
        unitTypeId: booking.unitTypeId,
        unitId: assignedUnitId,
        tenantId: booking.tenantId,
        landlordId: booking.landlordId,
        monthlyRent: finalRent,
        securityDeposit: finalDeposit,
        startDate: sDate,
        endDate: eDate,
        signedByLandlord: true,
        signedByTenant: false,
        status: "PENDING",
      },
    });
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      unitId: assignedUnitId,
      status: "CONTRACT_PREPARED",
    },
  });

  res.json({ contract, message: "Contract prepared and unit assigned successfully." });
}

export async function signContract(req, res) {
  const contract = await prisma.contract.findUnique({
    where: { id: req.params.id },
    include: { booking: true },
  });

  if (!contract) return res.status(404).json({ error: "Contract not found" });

  const isTenant = contract.tenantId === req.session.userId;
  const isLandlord = contract.landlordId === req.session.userId;

  if (!isTenant && !isLandlord) return res.status(403).json({ error: "Forbidden" });

  const data = isTenant ? { signedByTenant: true } : { signedByLandlord: true };

  let updated = await prisma.contract.update({ where: { id: req.params.id }, data });

  // When tenant signs, transition to AWAITING_PAYMENT and update booking status to CONTRACT_CONFIRMED
  if (updated.signedByTenant) {
    updated = await prisma.contract.update({
      where: { id: req.params.id },
      data: { status: "AWAITING_PAYMENT" },
    });

    if (contract.bookingId) {
      await prisma.booking.update({
        where: { id: contract.bookingId },
        data: { status: "CONTRACT_CONFIRMED" },
      });
    }
  }

  res.json({ contract: updated });
}

export async function payInitialContract(req, res) {
  const { mpesaReceiptNo } = req.body;
  const contract = await prisma.contract.findUnique({
    where: { id: req.params.id },
    include: { booking: true },
  });

  if (!contract) return res.status(404).json({ error: "Contract not found" });
  if (contract.tenantId !== req.session.userId && contract.landlordId !== req.session.userId && !req.session.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // Activate contract
  const activated = await prisma.contract.update({
    where: { id: req.params.id },
    data: { status: "ACTIVE" },
  });

  // Mark assigned unit as OCCUPIED
  if (contract.unitId) {
    await prisma.unit.update({
      where: { id: contract.unitId },
      data: { status: "OCCUPIED" },
    });
  }

  // Mark booking as COMPLETED
  if (contract.bookingId) {
    await prisma.booking.update({
      where: { id: contract.bookingId },
      data: { status: "COMPLETED" },
    });
  }

  // Generate rent payment schedules if not already existing
  const existingPayments = await prisma.rentPayment.count({ where: { contractId: contract.id } });
  if (existingPayments === 0) {
    const months = Math.max(1, Math.ceil(
      (new Date(contract.endDate).getTime() - new Date(contract.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
    ));

    const schedules = [];
    for (let i = 0; i < months; i++) {
      const dueDate = new Date(contract.startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      schedules.push({
        contractId: contract.id,
        tenantId: contract.tenantId,
        landlordId: contract.landlordId,
        amount: contract.monthlyRent,
        dueDate,
        cycleNumber: i + 1,
        status: i === 0 ? "PAID" : "UPCOMING",
        mpesaReceiptNo: i === 0 ? (mpesaReceiptNo || "ONLINE_PAYMENT") : null,
        paidDate: i === 0 ? new Date() : null,
      });
    }

    await prisma.rentPayment.createMany({ data: schedules });
  }

  res.json({ contract: activated, message: "Payment confirmed! Lease is active and unit is occupied." });
}
