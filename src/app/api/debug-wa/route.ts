import { NextResponse } from "next/server";

export async function GET() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  // Show which env vars are present (masked)
  const envCheck = {
    WHATSAPP_PHONE_NUMBER_ID: phoneNumberId
      ? `${phoneNumberId.slice(0, 4)}...${phoneNumberId.slice(-4)}`
      : "MISSING",
    WHATSAPP_ACCESS_TOKEN: accessToken
      ? `${accessToken.slice(0, 6)}...${accessToken.slice(-4)}`
      : "MISSING",
  };

  // Try sending a test message
  const res = await fetch(
    `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: "919890065855",
        type: "text",
        text: { body: "C9 debug: WhatsApp send from Vercel is working ✓" },
      }),
    }
  );

  const result = await res.json();

  return NextResponse.json({ envCheck, whatsappResponse: result });
}
