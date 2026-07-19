"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Home, ImageOff, MessageSquare, Send } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
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

interface ConversationsResponse {
  conversations: Conversation[];
}

interface ConversationResponse {
  conversation: Conversation;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function InboxPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");

  const { data: listData, isLoading: listLoading } =
    useQuery<ConversationsResponse>({
      queryKey: ["conversations"],
      queryFn: () =>
        api.get("/api/conversations") as Promise<ConversationsResponse>,
      enabled: !!user,
      refetchInterval: 10000,
    });

  const { data: activeData, isLoading: activeLoading } =
    useQuery<ConversationResponse>({
      queryKey: ["conversation", activeId],
      queryFn: () =>
        api.get(
          `/api/conversations/${activeId}`,
        ) as Promise<ConversationResponse>,
      enabled: !!activeId,
      refetchInterval: 5000,
    });

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
        err instanceof ApiError
          ? (err.body as { error?: string })?.error
          : "Failed to send message";
      toast.error("Error", { description: message });
    },
  });

  function handleSend() {
    if (!messageText.trim()) return;
    sendMutation.mutate(messageText.trim());
  }

  const conversations = listData?.conversations ?? [];
  const activeConversation = activeData?.conversation;

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Inbox</h1>

      <div className="flex h-[calc(100vh-200px)] overflow-hidden rounded-xl border border-border bg-card">
        {/* Conversation list */}
        <div
          className={`w-full shrink-0 border-r border-border sm:w-80 ${activeId ? "hidden sm:flex sm:flex-col" : "flex flex-col"}`}
        >
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-muted-foreground">
              {conversations.length} conversation
              {conversations.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {listLoading ? (
              <div className="space-y-3 p-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-lg bg-muted"
                  />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
                <MessageSquare className="h-8 w-8" />
                <p className="text-sm">No conversations yet</p>
                <Link href="/browse">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Home className="h-3.5 w-3.5" />
                    Browse listings
                  </Button>
                </Link>
              </div>
            ) : (
              conversations.map((conv) => {
                const other =
                  conv.tenantId === user.id ? conv.landlord : conv.tenant;
                const lastMsg = conv.messages[0];
                const isActive = activeId === conv.id;
                const firstPhoto = conv.listing.photos[0];

                return (
                  <button
                    type="button"
                    key={conv.id}
                    onClick={() => setActiveId(conv.id)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${isActive ? "bg-muted" : ""}`}
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {firstPhoto ? (
                        <Image
                          src={`${API_URL}${firstPhoto.url}`}
                          alt={conv.listing.title}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ImageOff className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {other.fullName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {conv.listing.title}
                      </p>
                      {lastMsg && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {lastMsg.body}
                        </p>
                      )}
                    </div>
                    {lastMsg && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(lastMsg.createdAt), {
                          addSuffix: false,
                        })}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Message thread */}
        <div
          className={`flex flex-1 flex-col ${!activeId ? "hidden sm:flex" : ""}`}
        >
          {!activeConversation && !activeLoading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <MessageSquare className="h-10 w-10" />
              <p className="text-sm">Select a conversation to view messages</p>
            </div>
          ) : activeLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : activeConversation ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <button
                  type="button"
                  onClick={() => setActiveId(null)}
                  className="sm:hidden"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/listings/${activeConversation.listing.slug}`}
                    className="truncate text-sm font-semibold hover:text-secondary"
                  >
                    {activeConversation.listing.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Ksh {activeConversation.listing.price.toLocaleString()}/mo ·{" "}
                    {activeConversation.listing.address}
                  </p>
                </div>
                <Link
                  href={`/listings/${activeConversation.listing.slug}`}
                  className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-secondary hover:text-secondary transition-colors"
                >
                  View listing
                </Link>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 p-4">
                {activeConversation.messages.map((msg) => {
                  const isMe = msg.sender.id === user.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}
                    >
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="text-xs bg-muted">
                          {initials(msg.sender.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm ${
                          isMe
                            ? "rounded-br-sm bg-secondary text-secondary-foreground"
                            : "rounded-bl-sm bg-muted text-foreground"
                        }`}
                      >
                        <p>{msg.body}</p>
                        <p
                          className={`mt-1 text-xs ${isMe ? "text-secondary-foreground/70" : "text-muted-foreground"}`}
                        >
                          {formatDistanceToNow(new Date(msg.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message input */}
              <div className="border-t border-border p-4">
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
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleSend}
                    disabled={sendMutation.isPending || !messageText.trim()}
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
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
