import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/conversations — list all conversations with last message preview
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("conversations")
    .select(`
      *,
      messages (
        content,
        created_at,
        role
      )
    `)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const conversations = (data ?? []).map((conv) => {
    const msgs = (conv.messages as { content: string; created_at: string; role: string }[]) ?? [];
    const last = msgs.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
    return {
      id: conv.id,
      phone: conv.phone,
      name: conv.name,
      mode: conv.mode,
      updated_at: conv.updated_at,
      created_at: conv.created_at,
      last_message: last?.content ?? null,
      last_message_at: last?.created_at ?? null,
    };
  });

  return NextResponse.json(conversations);
}
