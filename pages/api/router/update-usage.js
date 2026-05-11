import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    const token = req.query.token;

    if (!process.env.ROUTER_SYNC_TOKEN || token !== process.env.ROUTER_SYNC_TOKEN) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.method !== "POST" && req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const input = req.method === "GET" ? req.query : req.body;

    const voucherCode = String(input.voucherCode || "").trim();
    const bytesOut = Number(input.bytesOut || 0);
    const currentIp = input.currentIp ? String(input.currentIp).trim() : null;

    if (!voucherCode) {
      return res.status(400).json({ error: "Missing voucherCode" });
    }

    if (!Number.isFinite(bytesOut) || bytesOut < 0) {
      return res.status(400).json({ error: "Invalid bytesOut" });
    }

    const { data: voucher, error: voucherError } = await supabase
      .from("crew_vouchers")
      .select("voucher_code, ship_id, traffic_last_bytes")
      .eq("voucher_code", voucherCode)
      .single();

    if (voucherError || !voucher) {
      return res.status(404).json({ error: "Voucher not found" });
    }

    if (!voucher.ship_id) {
      return res.status(400).json({ error: "Voucher has no ship_id" });
    }

    const lastVoucherBytes = Number(voucher.traffic_last_bytes || 0);

    let deltaBytes = 0;

    if (bytesOut >= lastVoucherBytes) {
      deltaBytes = bytesOut - lastVoucherBytes;
    } else {
      deltaBytes = bytesOut;
    }

    if (deltaBytes <= 0) {
      return res.status(200).json({
        ok: true,
        skipped: true,
        reason: "No positive delta",
        voucherCode,
        shipId: voucher.ship_id,
        bytesOut,
        lastVoucherBytes,
        deltaBytes,
      });
    }

    const { data: latestUsage, error: latestUsageError } = await supabase
      .from("router_usage")
      .select("bytes_total")
      .eq("ship_id", voucher.ship_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestUsageError) {
      return res.status(500).json({
        error: "Failed to load latest router usage",
        details: latestUsageError.message,
      });
    }

    const previousRouterBytes = Number(latestUsage?.bytes_total || 0);
    const newRouterBytes = previousRouterBytes + deltaBytes;

    const { error: insertError } = await supabase
      .from("router_usage")
      .insert([
        {
          ship_id: voucher.ship_id,
          bytes_total: newRouterBytes,
        },
      ]);

    if (insertError) {
      return res.status(500).json({
        error: "Failed to insert router usage",
        details: insertError.message,
      });
    }

    return res.status(200).json({
      ok: true,
      voucherCode,
      shipId: voucher.ship_id,
      currentIp,
      bytesOut,
      lastVoucherBytes,
      deltaBytes,
      previousRouterBytes,
      newRouterBytes,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Internal server error",
      details: err.message,
    });
  }
}