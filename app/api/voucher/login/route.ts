import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const voucherCode = String(body.voucher_code || "")
      .trim()
      .toUpperCase();

    if (!voucherCode) {
      return NextResponse.json(
        { success: false, message: "Voucher code is required" },
        { status: 400 }
      );
    }

    const { data: voucher, error } = await supabase
      .from("crew_vouchers")
      .select("*")
      .eq("voucher_code", voucherCode)
      .single();

    if (error || !voucher) {
      return NextResponse.json(
        { success: false, message: "Voucher not found" },
        { status: 401 }
      );
    }

    const res = NextResponse.json({
      success: true,
      voucher_id: voucher.id,
      voucher_code: voucher.voucher_code,
    });

    res.cookies.set("voucher_id", voucher.id, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err) {
    console.error("VOUCHER LOGIN ERROR:", err);

    return NextResponse.json(
      { success: false, message: "Voucher login failed" },
      { status: 500 }
    );
  }
}