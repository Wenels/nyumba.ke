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
  Search,
  Send,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect, Suspense } from "react";
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

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

import { useSearchParams, useRouter } from "next/navigation";

export default function GeneralInboxPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <InboxContent />
    </Suspense>
  );
}

function InboxContent() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const targetTenantId = searchParams.get("tenantId") || searchParams.get("user");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: listData, isLoading: listLoading } = useQuery<{ conversations: Conversation[] }>({
    queryKey: ["conversations"],
    queryFn: () => api.get("/api/conversations") as Promise<{ conversations: Conversation[] }>,
    enabled: !!user,
    refetchInterval: 6000,
  });

  const { data: activeData, isLoading: activeLoading } = useQuery<{ conversation: Conversation }>({
    queryKey: ["conversation", activeId],
    queryFn: () => api.get(`/api/conversations/${activeId}`) as Promise<{ conversation: Conversation }>,
    enabled: !!activeId,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (targetTenantId && listData?.conversations && !activeId) {
      const match = listData.conversations.find((c: any) => c.tenantId === targetTenantId);
      if (match) setActiveId(match.id);
    }
  }, [targetTenantId, listData?.conversations, activeId]);

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

  function handleSend() {
    if (!messageText.trim()) return;
    sendMutation.mutate(messageText.trim());
  }

  const conversations = listData?.conversations ?? [];
  const activeConversation = activeData?.conversation;

  const filteredConversations = conversations.filter((c: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const other = c.tenantId === user?.id ? c.landlord : c.tenant;
    return (
      other?.fullName?.toLowerCase().includes(q) ||
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
          <Button className="mt-6 bg-secondary text-secondary-foreground hover:bg-secondary/90">
            Sign in
          </Button>
        </Link>
      </div>
    );
  }

  const isLandlord = user.role === "LANDLORD" || user.role === "ADMIN";

  return (
    <div className="space-y-4 max-w-6xl mx-auto py-6 px-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isLandlord ? "Tenant Messages" : "Inbox"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {isLandlord
              ? "Respond to inquiries and maintenance chats from your tenants"
              : "Manage all your communications"}
          </p>
        </div>
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
                placeholder="Search messages..."
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
                <p className="text-sm font-semibold">No conversations yet</p>
                <p className="text-xs text-muted-foreground">
                  {isLandlord
                    ? "Messages from tenants interested in or occupying your properties will appear here."
                    : "Your message threads will be listed here."}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv: any) => {
                const other = conv.tenantId === user.id ? conv.landlord : conv.tenant;
                const lastMsg = conv.messages[0];
                const isActive = activeId === conv.id;
                const firstPhoto = conv.listing?.photos?.[0];

                return (
                  <button
                    type="button"
                    key={conv.id}
                    onClick={() => setActiveId(conv.id)}
                    className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-all hover:bg-muted/50 ${
                      isActive ? "bg-secondary/15 border-l-4 border-secondary" : ""
                    }`}
                  >
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-muted border border-border">
                      {firstPhoto ? (
                        <Image
                          src={`${API_URL}${firstPhoto.url}`}
                          alt={conv.listing?.title || "Property"}
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
                          {other?.fullName || "User"}
                        </p>
                        {lastMsg && (
                          <span className="shrink-0 text-[10px] text-muted-foreground font-medium">
                            {formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: false })}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs font-semibold text-secondary">
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
              <div className="h-16 w-16 rounded-full bg-secondary/15 flex items-center justify-center text-secondary mb-2">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Select a Message Thread</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Choose a conversation to view chat history and reply.
              </p>
            </div>
          ) : activeLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : activeConversation ? (
            <>
              {/* Header */}
              {(() => {
                const other =
                  activeConversation.tenantId === user.id
                    ? activeConversation.landlord
                    : activeConversation.tenant;

                return (
                  <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-card">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => setActiveId(null)}
                        className="sm:hidden text-muted-foreground"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                      <Avatar className="h-9 w-9 shrink-0 border border-border">
                        <AvatarFallback className="bg-secondary/15 text-secondary text-xs font-bold">
                          {initials(other.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-foreground truncate">
                          {other.fullName}
                        </h3>
                        <p className="text-xs text-secondary font-medium truncate flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {activeConversation.listing?.title}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto space-y-4 p-5 bg-muted/10">
                {activeConversation.messages.length === 0 ? (
                  <div className="text-center py-10 text-xs text-muted-foreground">
                    No messages yet.
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
                              ? "rounded-br-none bg-secondary text-secondary-foreground"
                              : "rounded-bl-none bg-card border border-border text-foreground"
                          }`}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                          <div
                            className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                              isMe ? "text-secondary-foreground/70" : "text-muted-foreground"
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
                    placeholder="Type your reply..."
                    className="flex-1 text-sm bg-background"
                  />
                  <Button
                    type="button"
                    onClick={handleSend}
                    loading={sendMutation.isPending}
                    disabled={!messageText.trim()}
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4"
                  >
                    {!sendMutation.isPending && <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
