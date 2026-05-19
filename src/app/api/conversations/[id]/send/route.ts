import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

// POST /api/conversations/[id]/send — send a manual message from the dashboard
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { message } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  // Get conversation to retrieve phone number
  const { data: conversation, error: convError } = await supabaseAdmin
    .from("conversations")
    .select("phone")
    .eq("id", id)
    .single();

  if (convError || !conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  // Send via WhatsApp
  const waResult = await sendWhatsAppMessage(conversation.phone, message.trim());
  if (waResult.error) {
    return NextResponse.json({ error: waResult.error }, { status: 502 });
  }

  // Store in DB as assistant message
  const { data, error } = await supabaseAdmin
    .from("messages")
    .insert({
      conversation_id: id,
      role: "assistant",
      content: message.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
