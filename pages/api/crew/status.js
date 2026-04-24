import { supabase } from "../../../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const voucherCode = String(req.body?.voucherCode || "")
      .trim()
      .toUpperCase();

    if (!voucherCode) {
      return res.status(400).json({
        success: false,
        message: "Voucher code is required",
      });
    }

    const { data, error } = await supabase
      .from("crew_voucher_portal_view")
      .select("*")
      .eq("voucher_code", voucherCode)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: "Voucher not found",
      });
    }

    return res.status(200).json({
      success: true,
      voucher: data,
    });
  } catch (err) {
    console.error("crew status api error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}