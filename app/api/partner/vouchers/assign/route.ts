import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();

    const url = new URL(req.url);
    const partnerIdFromUrl = url.searchParams.get("partnerId");

    const adminAuth = cookieStore.get("admin_auth")?.value;
    const partnerIdFromCookie = cookieStore.get("partner_id")?.value;

    const partnerId =
      partnerIdFromUrl && adminAuth ? partnerIdFromUrl : partnerIdFromCookie;

    if (!partnerId) {
      return NextResponse.json(
        { success: false, message: "Partner not logged in" },
        { status: 401 }
      );
    }

    const { voucher_id, assigned_to } = await req.json();

    if (!voucher_id) {
      return NextResponse.json(
        { success: false, message: "Missing voucher_id" },
        { status: 400 }
      );
    }

    const { data: partner, error: partnerError } = await supabase
      .from("partners")
      .select("id, ship_id")
      .eq("id", partnerId)
      .eq("active", true)
      .single();

    if (partnerError || !partner) {
      return NextResponse.json(
        { success: false, message: "Partner not found" },
        { status: 404 }
      );
    }

    const { data: voucher, error: voucherError } = await supabase
      .from("crew_vouchers")
      .select("id, ship_id")
      .eq("id", voucher_id)
      .single();

    if (voucherError || !voucher) {
      return NextResponse.json(
        { success: false, message: "Voucher not found" },
        { status: 404 }
      );
    }

    if (voucher.ship_id !== partner.ship_id) {
      return NextResponse.json(
        { success: false, message: "Voucher does not belong to this partner ship" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("crew_vouchers")
      .update({
        assigned_to: assigned_to || null,
        assigned_at: assigned_to ? new Date().toISOString() : null,
      })
      .eq("id", voucher_id)
      .eq("ship_id", partner.ship_id);

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