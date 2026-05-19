import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { supabaseAdmin } from "@/lib/supabase";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { getAIResponse } from "@/lib/openrouter";
import type { MetaWebhookPayload } from "@/types";

// GET — Meta webhook verification
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// POST — Receive incoming WhatsApp messages
export async function POST(req: NextRequest) {
  const body: MetaWebhookPayload = await req.json();

  // waitUntil keeps the Vercel function alive until AI processing completes
  // even after the 200 response is sent to Meta
  waitUntil(handleIncoming(body).catch(console.error));

  return NextResponse.json({ status: "ok" });
}

async function handleIncoming(payload: MetaWebhookPayload) {
  const entry = payload.entry?.[0];
  const change = entry?.changes?.[0]?.value;

  if (!change?.messages?.length) return; // status update or empty — skip

  const msg = change.messages[0];
  if (msg.type !== "text" || !msg.text?.body) return;

  const phone = msg.from;
  const text = msg.text.body;
  const whatsappMsgId = msg.id;
  const contactName = change.contacts?.[0]?.profile?.name ?? null;

  // Deduplicate — skip if we've already processed this message
  const { data: existing } = await supabaseAdmin
    .from("messages")
    .select("id")
    .eq("whatsapp_msg_id", whatsappMsgId)
    .maybeSingle();

  if (existing) return;

  // Find or create conversation
  const { data: conversation, error: convError } = await supabaseAdmin
    .from("conversations")
    .upsert(
      { phone, name: contactName },
      { onConflict: "phone", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (convError || !conversation) {
    console.error("Failed to upsert conversation:", convError);
    return;
  }

  // Store user message
  const { error: msgError } = await supabaseAdmin.from("messages").insert({
    conversation_id: conversation.id,
    role: "user",
    content: text,
    whatsapp_msg_id: whatsappMsgId,
  });

  if (msgError) {
    console.error("Failed to store user message:", msgError);
    return;
  }

  // If mode is 'human', stop here — human will reply from dashboard
  if (conversation.mode === "human") return;

  // Fetch last 20 messages for context
  const { data: history } = await supabaseAdmin
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true })
    .limit(20);

  const aiMessages = (history ?? []) as { role: "user" | "assistant"; content: string }[];

  // Get AI response
  const aiReply = await getAIResponse(aiMessages);

  // Send reply via WhatsApp
  await sendWhatsAppMessage(phone, aiReply);

  // Store AI response
  await supabaseAdmin.from("messages").insert({
    conversation_id: conversation.id,
    role: "assistant",
    content: aiReply,
  });
}
