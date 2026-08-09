import { prisma } from "../lib/prisma.js";

export async function getTenantRentPayments(req, res) {
  const payments = await prisma.rentPayment.findMany({
    where: { tenantId: req.session.userId },
    include: {
      contract: {
        select: {
          id: true,
          monthlyRent: true,
          property: { select: { id: true, name: true, address: true } },
          unitType: { select: { id: true, label: true, bedroomCount: true } },
          unit: { select: { id: true, unitNumber: true, floor: true } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  const stats = {
    dueOverdue: payments.filter((p) => ["DUE_NOW", "OVERDUE"].includes(p.status)).length,
    totalPaid: payments.filter((p) => p.status === "PAID").reduce((sum, p) => sum + p.amount, 0),
    upcoming: payments.filter((p) => p.status === "UPCOMING").length,
    totalCycles: payments.length,
  };

  res.json({ payments, stats });
}

export async function getLandlordRentPayments(req, res) {
  const payments = await prisma.rentPayment.findMany({
    where: { landlordId: req.session.userId },
    include: {
      contract: {
        select: {
          id: true,
          monthlyRent: true,
          property: { select: { id: true, name: true, address: true } },
          unitType: { select: { id: true, label: true, bedroomCount: true } },
          unit: { select: { id: true, unitNumber: true, floor: true } },
          tenant: { select: { id: true, fullName: true, phone: true } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  const stats = {
    totalCollected: payments.filter((p) => p.status === "PAID").reduce((sum, p) => sum + p.amount, 0),
    thisMonth: payments.filter((p) => {
      const now = new Date();
      const due = new Date(p.dueDate);
      return p.status === "PAID" && due.getMonth() === now.getMonth() && due.getFullYear() === now.getFullYear();
    }).reduce((sum, p) => sum + p.amount, 0),
    overdue: payments.filter((p) => p.status === "OVERDUE").length,
    dueSoon: payments.filter((p) => p.status === "DUE_SOON").length,
  };

  res.json({ payments, stats });
}

export async function getPaymentDetail(req, res) {
  const payment = await prisma.rentPayment.findUnique({
    where: { id: req.params.id },
    include: {
      contract: {
        include: {
          property: { select: { id: true, name: true, slug: true, address: true, photos: true } },
          unitType: { select: { id: true, label: true, bedroomCount: true, monthlyRent: true } },
          unit: { select: { id: true, unitNumber: true, floor: true, rentOverride: true } },
          tenant: { select: { id: true, fullName: true, email: true, phone: true } },
          landlord: { select: { id: true, fullName: true, email: true, phone: true } },
        }
      }
    }
  });

  if (!payment) return res.status(404).json({ error: "Payment not found" });

  const isTenant = payment.tenantId === req.session.userId;
  const isLandlord = payment.landlordId === req.session.userId;

  if (!isTenant && !isLandlord && !req.session.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  res.json({ payment });
}

export async function initiateRentPayment(req, res) {
  const { phone } = req.body;
  const payment = await prisma.rentPayment.findUnique({ where: { id: req.params.id } });

  if (!payment) return res.status(404).json({ error: "Payment not found" });
  if (payment.tenantId !== req.session.userId) return res.status(403).json({ error: "Forbidden" });
  if (payment.status === "PAID") return res.status(400).json({ error: "Already paid" });

  const checkoutRequestId = `SIM-${Date.now()}-${payment.id.slice(0, 8)}`;
  
  await prisma.payment.create({
    data: {
      userId: req.session.userId,
      amount: payment.amount,
      phoneNumber: phone || "unknown",
      status: "PENDING",
      checkoutRequestId,
      purpose: `monthly_rent:${payment.id}`,
    },
  });

  res.json({
    message: "STK Push sent. Check your phone for the M-Pesa prompt.",
    paymentId: payment.id,
    checkoutRequestId,
    amount: payment.amount,
  });
}

export async function confirmRentPayment(req, res) {
  const { mpesaReceiptNo, checkoutRequestId } = req.body;
  const payment = await prisma.rentPayment.findUnique({ where: { id: req.params.id } });

  if (!payment) return res.status(404).json({ error: "Payment not found" });
  if (payment.tenantId !== req.session.userId && !req.session.isAdmin) return res.status(403).json({ error: "Forbidden" });
  if (payment.status === "PAID") return res.status(400).json({ error: "Already paid" });

  const receipt = mpesaReceiptNo || `SIM-RCPT-${Date.now()}`;

  if (checkoutRequestId) {
    await prisma.payment.updateMany({
      where: { checkoutRequestId },
      data: { status: "SUCCESS", mpesaReceiptNo: receipt },
    });
  }

  const updated = await prisma.rentPayment.update({
    where: { id: req.params.id },
    data: {
      status: "PAID",
      paidDate: new Date(),
      mpesaReceiptNo: receipt,
    },
  });

  res.json({ payment: updated, message: "Payment confirmed successfully" });
}
