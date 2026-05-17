import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

const secret = body.secret;
const shipId = body.shipId;
const apOnlineCount = Number(body.apOnlineCount || 0);

    if (secret !== process.env.ROUTER_HEARTBEAT_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date().toISOString();

    const { error } = await supabase
      .from("router_status")
      .update({
        router_online: true,
        starlink_online: true,
        last_seen_router: now,
last_seen_starlink: now,
ap_online_count: apOnlineCount,
last_seen_ap: now,
checked_at: now,
      })
      .eq("ship_id", shipId);

    if (error) {
      console.error(error);

      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      checked_at: now,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}