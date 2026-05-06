import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const generateVoucherCode = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

const gbTotals: Record<string, number> = {
  "1": 1,
  "5": 5,
  "10": 10,
  "20": 20,
  "50": 50,
};

const getCrewPriceUSD = (planType: string, size: string) => {
  const prices: Record<string, Record<string, number>> = {
    small: {
      "1": 7,
      "5": 34,
      "10": 67,
      "20": 132,
      "50": 330,
    },
    large: {
      "1": 5,
      "5": 24,
      "10": 45,
      "20": 85,
      "50": 200,
    },
  };

  return prices[planType]?.[size] || 0;
};

export async function POST(req: Request) {
  try {
    const { order_id } = await req.json();

    if (!order_id) {
      return NextResponse.json(
        { success: false, message: "Missing order_id" },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("partner_orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    if (order.payment_status !== "paid") {
      return NextResponse.json(
        { success: false, message: "Order must be paid before generating vouchers" },
        { status: 400 }
      );
    }

    if (order.delivery_status === "delivered") {
      return NextResponse.json(
        { success: false, message: "Vouchers already delivered for this order" },
        { status: 400 }
      );
    }

    const { data: items, error: itemsError } = await supabase
      .from("partner_order_items")
      .select("*")
      .eq("order_id", order_id);

    if (itemsError || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Order items not found" },
        { status: 404 }
      );
    }

    const { data: ships, error: shipError } = await supabase
      .from("ships")
      .select("*")
      .ilike("name", order.ship_name)
      .limit(1);

    if (shipError || !ships || ships.length === 0) {
      return NextResponse.json(
        { success: false, message: "Ship not found" },
        { status: 404 }
      );
    }

    const ship = ships[0];
    const planType = Number(ship.plan_gb) >= 500 ? "large" : "small";

    const vouchers: any[] = [];

    for (const item of items) {
      const size = String(item.voucher_size_gb);
      const amount = Number(item.quantity || 0);
      const gbTotal = gbTotals[size];

      if (!gbTotal || amount <= 0) continue;

      for (let i = 0; i < amount; i++) {
        vouchers.push({
          ship_id: ship.id,
          subscription_cycle_id: null,
          voucher_code: generateVoucherCode(),
          voucher_type: `${size}GB`,
          plan_type: planType,
          gb_total: gbTotal,
          gb_used: 0,
crew_price_usd: getCrewPriceUSD(planType, size),
revenue_share_model: ship.model,
your_revenue_usd: Number(item.unit_price || 0),
          status: "active",
          created_by: "partner_order",
          notes: `Generated from partner order ${order_id}`,
          partner_order_id: order_id,
          source: "partner_order",
          partner_name: order.partner_name,
          assigned_to: null,
        });
      }
    }

    if (vouchers.length === 0) {
      return NextResponse.json(
        { success: false, message: "No vouchers to generate" },
        { status: 400 }
      );
    }

    const { data: insertedVouchers, error: voucherError } = await supabase
      .from("crew_vouchers")
      .insert(vouchers)
      .select("*");

    if (voucherError) {
      console.error("VOUCHER GENERATION ERROR:", voucherError);
      return NextResponse.json(
        { success: false, message: "Voucher generation failed" },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabase
      .from("partner_orders")
      .update({
        delivery_status: "delivered",
        status: "fulfilled",
        delivered_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    if (updateError) {
      console.error("ORDER DELIVERY UPDATE ERROR:", updateError);
      return NextResponse.json(
        { success: false, message: "Vouchers created, but order update failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: insertedVouchers?.length || 0,
      vouchers: insertedVouchers?.map((v) => v.voucher_code) || [],
    });
  } catch (err) {
    console.error("GENERATE VOUCHERS SERVER ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}