import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BYTES_PER_GB = 1024 * 1024 * 1024;

export default async function handler(req, res) {
  try {
    if (req.method !== "GET" && req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const input = req.method === "GET" ? req.query : req.body;

    const voucherCode = String(input.voucherCode || "").trim();
    const bytesOut = Number(input.bytesOut || 0);
    const bytesIn = Number(input.bytesIn || 0);
    const currentIp = input.currentIp ? String(input.currentIp).trim() : null;

    if (!voucherCode) {
      return res.status(400).json({ error: "Missing voucherCode" });
    }

    if (!Number.isFinite(bytesOut) || bytesOut < 0) {
      return res.status(400).json({ error: "Invalid bytesOut" });
    }

    const { data: voucher, error: fetchError } = await supabase
      .from("crew_vouchers")
      .select("*")
      .eq("voucher_code", voucherCode)
      .single();

    if (fetchError || !voucher) {
      return res.status(404).json({ error: "Voucher not found" });
    }

    const gbTotal = Number(voucher.gb_total || 0);
    const oldGbUsed = Number(voucher.gb_used || 0);
    const lastBytes = Number(voucher.traffic_last_bytes || 0);

    let deltaBytes = 0;

    if (bytesOut >= lastBytes) {
      deltaBytes = bytesOut - lastBytes;
    } else {
      deltaBytes = bytesOut;
    }

    const newGbUsed = oldGbUsed + deltaBytes / BYTES_PER_GB;
    const gbRemaining = Math.max(0, gbTotal - newGbUsed);

    let status = voucher.status || "active";

    if (newGbUsed >= gbTotal) {
      status = "exhausted";
    } else if (status === "exhausted") {
      status = "active";
    }

    const updatePayload = {
  gb_used: newGbUsed,
  traffic_last_bytes: bytesOut,
  status,
};

    if (currentIp) {
      updatePayload.current_ip = currentIp;
    }

    const { error: updateError } = await supabase
      .from("crew_vouchers")
      .update(updatePayload)
      .eq("voucher_code", voucherCode);

if (updateError) {
  return res.status(500).json({
    error: "Failed to update voucher usage",
    details: updateError.message,
  });
}

try {
  const host = req.headers.host;
  const protocol = host?.includes("localhost") ? "http" : "https";

  await fetch(`${protocol}://${host}/api/router/mikrotik-vouchers?token=${process.env.ROUTER_SYNC_TOKEN}`);
} catch (syncError) {
  console.error("MIKROTIK SYNC AFTER USAGE ERROR:", syncError);
}

return res.status(200).json({
      ok: true,
      voucherCode,
      bytesOut,
      bytesIn,
      lastBytes,
      deltaBytes,
      oldGbUsed,
      gbUsed: newGbUsed,
      gbRemaining,
      status,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Internal server error",
      details: err.message,
    });
  }
}