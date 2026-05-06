import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    const { data: partner, error } = await supabase
      .from("partners")
      .select("*")
      .eq("email", email)
      .eq("active", true)
      .single();

    if (error || !partner) {
      return NextResponse.json(
        { success: false, message: "Partner not found" },
        { status: 401 }
      );
    }

    const res = NextResponse.json({
      success: true,
      partner_id: partner.id,
      ship_id: partner.ship_id,
    });

    res.cookies.set("partner_id", partner.id, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err) {
    console.error("PARTNER LOGIN ERROR:", err);

    return NextResponse.json(
      { success: false, message: "Partner login failed" },
      { status: 500 }
    );
  }
}