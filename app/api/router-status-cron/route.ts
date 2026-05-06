import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SHIP_ID = "SHIP-001";
const OFFLINE_AFTER_MINUTES = 2;

async function sendTelegramMessage(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });
}

function isFresh(value: string | null) {
  if (!value) return false;

  const ageMs = Date.now() - new Date(value).getTime();
  return ageMs <= OFFLINE_AFTER_MINUTES * 60 * 1000;
}

export async function GET() {
  const { data, error } = await supabase
    .from("router_status")
    .select("*")
    .eq("ship_id", SHIP_ID)
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }

  const routerFresh = isFresh(data.last_seen_router);
  const starlinkFresh = isFresh(data.last_seen_starlink);

  const updates: any = {};
  const messages: string[] = [];

  if (!routerFresh && data.router_online === true) {
    updates.router_online = false;
    updates.last_router_alert_at = new Date().toISOString();
    messages.push("❌ Router OFFLINE");
  }

  if (!starlinkFresh && data.starlink_online === true) {
    updates.starlink_online = false;
    updates.last_starlink_alert_at = new Date().toISOString();
    messages.push("❌ Starlink OFFLINE");
  }

  if (routerFresh && data.router_online === false) {
    updates.router_online = true;
    messages.push("✅ Router wieder ONLINE");
  }

  if (starlinkFresh && data.starlink_online === false) {
    updates.starlink_online = true;
    messages.push("✅ Starlink wieder ONLINE");
  }

  if (Object.keys(updates).length > 0) {
    updates.updated_at = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("router_status")
      .update(updates)
      .eq("ship_id", SHIP_ID);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError },
        { status: 500 }
      );
    }
  }

  for (const msg of messages) {
    await sendTelegramMessage(msg);
  }

  return NextResponse.json({
    success: true,
    routerFresh,
    starlinkFresh,
    messages,
  });
}