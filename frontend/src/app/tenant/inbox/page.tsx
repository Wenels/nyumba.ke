"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Building2,
  CheckCheck,
  Home,
  ImageOff,
  MessageSquare,
  Plus,
  Search,
  Send,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/app/features/auth/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, api } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Message {
  id: string;
  body: string;
  createdAt: string;
  read: boolean;
  sender: { id: string; fullName: string; avatarUrl?: string | null };
}

interface Conversation {
  id: string;
  tenantId: string;
  landlordId: string;
  listing: {
    id: string;
    title: string;
    slug: string;
    price: number;
    address: string;
    photos: { url: string }[];
  };
  tenant: { id: string; fullName: string; avatarUrl?: string | null };
  landlord: { id: string; fullName: string; avatarUrl?: string | null };
  messages: Message[];
}

interface Contract {
  id: string;
  propertyId: string;
  listing?: { id: string; title: string; slug: string; address: string };
  landlord?: { id: string; fullName: string; email: string };
  status: string;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function TenantInboxPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [newMsgText, setNewMsgText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: listData, isLoading: listLoading } = useQuery<{ conversations: Conversation[] }>({
    queryKey: ["conversations"],
    queryFn: () => api.get("/api/conversations") as Promise<{ conversations: Conversation[] }>,
    enabled: !!user,
    refetchInterval: 6000,
  });

  const { data: contractsData } = useQuery<{ contracts: Contract[] }>({
    queryKey: ["tenant-contracts"],
    queryFn: () => api.get("/api/contracts/tenant") as Promise<{ contracts: Contract[] }>,
    enabled: !!user && showNewModal,
  });

  const { data: activeData, isLoading: activeLoading } = useQuery<{ conversation: Conversation }>({
    queryKey: ["conversation", activeId],
    queryFn: () => api.get(`/api/conversations/${activeId}`) as Promise<{ conversation: Conversation }>,
    enabled: !!activeId,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (activeData?.conversation?.messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeData?.conversation?.messages]);

  const sendMutation = useMutation({
    mutationFn: (body: string) =>
      api.post(`/api/conversations/${activeId}/messages`, { message: body }),
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["conversation", activeId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? (err.body as { error?: string })?.error : "Failed to send message";
      toast.error("Error", { description: message });
    },
  });

  const startMutation = useMutation({
    mutationFn: ({ propertyId, message }: { propertyId: string; message: string }) =>
      api.post("/api/conversations", { propertyId, message }),
    onSuccess: (res: any) => {
      setShowNewModal(false);
      setSelectedPropertyId("");
      setNewMsgText("");
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (res.conversation?.id) {
        setActiveId(res.conversation.id);
      }
      toast.success("Conversation started!");
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? (err.body as { error?: string })?.error : "Failed to start conversation";
      toast.error("Error", { description: message });
    },
  });

  function handleSend() {
    if (!messageText.trim()) return;
    sendMutation.mutate(messageText.trim());
  }

  function handleStartNew() {
    if (!selectedPropertyId || !newMsgText.trim()) return;
    startMutation.mutate({ propertyId: selectedPropertyId, message: newMsgText.trim() });
  }

  const conversations = listData?.conversations ?? [];
  const activeConversation = activeData?.conversation;
  const contracts = contractsData?.contracts ?? [];
  // Filter active/valid contracts
  const activeContracts = contracts.filter((c: any) => ["ACTIVE", "PENDING", "AWAITING_PAYMENT"].includes(c.status));

  const filteredConversations = conversations.filter((c: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.landlord?.fullName?.toLowerCase().includes(q) ||
      c.listing?.title?.toLowerCase().includes(q) ||
      c.messages[0]?.body?.toLowerCase().includes(q)
    );
  });

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-6">
        <MessageSquare className="h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-bold">Sign in to view your inbox</h1>
        <Link href="/login">
          <Button className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90">
            Sign in
          </Button>
        </Link>
      </div>
    );
  }

  const router = useRouter();

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Landlord Inbox</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Directly communicate with your property landlord
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowNewModal(true)}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
        >
          <Plus className="h-4 w-4" /> Message Landlord
        </Button>
      </div>

      {/* Main Chat Box */}
      <div className="flex h-[calc(100vh-210px)] overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {/* Left Sidebar */}
        <div
          className={`w-full shrink-0 border-r border-border sm:w-80 md:w-96 ${
            activeId ? "hidden sm:flex sm:flex-col" : "flex flex-col"
          }`}
        >
          {/* Search bar */}
          <div className="p-3 border-b border-border bg-muted/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="pl-9 h-9 text-xs bg-background"
              />
            </div>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {listLoading ? (
              <div className="space-y-3 p-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm font-semibold">No messages yet</p>
                <p className="text-xs text-muted-foreground">
                  Send a message to your landlord regarding rent, maintenance, or unit queries.
                </p>
                <Button size="sm" onClick={() => setShowNewModal(true)} className="mt-2 gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Start Conversation
                </Button>
              </div>
            ) : (
              filteredConversations.map((conv: any) => {
                const landlord = conv.landlord;
                const lastMsg = conv.messages[0];
                const isActive = activeId === conv.id;
                const firstPhoto = conv.listing?.photos?.[0];

                return (
                  <button
                    type="button"
                    key={conv.id}
                    onClick={() => setActiveId(conv.id)}
                    className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-all hover:bg-muted/50 ${
                      isActive ? "bg-primary/10 border-l-4 border-primary" : ""
                    }`}
                  >
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-muted border border-border">
                      {firstPhoto ? (
                        <Image
                          src={`${API_URL}${firstPhoto.url}`}
                          alt={conv.listing.title}
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="truncate text-sm font-bold text-foreground">
                          {landlord?.fullName || "Landlord"}
                        </p>
                        {lastMsg && (
                          <span className="shrink-0 text-[10px] text-muted-foreground font-medium">
                            {formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: false })}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs font-semibold text-primary">
                        {conv.listing?.title}
                      </p>
                      {lastMsg && (
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {lastMsg.body}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Chat Thread */}
        <div className={`flex flex-1 flex-col ${!activeId ? "hidden sm:flex" : ""}`}>
          {!activeConversation && !activeLoading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground bg-muted/10">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Select a Conversation</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Choose a conversation from the left menu or start a new chat with your landlord.
              </p>
            </div>
          ) : activeLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : activeConversation ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-card">
                <div className="flex items-center gap-3 min-w-0">
                  <button type="button" onClick={() => setActiveId(null)} className="sm:hidden text-muted-foreground">
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <Avatar className="h-9 w-9 shrink-0 border border-border">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {initials(activeConversation.landlord.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-foreground truncate">
                      {activeConversation.landlord.fullName}
                    </h3>
                    <p className="text-xs text-primary font-medium truncate flex items-center gap-1">
                      <Building2 className="h-3 w-3" /> {activeConversation.listing?.title}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto space-y-4 p-5 bg-muted/10">
                {activeConversation.messages.length === 0 ? (
                  <div className="text-center py-10 text-xs text-muted-foreground">
                    No messages yet. Send your first message below!
                  </div>
                ) : (
                  activeConversation.messages.map((msg: Message) => {
                    const isMe = msg.sender.id === user.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}
                      >
                        <Avatar className="h-7 w-7 shrink-0 border border-border">
                          <AvatarFallback className="text-[10px] bg-muted font-bold">
                            {initials(msg.sender.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`max-w-md rounded-2xl px-4 py-2.5 text-sm shadow-xs ${
                            isMe
                              ? "rounded-br-none bg-primary text-primary-foreground"
                              : "rounded-bl-none bg-card border border-border text-foreground"
                          }`}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                          <div
                            className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                              isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            <span>
                              {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                            </span>
                            {isMe && <CheckCheck className="h-3 w-3" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t border-border p-4 bg-card">
                <div className="flex gap-2">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type your message to landlord..."
                    className="flex-1 text-sm bg-background"
                  />
                  <Button
                    type="button"
                    onClick={handleSend}
                    loading={sendMutation.isPending}
                    disabled={!messageText.trim()}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-4"
                  >
                    {!sendMutation.isPending && <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Start New Conversation Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-lg">Message Your Landlord</h3>
              </div>
              <button onClick={() => setShowNewModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Select one of your rented or active properties to start a direct line of communication with the landlord.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Select Property *
                </label>
                {activeContracts.length === 0 ? (
                  <div className="mt-2 rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                    You have no active tenancy contracts or property bookings right now.
                  </div>
                ) : (
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Choose a property...</option>
                    {activeContracts.map((c: any) => (
                      <option key={c.id} value={c.propertyId}>
                        {c.listing?.title} — Landlord: {c.landlord?.fullName || "Owner"}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Initial Message *
                </label>
                <textarea
                  value={newMsgText}
                  onChange={(e) => setNewMsgText(e.target.value)}
                  rows={4}
                  placeholder="Describe your inquiry, maintenance need, or question..."
                  className="mt-1.5 w-full rounded-lg border border-input bg-background p-3 text-sm focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
            </div>

            <div className="pt-3 flex gap-3 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={() => setShowNewModal(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                loading={startMutation.isPending}
                disabled={!selectedPropertyId || !newMsgText.trim()}
                onClick={handleStartNew}
              >
                Send Message →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
