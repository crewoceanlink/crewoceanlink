import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const cookieStore = await cookies();
    const partnerId = cookieStore.get("partner_id")?.value;

    if (!partnerId) {
      return NextResponse.json(
        { success: false, message: "Partner not logged in" },
        { status: 401 }
      );
    }

    const { data: partner, error: partnerError } = await supabase
      .from("partners")
      .select("*")
      .eq("id", partnerId)
      .eq("active", true)
      .single();

    if (partnerError || !partner) {
      return NextResponse.json(
        { success: false, message: "Partner not found" },
        { status: 404 }
      );
    }

    const { data: ship, error: shipError } = await supabase
      .from("ships")
      .select("*")
      .eq("id", partner.ship_id)
      .single();

    if (shipError || !ship) {
      return NextResponse.json(
        { success: false, message: "Ship not found" },
        { status: 404 }
      );
    }

    const { data: vouchers, error: vouchersError } = await supabase
      .from("crew_vouchers")
      .select("*")
      .eq("ship_id", ship.id)
      .order("created_at", { ascending: false });

    if (vouchersError) {
      console.error("PARTNER VOUCHERS LOAD ERROR:", vouchersError);
      return NextResponse.json(
        { success: false, message: "Failed to load vouchers" },
        { status: 500 }
      );
    }

    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("ship_id", ship.id);

    const { data: priceRules, error: priceRulesError } = await supabase
      .from("voucher_price_rules")
      .select("*")
      .eq("plan_type", partner.plan_type)
      .eq("commission_model", partner.commission_model)
      .eq("active", true);

    if (priceRulesError) {
      console.error("PRICE RULES LOAD ERROR:", priceRulesError);
      return NextResponse.json(
        { success: false, message: "Failed to load price rules" },
        { status: 500 }
      );
    }

    const today = new Date();
    let currentCycle = null;

    if (subscriptions && subscriptions.length > 0) {
      currentCycle = subscriptions.find((s) => {
        const start = new Date(s.start_date);
        const end = new Date(s.end_date);

        return today >= start && today <= end;
      });
    }

    return NextResponse.json({
      success: true,
      partner,
      ship,
      vouchers: vouchers || [],
      price_rules: priceRules || [],
      cycle_start: currentCycle?.start_date || null,
      cycle_end: currentCycle?.end_date || null,
    });
  } catch (err) {
    console.error("PARTNER VOUCHERS SERVER ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}