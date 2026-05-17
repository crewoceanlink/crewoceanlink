import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const OFFLINE_AFTER_MINUTES = 2;
const REMINDER_30_MINUTES = 30;
const REMINDER_2_HOURS = 120;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function sendTelegramMessage(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error("Missing Telegram environment variables");
    return;
  }

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
    }),
  });
}

function minutesSince(dateValue: string | null) {
  if (!dateValue) return null;

  const date = new Date(dateValue);
  const now = new Date();

  return (now.getTime() - date.getTime()) / 1000 / 60;
}

export async function GET() {
  const { data: statuses, error } = await supabase
    .from("router_status")
    .select("*");

  if (error) {
    console.error("router-status-cron select error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  for (const status of statuses || []) {
    const routerAge = minutesSince(status.last_seen_router);
    const starlinkAge = minutesSince(status.last_seen_starlink);

    const apOnlineCount = Number(status.ap_online_count || 0);
const apIsHealthy = apOnlineCount >= 5;
const apProblemAge = minutesSince(status.ap_problem_since_at);

    const routerIsFresh =
      routerAge !== null && routerAge <= OFFLINE_AFTER_MINUTES;

    const starlinkIsFresh =
      starlinkAge !== null && starlinkAge <= OFFLINE_AFTER_MINUTES;

    const updates: Record<string, any> = {};

    if (!routerIsFresh && status.router_online === true) {
      await sendTelegramMessage(`❌ Router OFFLINE\nShip: ${status.ship_id}`);

      updates.router_online = false;
      updates.last_router_30m_alert_at = null;
      updates.last_router_2h_alert_at = null;
    }

    if (!starlinkIsFresh && status.starlink_online === true) {
      await sendTelegramMessage(`❌ Starlink OFFLINE\nShip: ${status.ship_id}`);

      updates.starlink_online = false;
      updates.last_starlink_30m_alert_at = null;
      updates.last_starlink_2h_alert_at = null;
    }

    if (routerIsFresh && status.router_online === false) {
      await sendTelegramMessage(`✅ Router wieder ONLINE\nShip: ${status.ship_id}`);

      updates.router_online = true;
      updates.last_router_30m_alert_at = null;
      updates.last_router_2h_alert_at = null;
    }

    if (starlinkIsFresh && status.starlink_online === false) {
      await sendTelegramMessage(`✅ Starlink wieder ONLINE\nShip: ${status.ship_id}`);

      updates.starlink_online = true;
      updates.last_starlink_30m_alert_at = null;
      updates.last_starlink_2h_alert_at = null;
    }

    if (
      !routerIsFresh &&
      status.router_online === false &&
      routerAge !== null &&
      routerAge >= REMINDER_30_MINUTES &&
      !status.last_router_30m_alert_at
    ) {
      await sendTelegramMessage(
        `⚠️ Router STILL OFFLINE seit 30 Minuten\nShip: ${status.ship_id}`
      );

      updates.last_router_30m_alert_at = new Date().toISOString();
    }

    if (
      !routerIsFresh &&
      status.router_online === false &&
      routerAge !== null &&
      routerAge >= REMINDER_2_HOURS &&
      !status.last_router_2h_alert_at
    ) {
      await sendTelegramMessage(
        `⚠️ Router STILL OFFLINE seit 2 Stunden\nShip: ${status.ship_id}`
      );

      updates.last_router_2h_alert_at = new Date().toISOString();
    }

    if (
      !starlinkIsFresh &&
      status.starlink_online === false &&
      starlinkAge !== null &&
      starlinkAge >= REMINDER_30_MINUTES &&
      !status.last_starlink_30m_alert_at
    ) {
      await sendTelegramMessage(
        `⚠️ Starlink STILL OFFLINE seit 30 Minuten\nShip: ${status.ship_id}`
      );

      updates.last_starlink_30m_alert_at = new Date().toISOString();
    }

    if (
      !starlinkIsFresh &&
      status.starlink_online === false &&
      starlinkAge !== null &&
      starlinkAge >= REMINDER_2_HOURS &&
      !status.last_starlink_2h_alert_at
    ) {
      await sendTelegramMessage(
        `⚠️ Starlink STILL OFFLINE seit 2 Stunden\nShip: ${status.ship_id}`
      );

      updates.last_starlink_2h_alert_at = new Date().toISOString();
    }

    if (!apIsHealthy && status.ap_healthy === true) {
  await sendTelegramMessage(
    `⚠️ AP WARNING\nShip: ${status.ship_id}\nAPs online: ${apOnlineCount}/5`
  );

  updates.ap_healthy = false;
  updates.ap_problem_since_at = new Date().toISOString();
  updates.last_ap_30m_alert_at = null;
  updates.last_ap_2h_alert_at = null;
}

if (apIsHealthy && status.ap_healthy === false) {
  await sendTelegramMessage(
    `✅ APs wieder ONLINE\nShip: ${status.ship_id}\nAPs online: ${apOnlineCount}/5`
  );

  updates.ap_healthy = true;
  updates.ap_problem_since_at = null;
  updates.last_ap_30m_alert_at = null;
  updates.last_ap_2h_alert_at = null;
}

if (
  !apIsHealthy &&
  status.ap_healthy === false &&
  apProblemAge !== null &&
  apProblemAge >= REMINDER_30_MINUTES &&
  !status.last_ap_30m_alert_at
) {
  await sendTelegramMessage(
    `⚠️ AP STILL WARNING seit 30 Minuten\nShip: ${status.ship_id}\nAPs online: ${apOnlineCount}/5`
  );

  updates.last_ap_30m_alert_at = new Date().toISOString();
}

if (
  !apIsHealthy &&
  status.ap_healthy === false &&
  apProblemAge !== null &&
  apProblemAge >= REMINDER_2_HOURS &&
  !status.last_ap_2h_alert_at
) {
  await sendTelegramMessage(
    `⚠️ AP STILL WARNING seit 2 Stunden\nShip: ${status.ship_id}\nAPs online: ${apOnlineCount}/5`
  );

  updates.last_ap_2h_alert_at = new Date().toISOString();
}

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from("router_status")
        .update(updates)
        .eq("ship_id", status.ship_id);

      if (updateError) {
        console.error("router-status-cron update error:", updateError);
      }
    }
  }

  return NextResponse.json({ ok: true });
}