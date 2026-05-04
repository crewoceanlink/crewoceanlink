import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { voucher_id, assigned_to } = await req.json();

    if (!voucher_id) {
      return NextResponse.json(
        { success: false, message: "Missing voucher_id" },
        { status: 400 }
      );
    }

const { error } = await supabase
  .from("crew_vouchers")
  .update({
    assigned_to: assigned_to || null,
    assigned_at: assigned_to ? new Date().toISOString() : null,
  })
  .eq("id", voucher_id);

    if (error) {
      console.error("ASSIGN VOUCHER ERROR:", error);
      return NextResponse.json(
        { success: false, message: "Failed to save assigned name" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("ASSIGN VOUCHER SERVER ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}