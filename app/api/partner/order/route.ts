import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getDirectSaleCreditForVoucher(voucher: any, priceRules: any[]) {
  const model = String(voucher.revenue_share_model || "").toUpperCase();

  if (model === "M3") return 0;

  const rule = priceRules.find((rule) => {
    return (
      String(rule.plan_type || "").toLowerCase() === String(voucher.plan_type || "").toLowerCase() &&
      String(rule.commission_model || "").toUpperCase() === model &&
      String(rule.voucher_type || "").toUpperCase() === String(voucher.voucher_type || "").toUpperCase()
    );
  });

  const crewPrice = Number(voucher.crew_price_usd || rule?.crew_price_usd || 0);
  const partnerPrice = Number(rule?.partner_price_usd || 0);
  const credit = crewPrice - partnerPrice;

  return credit > 0 ? credit : 0;
}

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

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();

    const url = new URL(request.url);
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

    const { data: partnerForCredit } = await supabase
      .from("partners")
      .select("*")
      .eq("id", partnerId)
      .eq("active", true)
      .single();

    let directSalesCredit = 0;

    if (partnerForCredit?.ship_id) {
      const { data: directSaleVouchers, error: directSaleError } = await supabase
        .from("crew_vouchers")
        .select("id, ship_id, voucher_type, plan_type, crew_price_usd, revenue_share_model, partner_order_id, created_by, direct_credit_settled_order_id")
        .eq("ship_id", partnerForCredit.ship_id)
        .eq("created_by", "admin")
        .is("partner_order_id", null)
        .is("direct_credit_settled_order_id", null);

      if (directSaleError) {
        console.error("DIRECT SALES CREDIT LOAD ERROR:", directSaleError);
      }

      const { data: priceRules, error: priceRulesError } = await supabase
        .from("voucher_price_rules")
        .select("*")
        .eq("active", true);

      if (priceRulesError) {
        console.error("DIRECT SALES CREDIT PRICE RULES ERROR:", priceRulesError);
      }

      directSalesCredit = Number(
        (directSaleVouchers || [])
          .reduce((sum, voucher) => {
            return sum + getDirectSaleCreditForVoucher(voucher, priceRules || []);
          }, 0)
          .toFixed(2)
      );
    }

    if (orderError || !lastOrder) {
      return NextResponse.json({
        success: true,
        last_order: null,
        outstanding_amount: outstandingAmount,
        direct_sales_credit: directSalesCredit,
      });
    }

    return NextResponse.json({
      success: true,
      last_order: lastOrder,
      outstanding_amount: outstandingAmount,
      direct_sales_credit: directSalesCredit,
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

    const { data: directSaleVouchers, error: directSaleError } = await supabase
      .from("crew_vouchers")
      .select("id, ship_id, voucher_type, plan_type, crew_price_usd, revenue_share_model, partner_order_id, created_by, direct_credit_settled_order_id")
      .eq("ship_id", ship.id)
      .eq("created_by", "admin")
      .is("partner_order_id", null)
      .is("direct_credit_settled_order_id", null);

    if (directSaleError) {
      console.error("DIRECT SALES CREDIT LOAD ERROR:", directSaleError);
    }

    const { data: priceRules, error: priceRulesError } = await supabase
      .from("voucher_price_rules")
      .select("*")
      .eq("active", true);

    if (priceRulesError) {
      console.error("DIRECT SALES CREDIT PRICE RULES ERROR:", priceRulesError);
    }

    const directSalesCredit = Number(
      (directSaleVouchers || [])
        .reduce((sum, voucher) => {
          return sum + getDirectSaleCreditForVoucher(voucher, priceRules || []);
        }, 0)
        .toFixed(2)
    );

    const payableAmount = Math.max(
      0,
      Number((Number(total_amount || 0) - directSalesCredit).toFixed(2))
    );

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
        total_amount: payableAmount,
        credit_applied_usd: directSalesCredit,
        original_total_amount: total_amount,
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

    if (directSalesCredit > 0 && directSaleVouchers && directSaleVouchers.length > 0) {
      const directSaleVoucherIds = directSaleVouchers.map((voucher) => voucher.id);

      const { error: settleCreditError } = await supabase
        .from("crew_vouchers")
        .update({
          direct_credit_settled_order_id: order.id,
        })
        .in("id", directSaleVoucherIds);

      if (settleCreditError) {
        console.error("DIRECT SALES CREDIT SETTLE ERROR:", settleCreditError);
      }
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

Original Total: $${Number(total_amount || 0).toFixed(2)}
Direct Sales Credit: -$${directSalesCredit.toFixed(2)}
Total Payable: $${payableAmount.toFixed(2)}

Status: Payment pending`
    );

    return NextResponse.json({
      success: true,
      order_id: order.id,
      original_total_amount: Number(total_amount || 0),
      direct_sales_credit: directSalesCredit,
      payable_amount: payableAmount,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}