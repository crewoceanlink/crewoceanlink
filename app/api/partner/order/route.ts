import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function sendTelegramAlert(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("Telegram not configured");
    return;
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
    }),
  });

  if (!res.ok) {
    console.error("Telegram alert failed:", await res.text());
  }
}

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

    const { data: lastOrder, error: orderError } = await supabase
      .from("partner_orders")
      .select("*")
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const { data: pendingOrders, error: pendingOrdersError } = await supabase
      .from("partner_orders")
      .select("total_amount")
      .eq("partner_id", partnerId)
      .eq("payment_status", "pending");

    if (pendingOrdersError) {
      console.error("PENDING ORDERS LOAD ERROR:", pendingOrdersError);
    }

    const outstandingAmount = (pendingOrders || []).reduce(
      (sum, order) => sum + Number(order.total_amount || 0),
      0
    );

    if (orderError || !lastOrder) {
      return NextResponse.json({
        success: true,
        last_order: null,
        outstanding_amount: outstandingAmount,
      });
    }

    return NextResponse.json({
      success: true,
      last_order: lastOrder,
      outstanding_amount: outstandingAmount,
    });
  } catch (err) {
    console.error("PARTNER LAST ORDER ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const partnerId = cookieStore.get("partner_id")?.value;

    if (!partnerId) {
      return NextResponse.json(
        { success: false, message: "Partner not logged in" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const { items, total_amount } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "No items in order" },
        { status: 400 }
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

    const planName =
      Number(ship.plan_gb || 0) >= 500
        ? "Global Priority 500"
        : "Global Priority 50";

    const { data: order, error: orderError } = await supabase
      .from("partner_orders")
      .insert({
        ship_name: ship.name,
        ship_model: ship.model,
        starlink_plan: planName,
        partner_name: partner.name,

        ship_id: ship.id,
        partner_id: partner.id,

        order_data: items,
        total_amount,
      })
      .select()
      .single();

    if (orderError) {
      console.error(orderError);
      return NextResponse.json(
        { success: false, message: "Order insert failed" },
        { status: 500 }
      );
    }

    const itemsToInsert = items.map((item: any) => ({
      order_id: order.id,
      voucher_size_gb: parseInt(item.size),
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("partner_order_items")
      .insert(itemsToInsert);

    if (itemsError) {
      console.error(itemsError);
      return NextResponse.json(
        { success: false, message: "Items insert failed" },
        { status: 500 }
      );
    }

    const orderLines = items
      .map((item: any) => `${item.quantity}x ${item.size}GB`)
      .join("\n");

    await sendTelegramAlert(
      `🚨 New Crew Partner Order

Ship: ${ship.name}
Model: ${ship.model}
Plan: ${planName}
Partner: ${partner.name}

Order:
${orderLines}

Total: $${total_amount}

Status: Payment pending`
    );

    return NextResponse.json({
      success: true,
      order_id: order.id,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}