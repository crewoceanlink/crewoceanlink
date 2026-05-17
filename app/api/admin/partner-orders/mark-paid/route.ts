import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const cookie = req.headers.get("cookie") || "";

    if (!cookie.includes("admin_auth=true")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json(
        { success: false, message: "Missing order_id" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("partner_orders")
      .update({
        payment_status: "paid",
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    if (error) {
      console.error("MARK PAID ERROR:", error);
      return NextResponse.json(
        { success: false, message: "Mark paid failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("MARK PAID SERVER ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}