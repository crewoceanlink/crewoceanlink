import { supabase } from "../../../lib/supabase";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  console.log("=== LOGIN REQUEST START ===");

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

    console.log("INPUT:", {
      voucherCode,
      deviceId,
      deviceName,
    });

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

    console.log("Calling Supabase RPC...");

    const { data, error } = await supabase.rpc("crew_voucher_login", {
      p_voucher_code: voucherCode,
      p_device_mac: deviceId,
      p_device_name: deviceName,
      p_ip_address: null,
    });

    console.log("RPC RESPONSE:", data);
    console.log("RPC ERROR:", error);

    if (error) {
      console.error("crew login rpc error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Login failed",
      });
    }

    const result = Array.isArray(data) ? data[0] : data;

    console.log("PARSED RESULT:", result);

    if (!result?.success) {
      return res.status(403).json({
        success: false,
        message: result?.message || "Login denied",
        voucher_id: result?.voucher_id || null,
        gb_remaining: result?.gb_remaining || 0,
      });
    }

    console.log("LOGIN SUCCESS");

    return res.status(200).json({
      success: true,
      message: result.message,
      voucher_id: result.voucher_id,
      session_id: result.session_id,
      gb_remaining: result.gb_remaining,
    });

  } catch (err) {
    console.error("=== LOGIN CRASH ===");
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
}