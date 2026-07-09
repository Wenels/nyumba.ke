import { prisma } from "../lib/prisma.js";

export async function getConversations(req, res) {
  const userId = req.session.userId;

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ tenantId: userId }, { landlordId: userId }],
    },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          slug: true,
          price: true,
          address: true,
          photos: { orderBy: { order: "asc" }, take: 1 },
        },
      },
      tenant: {
        select: { id: true, fullName: true, avatarUrl: true },
      },
      landlord: {
        select: { id: true, fullName: true, avatarUrl: true },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ conversations });
}

export async function getConversation(req, res) {
  const userId = req.session.userId;
  const { id } = req.params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          slug: true,
          price: true,
          address: true,
          photos: { orderBy: { order: "asc" }, take: 1 },
        },
      },
      tenant: {
        select: { id: true, fullName: true, avatarUrl: true },
      },
      landlord: {
        select: { id: true, fullName: true, avatarUrl: true },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: { select: { id: true, fullName: true, avatarUrl: true } },
        },
      },
    },
  });

  if (!conversation) return res.status(404).json({ error: "Conversation not found" });

  if (conversation.tenantId !== userId && conversation.landlordId !== userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // Mark unread messages as read
  await prisma.message.updateMany({
    where: {
      conversationId: id,
      senderId: { not: userId },
      read: false,
    },
    data: { read: true },
  });

  res.json({ conversation });
}

export async function startConversation(req, res) {
  const tenantId = req.session.userId;
  const { listingId, message } = req.body;

  if (!listingId || !message?.trim()) {
    return res.status(400).json({ error: "Listing ID and message are required" });
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return res.status(404).json({ error: "Listing not found" });

  if (listing.landlordId === tenantId) {
    return res.status(400).json({ error: "You cannot message yourself" });
  }

  // Find or create conversation
  let conversation = await prisma.conversation.findUnique({
    where: { listingId_tenantId: { listingId, tenantId } },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        listingId,
        tenantId,
        landlordId: listing.landlordId,
      },
    });
  }

  const newMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: tenantId,
      body: message.trim(),
    },
    include: {
      sender: { select: { id: true, fullName: true, avatarUrl: true } },
    },
  });

  res.status(201).json({ conversation, message: newMessage });
}

export async function sendMessage(req, res) {
  const userId = req.session.userId;
  const { id } = req.params;
  const { message } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: "Message cannot be empty" });
  }

  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation) return res.status(404).json({ error: "Conversation not found" });

  if (conversation.tenantId !== userId && conversation.landlordId !== userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const newMessage = await prisma.message.create({
    data: {
      conversationId: id,
      senderId: userId,
      body: message.trim(),
    },
    include: {
      sender: { select: { id: true, fullName: true, avatarUrl: true } },
    },
  });

  res.status(201).json({ message: newMessage });
}

export async function getUnreadCount(req, res) {
  const userId = req.session.userId;

  const count = await prisma.message.count({
    where: {
      conversation: {
        OR: [{ tenantId: userId }, { landlordId: userId }],
      },
      senderId: { not: userId },
      read: false,
    },
  });

  res.json({ count });
}
