export default async function handler(req, res) {
  // 🔐 ADMIN AUTH CHECK
  const cookies = req.headers.cookie || "";
  const isAdmin = cookies.includes("admin_auth=true");

  if (!isAdmin) {
    return res.status(401).json({
      ok: false,
      error: "Unauthorized",
    });
  }

  // Nur POST erlaubt
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  }

  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return res.status(500).json({
        ok: false,
        error: "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID",
      });
    }

    const { shipName, gbType, amount, codes } = req.body;

    if (!Array.isArray(codes) || codes.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "Missing voucher codes",
      });
    }

    const text =
      `🎫 New CrewOceanLink Vouchers\n\n` +
      `Ship: ${shipName || "Unknown"}\n` +
      `Type: ${gbType || "Unknown"}\n` +
      `Amount: ${amount || codes.length}\n` +
      `Created: ${new Date().toISOString()}\n\n` +
      `Codes:\n${codes.join("\n")}`;

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("TELEGRAM API ERROR:", result);
      return res.status(500).json({
        ok: false,
        error: "Telegram API failed",
        telegram: result,
      });
    }

    return res.status(200).json({
      ok: true,
      telegram: result,
    });
  } catch (error) {
    console.error("TELEGRAM ERROR:", error);
    return res.status(500).json({
      ok: false,
      error: error.message || "Telegram send failed",
    });
  }
}