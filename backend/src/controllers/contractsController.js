import { prisma } from "../lib/prisma.js";

export async function getTenantContracts(req, res) {
  const contracts = await prisma.contract.findMany({
    where: { tenantId: req.session.userId },
    include: {
      listing: { select: { id: true, title: true, slug: true, address: true, photos: { take: 1 } } },
      landlord: { select: { id: true, fullName: true, email: true, phone: true } },
      booking: { select: { id: true, unitType: true, moveInDate: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total: contracts.length,
    active: contracts.filter((c) => c.status === "ACTIVE").length,
    pending: contracts.filter((c) => c.status === "PENDING").length,
    locked: contracts.filter((c) => c.status === "LOCKED").length,
  };

  res.json({ contracts, stats });
}

export async function getLandlordContracts(req, res) {
  const contracts = await prisma.contract.findMany({
    where: { landlordId: req.session.userId },
    include: {
      listing: { select: { id: true, title: true, slug: true, address: true } },
      tenant: { select: { id: true, fullName: true, email: true, phone: true } },
      booking: { select: { id: true, unitType: true, moveInDate: true } },
      rentPayments: { orderBy: { dueDate: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ contracts });
}

export async function getContract(req, res) {
  const contract = await prisma.contract.findUnique({
    where: { id: req.params.id },
    include: {
      listing: { select: { id: true, title: true, slug: true, address: true } },
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

  res.json({ contract });
}

export async function signContract(req, res) {
  const contract = await prisma.contract.findUnique({ where: { id: req.params.id } });
  if (!contract) return res.status(404).json({ error: "Contract not found" });

  const isTenant = contract.tenantId === req.session.userId;
  const isLandlord = contract.landlordId === req.session.userId;

  if (!isTenant && !isLandlord) return res.status(403).json({ error: "Forbidden" });

  const data = isTenant ? { signedByTenant: true } : { signedByLandlord: true };

  const updated = await prisma.contract.update({ where: { id: req.params.id }, data });

  // Activate contract if both signed
  if (updated.signedByTenant && updated.signedByLandlord) {
    const activated = await prisma.contract.update({
      where: { id: req.params.id },
      data: { status: "ACTIVE" },
    });

    // Generate rent payment schedule
    const months = Math.ceil(
      (new Date(contract.endDate) - new Date(contract.startDate)) / (1000 * 60 * 60 * 24 * 30)
    );

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
        status: i === 0 ? "DUE_NOW" : "UPCOMING",
      });
    }

    await prisma.rentPayment.createMany({ data: schedules });
    return res.json({ contract: activated });
  }

  res.json({ contract: updated });
}
