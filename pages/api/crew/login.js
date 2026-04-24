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

    const deviceId = String(req.body?.deviceId || "").trim();
    const deviceName = String(req.body?.deviceName || "Crew Device").trim();

    if (!voucherCode) {
      return res.status(400).json({
        success: false,
        message: "Voucher code is required",
      });
    }

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: "Device ID is required",
      });
    }

    const { data, error } = await supabase.rpc("crew_voucher_login", {
      p_voucher_code: voucherCode,
      p_device_mac: deviceId,
      p_device_name: deviceName,
      p_ip_address: null,
    });

    if (error) {
      console.error("crew login rpc error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Login failed",
      });
    }

    const result = Array.isArray(data) ? data[0] : data;

    if (!result?.success) {
      return res.status(403).json({
        success: false,
        message: result?.message || "Login denied",
        voucher_id: result?.voucher_id || null,
        gb_remaining: result?.gb_remaining || 0,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      voucher_id: result.voucher_id,
      session_id: result.session_id,
      gb_remaining: result.gb_remaining,
    });
  } catch (err) {
    console.error("crew login api error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}