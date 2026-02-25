import { NextRequest, NextResponse } from "next/server";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function POST(req: NextRequest) {
  try {
    const { message, name, contact } = await req.json();

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error("Telegram env vars not configured");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    // Build the Telegram message
    const lines = [`New DM from your website`];
    if (name) lines.push(`From: ${name}`);
    if (contact) lines.push(`Contact: ${contact}`);
    lines.push("", message);

    const text = lines.join("\n");

    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          parse_mode: "HTML",
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Telegram API error:", err);
      return NextResponse.json({ error: "Failed to send" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
