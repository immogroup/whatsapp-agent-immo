"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import type { ConversationWithPreview } from "@/types";

function formatTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  return isToday
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
}

type Props = {
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export default function Sidebar({ selectedId, onSelect }: Props) {
  const [conversations, setConversations] = useState<ConversationWithPreview[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchConversations() {
    const res = await fetch("/api/conversations");
    if (res.ok) {
      const data = await res.json();
      setConversations(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchConversations();

    const supabase = createBrowserSupabaseClient();

    // Re-fetch sidebar whenever a conversation is updated (new message / mode change)
    const channel = supabase
      .channel("sidebar-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => fetchConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <aside className="w-80 flex-shrink-0 bg-gray-900 border-r border-gray-700 flex flex-col">
      <div className="px-4 py-4 border-b border-gray-700">
        <h1 className="text-white font-semibold text-lg">C9 AI Concierge</h1>
        <p className="text-gray-400 text-xs mt-0.5">WhatsApp Dashboard</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <p className="text-gray-500 text-sm text-center mt-8">Loading...</p>
        )}
        {!loading && conversations.length === 0 && (
          <p className="text-gray-500 text-sm text-center mt-8 px-4">
            No conversations yet. Messages will appear here.
          </p>
        )}
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`w-full text-left px-4 py-3 border-b border-gray-800 hover:bg-gray-800 transition-colors ${
              selectedId === conv.id ? "bg-gray-800 border-l-2 border-l-green-500" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-white text-sm font-medium truncate pr-2">
                {conv.name ?? conv.phone}
              </span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    conv.mode === "agent"
                      ? "bg-green-900 text-green-300"
                      : "bg-orange-900 text-orange-300"
                  }`}
                >
                  {conv.mode === "agent" ? "AI" : "Human"}
                </span>
                <span className="text-gray-500 text-xs">
                  {formatTime(conv.last_message_at)}
                </span>
              </div>
            </div>
            <p className="text-gray-400 text-xs truncate">
              {conv.last_message ?? "No messages yet"}
            </p>
            {conv.name && (
              <p className="text-gray-600 text-xs mt-0.5">{conv.phone}</p>
            )}
          </button>
        ))}
      </div>
    </aside>
  );
}
