import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const partnerName = "Mike";

    const { data, error } = await supabase
      .from("crew_vouchers")
      .select("*")
      .eq("source", "partner_order")
      .eq("partner_name", partnerName)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("PARTNER VOUCHERS LOAD ERROR:", error);
      return NextResponse.json(
        { success: false, message: "Failed to load vouchers" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      vouchers: data || [],
    });
  } catch (err) {
    console.error("PARTNER VOUCHERS SERVER ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}