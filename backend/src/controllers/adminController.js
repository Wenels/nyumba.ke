import { prisma } from "../lib/prisma.js";

export async function getStats(req, res) {
  const [users, listings, reports, pendingVerifications] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count({ where: { status: "ACTIVE" } }),
    prisma.report.count({ where: { resolved: false } }),
    prisma.user.count({ where: { verification: "PENDING" } }),
  ]);

  res.json({ stats: { users, listings, reports, pendingVerifications } });
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
      _count: { select: { listings: true } },
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
  const { status, search } = req.query;

  const listings = await prisma.listing.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { address: { contains: search, mode: "insensitive" } },
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
      _count: { select: { savedBy: true, conversations: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ listings });
}

export async function updateListingStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  const listing = await prisma.listing.update({
    where: { id },
    data: { status },
  });

  res.json({ listing });
}

export async function deleteAdminListing(req, res) {
  await prisma.listing.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
}

export async function getReports(req, res) {
  const { resolved } = req.query;

  const reports = await prisma.report.findMany({
    where: {
      ...(resolved !== undefined && { resolved: resolved === "true" }),
    },
    include: {
      listing: {
        select: { id: true, title: true, slug: true, status: true },
      },
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
      _count: { select: { listings: true } },
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

  const listing = await prisma.listing.update({
    where: { id },
    data: { status: action === "approve" ? "ACTIVE" : "REMOVED" },
    include: {
      photos: true,
      landlord: { select: { id: true, fullName: true, email: true } },
      _count: { select: { savedBy: true, conversations: true } },
    },
  });

  res.json({ listing });
}

export async function getListingDetail(req, res) {
  const { id } = req.params;

  const listing = await prisma.listing.findUnique({
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
          _count: { select: { listings: true } },
        },
      },
      _count: { select: { savedBy: true, conversations: true } },
      reports: {
        include: {
          reportedBy: { select: { id: true, fullName: true, email: true } },
        },
      },
    },
  });

  if (!listing) return res.status(404).json({ error: "Listing not found" });
  res.json({ listing });
}
