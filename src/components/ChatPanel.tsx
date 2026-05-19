"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import ModeToggle from "./ModeToggle";
import type { Conversation, Message } from "@/types";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

type Props = {
  conversationId: string;
};

export default function ChatPanel({ conversationId }: Props) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadConversation() {
    const res = await fetch(`/api/conversations`);
    if (res.ok) {
      const all: Conversation[] = await res.json();
      const conv = all.find((c) => c.id === conversationId);
      if (conv) setConversation(conv);
    }
  }

  async function loadMessages() {
    const res = await fetch(`/api/conversations/${conversationId}/messages`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
    }
  }

  useEffect(() => {
    setMessages([]);
    setConversation(null);
    loadConversation();
    loadMessages();

    const supabase = createBrowserSupabaseClient();

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === payload.new.id);
            if (exists) return prev;
            return [...prev, payload.new as Message];
          })
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput("");

    const res = await fetch(`/api/conversations/${conversationId}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(`Failed to send: ${err.error}`);
      setInput(text);
    }

    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-950">
        <p className="text-gray-600">Loading conversation...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-950 min-h-0">
      {/* Header */}
      <div className="px-6 py-3 border-b border-gray-800 flex items-center justify-between bg-gray-900">
        <div>
          <h2 className="text-white font-semibold">
            {conversation.name ?? conversation.phone}
          </h2>
          {conversation.name && (
            <p className="text-gray-400 text-xs">{conversation.phone}</p>
          )}
        </div>
        <ModeToggle
          mode={conversation.mode}
          conversationId={conversation.id}
          onModeChange={(mode) => setConversation((prev) => prev ? { ...prev, mode } : prev)}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-600 text-sm text-center mt-8">No messages yet.</p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                msg.role === "user"
                  ? "bg-gray-800 text-gray-100 rounded-tl-sm"
                  : "bg-green-800 text-white rounded-tr-sm"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
              <p
                className={`text-xs mt-1 ${
                  msg.role === "user" ? "text-gray-500" : "text-green-300"
                }`}
              >
                {msg.role === "user" ? "User" : conversation.mode === "agent" ? "AI" : "You"}{" "}
                · {formatTime(msg.created_at)}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-gray-800 bg-gray-900">
        {conversation.mode === "human" && (
          <p className="text-orange-400 text-xs mb-2">
            Human mode — your message will be sent directly to the user.
          </p>
        )}
        {conversation.mode === "agent" && (
          <p className="text-green-400 text-xs mb-2">
            Agent mode — send a manual override message (AI handles replies automatically).
          </p>
        )}
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
            rows={2}
            className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm resize-none border border-gray-700 focus:outline-none focus:border-green-600 placeholder-gray-500"
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl text-sm font-medium transition-colors self-end"
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
