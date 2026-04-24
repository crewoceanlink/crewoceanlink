import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import {
  checkMikrotikStatus,
  checkStarlinkStatus,
} from "../lib/statusChecks.js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL fehlt in .env.local");
}

if (!supabaseKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY fehlt in .env.local");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const shipId = Number(process.env.STATUS_SHIP_ID || 1);
const offlineThresholdMinutes = Number(process.env.OFFLINE_THRESHOLD_MINUTES || 10);
const offlineRepeatMinutes = Number(process.env.OFFLINE_REPEAT_MINUTES || 60);

async function sendTelegramMessage(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log("Telegram ENV fehlt:", text);
    return;
  }

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });
}

function diffMinutes(dateString) {
  if (!dateString) return null;
  const diffMs = Date.now() - new Date(dateString).getTime();
  return Math.floor(diffMs / 60000);
}

async function getLastStatus() {
  const { data, error } = await supabase
    .from("router_status")
    .select("*")
    .eq("ship_id", shipId)
    .order("checked_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function saveStatus({
  routerOnline,
  starlinkOnline,
  lastSeenRouter,
  lastSeenStarlink,
}) {
  const { error } = await supabase.from("router_status").insert([
    {
      ship_id: shipId,
      router_online: routerOnline,
      starlink_online: starlinkOnline,
      last_seen_router: lastSeenRouter,
      last_seen_starlink: lastSeenStarlink,
      checked_at: new Date().toISOString(),
    },
  ]);

  if (error) throw error;
}

async function processStatusTransitions(current, last) {
  const messages = [];

  if (!last) return messages;

  if (last.router_online !== current.routerOnline) {
    messages.push(
      current.routerOnline
        ? "✅ Router wieder ONLINE"
        : "❌ Router OFFLINE"
    );
  }

  if (last.starlink_online !== current.starlinkOnline) {
    messages.push(
      current.starlinkOnline
        ? "✅ Starlink wieder ONLINE"
        : "❌ Starlink OFFLINE"
    );
  }

  if (!current.routerOnline && current.lastSeenRouter) {
    const offlineMinutes = diffMinutes(current.lastSeenRouter);

    if (offlineMinutes >= offlineThresholdMinutes) {
      const lastOfflineMinutes = diffMinutes(last.last_seen_router);

      const shouldSend =
        !last.router_online &&
        Math.floor(offlineMinutes / offlineRepeatMinutes) >
          Math.floor((lastOfflineMinutes || 0) / offlineRepeatMinutes);

      if (shouldSend) {
        messages.push(`⚠️ Router seit ${offlineMinutes} Minuten offline`);
      }
    }
  }

  if (!current.starlinkOnline && current.lastSeenStarlink) {
    const offlineMinutes = diffMinutes(current.lastSeenStarlink);

    if (offlineMinutes >= offlineThresholdMinutes) {
      const lastOfflineMinutes = diffMinutes(last.last_seen_starlink);

      const shouldSend =
        !last.starlink_online &&
        Math.floor(offlineMinutes / offlineRepeatMinutes) >
          Math.floor((lastOfflineMinutes || 0) / offlineRepeatMinutes);

      if (shouldSend) {
        messages.push(`⚠️ Starlink seit ${offlineMinutes} Minuten offline`);
      }
    }
  }

  return messages;
}

async function run() {
  console.log("Status Check gestartet");

  const last = await getLastStatus();

  const routerOnline = await checkMikrotikStatus();
  const starlinkOnline = await checkStarlinkStatus();

  const now = new Date().toISOString();

  const lastSeenRouter = routerOnline
    ? now
    : last?.last_seen_router || null;

  const lastSeenStarlink = starlinkOnline
    ? now
    : last?.last_seen_starlink || null;

  const current = {
    routerOnline,
    starlinkOnline,
    lastSeenRouter,
    lastSeenStarlink,
  };

  const messages = await processStatusTransitions(current, last);

  await saveStatus({
    routerOnline,
    starlinkOnline,
    lastSeenRouter,
    lastSeenStarlink,
  });

  for (const msg of messages) {
    await sendTelegramMessage(msg);
  }

  console.log("Fertig:", current);
}

run().catch((err) => {
  console.error("FEHLER:", err);
});