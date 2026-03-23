import { NextResponse } from "next/server";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export const revalidate = 60;

export async function GET() {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return NextResponse.json({ status: "offline" });
  }

  try {
    // Peek at unprocessed bot updates to find Skyler's last Telegram activity
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?limit=100&timeout=0`
      );
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        let lastSeen = 0;
        for (const update of data.result) {
          const msg = update.message;
          if (msg?.chat?.id?.toString() === TELEGRAM_CHAT_ID && msg.date > lastSeen) {
            lastSeen = msg.date;
          }
        }
        if (lastSeen > 0) {
          return NextResponse.json({ status: "online", lastSeen });
        }
      }
    } catch {
      // getUpdates may fail if a webhook is set — fall through to getChat
    }

    // Fallback: verify bot can reach the chat
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChat?chat_id=${TELEGRAM_CHAT_ID}`
    );
    const data = await res.json();

    return NextResponse.json({ status: data.ok ? "online" : "offline" });
  } catch {
    return NextResponse.json({ status: "offline" });
  }
}
