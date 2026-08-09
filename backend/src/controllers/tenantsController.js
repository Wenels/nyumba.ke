import { prisma } from "../lib/prisma.js";

export async function getTenantDetail(req, res) {
  const { id } = req.params;
  const landlordId = req.session.userId;

  // Verify the landlord actually has a contract with this tenant
  const hasContract = await prisma.contract.findFirst({
    where: {
      tenantId: id,
      landlordId,
      status: { in: ["ACTIVE", "EXPIRED", "TERMINATED", "LOCKED"] }
    }
  });

  if (!hasContract) {
    return res.status(403).json({ error: "Access denied. You can only view details of your own tenants." });
  }

  // Fetch tenant's non-sensitive details and only units/contracts under this landlord
  const tenant = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      avatarUrl: true,
      createdAt: true,
      tenantContracts: {
        where: { landlordId },
        include: {
          property: { select: { id: true, name: true } },
          unit: { select: { id: true, unitNumber: true } },
          unitType: { select: { id: true, label: true } },
          rentPayments: { orderBy: { dueDate: "desc" } }
        }
      },
      tenantBookings: {
        where: { landlordId, status: { in: ["APPROVED", "COMPLETED"] } },
        include: {
          property: { select: { id: true, name: true } },
          unitType: { select: { id: true, label: true } }
        }
      },
      tenantIssues: {
        where: { landlordId },
        include: {
          property: { select: { id: true, name: true } }
        }
      }
    }
  });

  if (!tenant) return res.status(404).json({ error: "Tenant not found" });

  res.json({ tenant });
}
