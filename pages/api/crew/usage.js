import { supabase } from "../../../lib/supabase";

export default async function handler(req, res) {
  // 🔐 TOKEN CHECK
  const token = req.headers["x-api-token"];

  if (!process.env.USAGE_API_TOKEN || token !== process.env.USAGE_API_TOKEN) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const shipId = String(req.body?.shipId || "").trim();
    const deviceMac = String(req.body?.deviceMac || "").trim();
    const ipAddress = String(req.body?.ipAddress || "").trim();
    const eventType = String(req.body?.eventType || "interim-update").trim();

    const bytesIn = Number(req.body?.bytesIn || 0);
    const bytesOut = Number(req.body?.bytesOut || 0);

    if (!shipId || !deviceMac) {
      return res.status(400).json({
        success: false,
        message: "shipId and deviceMac are required",
      });
    }

    if (!["login", "interim-update", "logout", "sync"].includes(eventType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid eventType",
      });
    }

    const { error } = await supabase.from("crew_usage_events").insert([
      {
        ship_id: shipId,
        event_type: eventType,
        device_mac: deviceMac,
        ip_address: ipAddress || null,
        bytes_in: bytesIn,
        bytes_out: bytesOut,
        raw_payload: req.body,
      },
    ]);

    if (error) {
      console.error("crew usage insert error:", error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Usage event stored",
    });
  } catch (err) {
    console.error("crew usage api error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
}