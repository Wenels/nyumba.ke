import { prisma } from "../lib/prisma.js";

export async function getConversations(req, res) {
  const userId = req.session.userId;

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ tenantId: userId }, { landlordId: userId }],
    },
    include: {
      property: {
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          photos: { orderBy: { order: "asc" }, take: 1 },
          unitTypes: { select: { monthlyRent: true } },
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

  const formatted = conversations.map((c) => {
    const minRent = c.property.unitTypes.length > 0 ? Math.min(...c.property.unitTypes.map((u) => u.monthlyRent)) : 0;
    return {
      ...c,
      listing: {
        id: c.property.id,
        title: c.property.name,
        slug: c.property.slug,
        address: c.property.address,
        price: minRent,
        photos: c.property.photos,
      },
    };
  });

  res.json({ conversations: formatted });
}

export async function getConversation(req, res) {
  const userId = req.session.userId;
  const { id } = req.params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      property: {
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          photos: { orderBy: { order: "asc" }, take: 1 },
          unitTypes: { select: { monthlyRent: true } },
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

  const minRent = conversation.property.unitTypes.length > 0 ? Math.min(...conversation.property.unitTypes.map((u) => u.monthlyRent)) : 0;
  const formatted = {
    ...conversation,
    listing: {
      id: conversation.property.id,
      title: conversation.property.name,
      slug: conversation.property.slug,
      address: conversation.property.address,
      price: minRent,
      photos: conversation.property.photos,
    },
  };

  res.json({ conversation: formatted });
}

export async function startConversation(req, res) {
  const tenantId = req.session.userId;
  const { propertyId, listingId, message } = req.body;
  const targetPropertyId = propertyId || listingId;

  if (!targetPropertyId || !message?.trim()) {
    return res.status(400).json({ error: "Property ID and message are required" });
  }

  const property = await prisma.property.findUnique({ where: { id: targetPropertyId } });
  if (!property) return res.status(404).json({ error: "Property not found" });

  if (property.landlordId === tenantId) {
    return res.status(400).json({ error: "You cannot message yourself" });
  }

  // Find or create conversation
  let conversation = await prisma.conversation.findUnique({
    where: { propertyId_tenantId: { propertyId: targetPropertyId, tenantId } },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        propertyId: targetPropertyId,
        tenantId,
        landlordId: property.landlordId,
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
