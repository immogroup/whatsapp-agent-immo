"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatPanel from "@/components/ChatPanel";

export default function DashboardPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar
        selectedId={selectedConversationId}
        onSelect={setSelectedConversationId}
      />

      <main className="flex-1 flex min-h-0">
        {selectedConversationId ? (
          <ChatPanel conversationId={selectedConversationId} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-950 text-center px-8">
            <div className="w-16 h-16 rounded-full bg-green-900 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-green-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.135.558 4.14 1.535 5.875L0 24l6.313-1.505A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.95 0-3.77-.5-5.353-1.376L2 22l1.395-4.565A9.945 9.945 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
              </svg>
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">
              C9 AI Concierge
            </h2>
            <p className="text-gray-500 text-sm max-w-sm">
              Select a conversation from the sidebar to view messages and manage
              AI or human replies.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
